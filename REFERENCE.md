# Healthcare Platform - Detailed Reference

> This file contains verbose specifications. Only reference when working on specific features.
> Core rules are in [CLAUDE.md](CLAUDE.md) (always loaded).

---

## Complete Typography Tokens

All in `app.css` via `@utility`. Each sets size+weight+line-height.

- `text-display` — 72px/700
- `text-page-title` — 36px/700
- `text-detail-title` — 24px/700
- `text-banner-heading` — 24px/600
- `text-section-title` — 20px/600
- `text-step-title` — 20px/600
- `text-subheading` — 16px/600
- `text-card-title` — 14px/600
- `text-label` — 14px/500
- `text-body` — 14px/400
- `text-caption` — 12px/500
- `text-overline` — 11px/600/uppercase
- `text-micro` — 10px/600

**Rule**: Tokens set weight, so remove redundant `font-medium`/`font-semibold` when applying.

---

## Complete Layout Specifications

**Cards**: 20px radius, 16px padding, rows `px-6 py-4`

**Sheets**: 500px width, 20px radius, 20px padding, right-side
Body CSS: `.sheet-body > *` = 20px pad, `> * + *` = auto dividers
Header/footer: `16px 20px` pad, 1px border, close button, 20px/semibold title
NO `SheetDivider` inside SheetBody

**Dialogs**: max-w-lg, 20px radius, flex-col
Body CSS: `.dialog-body > *` = 20px pad, `> * + *` = auto dividers

**Page**: 960px max-width, 40px padding

**Sections**: `space-y-12` between sections

**Borders**: 1px (spinner/Switch = 2px)

**Icon backgrounds**: `h-10 w-10 rounded-full` + `h-5 w-5` icon, semantic CSS vars

**SideNav**: 14px text/20px icons, 6px gap, pill style, #2563EB active, 200px width

---

## Complete Color System

**Primary**: Blue #1E40AF bg / #BFDBFE icons

**Text tokens**:
- `text-foreground` — #171717 (primary text)
- `text-muted-foreground` — #737373 (secondary text)
- `text-placeholder` — #A1A1A1 (inputs)
- `text-inverse` — #FFF (on dark backgrounds)
- `text-inverse-muted` — white/70% (subtle on dark)

**Status colors** (4 statuses × 5 tokens each):
- Strong: `bg-success` + `text-success-foreground` (filled components)
- Pastel: `bg-success-subtle` + `text-success-subtle-foreground` + `border-success-border` (Badges/Alerts)
- Same pattern for: `destructive`, `warning`, `info`

**Icon colors**:
- Light backgrounds: `text-foreground`
- Dark backgrounds: `text-inverse`
- Nav active: #2563EB

All defined in `app.css` with `:root` / `.dark` / `.high-contrast` overrides. CSS vars stay bare HSL (`221 83% 53%`) for backward compat.

---

## Complete Component Specifications

### Badge (shadcn/cva)

Element: `<span>`
Variants: `success` `danger` `warning` `info` `neutral` (all pastel)
Sizes: `sm` (12px) / `lg` (14px)
Padding: `px-2 py-0.5`
Props: `variant`, `size`, `icon` (optional)
Exports: `Badge`, `badgeVariants()`, `BadgeVariant`

### Alert (shadcn/cva)

Variants: `info` `success` `warning` `error`
Modes: `standalone` (rounded-lg) / `sticky` (no radius)
Padding: `px-4 py-3`
Icons: Filled circles
Props: `title`, `hideIcon`, `onDismiss`, `action`, `children`
`action`: Renders right-aligned (e.g. Button)
Exports: `Alert`, `AlertTitle`, `AlertDescription`, `alertVariants()`

### Tabs (pill style)

- TabsList: transparent, `gap-1`
- TabsTrigger: `rounded-full px-4 py-2`
- Active: `shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]`
- Custom tab switchers match pill style

### Other Components

- **Skeleton**: 300ms min / 10s timeout
- **EmptyState**: #F5F5F5 bg, 20px radius, message+description
- **CtaBanner**: Dark gradient, white text
- **SupportFooter**: Global fixed footer

---

## Complete Table Specifications

### List Tables

**Container**: `TableContainer` wraps all (rounded-3xl border bg-card overflow-hidden)

**Column order**: Date → Details → Member → Amount → Status → Actions

