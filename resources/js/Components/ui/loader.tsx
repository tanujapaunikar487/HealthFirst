import * as React from 'react';
import { cn } from '@/Lib/utils';

/**
 * Loader Component
 *
 * Animated loading indicators for different states.
 */

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
}

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function Loader({
  variant = 'dots',
  size = 'md',
  className,
  ...props
}: LoaderProps) {
  if (variant === 'dots') {
    return (
      <div
        className={cn('flex items-center gap-1', className)}
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-muted-foreground/70 animate-pulse-dot',
              dotSizes[size]
            )}
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'spinner') {
    return (
      <div
        className={cn(
          'border-2 border-muted border-t-primary rounded-full animate-spin',
          size === 'sm' && 'w-4 h-4',
          size === 'md' && 'w-6 h-6',
          size === 'lg' && 'w-8 h-8',
          className
        )}
        {...props}
      />
    );
  }

  // pulse variant
  return (
    <div
      className={cn(
        'rounded-full bg-primary animate-pulse',
        size === 'sm' && 'w-2 h-2',
        size === 'md' && 'w-3 h-3',
        size === 'lg' && 'w-4 h-4',
        className
      )}
      {...props}
    />
  );
}
