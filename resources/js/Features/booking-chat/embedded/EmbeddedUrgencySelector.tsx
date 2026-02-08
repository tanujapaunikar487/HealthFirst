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
    containerBg: 'bg-destructive/10',
    circleBg: 'bg-destructive',
  },
  {
    value: 'this_week',
    label: 'This Week',
    description: 'Within a few days',
    containerBg: 'bg-warning/10',
    circleBg: 'bg-warning',
  },
  {
    value: 'specific_date',
    label: "I've a specific date",
    description: 'Select a particular date',
    containerBg: 'bg-info/10',
    circleBg: 'bg-info',
  },
];

export function EmbeddedUrgencySelector({ selectedUrgency, onSelect, disabled }: Props) {
  return (
    <Card className="overflow-hidden">
      {options.map((option, index) => {
        const isSelected = selectedUrgency === option.value;

        return (
          <Button
            key={option.value}
            variant="ghost"
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={cn(
              "w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50",
              "flex items-center gap-4 text-left transition-all",
              "disabled:cursor-not-allowed",
              isSelected
                ? disabled ? "bg-primary/5 opacity-60" : "bg-primary/5"
                : disabled ? "opacity-30" : ""
            )}
            style={{
              borderBottom: index < options.length - 1 ? '1px solid hsl(var(--border))' : 'none'
            }}
          >
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", option.containerBg)}>
              <div className={cn("w-3 h-3 rounded-full", option.circleBg)} />
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className="text-label leading-tight mb-0.5">{option.label}</p>
              <p className="text-body text-muted-foreground leading-tight">{option.description}</p>
            </div>
          </Button>
        );
      })}
    </Card>
  );
}
