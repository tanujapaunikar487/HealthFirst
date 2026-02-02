import { HugeiconsIcon } from '@hugeicons/react';

/**
 * Icon wrapper that converts Tailwind h-X/w-X classes to a numeric size prop.
 * Keeps the rest of className intact (text-color, margins, etc.).
 */

// Map Tailwind size classes to pixels
const sizeMap: Record<string, number> = {
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
};

function extractSize(className: string): { size: number | undefined; rest: string } {
  const match = className.match(/(?:^|\s)h-(\d+(?:\.\d+)?)\s+w-\d+(?:\.\d+)?/);
  if (!match) return { size: undefined, rest: className };
  const size = sizeMap[match[1]] ?? parseFloat(match[1]) * 4;
  const rest = className
    .replace(/(?:^|\s)h-\d+(?:\.\d+)?/g, '')
    .replace(/(?:^|\s)w-\d+(?:\.\d+)?/g, '')
    .trim();
  return { size, rest };
}

interface IconProps {
  icon: any;
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function Icon({ icon, className, size, ...props }: IconProps) {
  let resolvedSize = size ?? 24;
  let cleanClassName = className;

  if (className) {
    const extracted = extractSize(className);
    if (!size && extracted.size) resolvedSize = extracted.size;
    cleanClassName = extracted.rest || undefined;
  }

  // Extract raw icon data from our wrapped components
  const iconData = (icon as any).iconData || icon;

  return (
    <HugeiconsIcon
      icon={iconData}
      size={resolvedSize}
      className={cleanClassName}
      {...props}
    />
  );
}
