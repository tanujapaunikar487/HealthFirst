import { Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
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
        <button
          key={slot.time}
          onClick={() => slot.available && onSelect(slot.time)}
          disabled={!slot.available}
          className={cn(
            'px-3 py-1.5 rounded-lg text-[14px] border transition-all relative',
            'hover:border-primary/50',
            selectedTime === slot.time &&
              'bg-foreground text-background border-foreground hover:border-foreground',
            !slot.available && 'opacity-50 cursor-not-allowed'
          )}
        >
          {slot.time}
          {slot.preferred && selectedTime !== slot.time && (
            <Icon icon={Star} className="absolute -top-1 -right-1 h-3 w-3 fill-black text-black" />
          )}
        </button>
      ))}
    </div>
  );
}
