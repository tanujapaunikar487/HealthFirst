import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';
import { Icon } from '@/Components/ui/icon';

/**
 * Badge Component
 *
 * Status indicators and labels with 5 semantic variants and 2 sizes.
 * Optional leading icon. Stateless, presentation-only.
 *
 * Styling follows shadcn/ui v4 base with semantic color tokens.
 */

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden transition-[color,box-shadow] [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        success: 'border-success-border bg-success-subtle text-success-subtle-foreground',
        danger: 'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
        warning: 'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
        info: 'border-info-border bg-info-subtle text-info-subtle-foreground',
        neutral: 'border-border bg-muted text-muted-foreground',
      },
      size: {
        sm: 'text-caption',
        lg: 'text-label',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  }
);

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'lg';

const iconSizeClasses: Record<string, string> = {
  sm: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: any;
}

function Badge({
  className,
  variant = 'neutral',
  size = 'sm',
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {icon && (
        <Icon icon={icon} className={cn('shrink-0', iconSizeClasses[size || 'sm'])} />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
