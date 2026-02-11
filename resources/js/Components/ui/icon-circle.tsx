import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Icon } from '@/Components/ui/icon';

export type IconCircleSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconCircleVariant =
  | 'primary'
  | 'success'
  | 'destructive'
  | 'warning'
  | 'info'
  | 'muted'
  | 'secondary';

export interface IconCircleProps {
  /**
   * Icon component from @/Lib/icons
   */
  icon: React.ComponentType;

  /**
   * Size preset
   * - sm: h-10 w-10 with size-20 icon (default, most common)
   * - md: h-12 w-12 with size-20 icon
   * - lg: h-14 w-14 with size-24 icon
   * - xl: h-16 w-16 with size-24 icon
   */
  size?: IconCircleSize;

  /**
   * Semantic color variant using design tokens
   * - primary: bg-primary/10 + text-primary (replaces blue-200/800)
   * - success: bg-success/10 + text-success
   * - destructive: bg-destructive/10 + text-destructive
   * - warning: bg-warning/10 + text-warning
   * - info: bg-info-subtle + text-info-subtle-foreground
   * - muted: bg-muted + text-muted-foreground
   * - secondary: bg-secondary + text-foreground
   */
  variant?: IconCircleVariant;

  /**
   * Additional className for circle wrapper (overrides)
   * Use for custom colors if variant doesn't fit
   */
  className?: string;

  /**
   * Inline styles (for HSL alpha values only)
   * Example: { backgroundColor: 'hsl(var(--success) / 0.1)' }
   */
  style?: React.CSSProperties;

  /**
   * Additional className for icon itself
   */
  iconClassName?: string;
}

const sizeConfig = {
  sm: {
    circle: 'h-10 w-10',
    icon: 20,
  },
  md: {
    circle: 'h-12 w-12',
    icon: 20,
  },
  lg: {
    circle: 'h-14 w-14',
    icon: 24,
  },
  xl: {
    circle: 'h-16 w-16',
    icon: 24,
  },
} as const;

const variantConfig = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-blue-800',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
  },
  destructive: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
  info: {
    bg: 'bg-info-subtle',
    text: 'text-info-subtle-foreground',
  },
  muted: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  },
  secondary: {
    bg: 'bg-secondary',
    text: 'text-foreground',
  },
} as const;

export function IconCircle({
  icon,
  size = 'sm',
  variant = 'primary',
  className,
  style,
  iconClassName,
}: IconCircleProps) {
  const config = sizeConfig[size];
  const colors = variantConfig[variant];

  return (
    <div
      className={cn(
        config.circle,
        'rounded-full flex items-center justify-center flex-shrink-0',
        colors.bg,
        className
      )}
      style={style}
    >
      <Icon icon={icon} size={config.icon} className={cn(colors.text, iconClassName)} />
    </div>
  );
}
