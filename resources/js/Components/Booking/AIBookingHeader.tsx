import { Link } from '@inertiajs/react';
import { HStack } from '@/Components/ui/stack';
import { cn } from '@/Lib/utils';
import { StepIndicator } from '@/Components/Booking/StepIndicator';

interface Step {
  id: string;
  label: string;
}

export interface AIBookingHeaderProps {
  /** Progress percentage (0-100) - used for AI flow */
  progress?: number;
  /** Steps for guided flow - if provided, shows step indicator instead of progress bar */
  steps?: Step[];
  /** Current step ID - required when steps are provided */
  currentStepId?: string;
  /** Show mode toggle (AI/Guided) */
  showModeToggle?: boolean;
  /** Active mode when toggle is shown */
  activeMode?: 'ai' | 'guided';
  /** Callback when mode changes */
  onModeChange?: (mode: 'ai' | 'guided') => void;
  /** Cancel URL - defaults to home */
  cancelUrl?: string;
}

export function AIBookingHeader({
  progress = 16,
  steps,
  currentStepId,
  showModeToggle = false,
  activeMode = 'ai',
  onModeChange,
  cancelUrl = '/',
}: AIBookingHeaderProps) {
  // Determine which mode indicator to show based on steps presence
  const isGuidedFlow = Boolean(steps && currentStepId);
  const isAIFlow = !isGuidedFlow;

  return (
    <header className="bg-card border-b border-border">
      <HStack className="justify-between items-center px-4 sm:px-6 py-4">
        <HStack gap={2} className="flex-shrink-0">
          <img src="/assets/icons/hugeicons/appointment-02.svg" alt="" className="w-5 h-5" />
          <span className="text-label hidden sm:inline">Booking an appointment</span>
        </HStack>

        {/* Step indicator for guided flow - centered in available space, hidden on mobile */}
        {isGuidedFlow && steps && currentStepId && (
          <div className="flex-1 min-w-0 hidden md:block">
            <StepIndicator steps={steps} currentStepId={currentStepId} className="!px-0 !py-0" />
          </div>
        )}

        <HStack gap={2} className="items-center flex-shrink-0 sm:gap-4">
          {/* Mode toggle - shown on entry page (AI flow only) */}
          {isAIFlow && showModeToggle && onModeChange && (
            <HStack gap={1} className="border border-border rounded-full p-1 bg-muted">
              <button
                className={cn(
                  'p-2 rounded-full transition-all',
                  activeMode === 'ai' ? 'bg-background shadow-md' : 'hover:bg-accent/50'
                )}
                onClick={() => onModeChange('ai')}
              >
                <img
                  src={activeMode === 'ai' ? '/assets/icons/hugeicons/ai-magic.svg' : '/assets/icons/hugeicons/ai-magic-1.svg'}
                  alt=""
                  className="w-4 h-4"
                />
              </button>
              <button
                className={cn(
                  'p-2 rounded-full transition-all',
                  activeMode === 'guided' ? 'bg-background shadow-md' : 'hover:bg-accent/50'
                )}
                onClick={() => onModeChange('guided')}
              >
                <img
                  src={activeMode === 'guided' ? '/assets/icons/hugeicons/stairs-01-1.svg' : '/assets/icons/hugeicons/stairs-01.svg'}
                  alt=""
                  className="w-4 h-4"
                />
              </button>
            </HStack>
          )}

          {/* AI/Guided toggle - shown for guided flow */}
          {isGuidedFlow && (
            <HStack gap={1} className="border border-border rounded-full p-1 bg-muted">
              <Link
                href="/booking?mode=ai"
                className="p-2 rounded-full hover:bg-accent/50 transition-all"
              >
                <img src="/assets/icons/hugeicons/ai-magic-1.svg" alt="" className="w-4 h-4" />
              </Link>
              <div className="p-2 rounded-full bg-background shadow-md">
                <img src="/assets/icons/hugeicons/stairs-01-1.svg" alt="" className="w-4 h-4" />
              </div>
            </HStack>
          )}

          {/* Active AI indicator - shown in AI conversation */}
          {isAIFlow && !showModeToggle && (
            <HStack gap={1} className="border border-border rounded-full p-1 bg-muted">
              <div className="p-2 rounded-full bg-background shadow-md">
                <img src="/assets/icons/hugeicons/ai-magic.svg" alt="" className="w-4 h-4" />
              </div>
              <Link
                href="/booking?mode=guided"
                className="p-2 rounded-full hover:bg-accent/50 transition-all"
              >
                <img src="/assets/icons/hugeicons/stairs-01.svg" alt="" className="w-4 h-4" />
              </Link>
            </HStack>
          )}

          {/* Cancel link */}
          <Link href={cancelUrl} className="text-label text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </HStack>
      </HStack>

      {/* Progress bar - only for AI flow */}
      {isAIFlow && (
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary/30 to-primary transition-all duration-300 rounded-r-full"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
      )}
    </header>
  );
}
