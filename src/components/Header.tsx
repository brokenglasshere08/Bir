import React from 'react';
import { ChevronLeft, CalendarClock } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onBack: () => void;
  onOpenBookings: () => void;
  bookingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onBack,
  onOpenBookings,
  bookingCount
}) => {
  const titles: Record<number, string> = {
    1: '',
    2: 'Select Services',
    3: 'Schedule Appointment',
    4: 'Secure Payment'
  };

  return (
    <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-20">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 1}
        aria-label="Navigate Back"
        className={`w-9 h-9 flex items-center justify-center rounded-full transition text-sm ${
          currentStep === 1
            ? 'opacity-20 pointer-events-none text-slate-300'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center">
        {titles[currentStep] ? (
          <h1 className="font-extrabold text-slate-900 text-base tracking-tight">
            {titles[currentStep]}
          </h1>
        ) : null}
        <span className="text-[10px] text-slate-400 font-medium">Step {currentStep} of 4</span>
      </div>

      <button
        type="button"
        onClick={onOpenBookings}
        title="View My Bookings"
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition"
      >
        <CalendarClock className="w-4 h-4" />
        {bookingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
            {bookingCount}
          </span>
        )}
      </button>
    </header>
  );
};
