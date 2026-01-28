import * as React from 'react';
import { cn } from '@/Lib/utils';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';

const ChainOfThought = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-2', className)}
    {...props}
  />
));
ChainOfThought.displayName = 'ChainOfThought';

const ChainOfThoughtStep = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> & {
    isLast?: boolean;
  }
>(({ className, isLast = false, ...props }, ref) => (
  <CollapsiblePrimitive.Root
    ref={ref}
    className={cn(
      'group relative grid grid-cols-[24px_1fr] gap-3',
      !isLast && 'pb-2',
      className
    )}
    {...props}
  />
));
ChainOfThoughtStep.displayName = 'ChainOfThoughtStep';

const ChainOfThoughtTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & {
    leftIcon?: React.ReactNode;
    swapIconOnHover?: boolean;
  }
>(({ className, children, leftIcon, swapIconOnHover = true, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Left icon/connector */}
      <div className="relative flex h-6 w-6 items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          {leftIcon || (
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          )}
        </div>
        {/* Vertical line connector */}
        <div className="absolute left-1/2 top-6 h-full w-px -translate-x-1/2 bg-border group-last:hidden" />
      </div>

      {/* Trigger button */}
      <CollapsiblePrimitive.Trigger
        ref={ref}
        className={cn(
          'flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors',
          'hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'rounded-sm px-2 py-1 -ml-2',
          className
        )}
        onOpenChange={setIsOpen}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsiblePrimitive.Trigger>
    </>
  );
});
ChainOfThoughtTrigger.displayName = 'ChainOfThoughtTrigger';

const ChainOfThoughtContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <>
    {/* Empty cell for grid alignment */}
    <div />
    {/* Content */}
    <CollapsiblePrimitive.Content
      ref={ref}
      className={cn(
        'overflow-hidden',
        'data-[state=closed]:animate-collapsible-up',
        'data-[state=open]:animate-collapsible-down',
        className
      )}
      {...props}
    >
      <div className="pt-2 pb-2 text-sm text-muted-foreground">{children}</div>
    </CollapsiblePrimitive.Content>
  </>
));
ChainOfThoughtContent.displayName = 'ChainOfThoughtContent';

const ChainOfThoughtItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-start gap-2 py-1', className)}
    {...props}
  />
));
ChainOfThoughtItem.displayName = 'ChainOfThoughtItem';

export {
  ChainOfThought,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
};
