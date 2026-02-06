import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
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
    <Card className={cn('overflow-hidden', className)}>
      {modes.map((mode, index) => {
        const modeIcon = modeIcons[mode.type];
        const isSelected = selectedMode === mode.type;

        return (
          <button
            key={mode.type}
            onClick={() => onSelect(mode.type)}
            className={cn(
              'w-full flex items-center gap-4 px-6 py-4 text-left transition-all',
              'hover:bg-muted/50',
              isSelected && 'bg-primary/5'
            )}
            style={{
              borderBottom: index < modes.length - 1 ? '1px solid hsl(var(--border))' : 'none'
            }}
          >
            {/* Icon with rounded background */}
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Icon icon={modeIcon} className="h-5 w-5 text-foreground" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[14px] leading-tight mb-0.5">{mode.label}</p>
              <p className="text-[14px] text-muted-foreground leading-tight">{mode.description}</p>
            </div>

            {/* Price */}
            <span className="font-medium text-[14px] flex-shrink-0">
              ₹{mode.price.toLocaleString()}
            </span>
          </button>
        );
      })}
    </Card>
  );
}
