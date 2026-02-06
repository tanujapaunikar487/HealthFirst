import * as React from 'react';
import { cn } from '@/Lib/utils';

/* ─── Types ─── */

interface InfoCardItem {
  label: string;
  value?: string | React.ReactNode;
  subtitle?: string;
  avatar?: {
    url?: string;
    initials?: string;
    bgColor?: string;
    textColor?: string;
  };
}

interface InfoCardProps {
  items: InfoCardItem[];
  className?: string;
}

/* ─── Helper ─── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ─── Component ─── */

export function InfoCard({ items, className }: InfoCardProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-white overflow-hidden',
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start px-6 py-4',
            index !== items.length - 1 && 'border-b border-border'
          )}
        >
          {/* Label */}
          <div className="w-[140px] flex-shrink-0">
            <span className="text-body text-muted-foreground">{item.label}</span>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center gap-3">
            {/* Avatar (optional) - only show if there's a value */}
            {item.avatar && item.value && (
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-card-title overflow-hidden"
                style={{
                  backgroundColor: item.avatar.bgColor || 'hsl(var(--secondary))',
                  color: item.avatar.textColor || 'hsl(var(--foreground))',
                }}
              >
                {item.avatar.url ? (
                  <img
                    src={item.avatar.url}
                    alt=""
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  item.avatar.initials ||
                  (typeof item.value === 'string' ? getInitials(item.value) : '')
                )}
              </div>
            )}

            {/* Text content */}
            <div className="flex-1 min-w-0">
              {item.value === null || item.value === undefined ? (
                <p className="text-card-title text-foreground truncate">—</p>
              ) : typeof item.value === 'string' ? (
                <p className="text-card-title text-foreground truncate">
                  {item.value || '—'}
                </p>
              ) : (
                item.value
              )}
              {item.subtitle && (
                <p className="text-body text-muted-foreground mt-0.5">{item.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export type { InfoCardItem, InfoCardProps };
