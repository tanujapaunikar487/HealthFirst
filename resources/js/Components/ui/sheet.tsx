import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, ArrowLeft } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-[4px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'fixed z-50 bg-background shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      style={{
        width: '500px',
        borderRadius: '24px',
        border: '1px solid #E5E5E5',
        background: '#FFF',
        boxShadow: '0 32px 32px 0 rgba(23, 23, 23, 0.12), 0 50px 60px 0 rgba(23, 23, 23, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        top: '10px',
        right: '10px',
        bottom: '10px',
        left: 'auto',
        height: 'auto',
      }}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  style,
  onBack,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onBack?: () => void }) => (
  <div
    className={cn('flex items-center gap-3', className)}
    style={{ padding: '16px 20px', borderBottom: '1px solid #E5E5E5', ...style }}
    {...props}
  >
    {onBack && (
      <button
        onClick={onBack}
        className="h-10 w-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted flex-shrink-0"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
    )}
    <div className="flex-1">{children}</div>
    <SheetPrimitive.Close className="h-10 w-10 rounded-full flex items-center justify-center transition-colors hover:bg-muted flex-shrink-0 focus:outline-none disabled:pointer-events-none">
      <X className="h-6 w-6" />
      <span className="sr-only">Close</span>
    </SheetPrimitive.Close>
  </div>
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center gap-2 mt-auto',
      className
    )}
    style={{ padding: '16px 20px', borderTop: '1px solid #E5E5E5' }}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

const SheetDivider = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('border-b', className)}
    {...props}
  />
);
SheetDivider.displayName = 'SheetDivider';

/**
 * SheetBody - Scrollable content area.
 * Sections (direct children) get 20px padding and are separated by 1px #E5E5E5 dividers.
 */
const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('sheet-body flex-1 overflow-y-auto', className)}
    {...props}
  />
);
SheetBody.displayName = 'SheetBody';

/**
 * SheetSection - Info-card style content display without border and horizontal padding.
 * Use for displaying read-only data rows in sheets.
 */
interface SheetSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

const SheetSection = ({
  title,
  className,
  children,
  ...props
}: SheetSectionProps) => (
  <div className={cn('space-y-0', className)} {...props}>
    {title && (
      <h4 className="text-[14px] font-medium text-[#171717] mb-3">{title}</h4>
    )}
    <div className="divide-y divide-border">
      {children}
    </div>
  </div>
);
SheetSection.displayName = 'SheetSection';

/**
 * SheetSectionRow - A single row within SheetSection, matching info-card row style.
 */
interface SheetSectionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value?: React.ReactNode;
}

const SheetSectionRow = ({
  label,
  value,
  className,
  children,
  ...props
}: SheetSectionRowProps) => (
  <div
    className={cn('flex items-center justify-between py-3', className)}
    {...props}
  >
    <span className="text-[14px] font-normal text-[#737373]">{label}</span>
    <span className="text-[14px] font-medium text-[#171717] text-right">
      {value ?? children ?? '—'}
    </span>
  </div>
);
SheetSectionRow.displayName = 'SheetSectionRow';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('font-semibold', className)}
    style={{
      color: '#171717',
      fontSize: '20px',
      lineHeight: '28px',
      letterSpacing: '0',
    }}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-[14px] text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetDivider,
  SheetSection,
  SheetSectionRow,
  SheetTitle,
  SheetDescription,
};
