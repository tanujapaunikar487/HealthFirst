import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Icon } from '@/Components/ui/icon';
import { User, RefreshCw } from '@/Lib/icons';

interface Props {
  selectedType: 'new' | 'followup' | null;
  onSelect: (type: 'new' | 'followup') => void;
  disabled: boolean;
}

const options = [
  {
    value: 'new' as const,
    label: 'New Appointment',
    description: 'First visit for this concern',
    icon: User,
  },
  {
    value: 'followup' as const,
    label: 'Follow-up Visit',
    description: 'Continuing care with previous doctor',
    icon: RefreshCw,
  },
];

export function EmbeddedAppointmentType({ selectedType, onSelect, disabled }: Props) {
  return (
    <Card className="overflow-hidden mt-3">
      <div className="divide-y">
        {options.map((option) => {
          const isSelected = selectedType === option.value;

          return (
            <Button
              key={option.value}
              variant="ghost"
              onClick={() => !disabled && onSelect(option.value)}
              disabled={disabled}
              className={cn(
                'w-full h-auto px-6 py-4 text-left transition-all flex items-center gap-4',
                'disabled:cursor-not-allowed',
                disabled && !isSelected && 'opacity-30',
                disabled && isSelected && 'opacity-60',
                isSelected
                  ? 'rounded-3xl border-2 border-primary bg-primary/5 [&:not(:first-child)]:border-t-0 [&+*]:border-t-0'
                  : 'rounded-none hover:bg-muted/50'
              )}
            >
              <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                <Icon icon={option.icon} size={20} className="text-blue-800" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label text-foreground">{option.label}</p>
                <p className="text-body text-muted-foreground">{option.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
