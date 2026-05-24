'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface WizardStep {
  label: string;
  description?: string;
}

interface WizardShellProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isNextDisabled?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  children: ReactNode;
}

export function WizardShell({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
  isNextDisabled,
  nextLabel = 'Next',
  submitLabel = 'Create',
  children,
}: WizardShellProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <nav aria-label="Progress">
        <ol className="flex items-center gap-2">
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;

            return (
              <li key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) onStepChange(i);
                  }}
                  disabled={!isCompleted}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                        ? 'bg-indigo-500/20 text-indigo-400 cursor-pointer hover:bg-indigo-500/30'
                        : 'bg-zinc-800 text-zinc-500',
                  )}
                >
                  {i + 1}
                </button>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-zinc-100' : isCompleted ? 'text-zinc-400' : 'text-zinc-600',
                  )}
                >
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn('mx-2 h-px w-8', isCompleted ? 'bg-indigo-500/30' : 'bg-zinc-800')} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div>{children}</div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={isFirst}
          className="text-zinc-400 hover:text-zinc-200"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        {isLast ? (
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting || isNextDisabled}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Creating...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onNext}
            disabled={isNextDisabled}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {nextLabel}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
