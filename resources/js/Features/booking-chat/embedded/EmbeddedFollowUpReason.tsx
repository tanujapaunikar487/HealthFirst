import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { CalendarClock, AlertCircle, RefreshCw } from '@/Lib/icons';

interface Props {
  selectedReason: string | null;
  onSelect: (reason: string) => void;
  disabled: boolean;
}

const reasons = [
  {
    value: 'scheduled',
    label: 'Scheduled follow-up',
    description: 'Doctor asked me to come back',
    icon: CalendarClock,
  },
  {
    value: 'new_concern',
    label: 'New concern',
    description: 'Something changed since last visit',
    icon: AlertCircle,
  },
  {
    value: 'ongoing_issue',
    label: 'Ongoing issue',
    description: "Symptoms haven't improved",
    icon: RefreshCw,
  },
];

export function EmbeddedFollowUpReason({ selectedReason, onSelect, disabled }: Props) {
  return (
    <Card className="overflow-hidden">
      {reasons.map((reason, index) => {
        const isSelected = selectedReason === reason.value;
        const Icon = reason.icon;

        return (
          <button
            key={reason.value}
            onClick={() => !disabled && onSelect(reason.value)}
            disabled={disabled}
            className={cn(
              "w-full px-6 py-4 text-left transition-all disabled:cursor-not-allowed flex items-center gap-4",
              "hover:bg-muted/50",
              isSelected
                ? disabled ? "bg-primary/5 opacity-60" : "bg-primary/5"
                : disabled ? "opacity-30" : ""
            )}
            style={{
              borderBottom: index < reasons.length - 1 ? '1px solid hsl(var(--border))' : 'none'
            }}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[14px] text-foreground leading-tight mb-0.5">
                {reason.label}
              </p>
              <p className="text-[14px] text-muted-foreground leading-tight">
                {reason.description}
              </p>
            </div>
          </button>
        );
      })}
    </Card>
  );
}
