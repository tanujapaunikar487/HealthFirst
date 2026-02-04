import { cn } from '@/Lib/utils';

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
    dotColor: 'bg-blue-500',
  },
  {
    value: 'new_concern',
    label: 'New concern',
    description: 'Something changed since last visit',
    dotColor: 'bg-amber-500',
  },
  {
    value: 'ongoing_issue',
    label: 'Ongoing issue',
    description: "Symptoms haven't improved",
    dotColor: 'bg-red-500',
  },
];

export function EmbeddedFollowUpReason({ selectedReason, onSelect, disabled }: Props) {
  return (
    <div className="space-y-3">
      {reasons.map((reason) => {
        const isSelected = selectedReason === reason.value;

        return (
          <button
            key={reason.value}
            onClick={() => !disabled && onSelect(reason.value)}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
              "hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-white",
              disabled && !isSelected && "opacity-60"
            )}
          >
            {/* Colored dot */}
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              reason.dotColor
            )} />

            {/* Text content */}
            <div className="flex-1 min-w-0">
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
    </div>
  );
}
