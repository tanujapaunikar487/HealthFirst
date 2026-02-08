import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Icon } from '@/Components/ui/icon';
import { Flame, CalendarClock, CalendarPlus } from '@/Lib/icons';

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
    icon: Flame,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
  {
    value: 'this_week',
    label: 'This Week',
    description: 'Within a few days',
    icon: CalendarClock,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  {
    value: 'specific_date',
    label: "I've a specific date",
    description: 'Select a particular date',
    icon: CalendarPlus,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
];

export function EmbeddedUrgencySelector({ selectedUrgency, onSelect, disabled }: Props) {
  return (
    <Card className="overflow-hidden">
      {options.map((option, index) => {
        const isSelected = selectedUrgency === option.value;
        const OptionIcon = option.icon;

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
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", option.iconBg)}>
              <Icon icon={OptionIcon} size={20} className={option.iconColor} />
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
