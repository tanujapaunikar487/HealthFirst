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
    bgColor: 'bg-destructive/10',
  },
  {
    value: 'this_week',
    label: 'This Week',
    description: 'Within a few days',
    dotColor: 'bg-warning',
    bgColor: 'bg-warning/10',
  },
  {
    value: 'specific_date',
    label: "I've a specific date",
    description: 'Select a particular date',
    dotColor: 'bg-info',
    bgColor: 'bg-info/10',
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
                "w-full h-auto justify-start px-6 py-4 text-body",
                "flex items-start gap-4 text-left transition-all",
                "disabled:cursor-not-allowed",
                disabled && "opacity-60",
                isSelected
                  ? "rounded-3xl border-2 border-primary bg-primary/5"
                  : "rounded-none hover:bg-muted/50"
              )}
            >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              option.bgColor
            )}>
              <div className={cn("w-2.5 h-2.5 rounded-full", option.dotColor)} />
            </div>

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
