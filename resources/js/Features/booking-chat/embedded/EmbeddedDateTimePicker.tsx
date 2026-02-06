import { cn } from '@/Lib/utils';
import { Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Card } from '@/Components/ui/card';
import { format, addDays, startOfDay } from 'date-fns';

interface TimeSlot {
  time: string;
  preferred: boolean;
  available: boolean;
}

interface Props {
  selectedDate: string | null;
  selectedTime: string | null;
  onSelect: (date: string, time: string) => void;
  disabled: boolean;
  warning?: {
    title: string;
    description: string;
  };
}

export function EmbeddedDateTimePicker({ selectedDate, selectedTime, onSelect, disabled, warning }: Props) {
  // Generate next 5 days
  const today = startOfDay(new Date());
  const dates = Array.from({ length: 5 }, (_, i) => addDays(today, i));

  // Mock time slots
  const timeSlots: TimeSlot[] = [
    { time: '9:00 AM', preferred: true, available: true },
    { time: '10:00 AM', preferred: true, available: true },
    { time: '11:00 AM', preferred: false, available: true },
    { time: '2:00 PM', preferred: false, available: true },
    { time: '3:00 PM', preferred: false, available: true },
    { time: '5:00 PM', preferred: false, available: true },
  ];

  const formatDateLabel = (date: Date, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return format(date, 'EEE');
  };

  const formatDateValue = (date: Date) => format(date, 'yyyy-MM-dd');
  const formatDateDisplay = (date: Date) => format(date, 'MMM d');

  return (
    <div className="space-y-4">
      {/* Warning message (e.g., fasting required) */}
      {warning && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[14px] font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[14px] text-warning mb-1">{warning.title}</p>
              <p className="text-[14px] text-warning">{warning.description}</p>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Date selection */}
        <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h4 className="font-semibold text-[14px] mb-3">Date</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date, index) => {
              const dateValue = formatDateValue(date);
              const isSelected = selectedDate === dateValue;

              return (
                <button
                  key={dateValue}
                  onClick={() => !disabled && selectedTime && onSelect(dateValue, selectedTime)}
                  disabled={disabled}
                  className={cn(
                    'flex flex-col items-center flex-shrink-0 px-6 py-3 rounded-2xl border transition-all min-w-[120px]',
                    'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60',
                    isSelected
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border bg-background text-foreground'
                  )}
                >
                  <div className={cn('font-semibold text-[14px]', isSelected && 'text-background')}>
                    {formatDateLabel(date, index)}
                  </div>
                  <div className={cn('text-[14px]', isSelected ? 'text-background/70' : 'text-muted-foreground')}>
                    {formatDateDisplay(date)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time selection */}
        <div className="p-4">
          <h4 className="font-semibold text-[14px] mb-3">
            Time {warning && <span className="text-[14px] font-normal text-muted-foreground">(morning recommended)</span>}
          </h4>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;

              return (
                <button
                  key={slot.time}
                  onClick={() => !disabled && selectedDate && onSelect(selectedDate, slot.time)}
                  disabled={disabled || !slot.available}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full border text-[14px] font-medium transition-all inline-flex items-center gap-1',
                    'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60',
                    isSelected
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border bg-background text-foreground'
                  )}
                >
                  {slot.time}
                  {slot.preferred && !isSelected && <Star className="w-3 h-3 fill-current" />}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
