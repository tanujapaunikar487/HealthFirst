import * as React from 'react';
import { cn } from '@/Lib/utils';

interface DetailRowProps {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function DetailRow({ label, children, className }: DetailRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[theme(spacing.detail-label)_1fr] items-start px-6 py-4',
        className
      )}
    >
      <span className="text-body text-muted-foreground pt-px">{label}</span>
      <span className="text-label">{children}</span>
    </div>
  );
}

export { DetailRow };
export type { DetailRowProps };
