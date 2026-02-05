import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';

interface Props {
  selectedUrgency: string | null;
  onSelect: (urgency: string) => void;
  disabled: boolean;
}

const options = [
  {
    value: 'urgent',
    label: 'Urgent (Today/ASAP)',
    description: 'Need to see someone ASAP',
    dotColor: 'bg-destructive',
  },
  {
    value: 'this_week',
    label: 'This Week',
    description: 'Within a few days',
    dotColor: 'bg-warning',
  },
  {
    value: 'specific_date',
    label: "I've a specific date",
    description: 'Select a particular date',
    dotColor: 'bg-primary',
  },
];

export function EmbeddedUrgencySelector({ selectedUrgency, onSelect, disabled }: Props) {
  return (
    <Card className="overflow-hidden">
      {options.map((option, index) => {
        const isSelected = selectedUrgency === option.value;

        return (
          <button
            key={option.value}
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-3 p-4 text-left transition-all",
              "hover:bg-muted/50 disabled:cursor-not-allowed",
              isSelected
                ? disabled ? "bg-primary/5 opacity-60" : "bg-primary/5"
                : disabled ? "opacity-30" : ""
            )}
            style={{
              borderBottom: index < options.length - 1 ? '1px solid hsl(var(--border))' : 'none'
            }}
          >
            {/* Colored dot */}
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", option.dotColor)} />

            <div className="min-w-0 flex-1">
              <p className="font-medium text-[14px] leading-tight mb-0.5">{option.label}</p>
              <p className="text-[14px] text-muted-foreground leading-tight">{option.description}</p>
            </div>
          </button>
        );
      })}
    </Card>
  );
}
