import { cn } from '@/Lib/utils';

interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStepId: string;
  className?: string;
}

export function StepIndicator({ steps, currentStepId, className }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className={cn("px-6 py-4 bg-white border-b border-gray-200", className)}>
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step label */}
              <div className="flex flex-col items-center relative z-10">
                <span className={cn(
                  "text-sm whitespace-nowrap",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-4 h-0.5 relative" style={{ marginTop: '-12px' }}>
                  {/* Background line */}
                  <div className="absolute inset-0 bg-gray-200 rounded-full" />

                  {/* Progress line */}
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300",
                      isCompleted || isCurrent ? "w-full" : "w-0"
                    )}
                  />

                  {/* Current step indicator dot */}
                  {isCurrent && (
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-sm" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
