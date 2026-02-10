import * as React from 'react';
import { Button, ButtonProps } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

export interface ChipProps extends Omit<ButtonProps, 'variant' | 'size'> {
  /**
   * Chip variant
   * - 'default': For symptoms, filters (outline → primary/10 when selected)
   * - 'accent': For time slots (outline → accent when selected)
   */
  variant?: 'default' | 'accent';
  /**
   * Whether the chip is selected
   */
  selected?: boolean;
  /**
   * Optional icon to show (e.g., star for preferred time slots)
   */
  icon?: React.ReactNode;
}

/**
 * Chip Component
 *
 * Unified component for chip-style selections across the app.
 *
 * @example
 * // Symptoms/Filters
 * <Chip selected={isSelected} onClick={() => toggle()}>
 *   Fever
 * </Chip>
 *
 * @example
 * // Time Slots
 * <Chip variant="accent" selected={isSelected} onClick={() => selectTime()}>
 *   10:00 AM
 * </Chip>
 *
 * @example
 * // Time Slot with Preferred Icon
 * <Chip
 *   variant="accent"
 *   selected={isSelected}
 *   icon={<Star className="h-3 w-3" />}
 * >
 *   10:00 AM
 * </Chip>
 */
export function Chip({
  variant = 'default',
  selected = false,
  icon,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <Button
      variant={
        variant === 'accent' && selected
          ? 'accent'
          : 'outline'
      }
      className={cn(
        'px-4 py-2 rounded-full relative',
        // Default variant (symptoms/filters)
        variant === 'default' && selected && 'bg-primary/10 border-primary text-label',
        // Accent variant (time slots)
        variant === 'accent' && selected && 'border-foreground',
        className
      )}
      {...props}
    >
      {children}
      {icon && (
        <span className="absolute -top-1 -right-1">
          {icon}
        </span>
      )}
    </Button>
  );
}
