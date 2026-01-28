import { cn } from '@/Lib/utils';
import { Monitor, Users } from 'lucide-react';

interface Mode {
  type: 'video' | 'in_person';
  price: number;
}

interface Props {
  modes: Mode[];
  selectedMode: string | null;
  onSelect: (mode: string) => void;
  disabled: boolean;
}

const modeConfig = {
  video: {
    icon: Monitor,
    label: 'Video Consultation',
    description: 'Connect from home via video call',
  },
  in_person: {
    icon: Users,
    label: 'In-Person Visit',
    description: 'Visit the doctor at the clinic',
  },
};

export function EmbeddedConsultationMode({ modes, selectedMode, onSelect, disabled }: Props) {
  return (
    <div className="border rounded-xl overflow-hidden divide-y">
      {modes.map((mode) => {
        const config = modeConfig[mode.type];
        const Icon = config.icon;
        const isSelected = selectedMode === mode.type;

        return (
          <button
            key={mode.type}
            onClick={() => !disabled && onSelect(mode.type)}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-4 p-4 text-left transition-all",
              "hover:bg-muted/50",
              isSelected && "bg-primary/5 border-l-2 border-l-primary",
              disabled && !isSelected && "opacity-60"
            )}
          >
            {/* Icon */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isSelected ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn("h-5 w-5", isSelected && "text-primary")} />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-medium text-sm">{config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>

            {/* Price */}
            <span className="font-semibold text-sm">₹{mode.price.toLocaleString()}</span>
          </button>
        );
      })}
    </div>
  );
}
