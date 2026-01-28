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
        <div
          className={cn(
            'rounded-full bg-gray-400 animate-bounce',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-3 h-3'
          )}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={cn(
            'rounded-full bg-gray-400 animate-bounce',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-3 h-3'
          )}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={cn(
            'rounded-full bg-gray-400 animate-bounce',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-3 h-3'
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
    );
  }

  if (variant === 'spinner') {
    return (
      <div
        className={cn(
          'border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin',
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
        'rounded-full bg-blue-500 animate-pulse',
        size === 'sm' && 'w-2 h-2',
        size === 'md' && 'w-3 h-3',
        size === 'lg' && 'w-4 h-4',
        className
      )}
      {...props}
    />
  );
}
