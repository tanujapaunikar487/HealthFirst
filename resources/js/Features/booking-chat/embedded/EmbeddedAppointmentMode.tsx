import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Monitor, Users } from '@/Lib/icons';

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
    <Card className="overflow-hidden">
      {modes.map((mode, index) => {
        const config = modeConfig[mode.type];
        const ModeIcon = config.icon;
        const isSelected = selectedMode === mode.type;

        return (
          <button
            key={mode.type}
            onClick={() => !disabled && onSelect(mode.type)}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-4 p-4 text-left transition-all",
              "hover:bg-muted/50 disabled:cursor-not-allowed",
              isSelected
                ? disabled ? "bg-primary/5 opacity-60" : "bg-primary/5"
                : disabled ? "opacity-30" : ""
            )}
            style={{
              borderBottom: index < modes.length - 1 ? '1px solid hsl(var(--border))' : 'none'
            }}
          >
            {/* Icon with rounded background */}
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <ModeIcon className="h-5 w-5 text-foreground" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium leading-tight mb-0.5">{config.label}</p>
              <p className="text-[14px] text-muted-foreground leading-tight">{config.description}</p>
            </div>

            {/* Price */}
            <span className="text-[14px] font-medium flex-shrink-0">₹{mode.price.toLocaleString()}</span>
          </button>
        );
      })}
    </Card>
  );
}
