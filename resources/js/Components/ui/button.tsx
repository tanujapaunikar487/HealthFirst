import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';

/**
 * Button Component
 *
 * Stateless, presentation-only button component.
 * Consumes design tokens only. No business logic.
 */

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2',
  {
    variants: {
      variant: {
        default: 'bg-[#2563EB] text-white hover:bg-[#2563EB]/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-[#E5E5E5] bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'border border-[#E5E5E5] bg-[#F5F5F5] text-foreground hover:bg-[#E5E5E5]',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        accent: 'bg-[#171717] text-white hover:bg-[#171717]/90',
        cta: 'bg-white text-[#00184D] hover:bg-white/95',
      },
      size: {
        default: 'h-12 py-2 px-8 text-sm',
        sm: 'h-8 px-4 text-sm',
        md: 'h-10 px-6 text-sm',
        lg: 'h-12 py-2 px-8 text-sm',
        xl: 'h-14 px-8 text-sm',
        cta: 'h-12 py-2 px-8 text-sm',
        icon: 'h-10 w-10',
      },
      rounded: {
        default: 'rounded-full',
        full: 'rounded-full',
        none: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
