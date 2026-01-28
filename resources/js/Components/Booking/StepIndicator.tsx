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

  // Calculate progress percentage for gradient width
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className={cn('px-6 py-3 bg-white', className)}>
      <div className="max-w-3xl mx-auto">
        {/* Progress line container */}
        <div className="relative mb-2 h-1">
          {/* Background line */}
          <div className="absolute inset-0 bg-gray-200 rounded-full" />

          {/* Single continuous gradient overlay */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Current step circle indicator - positioned at the end of progress */}
          {currentIndex < steps.length && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-600 rounded-full z-10 transition-all duration-300"
              style={{ left: `${progressPercentage}%`, transform: 'translate(-50%, -50%)' }}
            />
          )}
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
