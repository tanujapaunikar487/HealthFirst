import * as React from 'react';
import { cn } from '@/Lib/utils';

/* ─── Types ─── */

interface InfoCardItem {
  label: string;
  value?: string | React.ReactNode;
  subtitle?: string;
}

interface InfoCardProps {
  items: InfoCardItem[];
  className?: string;
}

/* ─── Component ─── */

export function InfoCard({ items, className }: InfoCardProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-card overflow-hidden divide-y',
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start px-6 py-4"
        >
          {/* Label */}
          <div className="w-detail-label flex-shrink-0">
            <span className="text-body text-muted-foreground">{item.label}</span>
          </div>

          {/* Content */}
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
      ))}
    </div>
  );
}

export type { InfoCardItem, InfoCardProps };
