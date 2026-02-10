import { PropsWithChildren } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { AIBookingHeader } from '@/Components/Booking/AIBookingHeader';
import { cn } from '@/Lib/utils';
import { useAccessibilityPreferences } from '@/Hooks/useAccessibilityPreferences';

interface Step {
  id: string;
  label: string;
}

interface GuidedBookingLayoutProps extends PropsWithChildren {
  steps: Step[];
  currentStepId: string;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  priceEstimate?: string;
  isProcessing?: boolean;
  className?: string;
}

export function GuidedBookingLayout({
  children,
  steps,
  currentStepId,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  priceEstimate,
  isProcessing = false,
  className,
}: GuidedBookingLayoutProps) {
  // Apply user accessibility preferences
  useAccessibilityPreferences();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <AIBookingHeader
        steps={steps}
        currentStepId={currentStepId}
        cancelUrl="/"
      />

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full px-4 sm:px-6 py-6 sm:py-8">
          <div className={cn("max-w-[800px] mx-auto", className)}>
            {children}
          </div>
        </div>
      </main>

      {/* Footer - Stack buttons on mobile, side-by-side on desktop */}
      <footer className="sticky bottom-0 z-10 flex-none border-t bg-background px-4 sm:px-6 py-4">
        <div className="max-w-[800px] mx-auto flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Button
            variant="secondary"
            onClick={onBack}
            className="px-6 w-full sm:w-auto"
            disabled={isProcessing}
          >
            Back
          </Button>

          <Button
            onClick={onContinue}
            disabled={continueDisabled || isProcessing}
            className="min-w-[120px] w-full sm:w-auto text-white"
          >
            {isProcessing ? 'Processing...' : priceEstimate ? `Pay ${priceEstimate.replace(/Total:|Est:/g, '').trim()}` : continueLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
