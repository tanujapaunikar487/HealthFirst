import { ChevronLeft, ChevronRight } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

interface TablePaginationProps {
  /** First visible item (1-based) */
  from: number;
  /** Last visible item */
  to: number;
  /** Total number of items */
  total: number;
  /** Current page number (1-based). Omit if no pagination controls needed */
  currentPage?: number;
  /** Total number of pages. Omit if no pagination controls needed */
  totalPages?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Label for items, e.g. "appointments", "bills" */
  itemLabel?: string;
}

export function TablePagination({
  from,
  to,
  total,
  currentPage,
  totalPages,
  onPageChange,
  itemLabel = 'items',
}: TablePaginationProps) {
  if (total === 0) return null;

  const showControls = totalPages != null && totalPages > 1 && currentPage != null && onPageChange != null;
  const showRange = from !== 1 || to !== total;

  return (
    <div className="flex items-center justify-between px-6 py-2.5 border-t border-border">
      <p className="text-caption text-muted-foreground">
        {showRange
          ? `Showing ${from}\u2013${to} of ${total} ${itemLabel}`
          : `Showing ${total} ${itemLabel}`}
      </p>
      {showControls && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            iconOnly
            size="xs"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="!min-h-0 !min-w-0 !h-7 !w-7"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? 'primary' : 'outline'}
              iconOnly
              size="xs"
              className={cn('!min-h-0 !min-w-0 !h-7 !w-7 text-caption', p === currentPage && 'pointer-events-none')}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            iconOnly
            size="xs"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="!min-h-0 !min-w-0 !h-7 !w-7"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
