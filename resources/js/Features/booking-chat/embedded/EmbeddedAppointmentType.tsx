import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';

interface Props {
  selectedType: 'new' | 'followup' | null;
  onSelect: (type: 'new' | 'followup') => void;
  disabled: boolean;
}

const options = [
  { value: 'new' as const, label: 'New Consultation' },
  { value: 'followup' as const, label: 'Follow-up' },
];

export function EmbeddedAppointmentType({ selectedType, onSelect, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const isSelected = selectedType === option.value;

        return (
          <Button
            key={option.value}
            variant="outline"
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={cn(
              "h-auto rounded-full px-5 py-3 text-label text-left transition-all",
              "hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed",
              isSelected
                ? disabled ? "border-primary bg-primary/5 opacity-60" : "border-primary bg-primary/5"
                : disabled ? "border-border bg-background opacity-30" : "border-border bg-background"
            )}
          >
            <span className="text-label">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
