import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

/**
 * Toast Component
 *
 * Notification component with dark background and status-based colored icons.
 * Follows design system specifications with automatic dismissal.
 */

const toastVariants = cva(
  'fixed z-[1000] flex items-center gap-2 whitespace-nowrap px-6 py-4 rounded-xl shadow-lg shadow-black/20',
  {
    variants: {
      variant: {
        success: '',
        error: '',
        warning: '',
        info: '',
      },
    },
    defaultVariants: {
      variant: 'success',
    },
  }
);

const toastIconConfig: Record<
  'success' | 'error' | 'warning' | 'info',
  { icon: React.ComponentType<any>; bgClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    bgClass: 'bg-success',
    iconClass: 'text-white'
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-destructive',
    iconClass: 'text-white'
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-warning',
    iconClass: 'text-white'
  },
  info: {
    icon: Info,
    bgClass: 'bg-info',
    iconClass: 'text-white'
  },
};

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  /**
   * Message to display in the toast
   */
  message: string;
  /**
   * Show/hide state
   */
  show: boolean;
  /**
   * Duration in milliseconds before auto-dismissing (default: 3000)
   */
  duration?: number;
  /**
   * Callback fired when toast should be hidden
   */
  onHide?: () => void;
  /**
   * Left offset for positioning (default: '160px' to account for sidebar)
   */
  leftOffset?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      message,
      show,
      variant = 'success',
      duration = 3000,
      onHide,
      leftOffset = '160px',
      className,
      ...props
    },
    ref
  ) => {
    React.useEffect(() => {
      if (show && onHide) {
        const timer = setTimeout(() => {
          onHide();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [show, duration, onHide]);

    if (!show) return null;

    const iconConfig = toastIconConfig[variant || 'success'];

    return (
      <>
        <div
          ref={ref}
          className={cn(toastVariants({ variant }), 'text-label text-white', className)}
          style={{
            bottom: '32px',
            left: '50%',
            marginLeft: leftOffset,
            transform: 'translateX(-50%)',
            animation: 'slideUp 0.3s ease-out',
            backgroundColor: '#1a1a1a',
          }}
          {...props}
        >
          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0', iconConfig.bgClass)}>
            <Icon icon={iconConfig.icon} className={cn('h-5 w-5', iconConfig.iconClass)} strokeWidth={2.5} />
          </div>
          {message}
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}</style>
      </>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast, toastVariants };
