import * as React from 'react';
import { Button, ButtonProps } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { X } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

export interface ChipProps extends Omit<ButtonProps, 'variant' | 'size'> {
  /**
   * Chip variant
   * - 'default': For symptoms, filters (outline → primary/10 when selected)
   * - 'accent': For time slots (outline → accent when selected)
   * - 'dismissible': For active filters with close button
   */
  variant?: 'default' | 'accent' | 'dismissible';
  /**
   * Whether the chip is selected (not applicable for dismissible variant)
   */
  selected?: boolean;
  /**
   * Optional icon to show (e.g., star for preferred time slots)
   */
  icon?: React.ReactNode;
  /**
   * Callback when dismiss button is clicked (only for dismissible variant)
   */
  onDismiss?: () => void;
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
 *
 * @example
 * // Dismissible Filter Chip
 * <Chip variant="dismissible" onDismiss={() => clearFilter()}>
 *   Health records
 * </Chip>
 */
export function Chip({
  variant = 'default',
  selected = false,
  icon,
  onDismiss,
  className,
  children,
  ...props
}: ChipProps) {
  const isDismissible = variant === 'dismissible';

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
        // Dismissible variant (active filters)
        isDismissible && 'bg-primary/10 text-primary text-label border-primary gap-1.5',
        className
      )}
      {...props}
    >
      {children}
      {icon && !isDismissible && (
        <span className="absolute -top-1 -right-1">
          {icon}
        </span>
      )}
      {isDismissible && onDismiss && (
        <Button
          variant="ghost"
          iconOnly
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="h-auto w-auto p-0 text-primary hover:text-primary/80 hover:bg-transparent"
        >
          <Icon icon={X} className="h-3.5 w-3.5" />
        </Button>
      )}
    </Button>
  );
}
