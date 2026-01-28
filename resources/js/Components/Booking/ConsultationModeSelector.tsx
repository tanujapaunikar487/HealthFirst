import { cn } from '@/Lib/utils';
import { Video, User } from 'lucide-react';

interface Mode {
  type: 'video' | 'in_person';
  label: string;
  description: string;
  price: number;
}

interface ConsultationModeSelectorProps {
  modes: Mode[];
  selectedMode: string | null;
  onSelect: (mode: string) => void;
  className?: string;
}

const modeIcons = {
  video: Video,
  in_person: User,
};

export function ConsultationModeSelector({
  modes,
  selectedMode,
  onSelect,
  className,
}: ConsultationModeSelectorProps) {
  return (
    <div className={cn('border rounded-xl overflow-hidden divide-y', className)}>
      {modes.map((mode) => {
        const Icon = modeIcons[mode.type];
        const isSelected = selectedMode === mode.type;

        return (
          <button
            key={mode.type}
            onClick={() => onSelect(mode.type)}
            className={cn(
              'w-full flex items-center gap-4 p-4 text-left transition-all',
              'hover:bg-muted/50',
              isSelected && 'bg-primary/5 border-2 border-primary'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                isSelected ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-foreground')} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{mode.label}</p>
              <p className="text-xs text-muted-foreground">{mode.description}</p>
            </div>

            {/* Price */}
            <span className="font-semibold text-sm flex-shrink-0">
              ₹{mode.price.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
