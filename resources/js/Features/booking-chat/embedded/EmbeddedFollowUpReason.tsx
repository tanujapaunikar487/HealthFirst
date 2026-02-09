import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Icon } from '@/Components/ui/icon';
import { CalendarClock, AlertCircle, RefreshCw } from '@/Lib/icons';

export interface FollowUpReasonOption {
  value: string;
  label: string;
  description: string;
}

interface Props {
  selectedReason: string | null;
  onSelect: (reason: string) => void;
  disabled: boolean;
  reasons?: FollowUpReasonOption[];
}

const defaultReasons: FollowUpReasonOption[] = [
  {
    value: 'scheduled',
    label: 'Scheduled follow-up',
    description: 'Doctor asked me to come back',
  },
  {
    value: 'new_concern',
    label: 'New concern',
    description: 'Something changed since last visit',
  },
  {
    value: 'ongoing_issue',
    label: 'Ongoing issue',
    description: "Symptoms haven't improved",
  },
];

const getReasonIcon = (value: string) => {
  switch (value) {
    case 'scheduled':
      return CalendarClock;
    case 'new_concern':
      return AlertCircle;
    case 'ongoing_issue':
      return RefreshCw;
    default:
      return AlertCircle;
  }
};

export function EmbeddedFollowUpReason({ selectedReason, onSelect, disabled, reasons = defaultReasons }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="divide-y">
        {reasons.map((reason) => {
          const isSelected = selectedReason === reason.value;
          const ReasonIcon = getReasonIcon(reason.value);

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
                disabled && !isSelected && "opacity-30",
                disabled && isSelected && "opacity-60"
              )}
            >
            <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
              <Icon icon={ReasonIcon} size={20} className="text-blue-800" />
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
