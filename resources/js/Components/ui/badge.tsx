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
        default: 'bg-blue-50 text-blue-700 border-blue-200',
        secondary: 'bg-gray-50 text-gray-600 border-gray-200',
        destructive: 'bg-red-50 text-red-700 border-red-200',
        success: 'bg-green-50 text-green-700 border-green-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        outline: 'text-foreground',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
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
