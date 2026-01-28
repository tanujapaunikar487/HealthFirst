import { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { Calendar, Sparkles, BarChart3 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { StepIndicator } from '@/Components/Booking/StepIndicator';
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex-none border-b bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Booking an appointment</span>
          </div>
          <div className="flex items-center gap-1 border rounded-full p-1">
            <Link
              href="/booking?mode=ai"
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
            </Link>
            <div className="p-2 rounded-full bg-gray-100">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator steps={steps} currentStepId={currentStepId} />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Blue gradient at top */}
        <div className="bg-gradient-to-b from-blue-50 to-white min-h-full">
          <div className={cn("max-w-3xl mx-auto px-6 py-8", className)}>
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none border-t bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-full px-6"
            disabled={isProcessing}
          >
            Back
          </Button>

          <div className="flex items-center gap-4">
            {priceEstimate && (
              <span className="text-sm text-muted-foreground">
                {priceEstimate}
              </span>
            )}
            <Button
              onClick={onContinue}
              disabled={continueDisabled || isProcessing}
              className="rounded-full min-w-[120px]"
            >
              {isProcessing ? 'Processing...' : continueLabel}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
