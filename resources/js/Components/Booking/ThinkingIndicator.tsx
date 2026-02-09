import { useState, useEffect } from 'react';
import { HStack, VStack } from '@/Components/ui/stack';
import { cn } from '@/Lib/utils';

interface ThinkingIndicatorProps {
  steps?: string[];
  className?: string;
}

/**
 * ThinkingIndicator - Chain of Thought Display
 *
 * Displays AI thinking process step-by-step with animations.
 * Inspired by https://www.prompt-kit.com/docs/chain-of-thought
 */
export function ThinkingIndicator({ steps = [], className }: ThinkingIndicatorProps) {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (steps.length === 0) return;

    // Show steps one by one with delay
    const timer = setInterval(() => {
      setVisibleSteps((prev) => {
        if (prev >= steps.length) {
          clearInterval(timer);
          setIsComplete(true);
          return prev;
        }
        return prev + 1;
      });
    }, 300); // 300ms delay between steps

    return () => clearInterval(timer);
  }, [steps.length]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <VStack gap={2} className={className}>
      {/* Header */}
      <HStack gap={2} className="text-body text-muted-foreground">
        <svg
          className={cn(
            'w-4 h-4',
            isComplete ? 'text-primary' : 'text-placeholder animate-spin'
          )}
          fill="none"
          viewBox="0 0 24 24"
        >
          {isComplete ? (
            <path
              fill="currentColor"
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
            />
          ) : (
            <>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </>
          )}
        </svg>
        <span className="text-label">
          {isComplete ? 'Analysis complete' : 'Thinking...'}
        </span>
      </HStack>

      {/* Thinking Steps */}
      <VStack gap={1} className="ml-5">
        {steps.slice(0, visibleSteps).map((step, index) => (
          <HStack
            key={index}
            gap={2}
            className={cn(
              'items-start text-body text-muted-foreground animate-in fade-in-50 slide-in-from-left-2',
              'transition-opacity duration-200'
            )}
            style={{
              animationDuration: '200ms',
              animationFillMode: 'both',
            }}
          >
            <span className="text-primary">→</span>
            <span className="flex-1">{step}</span>
          </HStack>
        ))}
      </VStack>

      {/* Progress indicator when not complete */}
      {!isComplete && visibleSteps > 0 && (
        <div className="ml-5 text-body text-placeholder">
          <HStack gap={1}>
            <span className="w-1 h-1 bg-placeholder rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-placeholder rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-placeholder rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </HStack>
        </div>
      )}
    </VStack>
  );
}
