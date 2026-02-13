import { Star } from '@/Lib/icons';
import { HStack } from '@/Components/ui/stack';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

interface TimeSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  className?: string;
}

export function TimeSlotGrid({ slots, selectedTime, onSelect, className }: TimeSlotGridProps) {
  return (
    <HStack gap={2} className={cn('flex-wrap', className)}>
      {slots.map((slot) => (
        <Button
          key={slot.time}
          variant="outline"
          onClick={() => slot.available && onSelect(slot.time)}
          disabled={!slot.available}
          className={cn(
            'h-auto px-4 py-2 rounded-full text-label disabled:opacity-60 transition-all',
            selectedTime !== slot.time && 'hover:border-primary/50 hover:bg-primary/5',
            selectedTime === slot.time && 'border-primary bg-primary/10 text-primary'
          )}
        >
          {slot.time}
          {slot.preferred && <Icon icon={Star} size={12} className="fill-current text-muted-foreground" />}
        </Button>
      ))}
    </HStack>
  );
}
