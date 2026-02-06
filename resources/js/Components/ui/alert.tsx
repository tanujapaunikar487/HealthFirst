import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';
import { Check, X } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

/**
 * Alert Component
 *
 * Two modes: sticky (below headers, 8px radius) and standalone (in content, 24px radius).
 * Filled circle icons with white symbols inside.
 * Stateless, presentation-only.
 */

const alertVariants = cva(
  'flex items-start gap-3 border-b p-4 pb-5',
  {
    variants: {
      variant: {
        info: 'bg-blue-50 border-b-sky-200',
        success: 'bg-green-50 border-b-green-200',
        warning: 'bg-amber-50 border-b-amber-200',
        error: 'bg-red-50 border-b-red-200',
      },
      mode: {
        standalone: 'rounded-3xl border-b-2',
        sticky: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'info',
      mode: 'standalone',
    },
  }
);

const alertIconConfig = {
  info: { type: 'text' as const, content: 'i', bg: 'bg-blue-600' },
  success: { type: 'icon' as const, icon: Check, bg: 'bg-green-700' },
  warning: { type: 'text' as const, content: '!', bg: 'bg-amber-600' },
  error: { type: 'icon' as const, icon: X, bg: 'bg-red-600' },
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  hideIcon?: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

function Alert({
  className,
  variant = 'info',
  mode = 'standalone',
  title,
  hideIcon = false,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const config = alertIconConfig[variant || 'info'];

  return (
    <div className={cn(alertVariants({ variant, mode }), className)} {...props}>
      {!hideIcon && (
        <div
          className={cn(
            'h-[22px] w-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
            config.bg
          )}
        >
          {config.type === 'icon' ? (
            <Icon icon={config.icon} className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          ) : (
            <span className="text-white text-[12px] font-bold leading-none">{config.content}</span>
          )}
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
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 hover:bg-black/5 transition-colors"
        >
          <Icon icon={X} className="h-4 w-4 text-foreground" />
        </button>
      )}
    </div>
  );
}

export { Alert, alertVariants };
