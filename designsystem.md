# Design System

## Overview

UI component library built on shadcn/ui (React + Tailwind CSS). All visual decisions are tokenized. Components are presentation-only and consume design tokens.

**Font**: Inter (400, 500, 600, 700)
**Component Library**: shadcn/ui + Radix UI primitives
**Styling**: Tailwind CSS + CVA (class-variance-authority) + tailwind-merge

---

## Color Tokens

Defined as CSS custom properties in `resources/css/app.css` and consumed via Tailwind.

### Core Palette (Light Mode)
| Token | HSL | Usage |
|-------|-----|-------|
| `--background` | 0 0% 100% | Page background |
| `--foreground` | 240 10% 3.9% | Primary text |
| `--card` | 0 0% 100% | Card background |
| `--card-foreground` | 240 10% 3.9% | Card text |
| `--primary` | 221 83% 53% | Accent color (#0052FF) |
| `--primary-foreground` | 0 0% 98% | Text on primary |
| `--secondary` | 240 4.8% 95.9% | Secondary surfaces |
| `--muted` | 240 4.8% 95.9% | Muted backgrounds |
| `--muted-foreground` | 240 3.8% 46.1% | Secondary text |
| `--destructive` | 0 84.2% 60.2% | Delete/error actions |
| `--border` | 240 5.9% 90% | All borders |
| `--input` | 240 5.9% 90% | Input borders |
| `--ring` | 221 83% 53% | Focus rings |
| `--radius` | 0.5rem | Default border radius |

### Brand Colors (Hardcoded)
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Dark | #00184D | Headings, dark text |
| Accent Blue | #0052FF | CTAs, active states, links |
| Border Gray | #CED2DB | Borders, dividers |
| Text Primary | #0A0B0D | Body text |
| Text Secondary | #5B636E | Muted text |
| Background Light | #EEF0F3, #F7F8F9, #F5F8FF | Section backgrounds |
| Success | #EEFBF4 | Completed states |

### Gradients
- CTA Banner: radial-gradient(#003EC1, #00184D)
- AI Button Border: linear(#FFFFFF, #0052FF, #FFFFFF)
- Chat Input Active: linear(265deg, #93C5FD 24.67%, #BFDBFE 144.07%)
- Chat Input Default: linear(265deg, #BFDBFE 24.67%, #FFF 144.07%)

### Per-Hospital Customization
Hospitals can configure **only**: logo and primary accent color (updates `--primary` CSS variable).

---

## Typography

| Variant | Size | Weight | Use Case |
|---------|------|--------|----------|
| h1 | 4xl | bold | Page titles |
| h2 | 3xl | semibold | Section titles |
| h3 | 2xl | semibold | Subsection titles |
| h4 | xl | semibold | Card/component titles |
| body | base (14px) | normal | Default body text |
| body-small | sm (14px) | normal | Compact body text |
| caption | xs (12px) | normal | Labels, timestamps |
| muted | sm | normal | Secondary text (`text-muted-foreground`) |

**Booking components** use 14px base, 12px secondary, 10px tertiary.

---

## Spacing

Use **only** Tailwind's default spacing scale. No arbitrary values.

| Usage | Token |
|-------|-------|
| Card padding | `p-6` or `p-4` |
| Section gaps | `gap-6` |
| Stack spacing | `space-y-4` |
| Icon-to-text | `gap-4` |
| Border radius (cards) | `rounded-lg` |
| Border radius (pills) | `rounded-full` |

---

## Component Catalog

### Core Components (from shadcn/ui)

| # | Component | Location | Purpose |
|---|-----------|----------|---------|
| 1 | Button | `ui/button.tsx` | All clickable actions. Variants: default, destructive, outline, secondary, ghost, link, cta. Sizes: sm, md, lg, xl, cta, icon |
| 2 | Input | `ui/input.tsx` | Text input fields |
| 3 | Textarea | `ui/textarea.tsx` | Multi-line text input |
| 4 | Card | `ui/card.tsx` | Content container (CardHeader, CardTitle, CardDescription, CardContent, CardFooter) |
| 5 | Badge | `ui/badge.tsx` | Status indicators. Variants: default, secondary, destructive, success, warning, info, outline |
| 6 | Avatar | `ui/avatar.tsx` | Profile images (AvatarImage, AvatarFallback). Sizes: sm(32), md(40), lg(48), xl(64) |
| 7 | Toast | `ui/toast.tsx` | Auto-dismiss notifications. Dark bg, white text, configurable duration |
| 8 | Tooltip | `ui/tooltip.tsx` | Radix UI tooltip wrapper with animations |
| 9 | Dropdown Menu | `ui/dropdown-menu.tsx` | Action menus (user profile, context menus) |
| 10 | Loader | `ui/loader.tsx` | Loading indicators |

### Chat/Prompt Components

| Component | Location | Purpose |
|-----------|----------|---------|
| PromptInput | `ui/prompt-input.tsx` | Main chat input with keyboard shortcuts |
| PromptInputTextarea | `ui/prompt-input.tsx` | Auto-sizing textarea (140px min, 240px max) |
| PromptInputActions | `ui/prompt-input.tsx` | Action button container |
| PromptInputContainer | `ui/prompt-input-container.tsx` | Gradient border wrapper |
| Message | `ui/message.tsx` | Chat message bubble |
| ChatContainer | `ui/chat-container.tsx` | Chat message list container |

### CTA Components

| Component | Location | Purpose |
|-----------|----------|---------|
| CtaBanner | `ui/cta-banner.tsx` | Call-to-action banner with radial gradient |

### Booking Components

| Component | Location | Purpose |
|-----------|----------|---------|
| StepIndicator | `Components/Booking/StepIndicator.tsx` | Multi-step progress indicator |
| SymptomChips | `Components/Booking/SymptomChips.tsx` | Symptom tag selector |
| TimeSlotGrid | `Components/Booking/TimeSlotGrid.tsx` | Time slot selection grid |
| ThinkingIndicator | `Components/Booking/ThinkingIndicator.tsx` | AI thinking animation |
| AppointmentModeSelector | `Components/Booking/AppointmentModeSelector.tsx` | Video/in-person toggle |

### Embedded Booking Chat Components

| Component | Location | Purpose |
|-----------|----------|---------|
| EmbeddedComponent | `Features/booking-chat/EmbeddedComponent.tsx` | Component router |
| EmbeddedDoctorList | `embedded/EmbeddedDoctorList.tsx` | Doctor cards with time slots |
| EmbeddedBookingSummary | `embedded/EmbeddedBookingSummary.tsx` | Summary with change actions |
| EmbeddedDateTimePicker | `embedded/EmbeddedDateTimePicker.tsx` | Date and time selection |
| EmbeddedDateTimeSelector | `embedded/EmbeddedDateTimeSelector.tsx` | Date/time combined selector |
| EmbeddedAppointmentType | `embedded/EmbeddedAppointmentType.tsx` | New/follow-up selector |
| EmbeddedAppointmentMode | `embedded/EmbeddedAppointmentMode.tsx` | Video/in-person selector |
| EmbeddedUrgencySelector | `embedded/EmbeddedUrgencySelector.tsx` | Urgency level selector |
| EmbeddedFollowUpFlow | `embedded/EmbeddedFollowUpFlow.tsx` | Follow-up combined view |
| EmbeddedFollowUpReason | `embedded/EmbeddedFollowUpReason.tsx` | Follow-up reason selector |
| EmbeddedPreviousVisit | `embedded/EmbeddedPreviousVisit.tsx` | Previous consultation card |
| EmbeddedPreviousDoctorsList | `embedded/EmbeddedPreviousDoctorsList.tsx` | Previously seen doctors |
| EmbeddedLocationSelector | `embedded/EmbeddedLocationSelector.tsx` | Home/center collection |
| EmbeddedPackageList | `embedded/EmbeddedPackageList.tsx` | Lab test packages |
| EmbeddedCollectionMethod | `embedded/EmbeddedCollectionMethod.tsx` | Sample collection method |

---

## Design System TypeScript Constants

Location: `resources/js/Lib/design-system.ts`

```typescript
// Spacing
spacing.cardPadding    // 'p-6'
spacing.cardPaddingSm  // 'p-4'
spacing.gapSm          // 'gap-2'
spacing.gapLg          // 'gap-4'
spacing.stackLg        // 'space-y-4'

// Typography
typography.h1          // 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl'
typography.label       // 'text-sm font-medium leading-none'
typography.pMuted      // 'text-sm text-muted-foreground'

// Card patterns
card.base              // 'rounded-lg border bg-card text-card-foreground shadow-sm'

// List item patterns
listItem.interactive   // 'flex items-center gap-4 p-4 hover:bg-accent cursor-pointer transition-colors'

// Badge patterns
badge.default          // 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold'
```

---

## Rules

### DO
- Use CSS variables: `text-foreground`, `bg-background`, `border-border`
- Use Tailwind scale: `p-4`, `p-6`, `gap-2`, `gap-4`
- Use semantic colors: `text-primary`, `bg-secondary`, `text-muted-foreground`
- Use standard radius: `rounded-lg`, `rounded-md`, `rounded-full`
- Use shadcn components: `<Card>`, `<Badge>`, `<Button>`

### DON'T
- No arbitrary values: `rounded-[12px]`, `p-[18px]`
- No raw colors: `text-gray-500`, `bg-blue-100`
- No custom shadows
- No font-bold for UI text (use font-medium or font-semibold)
- No skipping borders on cards
