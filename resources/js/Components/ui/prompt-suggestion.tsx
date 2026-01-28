import * as React from 'react';
import { cn } from '@/Lib/utils';

export interface PromptSuggestionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const PromptSuggestion = React.forwardRef<HTMLButtonElement, PromptSuggestionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-full',
          'px-4 py-2 text-sm font-medium',
          'border border-gray-300 bg-white text-gray-900',
          'hover:bg-gray-50 hover:border-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'transition-colors',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PromptSuggestion.displayName = 'PromptSuggestion';

export { PromptSuggestion };
