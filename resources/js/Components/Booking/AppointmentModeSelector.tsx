import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { HStack, VStack } from '@/Components/ui/stack';
import { Video, User } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

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
    <Card className={cn('overflow-hidden divide-y', className)}>
      {modes.map((mode) => {
        const modeIcon = modeIcons[mode.type];
        const isSelected = selectedMode === mode.type;

        return (
          <Button
            key={mode.type}
            variant="ghost"
            onClick={() => onSelect(mode.type)}
            className={cn(
              'w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50',
              'text-left transition-all',
              isSelected && 'bg-primary/5'
            )}
          >
            <HStack gap={4}>
              {/* Icon with rounded background */}
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Icon icon={modeIcon} className="text-foreground" size="lg" />
              </div>

              {/* Text */}
              <VStack gap={0} className="flex-1 min-w-0">
                <p className="text-label">{mode.label}</p>
                <p className="text-body text-muted-foreground">{mode.description}</p>
              </VStack>

              {/* Price */}
              <span className="text-label flex-shrink-0">
                ₹{mode.price.toLocaleString()}
              </span>
            </HStack>
          </Button>
        );
      })}
    </Card>
  );
}
