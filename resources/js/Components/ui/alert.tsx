import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';
import { Check, X } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

/**
 * Alert Component
 *
 * Two modes: sticky (below headers, no radius) and standalone (in content, rounded).
 * Filled circle icons with white symbols inside.
 * Stateless, presentation-only.
 *
 * Styling follows shadcn/ui v4 base with semantic color tokens.
 */

const alertVariants = cva(
  'relative w-full flex items-start gap-3 border px-4 py-3',
  {
    variants: {
      variant: {
        info: 'bg-info-subtle border-info-border',
        success: 'bg-success-subtle border-success-border',
        warning: 'bg-warning-subtle border-warning-border',
        error: 'bg-destructive-subtle border-destructive-border',
      },
      mode: {
        standalone: 'rounded-lg',
        sticky: 'rounded-none border-x-0 border-t-0',
      },
    },
    defaultVariants: {
      variant: 'info',
      mode: 'standalone',
    },
  }
);

const alertIconConfig = {
  info: { type: 'text' as const, content: 'i', bg: 'bg-info' },
  success: { type: 'icon' as const, icon: Check, bg: 'bg-success' },
  warning: { type: 'text' as const, content: '!', bg: 'bg-warning' },
  error: { type: 'icon' as const, icon: X, bg: 'bg-destructive' },
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  hideIcon?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

function Alert({
  className,
  variant = 'info',
  mode = 'standalone',
  title,
  hideIcon = false,
  onDismiss,
  action,
  children,
  ...props
}: AlertProps) {
  const config = alertIconConfig[variant || 'info'];

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, mode }), className)}
      {...props}
    >
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
            <span className="text-white text-caption">{config.content}</span>
          )}
        </div>
      )}
      <div className="flex-1 space-y-1">
        {title && (
          <p data-slot="alert-title" className="text-card-title text-foreground">
            {title}
          </p>
        )}
        <div data-slot="alert-description" className="text-body text-muted-foreground">
          {children}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 self-center">{action}</div>
      )}
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

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('text-card-title text-foreground', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('text-body text-muted-foreground', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
