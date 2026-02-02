import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';

/**
 * CTA Banner Component
 *
 * Call-to-action banner with gradient background, text content, and illustration.
 * Follows design system specifications for promotional content.
 */

export interface CtaBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Main heading text
   */
  heading: string;
  /**
   * Descriptive body text
   */
  description: string;
  /**
   * Button text
   */
  buttonText: string;
  /**
   * Button link href
   */
  buttonHref: string;
  /**
   * Illustration image source
   */
  imageSrc: string;
  /**
   * Alt text for the illustration
   */
  imageAlt: string;
  /**
   * Background gradient (default: radial blue gradient)
   */
  gradient?: string;
  /**
   * Minimum width (default: '800px')
   */
  minWidth?: string;
  /**
   * Border radius (default: '20px')
   */
  borderRadius?: string;
}

const CtaBanner = React.forwardRef<HTMLDivElement, CtaBannerProps>(
  (
    {
      heading,
      description,
      buttonText,
      buttonHref,
      imageSrc,
      imageAlt,
      gradient = 'radial-gradient(circle at center, #003EC1 0%, #00184D 100%)',
      minWidth = '800px',
      borderRadius = '20px',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('cta-banner', className)}
        style={{
          minWidth,
          width: '100%',
          borderRadius,
          background: gradient,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
          position: 'relative',
        }}
        {...props}
      >
        {/* Left Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '32px',
            flex: '0 0 auto',
            zIndex: 10,
            alignItems: 'flex-start',
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
                color: '#FFFFFF',
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
                letterSpacing: '0px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
              }}
            >
              {description}
            </p>
          </div>

          <Button asChild variant="cta" size="cta">
            <Link href={buttonHref}>{buttonText}</Link>
          </Button>
        </div>

        {/* Right Illustration Container */}
        <div
          style={{
            position: 'absolute',
            right: '-100px',
            top: '50%',
            transform: 'translateY(-50%)',
            height: '120%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            style={{
              height: '100%',
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
