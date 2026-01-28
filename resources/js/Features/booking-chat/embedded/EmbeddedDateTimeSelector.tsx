import { useState, useEffect } from 'react';
import { cn } from '@/Lib/utils';
import { Star } from 'lucide-react';

interface DateOption {
  date: string;
  label: string;
  sublabel: string;
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
    if (localTime) {
      onSelect(date, localTime);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (disabled) return;
    setLocalTime(time);
    if (localDate) {
      onSelect(localDate, time);
    }
  };

  return (
    <div className="space-y-4">
      {/* Fasting alert */}
      {fastingRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <p className="font-semibold text-amber-900">Fasting required</p>
              <p className="text-sm text-amber-700">
                {fastingHours || 12} hours before. Morning recommended.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date section */}
      <div>
        <label className="text-sm font-medium mb-2 block">Date</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((dateOption) => {
            const isDateSelected = localDate === dateOption.date || selectedDate === dateOption.date;

            return (
              <button
                key={dateOption.date}
                onClick={() => handleDateSelect(dateOption.date)}
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
                    'text-sm',
                    isDateSelected ? 'text-background/70' : 'text-muted-foreground'
                  )}
                >
                  {dateOption.sublabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time section */}
      <div>
        <label className="text-sm font-medium mb-2 block">
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
                  'px-3 py-1.5 rounded-full text-sm border transition-all inline-flex items-center gap-1',
                  'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60',
                  isTimeSelected
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background border-border'
                )}
              >
                {slot.time}
                {slot.preferred && !isTimeSelected && (
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
