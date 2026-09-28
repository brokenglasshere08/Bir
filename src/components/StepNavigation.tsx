import React from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  onNavigate: (step: number) => void;
  hasSelectedServices: boolean;
  hasSelectedSchedule: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onNavigate,
  hasSelectedServices,
  hasSelectedSchedule
}) => {
  const steps = [
    { num: 1, label: 'Profile', canClick: true },
    { num: 2, label: 'Services', canClick: true },
    { num: 3, label: 'Schedule', canClick: hasSelectedServices },
    { num: 4, label: 'Payment', canClick: hasSelectedServices && hasSelectedSchedule }
  ];

  return (
    <nav className="bg-slate-50 px-3 sm:px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-500 select-none">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.num;
        const isPast = currentStep > step.num;

        return (
          <React.Fragment key={step.num}>
            <button
              type="button"
              disabled={!step.canClick}
              onClick={() => onNavigate(step.num)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition whitespace-nowrap ${
                isActive
                  ? 'text-blue-600 bg-blue-50 font-bold ring-1 ring-blue-200'
                  : step.canClick
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-300 opacity-60 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isPast
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isPast ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : step.num}
              </span>
              <span className="hidden xs:inline">{step.label}</span>
            </button>

            {idx < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
