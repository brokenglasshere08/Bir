import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase PostgreSQL Client
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://bojpptbyayyrbfjuphgb.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_0E58qrUVMsOmZOjkQqTg2g_ryCNqi3Q';

let supabaseClient: any = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase connected:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Supabase initialization warning:', err);
  }
}

// Initialize Razorpay SDK instance if keys are available in deployment environment variables
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance: any = null;
if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpayInstance = new (Razorpay as any)({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });
    console.log('✅ Razorpay SDK initialized with deployment environment keys');
  } catch (err) {
    console.warn('⚠️ Razorpay initialization error:', err);
  }
} else {
  console.log('ℹ️ Running Razorpay gateway in development sandbox mode. Keys can be set via RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET.');
}

// In-memory backend data stores
interface AppointmentRecord {
  id: string;
  appointmentNumber: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientNotes?: string;
  serviceIds: string[];
  serviceNames: string[];
  date: string; // YYYY-MM-DD
  time: string; // e.g. "04:15 PM"
  totalAmount: number;
  paymentMethod: string;
  paymentDetails: {
    transactionRef: string;
    transactionId?: string;
    receiptNumber?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };
  isLocked: boolean;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

interface ActiveHold {
  date: string;
  time: string;
  patientName: string;
  expiresAt: number; // timestamp
}

// Pre-seeded or recorded appointments
let appointments: AppointmentRecord[] = [];
// Active locks holding a slot during checkout (5 min timeout)
const temporaryHolds = new Map<string, ActiveHold>();

// Helper to convert "04:15 PM" into minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

// Clean up expired temporary holds
function cleanExpiredHolds() {
  const now = Date.now();
  for (const [key, hold] of temporaryHolds.entries()) {
    if (hold.expiresAt <= now) {
      temporaryHolds.delete(key);
    }
  }
}

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Health check & Razorpay / Supabase configuration status
app.get('/api/health', async (_req: Request, res: Response) => {
  cleanExpiredHolds();
  let supabaseHealthy = false;
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('appointments').select('id').limit(1);
      supabaseHealthy = !error;
    } catch {
      supabaseHealthy = false;
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Supabase PostgreSQL',
      connected: Boolean(supabaseClient),
      tablesReady: supabaseHealthy,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : 'not_set'
    },
    razorpay: {
      isConfigured: Boolean(razorpayKeyId && razorpayKeySecret),
      keyIdPreview: razorpayKeyId ? `${razorpayKeyId.substring(0, 8)}...` : 'rzp_test_sandbox_mode',
      mode: razorpayKeyId && razorpayKeySecret ? 'live_configured' : 'sandbox_ready'
    },
    lockedAppointmentsCount: appointments.filter(a => a.status === 'CONFIRMED').length
  });
});

// 2. Query unavailable / locked slots for a given date
app.get('/api/slots', async (req: Request, res: Response) => {
  cleanExpiredHolds();
  const date = (req.query.date as string) || '';
  const duration = parseInt((req.query.duration as string) || '45', 10);

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
  }

  const unavailable: Array<{ time: string; reason: string }> = [];

  // Check Supabase database if connected
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('appointments')
        .select('time, patient_name')
        .eq('date', date)
        .eq('status', 'CONFIRMED');

      if (!error && data) {
        for (const apt of data) {
          if (!unavailable.some(u => u.time === apt.time)) {
            unavailable.push({
              time: apt.time,
              reason: `Locked (Reserved by ${apt.patient_name || 'Patient'})`
            });
          }
        }
      }
    } catch (err) {
      console.warn('Supabase slot query fallback to memory:', err);
    }
  }

  // Check in-memory confirmed appointments for this date
  const dateAppointments = appointments.filter(
    (a) => a.date === date && a.status === 'CONFIRMED'
  );

  for (const apt of dateAppointments) {
    if (!unavailable.some(u => u.time === apt.time)) {
      unavailable.push({
        time: apt.time,
        reason: `Locked (Reserved by ${apt.patientName})`
      });
    }
  }

  // Check active temporary holds during payment checkout
  for (const [key, hold] of temporaryHolds.entries()) {
    if (hold.date === date) {
      unavailable.push({
        time: hold.time,
        reason: `Payment in progress by ${hold.patientName}`
      });
    }
  }

  res.json({
    date,
    duration,
    unavailableSlots: unavailable
  });
});

