import { useState } from 'react';
import { cn } from '@/Lib/utils';
import { Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Card } from '@/Components/ui/card';
import { Alert } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { format, addDays, startOfDay } from 'date-fns';

export interface DateOption {
  date?: string;
  value?: string;  // legacy format
  label: string;
  sublabel?: string;
  day?: string;     // legacy format
}

export interface TimeSlot {
  time: string;
  preferred: boolean;
  available: boolean;
}

interface Props {
  selectedDate: string | null;
  selectedTime: string | null;
  onSelect: (date: string, time: string) => void;
  disabled: boolean;
  dates?: DateOption[];
  slots?: TimeSlot[];
  warning?: {
    title: string;
    description: string;
  };
  fastingRequired?: boolean;
  fastingHours?: number;
}

const defaultTimeSlots: TimeSlot[] = [
  { time: '9:00 AM', preferred: true, available: true },
  { time: '10:00 AM', preferred: true, available: true },
  { time: '11:00 AM', preferred: false, available: true },
  { time: '2:00 PM', preferred: false, available: true },
  { time: '3:00 PM', preferred: false, available: true },
  { time: '5:00 PM', preferred: false, available: true },
];

export function EmbeddedDateTimePicker({
  selectedDate,
  selectedTime,
  onSelect,
  disabled,
  dates: providedDates,
  slots: providedSlots,
  warning,
  fastingRequired,
  fastingHours,
}: Props) {
  // Local state to track selections independently
  const [localDate, setLocalDate] = useState(selectedDate);
  const [localTime, setLocalTime] = useState(selectedTime);

  // Generate next 5 days if dates not provided
  const today = startOfDay(new Date());
  const generatedDates = Array.from({ length: 5 }, (_, i) => addDays(today, i));

  const formatDateLabel = (date: Date, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return format(date, 'EEE');
  };

  const formatDateValue = (date: Date) => format(date, 'yyyy-MM-dd');
  const formatDateDisplay = (date: Date) => format(date, 'MMM d');

  // Convert generated dates to DateOption format if no dates provided
  const dateOptions: DateOption[] = providedDates || generatedDates.map((date, index) => ({
    date: formatDateValue(date),
    label: formatDateLabel(date, index),
    sublabel: formatDateDisplay(date),
  }));

  // Use provided slots or default slots
  const timeSlots = providedSlots || defaultTimeSlots;

  // Determine warning to show (support both formats)
  const warningToShow = warning || (fastingRequired ? {
    title: 'Fasting required',
    description: `${fastingHours || 12} hours before. Morning recommended.`,
  } : undefined);

  // Handle date selection
  const handleDateSelect = (date: string) => {
    if (disabled) return;
    setLocalDate(date);
    // Immediately call onSelect if time is already selected
    if (localTime) {
      onSelect(date, localTime);
    }
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    if (disabled) return;
    setLocalTime(time);
    // Immediately call onSelect if date is already selected
    const dateToUse = localDate || selectedDate;
    if (dateToUse) {
      onSelect(dateToUse, time);
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning message (e.g., fasting required) */}
      {warningToShow && (
        <Alert variant="warning" title={warningToShow.title}>
          {warningToShow.description}
        </Alert>
      )}

      <Card className="overflow-hidden divide-y">
        {/* Date selection */}
        <div className="p-4">
          <h4 className="text-card-title mb-3">Date</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dateOptions.map((dateOption, index) => {
              const dateValue = dateOption.date || dateOption.value || '';
              const subLabel = dateOption.sublabel || dateOption.day || '';
              const isSelected = localDate === dateValue || selectedDate === dateValue;

              return (
                <Button
                  key={dateValue || index}
                  variant="outline"
                  onClick={() => handleDateSelect(dateValue)}
                  disabled={disabled}
                  className={cn(
                    'h-auto px-6 py-3 rounded-2xl font-normal',
                    'flex flex-col items-center flex-shrink-0 min-w-[120px] gap-2',
                    'disabled:opacity-60',
                    isSelected && 'border-2 border-primary bg-primary/10'
                  )}
                >
                  <div className={cn('text-card-title leading-none', isSelected && 'text-primary')}>
                    {dateOption.label}
                  </div>
                  <div className={cn('text-body leading-none', isSelected ? 'text-primary/70' : 'text-muted-foreground')}>
                    {subLabel}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Time selection */}
        <div className="p-4">
          <h4 className="text-card-title mb-3">
            Time {warningToShow && <span className="text-body text-muted-foreground">(morning recommended)</span>}
          </h4>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => {
              const isSelected = localTime === slot.time || selectedTime === slot.time;

              return (
                <Button
                  key={slot.time}
                  variant="outline"
                  onClick={() => handleTimeSelect(slot.time)}
                  disabled={disabled || !slot.available}
                  className={cn(
                    'h-auto px-3 py-1.5 rounded-full text-label',
                    'disabled:opacity-60',
                    isSelected && 'border-2 border-primary bg-primary/10 text-primary'
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
