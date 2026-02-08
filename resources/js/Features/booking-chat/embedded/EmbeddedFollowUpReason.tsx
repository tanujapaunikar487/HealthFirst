import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Icon } from '@/Components/ui/icon';
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
      <div className="divide-y">
        {reasons.map((reason) => {
          const isSelected = selectedReason === reason.value;
          const ReasonIcon = reason.icon;

          return (
            <Button
              key={reason.value}
              variant="ghost"
              onClick={() => !disabled && onSelect(reason.value)}
              disabled={disabled}
              className={cn(
                "w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50",
                "flex items-center gap-4 text-left transition-all",
                "disabled:cursor-not-allowed",
                isSelected
                  ? disabled ? "bg-primary/5 opacity-60" : "bg-primary/5"
                  : disabled ? "opacity-30" : ""
              )}
            >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon icon={ReasonIcon} size={20} className="text-primary" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-label text-foreground leading-tight mb-0.5">
                {reason.label}
              </p>
              <p className="text-body text-muted-foreground leading-tight">
                {reason.description}
              </p>
            </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
