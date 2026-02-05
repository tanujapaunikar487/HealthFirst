import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';

/**
 * Badge Component
 *
 * Status indicators and labels.
 * Stateless, presentation-only. Consumes design tokens.
 */

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[14px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-muted text-muted-foreground border-border',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        info: 'bg-info/10 text-info border-info/20',
        outline: 'text-foreground',
        orange: 'bg-warning/10 text-warning border-warning/20',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'orange' | 'purple' | null;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
