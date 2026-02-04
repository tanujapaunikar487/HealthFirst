import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from '@/Lib/icons';
import { cn } from '@/Lib/utils';
import { Calendar } from '@/Components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/Components/ui/popover';

export interface DatePickerProps {
  /** Selected date value (Date object or ISO string YYYY-MM-DD) */
  value?: Date | string;
  /** Callback when date changes - receives ISO string YYYY-MM-DD or empty string */
  onChange: (value: string) => void;
  /** Minimum selectable date */
  min?: Date;
  /** Maximum selectable date */
  max?: Date;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Show error state */
  error?: boolean;
  /** Additional class names */
  className?: string;
  /** ID for the trigger button */
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  error = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert value to Date object for Calendar
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    // Parse ISO string (YYYY-MM-DD)
    const parsed = parse(value, 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Return ISO format YYYY-MM-DD for backend compatibility
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
    setOpen(false);
  };

  // Disable dates outside min/max range
  const disabledDays = React.useMemo(() => {
    const disabled: { before?: Date; after?: Date } = {};
    if (min) disabled.before = min;
    if (max) disabled.after = max;
    return Object.keys(disabled).length > 0 ? disabled : undefined;
  }, [min, max]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-[14px] ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            !dateValue && 'text-muted-foreground',
            error && 'border-red-300 focus:ring-red-500',
            className
          )}
        >
          <span>
            {dateValue ? format(dateValue, 'dd/MM/yyyy') : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          disabled={disabledDays}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