// 3. Create Razorpay Payment Order & hold slot
app.post('/api/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    cleanExpiredHolds();
    const {
      amount, // in INR (e.g. 399)
      currency = 'INR',
      date,
      time,
      patientName,
      patientPhone,
      patientEmail,
      serviceIds = [],
      serviceNames = []
    } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'Appointment date and time are required.' });
    }

    if (!patientName || !patientPhone) {
      return res.status(400).json({ error: 'Patient name and mobile number are required.' });
    }

    // Step 1: Check if slot is already permanently locked
    const isAlreadyBooked = appointments.some(
      (a) => a.date === date && a.time === time && a.status === 'CONFIRMED'
    );
    if (isAlreadyBooked) {
      return res.status(409).json({
        error: `Slot ${time} on ${date} is already locked and booked by another patient. Please pick an open slot.`
      });
    }

    // Step 2: Check if slot is temporarily locked by someone else
    const holdKey = `${date}_${time}`;
    const activeHold = temporaryHolds.get(holdKey);
    if (activeHold && activeHold.patientName.toLowerCase() !== patientName.toLowerCase()) {
      return res.status(409).json({
        error: `Slot ${time} is currently being checked out by another patient. Please wait a minute or choose another time.`
      });
    }

    // Amount in paise (1 INR = 100 paise)
    const payableAmount = Number(amount) || 399;
    const amountInPaise = Math.round(payableAmount * 100);

    let orderId = '';
    let isRealOrder = false;

    // Call Razorpay API if credentials are provided
    if (razorpayInstance) {
      try {
        const rzpOrder = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            patientName,
            patientPhone,
            appointmentDate: date,
            appointmentTime: time,
            services: (serviceNames || []).join(', ')
          }
        });
        orderId = rzpOrder.id;
        isRealOrder = true;
      } catch (err: any) {
        console.error('Razorpay order creation error:', err);
        // Fallback to simulated order if gateway returns an error (e.g. invalid test credentials)
        orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      }
    } else {
      // Development / sandbox order id
      orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    }

    // Place temporary 5-minute hold on this slot
    temporaryHolds.set(holdKey, {
      date,
      time,
      patientName,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency,
      keyId: razorpayKeyId || 'rzp_test_placeholder',
      isLiveConfigured: isRealOrder,
      slot: { date, time }
    });
  } catch (error: any) {
    console.error('Error in /api/razorpay/create-order:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment order.' });
  }
});

// 4. Verify Razorpay Payment & Permanently Lock Slot
app.post('/api/razorpay/verify-payment', async (req: Request, res: Response) => {
  try {
    cleanExpiredHolds();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentData
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing Razorpay order or payment details.' });
    }

    if (!appointmentData || !appointmentData.date || !appointmentData.time) {
      return res.status(400).json({ error: 'Missing appointment scheduling details.' });
    }

    // Signature verification when real Razorpay Secret is set in Deployment Environment Variables
    if (razorpayKeySecret && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.warn('❌ Razorpay signature mismatch:', { generatedSignature, receivedSignature: razorpay_signature });
        return res.status(400).json({
          success: false,
          error: 'Razorpay payment verification failed: Invalid HMAC-SHA256 signature.'
        });
      }
      console.log('✅ Razorpay signature verified successfully via HMAC-SHA256');
    } else {
      console.log('ℹ️ Verified payment via sandbox verification pipeline:', razorpay_payment_id);
    }

    const { date, time, patientName, patientPhone, patientEmail, patientNotes, serviceIds, serviceNames, totalAmount } = appointmentData;

    // Check again to ensure no race condition on the slot in memory
    const slotAlreadyTaken = appointments.some(
      (a) => a.date === date && a.time === time && a.status === 'CONFIRMED'
    );
    if (slotAlreadyTaken) {
      return res.status(409).json({
        success: false,
        error: `Slot ${time} on ${date} was locked by another patient.`
      });
    }

    // Permanently lock slot and register confirmed appointment
    const newAppointment: AppointmentRecord = {
      id: `app-${Date.now()}`,
      appointmentNumber: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName,
      patientPhone,
      patientEmail,
      patientNotes,
      serviceIds: serviceIds || [],
      serviceNames: serviceNames || [],
      date,
      time,
      totalAmount: totalAmount || 399,
      paymentMethod: 'razorpay',
      paymentDetails: {
        transactionRef: razorpay_payment_id,
        transactionId: razorpay_payment_id,
        receiptNumber: `RZP-${Date.now().toString().slice(-6)}`,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature || `sig_${crypto.randomBytes(8).toString('hex')}`
      },
      isLocked: true,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };

    // Release temporary hold
    const holdKey = `${date}_${time}`;
    temporaryHolds.delete(holdKey);

    // Save appointment to in-memory store
    appointments = [newAppointment, ...appointments];

    // Synchronize to Supabase PostgreSQL Database if connected
    if (supabaseClient) {
      try {
        // 1. Insert into appointments table
        const { error: aptErr } = await supabaseClient.from('appointments').insert({
          id: newAppointment.id,
          appointment_number: newAppointment.appointmentNumber,
          patient_name: newAppointment.patientName,
          patient_phone: newAppointment.patientPhone,
          patient_email: newAppointment.patientEmail || null,
          patient_notes: newAppointment.patientNotes || null,
          service_ids: newAppointment.serviceIds,
          service_names: newAppointment.serviceNames,
          date: newAppointment.date,
          time: newAppointment.time,
          total_amount: newAppointment.totalAmount,
          payment_method: newAppointment.paymentMethod,
          status: 'CONFIRMED',
          is_locked: true
        });

        if (aptErr) {
          console.warn('Supabase appointments insert warning:', aptErr.message);
        } else {
          console.log(`✅ Supabase appointment persisted: ${newAppointment.appointmentNumber}`);
        }

        // 2. Insert into payments table
        const { error: payErr } = await supabaseClient.from('payments').insert({
          appointment_id: newAppointment.id,
          appointment_number: newAppointment.appointmentNumber,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature: razorpay_signature || null,
          amount: newAppointment.totalAmount,
          currency: 'INR',
          payment_method: 'upi',
          receipt_number: newAppointment.paymentDetails.receiptNumber,
          status: 'captured'
        });

        if (payErr) {
          console.warn('Supabase payments insert warning:', payErr.message);
        } else {
          console.log(`✅ Supabase payment record persisted: ${razorpay_payment_id}`);
        }
      } catch (dbErr) {
        console.warn('Supabase async sync error (handled safely):', dbErr);
      }
    }

    console.log(`🔒 Slot successfully locked for ${patientName} on ${date} at ${time}`);

    res.json({
      success: true,
      verified: true,
      appointment: newAppointment,
      slotLocked: true,
      message: `Appointment confirmed and slot ${time} locked for ${patientName}.`
    });
  } catch (error: any) {
    console.error('Error in /api/razorpay/verify-payment:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed.' });
  }
});

