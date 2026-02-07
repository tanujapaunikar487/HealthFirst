import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import type { RecordStatus } from '@/Pages/HealthRecords/types';

interface MetaCardProps {
  categoryIcon: React.ReactNode;
  categoryLabel: string;
  date: string;
  doctorName?: string | null;
  departmentName?: string | null;
  status?: RecordStatus | null;
  familyMemberName?: string;
}

function StatusBadge({ status }: { status: RecordStatus }) {
  const variantMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    destructive: 'danger',
    secondary: 'neutral',
  };
  return <Badge variant={variantMap[status.variant] || 'neutral'}>{status.label}</Badge>;
}

export function MetaCard({
  categoryIcon,
  categoryLabel,
  date,
  doctorName,
  departmentName,
  status,
  familyMemberName,
}: MetaCardProps) {
  return (
    <Card className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {categoryIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="info">{categoryLabel}</Badge>
            {status && <StatusBadge status={status} />}
          </div>
          <p className="text-body text-muted-foreground mt-1">
            {date}
            {doctorName && <span> · {doctorName}</span>}
            {departmentName && <span> · {departmentName}</span>}
            {familyMemberName && <span> · {familyMemberName}</span>}
          </p>
        </div>
      </div>
    </Card>
  );
}
