import * as React from 'react';
import { cn } from '@/Lib/utils';

type GapScale = 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

type AlignValue = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type JustifyValue = 'start' | 'center' | 'end' | 'between';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: GapScale;
  align?: AlignValue;
  justify?: JustifyValue;
}

const gapMap: Record<GapScale, string> = {
  0.5: 'gap-0.5',
  1: 'gap-1',
  1.5: 'gap-1.5',
  2: 'gap-2',
  2.5: 'gap-2.5',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
};

const alignMap: Record<AlignValue, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyMap: Record<JustifyValue, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

const VStack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap, align, justify, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col',
        gap !== undefined && gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        className
      )}
      {...props}
    />
  )
);
VStack.displayName = 'VStack';

const HStack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap, align, justify, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-row',
        gap !== undefined && gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        className
      )}
      {...props}
    />
  )
);
HStack.displayName = 'HStack';

function Spacer() {
  return <div className="flex-1" />;
}

export { VStack, HStack, Spacer };
export type { StackProps, GapScale };
