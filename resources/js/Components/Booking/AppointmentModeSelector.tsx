import { cn } from '@/Lib/utils';
import { Video, User } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

interface Mode {
  type: 'video' | 'in_person';
  label: string;
  description: string;
  price: number;
}

interface AppointmentModeSelectorProps {
  modes: Mode[];
  selectedMode: string | null;
  onSelect: (mode: string) => void;
  className?: string;
}

const modeIcons = {
  video: Video,
  in_person: User,
};

export function AppointmentModeSelector({
  modes,
  selectedMode,
  onSelect,
  className,
}: AppointmentModeSelectorProps) {
  return (
    <div className={cn('border rounded-xl overflow-hidden divide-y', className)}>
      {modes.map((mode) => {
        const modeIcon = modeIcons[mode.type];
        const isSelected = selectedMode === mode.type;

        return (
          <button
            key={mode.type}
            onClick={() => onSelect(mode.type)}
            className={cn(
              'w-full flex items-center gap-4 p-4 text-left transition-all',
              'hover:bg-muted/50',
              isSelected && 'bg-primary/5 border border-primary'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                isSelected ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <Icon icon={modeIcon} className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-foreground')} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[14px]">{mode.label}</p>
              <p className="text-[14px] text-muted-foreground">{mode.description}</p>
            </div>

            {/* Price */}
            <span className="font-semibold text-[14px] flex-shrink-0">
              ₹{mode.price.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
