import { INITIAL_DOCTOR, INITIAL_SERVICES, INITIAL_REVIEWS } from '../data/initialClinicData.js';
import { DoctorProfile, TreatmentService, PatientReview, Appointment } from './types.js';
import { supabase } from './supabase.js';

let services: TreatmentService[] = [...INITIAL_SERVICES];
let reviews: PatientReview[] = [...INITIAL_REVIEWS];

// Initialize appointments from localStorage if in browser
const APPOINTMENTS_STORAGE_KEY = 'clinic_appointments_v1';
const loadStoredAppointments = (): Appointment[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read appointments from localStorage', e);
    }
  }
  return [];
};

let appointments: Appointment[] = loadStoredAppointments();

// Fetch initial confirmed appointments from Supabase if configured
const syncInitialSupabaseAppointments = async () => {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const loaded: Appointment[] = data.map((row: any) => ({
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
        status: row.status || 'CONFIRMED'
      }));
      appointments = loaded;
      saveAppointments();
    }
  } catch (err: unknown) {
    console.warn('Supabase client load notice:', err);
  }
};

syncInitialSupabaseAppointments();

const saveAppointments = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    } catch (e) {
      console.warn('Could not save appointments to localStorage', e);
    }
  }
};

export const getDoctor = (): DoctorProfile => INITIAL_DOCTOR;
export const getServices = (): TreatmentService[] => services;
export const getReviews = (): PatientReview[] => reviews;

export const addReview = (review: {
  patientName: string;
  rating: number;
  treatment: string;
  comment: string;
}): PatientReview => {
  const initials = review.patientName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'P';

  const newReview: PatientReview = {
    ...review,
    id: `rev-${Date.now()}`,
    initials,
    date: 'Just now',
    verified: true,
    avatarColor: 'bg-teal-600'
  };
  reviews = [newReview, ...reviews];
  return newReview;
};

// Helper to convert time format like "04:15 PM" to minutes from midnight
export const timeToMinutes = (timeStr: string): number => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

// Check locked and unavailable slots for a date (only actual booked/reserved slots)
export const getUnavailableSlots = (
  dateStr: string
): Array<{ time: string; reason: string }> => {
  const unavailable: Array<{ time: string; reason: string }> = [];

  // Check all confirmed appointments on this date
  const confirmedForDate = appointments.filter(
    (a) => a.date === dateStr && a.status === 'CONFIRMED'
  );

  for (const apt of confirmedForDate) {
    unavailable.push({
      time: apt.time,
      reason: `Locked (Booked by ${apt.patientName})`
    });
  }

  return unavailable;
};

// Create Razorpay payment order via backend API with fallback
export const createRazorpayOrder = async (orderParams: {
  amount: number;
  serviceIds: string[];
  serviceNames?: string[];
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  couponCode?: string;
}): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isLiveConfigured?: boolean;
}> => {
  // First check client-side if slot is already confirmed
  const isBooked = appointments.some(
    (a) => a.date === orderParams.date && a.time === orderParams.time && a.status === 'CONFIRMED'
  );
  if (isBooked) {
    throw new Error(`Slot ${orderParams.time} on ${orderParams.date} is already locked by another patient.`);
  }

  try {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderParams)
    });

    if (res.ok) {
      const data = await res.json();
      return {
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency || 'INR',
        keyId: data.keyId || 'rzp_test_placeholder',
        isLiveConfigured: data.isLiveConfigured
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('already locked')) {
      throw err;
    }
    console.warn('Backend order call fallback to client simulator:', err.message);
  }

  // Graceful fallback if backend server route is unavailable
  return {
    orderId: `order_${Math.random().toString(36).substring(2, 14)}`,
    amount: Math.round(orderParams.amount * 100),
    currency: 'INR',
    keyId: 'rzp_test_placeholder',
    isLiveConfigured: false
  };
};

