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
          'px-4 py-2 text-label',
          'border border-border bg-background text-foreground',
          'hover:bg-muted hover:border-muted-foreground/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
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
