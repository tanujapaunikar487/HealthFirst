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
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className={cn('px-6 py-3 bg-white', className)}>
      <div className="max-w-3xl mx-auto">
        {/* Progress line container */}
        <div className="relative mb-2">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Progress segment */}
                  <div className="relative h-1 flex-1">
                    {/* Background line with full radius */}
                    <div className="absolute inset-0 bg-gray-200 rounded-full" />

                    {/* Active progress line with full radius */}
                    {(isCompleted || isCurrent) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300" />
                    )}

                    {/* Current step circle indicator - positioned on top */}
                    {isCurrent && !isLast && (
                      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-600 rounded-full z-10" />
                    )}
                  </div>

                  {/* Last step has a circle at the end */}
                  {isLast && (
                    <div
                      className={cn(
                        'w-3.5 h-3.5 rounded-full transition-colors z-10',
                        isCurrent || isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step labels */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCurrent = index === currentIndex;

            return (
              <div
                key={step.id}
                className={cn('text-sm whitespace-nowrap', index === 0 ? 'text-left' : '')}
                style={
                  index === 0
                    ? { flex: '0 0 auto' }
                    : index === steps.length - 1
                      ? { flex: '0 0 auto' }
                      : { flex: '1 1 0%', textAlign: 'center' }
                }
              >
                <span
                  className={cn(
                    'transition-colors',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
