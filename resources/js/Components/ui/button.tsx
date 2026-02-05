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
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'border border-border bg-secondary text-foreground hover:bg-muted',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        accent: 'bg-foreground text-background hover:bg-foreground/90',
        cta: 'bg-white text-[#00184D] hover:bg-white/95',
      },
      size: {
        default: 'h-12 py-2 px-8 text-[14px]',
        sm: 'h-8 px-4 text-[14px]',
        md: 'h-10 px-6 text-[14px]',
        lg: 'flex h-12 py-2 px-8 text-[14px]',
        xl: 'h-14 px-8 text-[14px]',
        cta: 'h-12 py-2 px-8 text-[14px]',
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
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const lgStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: '48px',
  fontSize: '16px',
};

const iconStyle: React.CSSProperties = {
  display: 'flex',
  width: '40px',
  height: '40px',
  padding: '8px',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
  borderRadius: '10000px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--secondary))',
  color: 'hsl(var(--foreground))',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, icon: IconComp, children, style, ...props }, ref) => {
    let mergedStyle = style;
    if (size === 'lg') mergedStyle = { ...lgStyle, ...style };
    if (size === 'icon') mergedStyle = { ...iconStyle, ...style };
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, rounded, className }))}
          ref={ref}
          style={mergedStyle}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        style={mergedStyle}
        {...props}
      >
        {IconComp && <IconComp className={size === 'lg' ? 'h-[20px] w-[20px]' : 'h-[16px] w-[16px]'} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
