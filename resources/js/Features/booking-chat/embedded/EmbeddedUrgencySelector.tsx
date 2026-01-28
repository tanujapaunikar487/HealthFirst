import { cn } from '@/Lib/utils';

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
    dotColor: 'bg-red-500',
  },
  {
    value: 'this_week',
    label: 'This Week',
    description: 'Within a few days',
    dotColor: 'bg-amber-500',
  },
  {
    value: 'specific_date',
    label: "I've a specific date",
    description: 'Select a particular date',
    dotColor: 'bg-blue-500',
  },
];

export function EmbeddedUrgencySelector({ selectedUrgency, onSelect, disabled }: Props) {
  return (
    <div className="border rounded-xl overflow-hidden divide-y bg-background">
      {options.map((option) => {
        const isSelected = selectedUrgency === option.value;

        return (
          <button
            key={option.value}
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-3 p-3.5 text-left transition-all",
              "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
              isSelected && "bg-accent border-l-2 border-l-primary"
            )}
          >
            {/* Colored dot */}
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", option.dotColor)} />

            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm leading-tight mb-0.5">{option.label}</p>
              <p className="text-xs text-muted-foreground leading-tight">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
