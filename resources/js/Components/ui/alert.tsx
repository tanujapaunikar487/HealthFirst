import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';
import { Info, AlertTriangle, CheckCircle2, XCircle } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

/**
 * Alert Component
 *
 * Standalone alert/notice component for informational messages.
 * Stateless, presentation-only. Consumes design tokens.
 */

const alertVariants = cva(
  'flex items-start gap-3 rounded-[20px] border-b-2 p-4 pb-5',
  {
    variants: {
      variant: {
        info: 'bg-info/10 border-b-info/30',
        success: 'bg-success/10 border-b-success/20',
        warning: 'bg-warning/10 border-b-warning/20',
        error: 'bg-destructive/10 border-b-destructive/20',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const alertIconVariants = {
  info: { icon: Info, className: 'text-info' },
  success: { icon: CheckCircle2, className: 'text-success' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  error: { icon: XCircle, className: 'text-destructive' },
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  hideIcon?: boolean;
  children?: React.ReactNode;
}

function Alert({
  className,
  variant = 'info',
  title,
  hideIcon = false,
  children,
  ...props
}: AlertProps) {
  const iconConfig = alertIconVariants[variant || 'info'];
  const AlertIcon = iconConfig.icon;

  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      {!hideIcon && (
        <div className="flex-shrink-0 mt-0.5">
          <Icon icon={AlertIcon} className={cn('h-5 w-5', iconConfig.className)} />
        </div>
      )}
      <div className="flex-1 space-y-1">
        {title && (
          <p className="text-[14px] font-semibold leading-5 text-foreground">
            {title}
          </p>
        )}
        <div className="text-[14px] font-normal leading-5 text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

export { Alert, alertVariants };
