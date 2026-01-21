# Component Library

**Status:** Locked
**Library:** shadcn/ui (React + Tailwind)
**Authority:** This document defines the complete set of allowed components.

---

## Principles

1. **Components are stateless.** They render what they're given.
2. **Components consume design tokens.** Never override tokens.
3. **Components never query data.** Data comes from the server via Inertia.
4. **Components never make decisions.** Business logic lives in Laravel.
5. **Components are presentation only.** Pure rendering functions.

---

## Core Components

### 1. Button
**Purpose:** All clickable actions

**Variants:**
- `default` - Primary action (uses accent color)
- `destructive` - Delete, remove, cancel
- `outline` - Secondary action
- `secondary` - Tertiary action
- `ghost` - Minimal/text-like action
- `link` - Link styling

**Sizes:**
- `sm` - Compact buttons
- `md` - Default size
- `lg` - Large/prominent actions

**Props:**
```tsx
interface ButtonProps {
  variant?: ButtonVariant;
  size?: ComponentSize;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

**Usage:**
- Primary actions: `variant="default"`
- Destructive actions: `variant="destructive"`
- Cancel/back: `variant="outline"`

---

### 2. Input
**Purpose:** Text input fields

**Variants:**
- Default (no variants)

**Props:**
```tsx
interface InputProps {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}
```

**Usage:**
- Always pair with a `Label`
- Use `muted-foreground` for placeholder text
- Validation errors shown via separate `Alert` or `FormError` component

---

### 3. Label
**Purpose:** Form field labels

**Props:**
```tsx
interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
}
```

**Usage:**
- Always use with form inputs
- Use `text-sm font-medium` styling

---

### 4. Textarea
**Purpose:** Multi-line text input

**Props:**
```tsx
interface TextareaProps {
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}
```

---

### 5. Select
**Purpose:** Dropdown selection

**Props:**
```tsx
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}
```

**Sub-components:**
- `SelectTrigger` - The dropdown button
- `SelectContent` - The dropdown menu
- `SelectItem` - Individual option
- `SelectValue` - Displays selected value

**Usage:**
- Options are passed from the server
- Component never fetches options itself

---

### 6. Checkbox
**Purpose:** Boolean selection

**Props:**
```tsx
interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}
```

---

### 7. Radio Group
**Purpose:** Single selection from multiple options

**Props:**
```tsx
interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}
```

**Sub-components:**
- `RadioGroupItem` - Individual radio button

---

### 8. Card
**Purpose:** Containerfor grouped content

**Sub-components:**
- `CardHeader` - Title area
- `CardTitle` - Main title
- `CardDescription` - Subtitle/description
- `CardContent` - Main content area
- `CardFooter` - Actions area

**Props:**
```tsx
interface CardProps {
  className?: string;
  children: React.ReactNode;
}
```

**Usage:**
- Patient info cards
- Appointment cards
- Dashboard widgets
- Form sections

---

### 9. Badge
**Purpose:** Status indicators and labels

**Variants:**
- `default` - Neutral
- `secondary` - Alternative neutral
- `destructive` - Error/critical
- `success` - Completed/confirmed
- `warning` - Attention needed
- `info` - Informational
- `outline` - Outlined variant

**Props:**
```tsx
interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}
```

**Usage:**
- Appointment status: `<Badge variant="success">Confirmed</Badge>`
- Patient priority: `<Badge variant="warning">High Priority</Badge>`
- Never use for interactive elements

---

### 10. Alert
**Purpose:** Contextual messages and notifications

**Variants:**
- `default` - Neutral informational
- `destructive` - Error/critical message

**Sub-components:**
- `AlertTitle` - Alert heading
- `AlertDescription` - Alert content

**Props:**
```tsx
interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}
```

**Usage:**
- Form validation errors
- System messages
- Confirmation messages

---

### 11. Table
**Purpose:** Tabular data display

**Sub-components:**
- `TableHeader` - Column headers
- `TableBody` - Rows
- `TableRow` - Single row
- `TableHead` - Header cell
- `TableCell` - Data cell
- `TableCaption` - Table caption

**Props:**
```tsx
interface TableProps {
  children: React.ReactNode;
}
```

**Usage:**
- Patient lists
- Appointment schedules
- Medical records
- Billing tables

---

### 12. Dialog (Modal)
**Purpose:** Modal overlays for focused tasks

**Sub-components:**
- `DialogTrigger` - Opens the dialog
- `DialogContent` - Modal content container
- `DialogHeader` - Title area
- `DialogTitle` - Modal title
- `DialogDescription` - Modal description
- `DialogFooter` - Action buttons area

**Props:**
```tsx
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}
```

**Usage:**
- Confirmations (e.g., "Delete appointment?")
- Quick forms (e.g., "Add note")
- Detail views

---

### 13. Popover
**Purpose:** Contextual overlays for supplementary content

**Sub-components:**
- `PopoverTrigger` - Opens the popover
- `PopoverContent` - Content container

**Props:**
```tsx
interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}
```

**Usage:**
- Date pickers
- Quick info tooltips
- Small forms

---

### 14. Tabs
**Purpose:** Content organization with tabbed navigation

**Sub-components:**
- `TabsList` - Tab buttons container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Tab panel content

**Props:**
```tsx
interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}
```

**Usage:**
- Patient details (Overview, History, Prescriptions)
- Dashboard sections
- Settings panels

---

### 15. Accordion
**Purpose:** Collapsible content sections

**Sub-components:**
- `AccordionItem` - Single collapsible section
- `AccordionTrigger` - Header/button
- `AccordionContent` - Collapsible content

**Props:**
```tsx
interface AccordionProps {
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
}
```

**Usage:**
- FAQ sections
- Medical history sections
- Collapsible filters

---

### 16. Separator
**Purpose:** Visual dividers

**Props:**
```tsx
interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
}
```

---

### 17. Avatar
**Purpose:** User/patient profile images

**Sub-components:**
- `AvatarImage` - Actual image
- `AvatarFallback` - Initials or placeholder

**Props:**
```tsx
interface AvatarProps {
  children: React.ReactNode;
}
```

**Usage:**
- Patient lists
- Doctor profiles
- Chat interfaces

---

### 18. Calendar
**Purpose:** Date selection and scheduling

**Props:**
```tsx
interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[];
  onSelect?: (date: Date | Date[] | undefined) => void;
  disabled?: (date: Date) => boolean;
}
```

**Usage:**
- Appointment booking
- Date range selection
- Availability views

**Important:**
- Availability logic comes from the server
- Component only renders available/unavailable states
- Never computes availability client-side

---

### 19. Dropdown Menu
**Purpose:** Action menus and context menus

**Sub-components:**
- `DropdownMenuTrigger` - Opens the menu
- `DropdownMenuContent` - Menu container
- `DropdownMenuItem` - Individual action
- `DropdownMenuSeparator` - Divider
- `DropdownMenuLabel` - Section label

**Props:**
```tsx
interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}
```

**Usage:**
- Row actions in tables
- User profile menu
- Context menus

---

### 20. Toast
**Purpose:** Temporary notifications

**Props:**
```tsx
interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}
```

**Usage:**
- Success confirmations ("Appointment saved")
- Error notifications ("Failed to load data")
- Triggered programmatically, not rendered in components

---

### 21. Skeleton
**Purpose:** Loading placeholders

**Props:**
```tsx
interface SkeletonProps {
  className?: string;
}
```

**Usage:**
- Show while data is loading
- Matches the shape of actual content

---

### 22. Progress
**Purpose:** Progress indicators

**Props:**
```tsx
interface ProgressProps {
  value?: number; // 0-100
}
```

**Usage:**
- File uploads
- Multi-step forms
- Processing status

---

## Layout Components

### 23. Container
**Purpose:** Max-width content wrapper

**Props:**
```tsx
interface ContainerProps {
  children: React.ReactNode;
}
```

**Usage:**
- Page-level content wrapper
- Centers content with max-width

---

### 24. Stack
**Purpose:** Vertical spacing utility

**Props:**
```tsx
interface StackProps {
  spacing?: SpacingToken;
  children: React.ReactNode;
}
```

**Usage:**
- Consistent vertical spacing between elements

---

## Typography Components

### 25. Heading
**Purpose:** Semantic headings

**Props:**
```tsx
interface HeadingProps {
  level: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}
