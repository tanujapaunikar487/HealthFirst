import { useState, useEffect } from 'react';
import { cn } from '@/Lib/utils';
import { Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Card } from '@/Components/ui/card';

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
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[14px] font-bold">!</span>
            </div>
            <div>
              <p className="font-semibold text-warning">Fasting required</p>
              <p className="text-[14px] text-warning">
                {fastingHours || 12} hours before. Morning recommended.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Date section */}
        <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <label className="text-[14px] font-medium mb-2 block">Date</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((dateOption, idx) => {
              const dateValue = dateOption.date || dateOption.value || '';
              const subLabel = dateOption.sublabel || dateOption.day || '';
              const isDateSelected = localDate === dateValue || selectedDate === dateValue;

              return (
                <button
                  key={dateValue || idx}
                  onClick={() => handleDateSelect(dateValue)}
                  disabled={disabled}
                  className={cn(
                    'flex-shrink-0 px-4 py-3 rounded-xl border transition-all min-w-[100px]',
                    'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60',
                    isDateSelected
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background border-border'
                  )}
                >
                  <p className={cn('font-medium', isDateSelected && 'text-background')}>
                    {dateOption.label}
                  </p>
                  <p
                    className={cn(
                      'text-[14px]',
                      isDateSelected ? 'text-background/70' : 'text-muted-foreground'
                    )}
                  >
                    {subLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time section */}
        <div className="p-4">
          <label className="text-[14px] font-medium mb-2 block">
            Time
            {fastingRequired && (
              <span className="text-muted-foreground font-normal"> (morning recommended)</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const isTimeSelected = localTime === slot.time || selectedTime === slot.time;

              return (
                <button
                  key={slot.time}
                  onClick={() => handleTimeSelect(slot.time)}
                  disabled={disabled || !slot.available}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[14px] border transition-all inline-flex items-center gap-1',
                    'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60',
                    isTimeSelected
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background border-border'
                  )}
                >
                  {slot.time}
                  {slot.preferred && !isTimeSelected && (
                    <Star className="h-3 w-3 fill-warning text-warning" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
