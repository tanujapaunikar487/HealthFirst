import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/Lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, HugeiconsIcon } from '@/Lib/icons';

/**
 * Toast Component
 *
 * Global notification system with dark background and status-based colored icons.
 * Usage: `useToast()` hook → `showToast(message, variant)`
 *
 * - 4 variants: success/error/warning/info
 * - Dark background (#171717) with filled status-colored icons
 * - 12px rounded edges (rounded-lg)
 * - Auto-dismisses after 3s
 * - Uses Tailwind v4 design tokens
 */

const toastVariants = cva(
  'fixed bottom-8 z-[1000] flex items-center gap-3 whitespace-nowrap rounded-lg bg-toast px-4 py-3 text-label text-white shadow-lg shadow-black/20 animate-in slide-in-from-bottom-5 fade-in duration-300',
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
  { icon: React.ComponentType<any>; colorClass: string }
> = {
  success: {
    icon: CheckCircle2,
    colorClass: 'text-success'
  },
  error: {
    icon: XCircle,
    colorClass: 'text-destructive'
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-warning'
  },
  info: {
    icon: Info,
    colorClass: 'text-info'
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
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      message,
      show,
      variant = 'success',
      duration = 3000,
      onHide,
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
    const IconComponent = iconConfig.icon;

    // Access the iconData from the icon component wrapper
    const iconData = (IconComponent as any).iconData;

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        {...props}
      >
        <HugeiconsIcon
          icon={iconData}
          size={20}
          variant="solid"
          className={cn('flex-shrink-0', iconConfig.colorClass)}
        />
        {message}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast, toastVariants };