**Column widths** (tokens):
- `w-col-checkbox` — 40px
- `w-col-date` — 144px
- `w-col-member` — 160px
- `w-col-amount` — 128px
- `w-col-status` — 140px
- `w-col-actions` — 48px
- Details: flex, no fixed width

**Cell patterns**:
- All: `align-top`
- Date: `text-label whitespace-nowrap` + `text-body text-muted-foreground` (time)
- Details: Icon (`h-10 w-10 rounded-full`) + Title (`text-label`) + Subtitle (`text-body text-muted-foreground`), gap-2.5
- Member: `text-label whitespace-nowrap`
- Amount: `text-label text-right` formatted `₹X,XXX`
- Status: pill Badge component
- Actions: `Button secondary iconOnly md` + ChevronRight icon
- Empty: `—`

**Rows**: `cursor-pointer hover:bg-muted/50`

**Pagination**: `TablePagination` component with props: `from`, `to`, `total`, `currentPage`, `totalPages`, `onPageChange`, `itemLabel`

**Dates**: Use `useFormatPreferences()` hook (never `formatTableDate()`/`formatTableTime()`)

### Inline Tables (detail pages)

Raw `<table className="w-full text-body">`
Header: `bg-muted/50`
th: `px-4 py-3 text-label text-muted-foreground`
Rows: `border-t`
td: `px-4 py-3`

No wrapper — goes directly as section content (Card `overflow-hidden` clips corners)

---

## Detail Page Patterns

### Alert Positioning (CRITICAL)

**All alerts MUST appear below title/breadcrumb, before main content**

Structure: `Breadcrumb → Header → Alerts (mb-12 space-y-4) → Main Content`

```tsx
{/* Alerts */}
<div className="mb-12 space-y-4">
  {condition && <Alert variant="info">...</Alert>}
  {otherCondition && <Alert variant="warning">...</Alert>}
</div>
```

Status alerts (vaccination complete, side effects, symptoms worsen, dispute, expiry) promoted from sections to top-level.
Never embed status alerts inside DetailSection content.

### Edge-to-Edge Dividers (mixed content)

```tsx
<DetailSection noPadding>
  <div className="p-6">
    <div className="divide-y -mx-6">
      <DetailRow>...</DetailRow>
    </div>
  </div>
</DetailSection>
```

Negative margin breaks out of parent padding for full-width dividers.

### Pure Row Sections

```tsx
<DetailSection noPadding>
  <div className="divide-y">
    <DetailRow>...</DetailRow>
  </div>
</DetailSection>
```

### Avatar Pattern

- **Detail headers**: 48px Avatar (image or initial fallback `bg-warning text-warning-foreground`)
- **Lab tests**: 48px icon circle (`bg-info-subtle` / `text-info-subtle-foreground` + TestTube2)
- **Table Details column**: 40px Avatar for doctors, 40px icon circle for lab tests
- **Never in DetailRow children** — plain text only for names

---

## Feature-Specific Decisions

### Notifications (item 13)

`NotificationService` → email/SMS/WhatsApp(Twilio) + in-app bell via `billing_notifications`
16 types, 5 categories, sub-prefs for health_alerts (lab_results/medication_reminders)
`toBillingNotification()` bridges to bell UI (type/key remap)
5 scheduled commands in `routes/console.php`
Rx reminders show per-drug days remaining + Dashboard "Up Next" cards

### Preferences (item 16)

Text size (CSS zoom), high contrast, date/time format, default family member — all e2e
Use `useFormatPreferences()` hook
Notifications + Preferences auto-save with 1s debounce
Language hidden (backend `'en'`)

### High Contrast (item 20)

