import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Lock } from 'lucide-react';
import { TreatmentService } from '../lib/types.js';
import * as db from '../lib/data.js';

interface ScheduleViewProps {
  selectedServices: TreatmentService[];
  onChangeServices: () => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  onProceedToPayment: () => void;
  showToast: (msg: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  selectedServices,
  onChangeServices,
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  onProceedToPayment,
  showToast
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [unavailableSlots, setUnavailableSlots] = useState<Array<{ time: string; reason: string }>>([]);

  // Time components
  const [hour, setHour] = useState('04');
  const [minute, setMinute] = useState('15');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');

  // Format date YYYY-MM-DD
  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sync hour, minute, ampm from selectedTime prop
  useEffect(() => {
    if (selectedTime) {
      const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        setHour(match[1].padStart(2, '0'));
        setMinute(match[2].padStart(2, '0'));
        setAmpm(match[3].toUpperCase() as 'AM' | 'PM');
      }
    }
  }, [selectedTime]);

  // Check availability whenever selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = formatDateKey(selectedDate);
    
    const fetchAvailability = async () => {
      const localUnavailable = db.getUnavailableSlots(dateStr);
      let merged = [...localUnavailable];

      try {
        const res = await fetch(`/api/slots?date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data.unavailableSlots && Array.isArray(data.unavailableSlots)) {
            for (const item of data.unavailableSlots) {
              if (!merged.some(m => m.time === item.time)) {
                merged.push(item);
              }
            }
          }
        }
      } catch (_e) {
        // Fallback to local state if server route is not responding
      }

      setUnavailableSlots(merged.map((item: any) => typeof item === 'string' ? { time: item, reason: 'Occupied' } : item));
    };

    fetchAvailability();

    // Auto-refresh availability every 6 seconds so slots lock and reopen automatically in real time
    const interval = setInterval(fetchAvailability, 6000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const updateTime = (newH: string, newM: string, newP: 'AM' | 'PM') => {
    const timeString = `${newH}:${newM} ${newP}`;
    setHour(newH);
    setMinute(newM);
    setAmpm(newP);
    onSelectTime(timeString);
  };

  // Calendar calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isSlotUnavailable = (timeStr: string) => {
    return unavailableSlots.some((s) => s.time === timeStr);
  };

  const getSlotReason = (timeStr: string) => {
    return unavailableSlots.find((s) => s.time === timeStr)?.reason;
  };

  const currentSlotUnavailable = isSlotUnavailable(`${hour}:${minute} ${ampm}`);
  const currentSlotReason = getSlotReason(`${hour}:${minute} ${ampm}`);

  // Recommended quick slots
  const quickSlots = [
    { label: '08:30 AM', h: '08', m: '30', p: 'AM' as const },
    { label: '10:15 AM', h: '10', m: '15', p: 'AM' as const },
    { label: '11:30 AM', h: '11', m: '30', p: 'AM' as const },
    { label: '01:00 PM', h: '01', m: '00', p: 'PM' as const },
    { label: '03:00 PM', h: '03', m: '00', p: 'PM' as const },
    { label: '04:15 PM', h: '04', m: '15', p: 'PM' as const },
    { label: '04:30 PM', h: '04', m: '30', p: 'PM' as const },
    { label: '06:30 PM', h: '06', m: '30', p: 'PM' as const },
    { label: '08:30 PM', h: '08', m: '30', p: 'PM' as const }
  ];

  return (
    <section className="space-y-5 animate-fadeIn">
      {/* Treatments Ribbon */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
        <div className="pr-2 min-w-0">
          <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Selected Treatments</p>
          <p className="font-extrabold text-slate-900 text-sm mt-0.5 truncate">
            {selectedServices.map((s) => s.name).join(' + ')}
          </p>
        </div>
        <button
          type="button"
          onClick={onChangeServices}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs shrink-0"
        >
          Change
        </button>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              {currentMonth.toLocaleString('default', { month: 'long' })} {year}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-8" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateObj = new Date(year, month, dayNum);
            dateObj.setHours(0, 0, 0, 0);

            const isPast = dateObj < today;
            const isSelected =
              selectedDate !== null &&
              selectedDate.getFullYear() === year &&
              selectedDate.getMonth() === month &&
              selectedDate.getDate() === dayNum;

            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === dayNum;

            return (
              <button
                key={dayNum}
                type="button"
                disabled={isPast}
                onClick={() => onSelectDate(dateObj)}
                className={`h-8 w-8 mx-auto rounded-full text-xs font-bold transition flex items-center justify-center relative ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isPast
                    ? 'text-slate-300 cursor-not-allowed line-through'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-slate-800 font-bold text-sm">Consultation Time</span>
          </div>
          <span
            className={`font-extrabold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              currentSlotUnavailable
                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}
          >
            {currentSlotUnavailable && <Lock className="w-3 h-3 text-amber-700" />}
            <span>{hour}:{minute} {ampm}</span>
          </span>
        </div>

        {/* Real-time visual slot notice */}
        {currentSlotUnavailable && (
          <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left text-xs">
              <p className="font-extrabold text-amber-950">Slot Reserved</p>
              <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
                {currentSlotReason || 'This consultation slot is already reserved. Please select another slot.'}
              </p>
            </div>
          </div>
        )}

        {/* Quick Slot Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">Recommended Slots</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {quickSlots.map((qs) => {
              const fullTime = `${qs.h}:${qs.m} ${qs.p}`;
              const isSelected = hour === qs.h && minute === qs.m && ampm === qs.p;
              const disabled = isSlotUnavailable(fullTime);
              const slotReason = getSlotReason(fullTime);

              return (
                <button
                  key={qs.label}
                  type="button"
                  title={disabled ? (slotReason || 'Not available') : 'Available for booking'}
                  onClick={() => updateTime(qs.h, qs.m, qs.p)}
                  disabled={disabled}
                  className={`py-2 px-1 rounded-xl text-xs font-bold text-center transition border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : disabled
                      ? 'bg-slate-100/90 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={disabled ? 'line-through text-slate-400' : ''}>{qs.label}</span>
                  {disabled && (
                    <span className="block text-[8.5px] font-extrabold text-amber-800 no-underline leading-none mt-0.5 truncate">
                      {slotReason || 'Reserved'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Wheel / Stepper Picker */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 block mb-2">Custom Slot Picker</span>
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {/* Hour select (08:00 AM to 08:45 PM) */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Hour</label>
              <select
                value={hour}
                onChange={(e) => updateTime(e.target.value, minute, ampm)}
                className="w-full bg-white h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['08', '09', '10', '11', '12', '01', '02', '03', '04', '05', '06', '07', '08'].map((h, idx) => (
                  <option key={`${h}-${idx}`} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Minute select */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Minute</label>
              <select
                value={minute}
                onChange={(e) => updateTime(hour, e.target.value, ampm)}
                className="w-full bg-white h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['00', '15', '30', '45'].map((m) => (
                  <option key={m} value={m}>
                    :{m}
                  </option>
                ))}
              </select>
            </div>

            {/* AM/PM toggle */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Period</label>
              <div className="grid grid-cols-2 gap-1 h-9">
                <button
                  type="button"
                  onClick={() => updateTime(hour, minute, 'AM')}
                  className={`rounded-lg text-xs font-bold transition ${
                    ampm === 'AM'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => updateTime(hour, minute, 'PM')}
                  className={`rounded-lg text-xs font-bold transition ${
                    ampm === 'PM'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (!selectedDate) {
              showToast('Please select an appointment date on the calendar.');
              return;
            }
            if (currentSlotUnavailable) {
              showToast(`Slot occupied (${currentSlotReason || 'Reserved'}). Please choose another slot.`);
              return;
            }
            onProceedToPayment();
          }}
          disabled={!selectedDate || currentSlotUnavailable}
          className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition ${
            !selectedDate || currentSlotUnavailable
              ? 'bg-slate-200 text-slate-400 border border-slate-300/70 cursor-not-allowed shadow-none'
              : 'bg-slate-900 hover:bg-black text-white active:scale-98 cursor-pointer'
          }`}
        >
          {currentSlotUnavailable ? (
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Select an Open Time Slot</span>
            </span>
          ) : (
            <>
              <span>Proceed to Payment</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
};
