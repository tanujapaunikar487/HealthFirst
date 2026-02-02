import { PropsWithChildren } from 'react';
import { Link, router } from '@inertiajs/react';
import { Sparkles, BarChart3, X } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { StepIndicator } from '@/Components/Booking/StepIndicator';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';

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
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 flex-none border-b bg-white">
        <div className="flex items-center justify-between gap-8 px-6 py-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src="/assets/icons/hugeicons/appointment-02.svg" alt="" className="w-5 h-5" />
            <span className="font-medium text-sm">Booking an appointment</span>
          </div>

          {/* Step indicator - inline, will handle its own 800px centering */}
          <div className="flex-1 min-w-0">
            <StepIndicator steps={steps} currentStepId={currentStepId} className="!px-0 !py-0" />
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 border rounded-full p-1 bg-gray-50">
            <Link
              href="/booking?mode=ai"
              className="p-1.5 rounded-full hover:bg-gray-100 transition-all"
            >
              <img
                src="/assets/icons/hugeicons/ai-magic-1.svg"
                alt=""
                className="w-4 h-4"
              />
            </Link>
            <div className="p-1.5 rounded-full bg-white shadow-md">
              <img
                src="/assets/icons/hugeicons/stairs-01-1.svg"
                alt=""
                className="w-4 h-4"
              />
            </div>

            {/* Cancel button */}
            <button
              onClick={() => router.visit('/')}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
              title="Cancel booking"
            >
              <Icon icon={X} className="w-4 h-4 text-gray-600" />
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Blue gradient at top */}
        <div className="bg-gradient-to-b from-blue-50 to-white min-h-full px-6 py-8">
          <div className={cn("max-w-[800px] mx-auto", className)}>
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 flex-none border-t bg-white px-6 py-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Button
            variant="outline"
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