CSS vars in `app.css` (`:root` defaults, `.high-contrast` overrides)
Tailwind v4 `@theme inline` maps `--color-*: hsl(var(--*))`
55 files use semantic classes
Avatar palette in `Lib/avatar-colors.ts`
Exceptions: Razorpay/PDF/print keep hex (can't parse CSS vars)

### Google Calendar (items 17-18)

OAuth + mock. Auto sync on book/reschedule/cancel
`calendar_sync` in user_settings. Privacy-safe
7 controller hooks in try/catch
Calendar `preferred` field (`'google'|'apple'|null`)
Connect auto-sets; disconnect clears. Confirmation adapts per preference

### Dashboard Onboarding (item 22)

3-step checklist opens Sheets (health/insurance/family)
`AddInsuranceSheet` in `Components/Insurance/`
`_from_dashboard` flag → `back()`
`EmbeddedFamilyMemberFlow` with `mode="standalone"`

### Booking Entry (item 23)

AI: prompt pills (left, stacked, click populates, manual send)
Guided: two option cards
`PromptSuggestion` from `Components/ui/prompt-suggestion.tsx`

### Smart Patient (item 24)

`mergeEntities()` DB lookup by relation
Found → auto-select + skip
Not found → selector with "I don't see…" message
All relations including `self`

### Lab Tests (item 26)

`noPadding` + `divide-y` rows
Completed → Normal/Abnormal badge + chevron → `/health-records/{id}` via `health_record_id`
Pending → muted name + "Pending" warning badge
"Book pending tests" header action (not per-row)
Backend: `HealthRecord` by `appointment_id` + `category='lab_report'`
Empty inside Section: centered text, not `EmptyState`

### Appointment Overview (item 28)

Merged Date+Time into single "Date & time" row. No Status row
Clinical Summary uses `noPadding` + DetailRow for diagnosis (inline ICD+severity badges) and allergies (danger badges)
"If Symptoms Worsen" alert moved to top-level alert section (shows when clinical_summary exists)

### Appointment Filters (item 30)

Type filter (All types/Doctor visit/Lab test) + Doctor filter + Member filter
Type filter uses `a.type` field
Completed lab tests in past tab show FileText icon linking to `/health-records/{id}` instead of ChevronRight
`health_record_id` from `formatAppointment()` backend

### Health Record Detail (item 31)

Dynamic sidenav: Summary + category-specific sections + Patient + Provider
`CategorySection` interface: `{id, title, icon, content, action?}`
Each category function (`getConsultationSections()`, `getLabReportSections()`, etc.) returns `CategorySection[]`
`getCategorySections()` router dispatches by `record.category`
No `SectionTitle` inside cards — each logical group is its own top-level `DetailSection`
Summary section: record info rows at top (`divide-y`), then description + AI summary (`p-6 space-y-6`)
`VitalsRows` renders vitals as DetailRow rows in `divide-y`
Pure-row content: `<div className="divide-y">`
Padded content (tables, alerts): `<div className="p-6">`
Invoice line items use financial row pattern (`flex justify-between`)
Inline tables (lab/PFT/vaccination): directly as section content
Drug names as section titles with Active/Inactive badge as `action` prop

### Other Decisions

2. **Overlays**: Sheets=forms/wizards. Dialogs=security/account/search(Cmd+K)/share. AlertDialog=confirmations (no fields). Legacy Breeze profile removed
3. Flexible JSON `metadata` for category-specific data
6. 2-week booking window enforced
7. Doctor IDs: frontend 'd' prefix, backend strips
8. Phone: +91XXXXXXXXXX
10. Detail page primary button varies by status
11. Breadcrumbs: path-aware via `?from=` params
12. Auth: Breeze, session guard, CSRF, rate limit (5 attempts)
14. NO `SheetDivider` inside SheetBody
15. Razorpay: checkout modal only, no saved methods. Settings=4 tabs: Profile/Notifications/Preferences/Connections
19. Toast: #171717 text, status-colored icons, `fit-content` width. No `richColors`
21. **Download Data**: PDF via `barryvdh/laravel-dompdf`. Blade: `resources/views/pdf/data-export.blade.php`. Standalone HTML/CSS. `window.location.href` (no page nav)
25. **Alerts**: ESLint `no-ad-hoc-alert` catches inline `backgroundColor` with status tokens on `div`/`section`. Exceptions: EmergencyAlert, EmergencyWarning
27. **Financial rows**: Same pattern on Billing/Show.tsx and ClaimDetail financial section
29. **Doctor Avatars**: `doctor_avatar_url` field on `Appointment` interface + `formatAppointment()` backend

---

## Tailwind v4 Migration Notes

Config is in `app.css @theme inline`, not `tailwind.config.js` (deleted)
Build via `@tailwindcss/vite` plugin, no PostCSS
Typography tokens use `@utility` not `@layer utilities`
Plugins loaded via `@plugin`
Dark mode via `@variant dark (&:is(.dark *))`
CSS vars stay bare HSL (`221 83% 53%`) for backward compat with `hsl(var(--*))` inline styles
Kill stale Vite processes after migration: `pkill -f "vite"`

**Critical**: Base styles (`*`, `body`) MUST be in `@layer base {}` — unlayered CSS beats ALL `@layer utilities` classes.
