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
              className={cn(
                "w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50",
                "flex items-center gap-4 text-left transition-all",
                "disabled:cursor-not-allowed",
                isSelected
                  ? disabled ? "bg-primary/5 opacity-60" : "bg-primary/5"
                  : disabled ? "opacity-30" : ""
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                isSelected ? "bg-primary/10" : "bg-muted"
              )}>
                <Icon icon={ModeIcon} size={20} className={cn(isSelected ? "text-primary" : "text-foreground")} />
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
