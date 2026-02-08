import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Icon } from '@/Components/ui/icon';
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
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => {
        const config = modeConfig[mode.type];
        const ModeIcon = config.icon;
        const isSelected = selectedMode === mode.type;

        return (
          <Button
            key={mode.type}
            variant="outline"
            onClick={() => !disabled && onSelect(mode.type)}
            disabled={disabled}
            className={cn(
              "h-auto px-4 py-2 rounded-full text-label font-normal",
              "hover:border-primary/50 hover:bg-primary/5",
              isSelected
                ? disabled ? "border-primary bg-primary/10 opacity-60" : "border-primary bg-primary/10"
                : disabled ? "opacity-30" : ""
            )}
          >
            <div className="flex items-center gap-2">
              <Icon icon={ModeIcon} size={16} />
              <span>{config.label}</span>
              <span className="text-body">₹{mode.price.toLocaleString()}</span>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
