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
          variant={selectedTime === slot.time ? 'accent' : 'outline'}
          onClick={() => slot.available && onSelect(slot.time)}
          disabled={!slot.available}
          className={cn(
            'h-auto px-4 py-2 rounded-xl text-label disabled:opacity-60 relative',
            'hover:border-primary/50',
            selectedTime === slot.time &&
              'hover:border-foreground'
          )}
        >
          {slot.time}
          {slot.preferred && selectedTime !== slot.time && (
            <Icon icon={Star} className="absolute -top-1 -right-1 fill-black text-black" size="sm" />
          )}
        </Button>
      ))}
    </HStack>
  );
}