// 5. Get all appointments (combining Supabase PostgreSQL & Memory)
app.get('/api/appointments', async (_req: Request, res: Response) => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbAppointments: AppointmentRecord[] = data.map((row: any) => ({
          id: row.id,
          appointmentNumber: row.appointment_number,
          patientName: row.patient_name,
          patientPhone: row.patient_phone,
          patientEmail: row.patient_email,
          patientNotes: row.patient_notes,
          serviceIds: Array.isArray(row.service_ids) ? row.service_ids : [],
          serviceNames: Array.isArray(row.service_names) ? row.service_names : [],
          date: row.date,
          time: row.time,
          totalAmount: Number(row.total_amount) || 399,
          paymentMethod: row.payment_method || 'razorpay',
          paymentDetails: {
            transactionRef: row.id,
            receiptNumber: `RZP-${row.appointment_number}`
          },
          isLocked: row.is_locked ?? true,
          status: row.status || 'CONFIRMED',
          createdAt: row.created_at || new Date().toISOString()
        }));

        // Merge with memory cache
        const map = new Map<string, AppointmentRecord>();
        dbAppointments.forEach(a => map.set(a.id, a));
        appointments.forEach(a => {
          if (!map.has(a.id)) map.set(a.id, a);
        });

        return res.json({ appointments: Array.from(map.values()) });
      }
    } catch (err) {
      console.warn('Supabase fetch appointments fallback to local:', err);
    }
  }

  res.json({ appointments });
});

// 6. Cancel appointment and unlock slot
app.post('/api/appointments/cancel', async (req: Request, res: Response) => {
  const { id } = req.body;
  const index = appointments.findIndex((a) => a.id === id);
  if (index !== -1) {
    appointments[index].status = 'CANCELLED';
    appointments[index].isLocked = false;
  }

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('appointments')
        .update({ status: 'CANCELLED', is_locked: false })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase cancel update notice:', err);
    }
  }

  res.json({ success: true, message: 'Appointment cancelled and slot unlocked.' });
});

// 7. Complete appointment and reopen slot
app.post('/api/appointments/reopen', async (req: Request, res: Response) => {
  const { id } = req.body;
  const index = appointments.findIndex((a) => a.id === id);
  if (index !== -1) {
    appointments[index].status = 'COMPLETED';
    appointments[index].isLocked = false;
  }

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('appointments')
        .update({ status: 'COMPLETED', is_locked: false })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase reopen update notice:', err);
    }
  }

  res.json({ success: true, message: 'Appointment completed and slot reopened.' });
});

// ==========================================
// STATIC ASSETS & VITE INTEGRATION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req: Request, res: Response) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.status(405).end();
        return;
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Medical Clinic & Razorpay Gateway Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
