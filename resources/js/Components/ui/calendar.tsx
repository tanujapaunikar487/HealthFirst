import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown } from '@/Lib/icons';
import { cn } from '@/Lib/utils';
import { buttonVariants } from '@/Components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 w-full', className)}
      captionLayout="dropdown"
      classNames={{
        months: 'flex flex-col w-full',
        month: 'flex flex-col w-full relative',
        month_caption: 'flex items-center justify-center relative h-10 mb-4',
        caption_label: 'hidden',
        dropdowns: 'flex items-center gap-2',
        dropdown: 'appearance-none bg-transparent text-label cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border border-input rounded-lg px-2 py-1',
        dropdown_root: 'relative inline-flex items-center',
        nav: 'absolute inset-x-0 flex items-center justify-between pointer-events-none',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-md pointer-events-auto'
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-md pointer-events-auto'
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex w-full',
        weekday: 'text-muted-foreground flex-1 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'flex-1 text-center text-body p-0 relative [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-md'
        ),
        range_end: 'day-range-end',
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
        today: 'bg-accent text-accent-foreground rounded-md',
        outside:
          'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        disabled: 'text-muted-foreground opacity-50',
        range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      formatters={{
        formatMonthDropdown: (date) => format(date, 'MMM'),
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" />;
          }
          if (orientation === 'right') {
            return <ChevronRight className="h-4 w-4" />;
          }
          // For dropdown chevrons (up/down)
          return <ChevronDown className="h-3 w-3 opacity-50" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
