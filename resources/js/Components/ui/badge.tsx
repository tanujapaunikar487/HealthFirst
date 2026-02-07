import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Icon } from '@/Components/ui/icon';

/**
 * Badge Component
 *
 * Status indicators and labels with 5 semantic variants and 2 sizes.
 * Optional leading icon. Stateless, presentation-only.
 */

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'lg';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-600',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  neutral: 'border-border bg-muted text-muted-foreground',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-caption',
  lg: 'text-label',
};

const iconSizeClasses: Record<BadgeSize, string> = {
  sm: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
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
    <div
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border gap-1',
        icon ? 'py-1 pl-1 pr-2' : 'py-1 px-2',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon && (
        <Icon icon={icon} className={cn('shrink-0', iconSizeClasses[size])} />
      )}
      {children}
    </div>
  );
}

export { Badge };
