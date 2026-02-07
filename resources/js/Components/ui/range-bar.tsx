import { cn } from '@/Lib/utils';

interface RangeBarProps {
  value: number;
  min: number;
  max: number;
  normalMin: number;
  normalMax: number;
  status: string;
}

export function RangeBar({ value, min, max, normalMin, normalMax, status }: RangeBarProps) {
  const range = max - min;
  if (range <= 0) return null;

  const normalStartPct = ((normalMin - min) / range) * 100;
  const normalWidthPct = ((normalMax - normalMin) / range) * 100;
  const valuePct = Math.max(0, Math.min(100, ((value - min) / range) * 100));

  const isNormal = status === 'normal';
  const isWarning = status === 'borderline' || status === 'low' || status === 'elevated';

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="relative flex-1 h-2 rounded-full bg-muted overflow-hidden">
        {/* Normal range zone */}
        <div
          className="absolute top-0 h-full bg-success/30 rounded-full"
          style={{ left: `${normalStartPct}%`, width: `${normalWidthPct}%` }}
        />
        {/* Value marker */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-card',
            isNormal ? 'bg-success' : isWarning ? 'bg-warning' : 'bg-destructive'
          )}
          style={{ left: `${valuePct}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className="flex justify-between text-micro text-muted-foreground w-20">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
