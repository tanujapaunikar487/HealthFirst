import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';

/**
 * Button Component
 *
 * Stateless, presentation-only button component.
 * 4 primary variants (primary, secondary, accent, destructive) + 4 compat variants.
 * 3 sizes (lg/md/sm) with iconOnly mode for square buttons.
 */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'border border-neutral-200 bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        accent: 'bg-neutral-900 text-white hover:bg-neutral-800',
        destructive: 'border border-red-600 bg-red-50 text-red-700 hover:bg-red-100',
        outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        cta: 'bg-white text-foreground hover:bg-white/95',
      },
      size: {
        lg: 'h-12 px-8 py-2',
        md: 'h-10 px-6 py-2',
        sm: 'h-8 px-4 py-1.5',
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
  md: 'w-10 p-0',
  sm: 'w-8 p-0',
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
