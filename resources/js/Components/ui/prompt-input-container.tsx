import * as React from 'react';
import { cn } from '@/Lib/utils';

/**
 * PromptInputContainer Component
 *
 * A decorative container with gradient border effect for AI prompt inputs.
 * Creates a two-layer structure with gradient outer border and white inner content area.
 */

export interface PromptInputContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Border width in pixels (default: 2)
   */
  borderWidth?: number;
  /**
   * Gradient background for the border effect
   */
  gradient?: string;
  /**
   * Border radius for outer container
   */
  borderRadius?: string;
  /**
   * Box shadow for depth
   */
  boxShadow?: string;
  /**
   * Inner container background color
   */
  innerBackground?: string;
}

const PromptInputContainer = React.forwardRef<HTMLDivElement, PromptInputContainerProps>(
  (
    {
      children,
      className,
      borderWidth = 2,
      gradient = 'linear-gradient(265deg, hsl(var(--primary) / 0.2) 24.67%, hsl(var(--background)) 144.07%)',
      borderRadius = '20px',
      boxShadow = '0 4px 6px -4px rgba(0, 0, 0, 0.10), 0 10px 15px -3px rgba(0, 0, 0, 0.10)',
      innerBackground = 'hsl(var(--background))',
      style,
      ...props
    },
    ref
  ) => {
    // Calculate inner border radius (slightly smaller than outer)
    const innerBorderRadius = `${parseInt(borderRadius) - borderWidth}px`;

    return (
      <div
        ref={ref}
        className={cn('prompt-input-container', className)}
        style={{
          borderRadius,
          background: gradient,
          boxShadow,
          padding: `${borderWidth}px`,
          ...style,
        }}
        {...props}
      >
        <div
          style={{
            borderRadius: innerBorderRadius,
            background: innerBackground,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            alignSelf: 'stretch',
            width: '100%',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

PromptInputContainer.displayName = 'PromptInputContainer';

export { PromptInputContainer };
