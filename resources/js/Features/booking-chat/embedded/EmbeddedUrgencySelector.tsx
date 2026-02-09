import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

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
    borderColor: 'border-destructive/40',
  },
  {
    value: 'this_week',
    label: 'This Week',
    description: 'Within a few days',
    dotColor: 'bg-warning',
    borderColor: 'border-warning/40',
  },
  {
    value: 'specific_date',
    label: "I've a specific date",
    description: 'Select a particular date',
    dotColor: 'bg-info',
    borderColor: 'border-info/40',
  },
];

export function EmbeddedUrgencySelector({ selectedUrgency, onSelect, disabled }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="divide-y">
        {options.map((option) => {
          const isSelected = selectedUrgency === option.value;

          return (
            <Button
              key={option.value}
              variant="ghost"
              onClick={() => !disabled && onSelect(option.value)}
              disabled={disabled}
              className={cn(
                "w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50",
                "flex items-start gap-4 text-left transition-all",
                "disabled:cursor-not-allowed",
                isSelected && "bg-primary/10 border-l-2 border-l-primary",
                disabled && !isSelected && "opacity-30",
                disabled && isSelected && "opacity-60"
              )}
            >
            <div className={cn("w-4 h-4 rounded-full flex-shrink-0 border-4", option.dotColor, option.borderColor)} />

            <div className="min-w-0 flex-1 text-left">
              <p className="text-label leading-tight mb-0.5">{option.label}</p>
              <p className="text-body text-muted-foreground leading-tight">{option.description}</p>
            </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
