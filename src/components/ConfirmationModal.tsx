import React from 'react';
import { CheckCircle2, Calendar, Clock, Download, ExternalLink, ShieldCheck, Lock, Sparkles, Printer } from 'lucide-react';
import { Appointment } from '../lib/types.js';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onViewAllBookings: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onViewAllBookings
}) => {
  if (!isOpen || !appointment) return null;

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Dr. Ananya Rao - ${appointment.serviceNames.join(', ')}`);
    const details = encodeURIComponent(
      `Appointment Ref: ${appointment.appointmentNumber}\nClinic: Aura Medical & Dental Wellness Centre\nPatient: ${appointment.patientName}\nAmount Paid: ₹${appointment.totalAmount}\nPayment: Razorpay Verified (${appointment.paymentDetails.razorpayPaymentId || appointment.paymentDetails.transactionRef})\nSlot: Locked for patient`
    );
    const location = encodeURIComponent('Suite 402, 100ft Road, Indiranagar, Bangalore');

    const dateParts = appointment.date.split('-');
    const [timeStr, period] = appointment.time.split(' ');
    const [hourStr, minStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const startDate = new Date(
      parseInt(dateParts[0], 10),
      parseInt(dateParts[1], 10) - 1,
      parseInt(dateParts[2], 10),
      hour,
      parseInt(minStr, 10)
    );
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatCalTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${formatCalTime(startDate)}/${formatCalTime(endDate)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Appointment Confirmation"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 animate-scaleUp max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Verification Icon */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-extrabold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified by Razorpay</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-2">Appointment Confirmed!</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Booking Ref: <span className="font-mono font-bold text-slate-800">{appointment.appointmentNumber}</span>
          </p>
        </div>

        {/* Slot Confirmed Banner */}
        <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-left space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Slot Reserved for {appointment.patientName}</span>
          </div>
          <p className="text-[11px] text-emerald-800/90 leading-relaxed font-medium">
            Your consultation slot at <strong className="text-emerald-950 font-bold">{appointment.time}</strong> on <strong className="text-emerald-950 font-bold">{appointment.date}</strong> is confirmed and locked exclusively for you.
          </p>
        </div>

        {/* Appointment Details Box */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5 font-medium">
          <div className="flex justify-between items-start">
            <span className="text-slate-400">Doctor:</span>
            <span className="font-bold text-slate-900 text-right">Dr. Ananya Rao</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-400">Patient:</span>
            <span className="font-bold text-slate-900 text-right">{appointment.patientName}</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-400">Treatments:</span>
            <span className="font-bold text-slate-900 text-right max-w-[180px] truncate">
              {appointment.serviceNames.join(', ')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Date:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {appointment.date}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Time:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {appointment.time}
            </span>
          </div>

          {/* Razorpay Transaction Details */}
          <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
            <div className="flex justify-between items-center text-slate-500">
              <span>Razorpay Order ID:</span>
              <span className="font-mono font-bold text-slate-700">
                {appointment.paymentDetails.razorpayOrderId || 'order_rzp_verified'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Razorpay Payment ID:</span>
              <span className="font-mono font-bold text-emerald-700">
                {appointment.paymentDetails.razorpayPaymentId || appointment.paymentDetails.transactionRef}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-bold">Total Paid:</span>
            <span className="font-extrabold text-blue-600 text-sm">
              ₹{appointment.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-blue-200"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Add to Google Calendar</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onViewAllBookings}
              className="py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
            >
              <span>My Bookings</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold"
          >
            Close & Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};
