import { Badge } from '@/Components/ui/badge';
import { Check } from '@/Lib/icons';
import { RangeBar } from '@/Components/ui/range-bar';

interface ParameterCardProps {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: string;
  showRangeBar?: boolean;
}

function parseRange(rangeStr: string): { min: number; max: number; normalMin: number; normalMax: number } | null {
  // Handle ranges like "13.5-17.5", "< 5.7%", "> 70%", "120-200 ms", etc.
  const cleaned = rangeStr.replace(/[%a-zA-Z/²]/g, '').trim();

  // Range format: "X-Y" or "X - Y"
  const rangeMatch = cleaned.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]);
    const hi = parseFloat(rangeMatch[2]);
    const margin = (hi - lo) * 0.5;
    return { min: Math.max(0, lo - margin), max: hi + margin, normalMin: lo, normalMax: hi };
  }

  // Less-than format: "< X"
  const ltMatch = cleaned.match(/^<\s*([\d.]+)$/);
  if (ltMatch) {
    const hi = parseFloat(ltMatch[1]);
    return { min: 0, max: hi * 2, normalMin: 0, normalMax: hi };
  }

  // Greater-than format: "> X"
  const gtMatch = cleaned.match(/^>\s*([\d.]+)$/);
  if (gtMatch) {
    const lo = parseFloat(gtMatch[1]);
    return { min: 0, max: lo * 2, normalMin: lo, normalMax: lo * 2 };
  }

  return null;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    high: 'HIGH',
    abnormal: 'HIGH',
    low: 'LOW',
    elevated: 'ELEVATED',
    borderline: 'BORDERLINE',
  };
  return labels[status] || status.toUpperCase();
}

function getStatusArrow(status: string): string {
  if (status === 'high' || status === 'abnormal' || status === 'elevated') return '↑';
  if (status === 'low') return '↓';
  return '';
}

export function ParameterCard({
  parameter,
  value,
  unit,
  referenceRange,
  status,
  showRangeBar = true,
}: ParameterCardProps) {
  const isNormal = status === 'normal';
  const numericValue = parseFloat(value);
  const rangeData = showRangeBar && !isNormal ? parseRange(referenceRange) : null;

  return (
    <div className="px-6 py-4">
      {/* Top row: parameter name + value */}
      <div className="flex items-start justify-between gap-4">
        <span className="text-label text-foreground">{parameter}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-label text-foreground">
            {value} {unit}
          </span>
          {isNormal ? (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10">
              <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
            </span>
          ) : (
            <Badge variant={status === 'borderline' || status === 'low' || status === 'elevated' ? 'warning' : 'danger'} size="sm">
              {getStatusArrow(status)} {getStatusLabel(status)}
            </Badge>
          )}
        </div>
      </div>

      {/* Reference range */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-caption text-muted-foreground">Normal: {referenceRange}</span>
      </div>

      {/* Range bar for abnormal values */}
      {rangeData && !isNaN(numericValue) && (
        <RangeBar
          value={numericValue}
          min={rangeData.min}
          max={rangeData.max}
          normalMin={rangeData.normalMin}
          normalMax={rangeData.normalMax}
          status={status}
        />
      )}
    </div>
  );
}
