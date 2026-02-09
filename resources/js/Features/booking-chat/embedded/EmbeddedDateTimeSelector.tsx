import { useState, useEffect } from 'react';
import { cn } from '@/Lib/utils';
import { Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Card } from '@/Components/ui/card';
import { Alert } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';

interface DateOption {
  date?: string;
  value?: string;  // legacy format
  label: string;
  sublabel?: string;
  day?: string;     // legacy format
}

interface TimeSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}

interface Props {
  dates: DateOption[];
  slots: TimeSlot[];
  fastingRequired?: boolean;
  fastingHours?: number;
  selectedDate: string | null;
  selectedTime: string | null;
  onSelect: (date: string, time: string) => void;
  disabled: boolean;
}

export function EmbeddedDateTimeSelector({
  dates,
  slots,
  fastingRequired,
  fastingHours,
  selectedDate,
  selectedTime,
  onSelect,
  disabled,
}: Props) {
  const [localDate, setLocalDate] = useState(selectedDate);
  const [localTime, setLocalTime] = useState(selectedTime);

  const handleDateSelect = (date: string) => {
    if (disabled) return;
    setLocalDate(date);
    // Immediately call onSelect if time is already selected
    if (localTime) {
      onSelect(date, localTime);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (disabled) return;
    setLocalTime(time);
    // Immediately call onSelect if date is already selected
    // Use localDate from state or the current selectedDate prop
    const dateToUse = localDate || selectedDate;
    if (dateToUse) {
      onSelect(dateToUse, time);
    }
  };

  return (
    <div className="space-y-4">
      {/* Fasting alert */}
      {fastingRequired && (
        <Alert variant="warning" title="Fasting required">
          {fastingHours || 12} hours before. Morning recommended.
        </Alert>
      )}

      <Card className="overflow-hidden divide-y">
        {/* Date section */}
        <div className="p-4">
          <label className="text-label mb-2 block">Date</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((dateOption, idx) => {
              const dateValue = dateOption.date || dateOption.value || '';
              const subLabel = dateOption.sublabel || dateOption.day || '';
              const isDateSelected = localDate === dateValue || selectedDate === dateValue;

              return (
                <Button
                  key={dateValue || idx}
                  variant={isDateSelected ? 'accent' : 'outline'}
                  onClick={() => handleDateSelect(dateValue)}
                  disabled={disabled}
                  className={cn(
                    'h-auto px-6 py-3 rounded-2xl font-normal',
                    'flex-shrink-0 min-w-[100px]',
                    'disabled:opacity-60',
                    isDateSelected && 'border-foreground'
                  )}
                >
                  <div className="w-full text-left">
                    <p className={cn('font-medium', isDateSelected && 'text-background')}>
                      {dateOption.label}
                    </p>
                    <p
                      className={cn(
                        'text-body',
                        isDateSelected ? 'text-background/70' : 'text-muted-foreground'
                      )}
                    >
                      {subLabel}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Time section */}
        <div className="p-4">
          <label className="text-label mb-2 block">
            Time
            {fastingRequired && (
              <span className="text-muted-foreground font-normal"> (morning recommended)</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const isTimeSelected = localTime === slot.time || selectedTime === slot.time;

              return (
                <Button
                  key={slot.time}
                  variant={isTimeSelected ? 'accent' : 'outline'}
                  onClick={() => handleTimeSelect(slot.time)}
                  disabled={disabled || !slot.available}
                  className={cn(
                    'h-auto px-3 py-1.5 rounded-full text-label',
                    'disabled:opacity-60',
                    isTimeSelected && 'border-foreground'
                  )}
                >
                  {slot.time}
                  {slot.preferred && !isTimeSelected && (
                    <Icon icon={Star} size={12} className="fill-warning text-warning" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
