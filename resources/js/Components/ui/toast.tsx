import * as React from 'react';
import { cn } from '@/Lib/utils';

/**
 * Toast Component
 *
 * Notification component for success messages.
 * Follows design system specifications with automatic dismissal.
 */

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
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
   * Icon to display (defaults to success checkmark)
   */
  icon?: React.ReactNode;
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
      duration = 3000,
      onHide,
      icon,
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

    const defaultIcon = (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="10"
          cy="10"
          r="9"
          fill="hsl(var(--success))"
          stroke="hsl(var(--success))"
          strokeWidth="2"
        />
        <path
          d="M6 10L8.5 12.5L14 7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

    return (
      <>
        <div
          ref={ref}
          className={cn('toast-notification text-label', className)}
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            marginLeft: leftOffset,
            transform: 'translateX(-50%)',
            backgroundColor: 'hsl(var(--foreground))',
            color: 'hsl(var(--background))',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow:
              '0px 4px 16px rgba(0, 0, 0, 0.12), 0px 12px 32px rgba(0, 0, 0, 0.16)',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease-out',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          {...props}
        >
          {icon || defaultIcon}
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

export { Toast };
