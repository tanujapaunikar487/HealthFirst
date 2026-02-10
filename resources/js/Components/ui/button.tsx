import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';

/**
 * Button Component
 *
 * Stateless, presentation-only button component.
 * 5 primary variants (primary, secondary, accent, destructive, outline) + 3 compat variants.
 * 4 sizes (lg/md/sm/xs) with iconOnly mode for square buttons.
 */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        accent: 'bg-accent-foreground text-accent hover:bg-accent-foreground/90',
        destructive: 'border border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20',
        outline: 'border border-border bg-transparent text-foreground hover:bg-muted',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        white: 'bg-white text-foreground hover:bg-white/95',
      },
      size: {
        // Mobile-first: Ensure 44px minimum touch target, desktop keeps original sizes
        lg: 'h-12 px-8 py-2 text-subheading',
        md: 'min-h-[44px] h-10 sm:h-10 px-6 py-2 text-card-title',
        sm: 'min-h-[44px] h-8 sm:h-8 px-4 py-1.5 text-card-title',
        xs: 'min-h-[44px] h-6 sm:h-6 px-3 py-0.5 text-caption',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg',
    },
  }
);

const iconOnlySizes: Record<string, string> = {
  lg: 'w-12 p-0',
  md: 'min-w-[44px] w-10 sm:w-10 p-0',
  sm: 'min-w-[44px] w-8 sm:w-8 p-0',
  xs: 'min-w-[44px] w-6 sm:w-6 p-0',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  iconOnly?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size = 'lg', iconOnly = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          iconOnly && iconOnlySizes[size || 'lg'],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
