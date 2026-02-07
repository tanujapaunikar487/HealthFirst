import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';

interface VitalItem {
  label: string;
  value: string;
  unit: string;
  status?: 'normal' | 'abnormal' | 'elevated' | 'low';
}

interface VitalsGridProps {
  vitals: VitalItem[];
  className?: string;
}

export function VitalsGrid({ vitals, className }: VitalsGridProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {vitals.map((vital) => {
          const isAbnormal = vital.status && vital.status !== 'normal';
          return (
            <div
              key={vital.label}
              className={cn(
                'rounded-2xl p-4 text-center',
                isAbnormal ? 'bg-destructive-subtle' : 'bg-muted'
              )}
            >
              <p className="text-caption text-muted-foreground mb-1">{vital.label}</p>
              <p className={cn(
                'text-detail-title',
                isAbnormal ? 'text-destructive-subtle-foreground' : 'text-foreground'
              )}>
                {vital.value}
              </p>
              <p className={cn(
                'text-caption',
                isAbnormal ? 'text-destructive-subtle-foreground' : 'text-muted-foreground'
              )}>
                {vital.unit}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
