import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { X } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

/**
 * CTA Banner Component
 *
 * Call-to-action banner with gradient background, text content, and illustration.
 * Follows design system specifications for promotional content.
 */

export interface CtaBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string;
  description: string;
  buttonText: string;
  buttonHref?: string;
  onButtonClick?: () => void;
  imageSrc: string;
  imageAlt: string;
  gradient?: string;
  minWidth?: string;
  borderRadius?: string;
  onDismiss?: () => void;
}

const CtaBanner = React.forwardRef<HTMLDivElement, CtaBannerProps>(
  (
    {
      heading,
      description,
      buttonText,
      buttonHref,
      onButtonClick,
      imageSrc,
      imageAlt,
      gradient,
      minWidth = '800px',
      borderRadius = '20px',
      onDismiss,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('cta-banner', !gradient && 'bg-gradient-to-r from-blue-950 to-primary', className)}
        style={{
          minWidth,
          width: '100%',
          borderRadius,
          ...(gradient ? { background: gradient } : {}),
          position: 'relative',
        }}
        {...props}
      >
        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-20"
          >
            <Icon icon={X} className="h-4 w-4 text-white" />
          </button>
        )}

        {/* Content Container - determines banner height */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '20px',
            padding: '32px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '480px',
            }}
          >
            <h2
              className="font-semibold"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                lineHeight: '32px',
                letterSpacing: '-0.48px',
                color: 'hsl(var(--primary-foreground))',
                margin: 0,
              }}
            >
              {heading}
            </h2>
            <p
              className="font-medium"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '20px',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0,
              }}
            >
              {description}
            </p>
          </div>

          {buttonHref ? (
            <Button asChild variant="cta" size="lg">
              <Link href={buttonHref}>{buttonText}</Link>
            </Button>
          ) : (
            <Button variant="cta" size="lg" onClick={onButtonClick}>
              {buttonText}
            </Button>
          )}
        </div>

        {/* Image wrapper with its own overflow hidden */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '45%',
            overflow: 'hidden',
            borderTopRightRadius: borderRadius,
            borderBottomRightRadius: borderRadius,
            pointerEvents: 'none',
          }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            style={{
              position: 'absolute',
              right: 0,
              bottom: '-72px',
              height: 'calc(100% + 72px)',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    );
  }
);

CtaBanner.displayName = 'CtaBanner';

export { CtaBanner };
