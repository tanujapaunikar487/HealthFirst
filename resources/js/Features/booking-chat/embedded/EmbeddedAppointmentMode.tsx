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
    <Card className="overflow-hidden">
      <div className="divide-y">
        {modes.map((mode) => {
          const config = modeConfig[mode.type];
          const ModeIcon = config.icon;
          const isSelected = selectedMode === mode.type;

          return (
            <Button
              key={mode.type}
              variant="ghost"
              onClick={() => !disabled && onSelect(mode.type)}
              disabled={disabled}
              className="w-full h-auto justify-start px-6 py-4 text-body flex items-center gap-4 text-left transition-all rounded-none hover:bg-muted/50"
            >
              <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                <Icon icon={ModeIcon} size={20} className="text-blue-800" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-label text-foreground leading-tight mb-0.5">
                  {config.label}
                </p>
                <p className="text-body text-muted-foreground leading-tight">
                  {config.description}
                </p>
              </div>
              <p className="text-label shrink-0">₹{mode.price.toLocaleString()}</p>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
