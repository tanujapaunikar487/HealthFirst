import * as React from 'react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

export interface BulkActionBarAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

export interface BulkActionBarProps {
  /**
   * Number of items selected
   */
  count: number;
  /**
   * Label for the items (e.g., "bill", "record", "item")
   * Will be pluralized automatically
   */
  itemLabel: string;
  /**
   * Callback when clear button is clicked
   */
  onClear: () => void;
  /**
   * Actions to display in the bar
   */
  actions?: BulkActionBarAction[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * BulkActionBar Component
 *
 * Global component for displaying bulk actions on tables when items are selected.
 * Uses light grey background with dark accent buttons for actions.
 *
 * @example
 * <BulkActionBar
 *   count={selectedIds.size}
 *   itemLabel="bill"
 *   onClear={() => setSelectedIds(new Set())}
 *   actions={[
 *     {
 *       label: `Pay ₹${total}`,
 *       icon: CreditCard,
 *       onClick: handlePay,
 *     },
 *     {
 *       label: 'Download',
 *       icon: Download,
 *       onClick: handleDownload,
 *     }
 *   ]}
 * />
 */
export function BulkActionBar({
  count,
  itemLabel,
  onClear,
  actions = [],
  className,
}: BulkActionBarProps) {
  if (count === 0) return null;

  const pluralizedLabel = count === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-label text-foreground">
          {count} {pluralizedLabel} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-body text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          Clear
        </Button>
      </div>

      {actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="accent"
                size="md"
                className="gap-1.5"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