```

**Usage:**
- Renders `<h1>` through `<h4>` with correct token styles
- Enforces semantic hierarchy

---

### 26. Text
**Purpose:** Semantic text

**Props:**
```tsx
interface TextProps {
  variant?: 'body' | 'body-large' | 'body-small' | 'caption' | 'muted';
  children: React.ReactNode;
}
```

**Usage:**
- Renders `<p>` or `<span>` with correct token styles

---

## Form Components

### 27. Form
**Purpose:** Form wrapper with validation context

**Props:**
```tsx
interface FormProps {
  onSubmit: (e: FormEvent) => void;
  children: React.ReactNode;
}
```

**Usage:**
- Wraps all forms
- Handles submission
- Integrates with Laravel validation errors

---

### 28. FormField
**Purpose:** Form field with label, input, and error

**Props:**
```tsx
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

**Usage:**
- Combines `Label`, input component, and error message
- Consistent spacing and layout

---

## Data Display Components

### 29. DataList
**Purpose:** Key-value pair display

**Props:**
```tsx
interface DataListProps {
  data: Array<{ label: string; value: string | React.ReactNode }>;
}
```

**Usage:**
- Patient details
- Appointment summaries
- Record metadata

---

### 30. EmptyState
**Purpose:** No data placeholder

**Props:**
```tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

**Usage:**
- Empty tables
- No search results
- No appointments scheduled

---

## Component Rules

### ✅ Components MUST:
- Consume design tokens only
- Be fully controlled or fully uncontrolled
- Accept data as props
- Be stateless (except local UI state like open/closed)
- Follow TypeScript prop types strictly

### ❌ Components MUST NOT:
- Query the database
- Make API calls
- Contain business logic
- Make decisions based on data
- Override design tokens
- Use arbitrary styling values
- Depend on Laravel directly

---

## Installation

All components will be installed from shadcn/ui and customized to match our design tokens.

```bash
npx shadcn@latest init
npx shadcn@latest add button input label textarea select checkbox radio-group card badge alert table dialog popover tabs accordion separator avatar calendar dropdown-menu toast skeleton progress
```

---

## Customization

Each component is customized to:
1. Consume our design tokens from [tailwind.config.js](../tailwind.config.js)
2. Follow our typography system from [design-tokens.md](design-tokens.md)
3. Use our spacing, radius, and border tokens
4. Expose only the variants we need

---

## Summary

**30 components locked.**
**All components are presentation-only.**
**All components consume design tokens.**
**No exceptions.**
