import { Link, router } from '@inertiajs/react';
import { HStack } from '@/Components/ui/stack';
import { Button } from '@/Components/ui/button';
import { Icon } from '@/Components/ui/icon';
import { X } from '@/Lib/icons';
import { cn } from '@/Lib/utils';

export interface AIBookingHeaderProps {
  /** Progress percentage (0-100) */
  progress?: number;
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
  showModeToggle = false,
  activeMode = 'ai',
  onModeChange,
  cancelUrl = '/',
}: AIBookingHeaderProps) {
  return (
    <header className="bg-card border-b border-border">
      <HStack className="justify-between items-center px-6 py-4">
        <HStack gap={2}>
          <img src="/assets/icons/hugeicons/appointment-02.svg" alt="" className="w-5 h-5" />
          <span className="text-label">Booking an appointment</span>
        </HStack>
        <HStack gap={4} className="items-center">
          {/* Mode toggle - shown on entry page */}
          {showModeToggle && onModeChange && (
            <HStack gap={1} className="border border-border rounded-full p-1 bg-muted">
              <Button
                variant="ghost"
                className={cn(
                  'h-auto p-2 rounded-full transition-all',
                  activeMode === 'ai' ? 'bg-background shadow-md hover:bg-background' : 'hover:bg-transparent'
                )}
                onClick={() => onModeChange('ai')}
                iconOnly
              >
                <img
                  src={activeMode === 'ai' ? '/assets/icons/hugeicons/ai-magic.svg' : '/assets/icons/hugeicons/ai-magic-1.svg'}
                  alt=""
                  className="w-4 h-4"
                />
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  'h-auto p-2 rounded-full transition-all',
                  activeMode === 'guided' ? 'bg-background shadow-md hover:bg-background' : 'hover:bg-transparent'
                )}
                onClick={() => onModeChange('guided')}
                iconOnly
              >
                <img
                  src={activeMode === 'guided' ? '/assets/icons/hugeicons/stairs-01-1.svg' : '/assets/icons/hugeicons/stairs-01.svg'}
                  alt=""
                  className="w-4 h-4"
                />
              </Button>
            </HStack>
          )}

          {/* Active AI indicator - shown in conversation */}
          {!showModeToggle && (
            <HStack gap={1} className="border border-border rounded-full p-1 bg-muted">
              <div className="p-2 rounded-full bg-background shadow-md">
                <img src="/assets/icons/hugeicons/ai-magic.svg" alt="" className="w-4 h-4" />
              </div>
              <Link
                href="/booking?mode=guided"
                className="p-2 rounded-full hover:bg-accent transition-all"
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
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-r-full"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>
    </header>
  );
}
