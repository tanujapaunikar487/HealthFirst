import { cn } from '@/Lib/utils';

interface Props {
  selectedType: 'new' | 'followup' | null;
  onSelect: (type: 'new' | 'followup') => void;
  disabled: boolean;
}

const options = [
  { value: 'new' as const, label: 'New Appointment' },
  { value: 'followup' as const, label: 'Follow-up' },
];

export function EmbeddedAppointmentType({ selectedType, onSelect, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const isSelected = selectedType === option.value;

        return (
          <button
            key={option.value}
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
              isSelected ? "border-primary bg-accent" : "border-border bg-background"
            )}
          >
            <span className="font-medium text-[14px]">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
