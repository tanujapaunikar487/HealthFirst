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
        info: 'bg-[#EFF6FF] border-b-[#BAE6FD]',
        success: 'bg-green-50 border-b-green-200',
        warning: 'bg-amber-50 border-b-amber-200',
        error: 'bg-red-50 border-b-red-200',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const alertIconVariants = {
  info: { icon: Info, className: 'text-[#0EA5E9]' },
  success: { icon: CheckCircle2, className: 'text-green-600' },
  warning: { icon: AlertTriangle, className: 'text-amber-600' },
  error: { icon: XCircle, className: 'text-red-600' },
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
          <p className="text-[14px] font-semibold leading-5 text-[#171717]">
            {title}
          </p>
        )}
        <div className="text-[14px] font-normal leading-5 text-[#737373]">
          {children}
        </div>
      </div>
    </div>
  );
}

export { Alert, alertVariants };
