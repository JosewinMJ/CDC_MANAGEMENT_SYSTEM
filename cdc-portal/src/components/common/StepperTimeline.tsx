import React from 'react';
import { CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { InternshipApprovalStep } from '../../shared/types';
import { formatDate } from '../../shared/utils';

interface StepperTimelineProps {
  steps: InternshipApprovalStep[];
  className?: string;
}

export const StepperTimeline: React.FC<StepperTimelineProps> = ({ steps, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const isApproved = step.decision === 'APPROVED' || step.decision === 'SUBMITTED';
        const isRejected = step.decision === 'REJECTED';
        const isPending = step.decision === 'PENDING';
        const isLast = index === steps.length - 1;

        return (
          <div key={step.stepNumber} className="relative flex items-start gap-4">
            {/* Connecting line */}
            {!isLast && (
              <div
                className={`absolute left-4 top-8 w-0.5 h-full -ml-[1px] ${
                  isApproved ? 'bg-emerald-300' : 'bg-slate-200'
                }`}
              />
            )}

            {/* Step icon */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                isApproved
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                  : isRejected
                  ? 'bg-rose-50 border-rose-500 text-rose-600'
                  : 'bg-slate-50 border-slate-300 text-slate-400'
              }`}
            >
              {isApproved && <CheckCircle2 className="w-4 h-4" />}
              {isRejected && <XCircle className="w-4 h-4" />}
              {isPending && <Clock className="w-4 h-4" />}
            </div>

            {/* Step details */}
            <div className="flex-1 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-[#142B4A]">
                  Step {step.stepNumber}: {step.stepName}
                </h4>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRejected
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {step.reviewOutcome === 'CHANGES_REQUESTED' ? 'Changes requested' : step.decision}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#78869A] mt-1">
                <span>
                  Responsible:{' '}
                  <strong className="text-slate-700">{step.responsibleUserName}</strong>
                </span>
                {step.decisionDate && (
                  <span>
                    Date: <strong className="text-slate-700">{formatDate(step.decisionDate)}</strong>
                  </span>
                )}
              </div>

              {step.remarks && (
                <div className="mt-2 text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 italic">
                  "{step.remarks}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
