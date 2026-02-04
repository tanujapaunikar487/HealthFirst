import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from '@/Lib/icons';
import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';
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
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !dateValue && 'text-muted-foreground',
            error && 'border-red-300 focus:ring-red-500',
            className
          )}
        >
          <span>
            {dateValue ? format(dateValue, 'dd/MM/yyyy') : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
