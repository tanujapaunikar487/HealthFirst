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
   * Chip size
   * - 'default': px-4 py-3 text-body (16px/12px)
   * - 'md': px-3 py-1.5 text-body (12px/6px, 14px font)
   * - 'sm': px-2.5 py-1 text-caption (10px/4px, 12px font)
   */
  size?: 'default' | 'md' | 'sm';
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
 * // Symptoms/Filters (default size)
 * <Chip selected={isSelected} onClick={() => toggle()}>
 *   Fever
 * </Chip>
 *
 * @example
 * // Medium size chip
 * <Chip size="md" selected={isSelected} onClick={() => toggle()}>
 *   Lab Test
 * </Chip>
 *
 * @example
 * // Time Slots (small)
 * <Chip variant="accent" size="sm" selected={isSelected} onClick={() => selectTime()}>
 *   10:00 AM
 * </Chip>
 *
 * @example
 * // Time Slot with Preferred Icon
 * <Chip
 *   variant="accent"
 *   size="sm"
 *   selected={isSelected}
 *   icon={<Star className="h-3 w-3" />}
 * >
 *   10:00 AM
 * </Chip>
 *
 * @example
 * // Dismissible Filter Chip (default size)
 * <Chip variant="dismissible" onDismiss={() => clearFilter()}>
 *   Health records
 * </Chip>
 */
export function Chip({
  variant = 'default',
  size = 'default',
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
      variant="outline"
      className={cn(
        'h-auto min-h-0 rounded-3xl relative',
        // Size variants
        size === 'sm' ? 'px-2.5 py-1 text-caption' :
        size === 'md' ? 'px-3 py-1.5 text-body' :
        'px-4 py-3 text-body',
        // Default variant (symptoms/filters)
        variant === 'default' && selected && 'bg-primary/10 border-primary text-label',
        // Accent variant (time slots)
        variant === 'accent' && selected && 'border-2 border-primary bg-primary/10 text-primary',
        // Dismissible variant (active filters)
        isDismissible && 'bg-background text-foreground border-border gap-1.5',
        // Extra left padding for dismissible chips
        isDismissible && (size === 'sm' ? 'pl-3.5' : size === 'md' ? 'pl-4' : 'pl-5'),
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
          className="h-auto w-auto min-h-0 min-w-0 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
        >
          <Icon icon={X} className="h-3.5 w-3.5" />
        </Button>
      )}
    </Button>
  );
}
