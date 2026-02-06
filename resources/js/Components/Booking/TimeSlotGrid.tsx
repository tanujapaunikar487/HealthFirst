import { Star } from '@/Lib/icons';
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
    <div className={cn('flex flex-wrap gap-2', className)}>
      {slots.map((slot) => (
        <Button
          key={slot.time}
          variant={selectedTime === slot.time ? 'accent' : 'outline'}
          onClick={() => slot.available && onSelect(slot.time)}
          disabled={!slot.available}
          className={cn(
            'h-auto px-3 py-1.5 rounded-lg font-medium text-[14px] disabled:opacity-60 relative',
            'hover:border-primary/50',
            selectedTime === slot.time &&
              'hover:border-foreground'
          )}
        >
          {slot.time}
          {slot.preferred && selectedTime !== slot.time && (
            <Icon icon={Star} className="absolute -top-1 -right-1 h-3 w-3 fill-black text-black" />
          )}
        </Button>
      ))}
    </div>
  );
}
