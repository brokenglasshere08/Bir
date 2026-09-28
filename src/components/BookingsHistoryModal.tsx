import React, { useState } from 'react';
import { X, CalendarClock, Clock, CheckCircle, XCircle, AlertCircle, FileText, ChevronRight, Phone, Mail } from 'lucide-react';
import { Appointment } from '../lib/types.js';

interface BookingsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onCancelAppointment: (id: string, reason?: string) => Promise<void>;
  onReopenSlot?: (id: string) => Promise<void>;
  onSelectBookingForReceipt: (apt: Appointment) => void;
}

export const BookingsHistoryModal: React.FC<BookingsHistoryModalProps> = ({
  isOpen,
  onClose,
  appointments,
  onCancelAppointment,
  onReopenSlot,
  onSelectBookingForReceipt
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    try {
      setIsSubmitting(true);
      await onCancelAppointment(cancellingId, cancelReason);
      setCancellingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="My Appointments"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Clinic Appointments</h3>
              <p className="text-[11px] text-slate-500 font-medium">Manage booked slots & receipts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {appointments.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                <CalendarClock className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No appointments scheduled yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Select your desired dental or medical services, choose a time slot, and complete booking.
              </p>
            </div>
          ) : (
            appointments.map((apt) => {
              const statusUpper = (apt.status || '').toUpperCase();
              const isConfirmed = statusUpper === 'CONFIRMED';
              const isCompleted = statusUpper === 'COMPLETED';
              const isCancelled = statusUpper === 'CANCELLED';

              return (
                <div
                  key={apt.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isConfirmed
                      ? 'bg-white border-blue-200/80 shadow-xs'
                      : isCompleted
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200/60 opacity-80'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {apt.appointmentNumber}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isConfirmed
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isConfirmed && (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" /> 🔒 Slot Locked
                            </>
                          )}
                          {isCompleted && (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Completed
                            </>
                          )}
                          {isCancelled && (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" /> Cancelled
                            </>
                          )}
                        </span>
                        {isConfirmed && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Razorpay Verified
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        {apt.serviceNames.join(' + ')}
                      </h4>
                    </div>

                    {/* Line separator restored */}
                    <div className="w-full h-px bg-slate-200" />

                    <span className="text-xs font-extrabold text-blue-600">
                      ₹{apt.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">DATE & TIME</span>
                      <span className="font-bold text-slate-800">
                        {apt.date} · {apt.time}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">PATIENT</span>
                      <span className="font-semibold text-slate-800 truncate block">{apt.patientName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBookingForReceipt(apt);
                        onClose();
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipt #{apt.paymentDetails.receiptNumber}</span>
                    </button>

                    {isConfirmed && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCancellingId(apt.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[11px] rounded-lg transition"
                        >
                          Cancel and Get Refund
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cancel Confirmation Prompt */}
        {cancellingId && (
          <div className="p-4 bg-red-50 border-t border-red-200 space-y-3">
            <div className="flex items-center gap-2 text-red-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Are you sure you want to cancel this appointment?</span>
            </div>
            <p className="text-[11px] text-red-700 leading-tight">
              Cancelling will immediately release the reserved clinic time slot and initiate a refund to your original payment method.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancellingId(null)}
                className="w-1/2 py-2 bg-white text-slate-700 font-bold rounded-xl text-xs border border-slate-200"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className="w-1/2 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition"
              >
                {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
