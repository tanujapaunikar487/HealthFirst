import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';

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

export function EmbeddedFollowUpReason({ selectedReason, onSelect, disabled }: Props) {
  return (
    <Card className="overflow-hidden">
      {reasons.map((reason, index) => {
        const isSelected = selectedReason === reason.value;

        return (
          <button
            key={reason.value}
            onClick={() => !disabled && onSelect(reason.value)}
            disabled={disabled}
            className={cn(
              "w-full p-4 text-left transition-all disabled:cursor-not-allowed",
              "hover:bg-muted/50",
              isSelected
                ? disabled ? "bg-primary/5 opacity-60" : "bg-primary/5"
                : disabled ? "opacity-30" : ""
            )}
            style={{
              borderBottom: index < reasons.length - 1 ? '1px solid hsl(var(--border))' : 'none'
            }}
          >
            <p className="font-medium text-[14px] text-foreground leading-tight mb-0.5">
              {reason.label}
            </p>
            <p className="text-[14px] text-muted-foreground leading-tight">
              {reason.description}
            </p>
          </button>
        );
      })}
    </Card>
  );
}
