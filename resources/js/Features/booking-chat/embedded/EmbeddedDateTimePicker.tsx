import { cn } from '@/Lib/utils';
import { Star } from 'lucide-react';
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-900 mb-1">{warning.title}</p>
              <p className="text-sm text-amber-800">{warning.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Date selection */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Date</h4>
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
                  'flex flex-col items-center flex-shrink-0 px-6 py-3 rounded-2xl border-2 transition-all min-w-[120px]',
                  'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60',
                  isSelected
                    ? 'border-[#0A0B0D] bg-[#0A0B0D] text-white'
                    : 'border-gray-200 bg-white text-[#0A0B0D]'
                )}
              >
                <div className={cn('font-semibold text-sm', isSelected && 'text-white')}>
                  {formatDateLabel(date, index)}
                </div>
                <div className={cn('text-xs', isSelected ? 'text-gray-300' : 'text-gray-500')}>
                  {formatDateDisplay(date)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time selection */}
      <div>
        <h4 className="font-semibold text-sm mb-3">
          Time {warning && <span className="text-xs font-normal text-gray-500">(morning recommended)</span>}
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
                  'px-3.5 py-1.5 rounded-full border-2 text-xs font-medium transition-all inline-flex items-center gap-1',
                  'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60',
                  isSelected
                    ? 'border-[#0A0B0D] bg-[#0A0B0D] text-white'
                    : 'border-gray-200 bg-white text-[#0A0B0D]'
                )}
              >
                {slot.time}
                {slot.preferred && !isSelected && <Star className="w-3 h-3 fill-current" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
