import { cn } from '@/Lib/utils';
import { Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Card } from '@/Components/ui/card';
import { Alert } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
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
        <Alert variant="warning" title={warning.title}>
          {warning.description}
        </Alert>
      )}

      <Card className="overflow-hidden">
        {/* Date selection */}
        <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h4 className="text-card-title mb-3">Date</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date, index) => {
              const dateValue = formatDateValue(date);
              const isSelected = selectedDate === dateValue;

              return (
                <Button
                  key={dateValue}
                  variant={isSelected ? 'accent' : 'outline'}
                  onClick={() => !disabled && selectedTime && onSelect(dateValue, selectedTime)}
                  disabled={disabled}
                  className={cn(
                    'h-auto px-6 py-3 rounded-2xl font-normal',
                    'flex flex-col items-center flex-shrink-0 min-w-[120px]',
                    'disabled:opacity-60',
                    isSelected && 'border-foreground'
                  )}
                >
                  <div className={cn('text-card-title', isSelected && 'text-background')}>
                    {formatDateLabel(date, index)}
                  </div>
                  <div className={cn('text-body', isSelected ? 'text-background/70' : 'text-muted-foreground')}>
                    {formatDateDisplay(date)}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Time selection */}
        <div className="p-4">
          <h4 className="text-card-title mb-3">
            Time {warning && <span className="text-body text-muted-foreground">(morning recommended)</span>}
          </h4>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;

              return (
                <Button
                  key={slot.time}
                  variant={isSelected ? 'accent' : 'outline'}
                  onClick={() => !disabled && selectedDate && onSelect(selectedDate, slot.time)}
                  disabled={disabled || !slot.available}
                  className={cn(
                    'h-auto px-3 py-1.5 rounded-full text-label',
                    'disabled:opacity-60',
                    isSelected && 'border-foreground'
                  )}
                >
                  {slot.time}
                  {slot.preferred && !isSelected && <Icon icon={Star} size={12} className="fill-current" />}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
