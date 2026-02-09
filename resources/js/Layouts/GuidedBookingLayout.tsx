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
        <div className="min-h-full px-6 py-8">
          <div className={cn("max-w-[800px] mx-auto", className)}>
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 flex-none border-t bg-background px-6 py-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={onBack}
            className="px-6"
            disabled={isProcessing}
          >
            Back
          </Button>

          <Button
            onClick={onContinue}
            disabled={continueDisabled || isProcessing}
            className="min-w-[120px] text-white"
          >
            {isProcessing ? 'Processing...' : priceEstimate ? `Pay ${priceEstimate.replace(/Total:|Est:/g, '').trim()}` : continueLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
