import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';

export interface BookingSummaryRow {
  label: string;
  value: React.ReactNode;
  onChange?: () => void;
}

interface BookingSummaryProps {
  rows: BookingSummaryRow[];
  className?: string;
}

export function BookingSummary({ rows, className }: BookingSummaryProps) {
  return (
    <Card className={className}>
      <div className="divide-y">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[theme(spacing.detail-label)_1fr] items-baseline gap-4 px-6 py-3"
          >
            <span className="text-body text-muted-foreground text-left">{row.label}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-label text-left">{row.value}</span>
              {row.onChange && (
                <Button
                  variant="link"
                  onClick={row.onChange}
                  className="h-auto p-0 text-primary text-body hover:underline ml-4"
                >
                  change
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
