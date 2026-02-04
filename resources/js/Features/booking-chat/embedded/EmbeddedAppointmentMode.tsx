import { cn } from '@/Lib/utils';
import { Card, CardContent } from '@/Components/ui/card';
import { Monitor, Users } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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
    label: 'Video Appointment',
    description: 'Connect from home via video call',
  },
  in_person: {
    icon: Users,
    label: 'In-Person Visit',
    description: 'Visit the doctor at the clinic',
  },
};

export function EmbeddedAppointmentMode({ modes, selectedMode, onSelect, disabled }: Props) {
  return (
    <Card>
      <CardContent className="p-0 divide-y">
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
                "w-full flex items-center gap-4 px-6 py-4 text-left transition-colors",
                "hover:bg-accent",
                isSelected && "bg-accent border-l-4 border-l-primary",
                disabled && !isSelected && "opacity-60"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                isSelected ? "bg-primary/10" : "bg-muted"
              )}>
                <Icon className={cn("h-5 w-5", isSelected && "text-primary")} />
              </div>

              {/* Text */}
              <div className="flex-1 space-y-1">
                <p className="text-[14px] font-medium leading-none">{config.label}</p>
                <p className="text-[14px] text-muted-foreground">{config.description}</p>
              </div>

              {/* Price */}
              <span className="text-[14px] font-medium">₹{mode.price.toLocaleString()}</span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
