import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, ArrowLeft } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';

/**
 * Sheet Component System
 *
 * Composable primitives for building consistent sheet overlays across the application.
 * All components use Tailwind v4 design tokens for spacing, typography, and colors.
 *
 * ## Common Patterns
 *
 * ### 1. Simple Forms
 * Use for basic forms with a single submit action.
 *
 * @example
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <SheetContent>
 *     <SheetHeader>
 *       <SheetTitle>Add Insurance</SheetTitle>
 *     </SheetHeader>
 *     <SheetBody className="space-y-5">
 *       <div>
 *         <SheetSectionHeading>Policy Information</SheetSectionHeading>
 *         <div className="space-y-3">
 *           <Input label="Policy Number" />
 *           <Input label="Provider" />
 *         </div>
 *       </div>
 *     </SheetBody>
 *     <SheetFooter>
 *       <Button type="submit">Save</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 *
 * ### 2. List Views
 * Use for displaying lists with full-width items and dividers.
 *
 * @example
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <SheetContent>
 *     <SheetHeader>
 *       <HStack className="justify-between">
 *         <HStack gap={2.5}>
 *           <SheetTitle>Notifications</SheetTitle>
 *           <Badge variant="danger" size="sm">{count}</Badge>
 *         </HStack>
 *         <Button variant="ghost" size="sm">Mark all read</Button>
 *       </HStack>
 *     </SheetHeader>
 *     <SheetBody>
 *       <SheetEdgeContent>
 *         <div className="divide-y">
 *           <Button variant="ghost" className="px-6 py-4 rounded-none">Item 1</Button>
 *           <Button variant="ghost" className="px-6 py-4 rounded-none">Item 2</Button>
 *         </div>
 *       </SheetEdgeContent>
 *     </SheetBody>
 *   </SheetContent>
 * </Sheet>
 *
 * ### 3. Details Views
 * Use for displaying detailed information with mixed padded and edge-to-edge sections.
 *
 * @example
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <SheetContent>
 *     <SheetHeader>
 *       <SheetTitle>Appointment Details</SheetTitle>
 *     </SheetHeader>
 *     <SheetBody>
 *       <div className="px-5 py-4">
 *         <SheetSectionHeading>Patient Information</SheetSectionHeading>
 *         // Content here
 *       </div>
 *       <SheetDivider />
 *       <SheetEdgeContent>
 *         <Collapsible>// Full-width collapsible content</Collapsible>
 *       </SheetEdgeContent>
 *     </SheetBody>
 *     <SheetFooter>
 *       <Button>Confirm</Button>
 *       <Button variant="outline">Cancel</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 *
 * ### 4. Multi-Step Forms
 * Use onBack prop in SheetHeader for navigation between steps.
 *
 * @example
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <SheetContent>
 *     <SheetHeader onBack={step > 1 ? handleBack : undefined}>
 *       <SheetTitle>{stepTitles[step]}</SheetTitle>
 *     </SheetHeader>
 *     <SheetBody className="space-y-5">
 *       {step === 1 && <StepOne />}
 *       {step === 2 && <StepTwo />}
 *     </SheetBody>
 *     <SheetFooter>
 *       <Button onClick={handleNext}>
 *         {step === maxSteps ? 'Submit' : 'Next'}
 *       </Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 *
 * ## Design Tokens
 * - Spacing: Use gap-{N} where N×4=px (gap-3 = 12px, gap-5 = 20px)
 * - Typography: text-section-title, text-label, text-body, text-caption
 * - Colors: text-foreground, text-muted-foreground, text-primary
 * - Padding: px-5 py-5 for sections, px-6 py-4 for list items
 * - Rounded: rounded-xl for cards/buttons, rounded-full for pills
 */

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
      className={cn(sheetVariants({ side }), 'rounded-3xl', className)}
      style={{
        width: '500px',
        border: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
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
    style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', ...style }}
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
    style={{ padding: '16px 20px', borderTop: '1px solid hsl(var(--border))' }}
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
      <h4 className="text-label text-foreground mb-3">{title}</h4>
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
    <span className="text-body text-muted-foreground">{label}</span>
    <span className="text-label text-foreground text-right">
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
    className={cn('text-section-title text-foreground', className)}
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
    className={cn('text-body text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

/**
 * SheetEdgeContent - Edge-to-edge content wrapper for full-width sections.
 * Automatically applies negative margin to break out of SheetBody padding.
 * Use for lists, dividers, tables, or any content that needs to span full width.
 *
 * @example
 * <SheetBody>
 *   <SheetEdgeContent>
 *     <div className="divide-y">
 *       <Button variant="ghost" className="w-full">Item 1</Button>
 *       <Button variant="ghost" className="w-full">Item 2</Button>
 *     </div>
 *   </SheetEdgeContent>
 * </SheetBody>
 */
const SheetEdgeContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('-mx-5', className)}
    {...props}
  />
);
SheetEdgeContent.displayName = 'SheetEdgeContent';

/**
 * SheetSectionHeading - Standardized section heading for sheet content.
 * Use to separate logical sections within forms or details views.
 *
 * @example
 * <SheetBody>
 *   <div className="space-y-5">
 *     <div>
 *       <SheetSectionHeading>Personal Information</SheetSectionHeading>
 *       <div className="space-y-3">
 *         <Input label="Name" />
 *         <Input label="Email" />
 *       </div>
 *     </div>
 *     <div>
 *       <SheetSectionHeading>Contact Details</SheetSectionHeading>
 *       <div className="space-y-3">
 *         <Input label="Phone" />
 *       </div>
 *     </div>
 *   </div>
 * </SheetBody>
 */
const SheetSectionHeading = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('mb-3 text-label text-muted-foreground', className)}
    {...props}
  />
);
SheetSectionHeading.displayName = 'SheetSectionHeading';

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
  SheetEdgeContent,
  SheetSectionHeading,
  SheetTitle,
  SheetDescription,
};
