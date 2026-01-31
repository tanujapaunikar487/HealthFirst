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

  // Calculate dot position at the center of current step label
  // Each step label is evenly distributed, so the center of each step is:
  // Step 0: 12.5% (center of first quarter)
  // Step 1: 37.5% (center of second quarter)
  // Step 2: 62.5% (center of third quarter)
  // Step 3: 87.5% (center of fourth quarter)
  const stepWidth = 100 / steps.length; // Width of each step segment
  const dotPercentage = (currentIndex * stepWidth) + (stepWidth / 2);

  // Gradient should go up to the dot position (not beyond)
  const progressPercentage = dotPercentage;

  return (
    <div className={cn('px-6 py-3 bg-white', className)}>
      <div className="w-full max-w-[800px] mx-auto">
        {/* Progress line container */}
        <div className="relative mb-2 h-1">
          {/* Background line */}
          <div className="absolute inset-0 bg-gray-200 rounded-full" />

          {/* Single continuous gradient overlay */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Current step circle indicator - positioned at current step label */}
          {currentIndex < steps.length && (
            <div
              className="absolute top-1/2 w-3.5 h-3.5 bg-blue-600 rounded-full z-10 transition-all duration-300"
              style={{
                left: `${dotPercentage}%`,
                transform: 'translate(-50%, -50%)',
              }}
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
                className="text-sm whitespace-nowrap text-center"
                style={{
                  flex: '1 1 0%',
                }}
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