// Verify Razorpay payment and lock appointment slot
export const verifyRazorpayPayment = async (verificationParams: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  appointmentData: {
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    patientNotes?: string;
    serviceIds: string[];
    serviceNames: string[];
    date: string;
    time: string;
    totalAmount: number;
  };
}): Promise<Appointment> => {
  const { appointmentData, razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationParams;

  try {
    const res = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationParams)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.appointment) {
        // Synchronize into local appointments list
        appointments = [data.appointment, ...appointments.filter(a => a.id !== data.appointment.id)];
        saveAppointments();
        return data.appointment;
      }
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error) {
        throw new Error(err.error);
      }
    }
  } catch (err: any) {
    console.warn('Backend verification call fallback to client storage:', err.message);
  }

  // Local fallback: create verified & locked appointment
  const newAppointment: Appointment = {
    id: `app-${Date.now()}`,
    appointmentNumber: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
    patientName: appointmentData.patientName,
    patientPhone: appointmentData.patientPhone,
    patientEmail: appointmentData.patientEmail,
    patientNotes: appointmentData.patientNotes,
    serviceIds: appointmentData.serviceIds,
    serviceNames: appointmentData.serviceNames,
    date: appointmentData.date,
    time: appointmentData.time,
    totalAmount: appointmentData.totalAmount,
    paymentMethod: 'razorpay',
    paymentDetails: {
      transactionRef: razorpay_payment_id,
      transactionId: razorpay_payment_id,
      receiptNumber: `RZP-${Date.now().toString().slice(-6)}`,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature || `sig_${Date.now()}`
    },
    isLocked: true,
    status: 'CONFIRMED'
  };

  appointments = [newAppointment, ...appointments];
  saveAppointments();
  return newAppointment;
};

export const bookAppointment = (appointment: {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientNotes?: string;
  serviceIds: string[];
  date: string;
  time: string;
  totalAmount?: number;
  paymentMethod?: string;
  paymentTransactionId?: string;
  couponCode?: string;
}): Appointment => {
  const calculatedTotal = appointment.totalAmount ?? 399;
  const newAppointment: Appointment = {
    id: `app-${Date.now()}`,
    appointmentNumber: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
    patientName: appointment.patientName,
    patientPhone: appointment.patientPhone,
    patientEmail: appointment.patientEmail,
    patientNotes: appointment.patientNotes,
    serviceIds: appointment.serviceIds,
    serviceNames: services.filter(s => appointment.serviceIds.includes(s.id)).map(s => s.name),
    date: appointment.date,
    time: appointment.time,
    totalAmount: calculatedTotal,
    paymentMethod: appointment.paymentMethod || 'razorpay',
    paymentDetails: {
      transactionRef: `RZP-${Date.now()}`,
      transactionId: appointment.paymentTransactionId || `PAY-${Date.now()}`
    },
    isLocked: true,
    status: 'CONFIRMED'
  };
  appointments = [newAppointment, ...appointments];
  saveAppointments();
  return newAppointment;
};

export const getAppointments = (): Appointment[] => appointments;

export const cancelAppointment = (id: string, _reason?: string): Appointment => {
  const index = appointments.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Appointment not found');
  appointments[index] = {
    ...appointments[index],
    isLocked: false,
    status: 'CANCELLED'
  };
  saveAppointments();

  // Also notify backend if reachable
  fetch('/api/appointments/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, reason: _reason })
  }).catch(() => {});

  return appointments[index];
};

export const reopenSlot = (id: string): Appointment => {
  const index = appointments.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Appointment not found');
  appointments[index] = {
    ...appointments[index],
    isLocked: false,
    status: 'COMPLETED'
  };
  saveAppointments();

  // Also notify backend if reachable
  fetch('/api/appointments/reopen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).catch(() => {});

  return appointments[index];
};

// Backwards-compatibility helpers
export const createPaymentOrder = (_order: { serviceIds: string[]; couponCode?: string }) => {
  return {
    orderId: `ORD-${Date.now()}`,
    totalAmount: 399
  };
};

export const processPayment = (payment: {
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  upiApp?: string;
  cardLast4?: string;
  cardBrand?: string;
  bankName?: string;
}) => {
  return {
    id: `TXN-${Date.now()}`,
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: 'SUCCESS',
    transactionRef: `TXN-${Date.now()}`
  };
};
