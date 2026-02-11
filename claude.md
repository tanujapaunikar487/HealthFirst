# Healthcare Platform
Laravel 11 + React 18 + TS + Inertia v2 + Tailwind v4 + shadcn/ui | `php artisan serve --port=3000` + `npm run dev` | Docs: [REFERENCE.md](REFERENCE.md)

## Design Tokens (ESLint enforced)
**Typography**: `text-page-title` `text-detail-title` `text-section-title` `text-card-title` `text-label` `text-body` `text-caption` (never `text-[Xpx]`)
**Colors**: `text-foreground` `text-muted-foreground` `text-placeholder` `text-inverse` | Status: `bg-success-subtle` `text-success-subtle-foreground` `border-success-border` (same for destructive/warning/info) | Never: `text-neutral-*` `text-gray-*` `text-[#hex]` `bg-[#hex]`
**Spacing**: `max-w-page` `max-w-content` `w-sidebar` `w-detail-label` `w-col-*` | **Stack**: `<VStack>`/`<HStack>` `gap={N}` (N×4=px), `<Spacer/>`=flex-1

## Components
**Badge**: 5 variants (success/danger/warning/info/neutral), 2 sizes (sm/lg), optional icon. Always use component, never ad-hoc spans.
**Alert**: 4 variants (info/success/warning/error), 2 modes (standalone/sticky). Props: title, hideIcon, onDismiss, action, children. No ad-hoc alert divs.
**Toast**: Global notification system. 4 variants (success/error/warning/info). Dark bg with colored circle icons. Usage: `useToast()` hook → `showToast(message, variant)`. Auto-dismisses 3s.
**BulkActionBar**: Global component for table bulk actions. Light grey `bg-muted` background with dark `variant="accent"` buttons. Auto-pluralizes item labels, hides when count is 0. Pattern: `className="mb-4"` on bar, `className="mt-4"` on table wrapper for consistent 32px spacing.
**Button**: 8 variants, 4 sizes (lg/md/sm/xs). Use `buttonVariants()` on Links. Default: primary lg. Adjacent icons match parent size (lg→lg).
**Chip**: Unified chip component (`Components/ui/chip`). 2 variants: `default` (symptoms/filters: outline→primary/10 selected), `accent` (time slots: outline→accent selected). Props: variant, selected, icon. Pattern: `<Chip selected={bool}>Label</Chip>`. Wrap in `HStack gap={2}` with `flex-wrap`. Never use ad-hoc rounded buttons.
**OptionList**: Global selection list component (`Components/ui/option-list`) for AI booking and option selections. Props: options (array of {value, label, description?, icon?, indicator?, rightContent?}), selected, onSelect, disabled. Supports: icons (blue circle default), colored indicators (dots for urgency), pricing/badges (rightContent). Selected state: `rounded-3xl border-2 border-primary bg-primary/10`. Used in: follow-up reasons, appointment modes/types, urgency, collection methods. Generic type `<T>` for typed values. Always use OptionList for Card+divide-y selection patterns—never duplicate the structure.
**DoctorCard**: Global doctor card component (`Components/Booking/DoctorCard`) for AI booking flows. Props: id, name, avatar, specialization, experienceYears, education, languages, rating, reviewCount, consultationModes, videoFee, inPersonFee, price, slots, quickTimes, availableOnDate, selectedTime, onSelectTime, disabled. Displays: doctor avatar with colored fallback, info (specialty, experience, education, languages, rating), consultation mode badges (Video/In-person), pricing (single or dual), time slot chips with preferred markers. Layout: `px-6 py-4`, `hover:bg-muted/50`. Time slots: `ml-13` offset, `rounded-full`, `variant="accent"` when selected, `border-foreground`. Used in: EmbeddedDoctorList, EmbeddedPreviousDoctorsList. Always use DoctorCard—never duplicate doctor card structure.
**ActionableCardList**: Global dashboard card list component (`Components/ui/actionable-card-list`). Displays action items (overdue bills, appointments, health alerts, etc.) in Card+divide-y pattern with "View all" expansion. Components: `ActionableCardList` (wrapper with expansion logic) and `ActionableCardListItem` (individual items). Item displays: icon/avatar (colored circle for non-doctors, avatar for doctors), patient name + badge, title + subtitle, action button + three-dot menu. Props: type (determines icon/colors), title, subtitle, patientName, badge, badgeVariant, actionLabel, actionVariant, onAction, menuItems, isLast, iconOverride, doctorName, doctorAvatarUrl. Layout: `p-4`, `border-b` between items. View all threshold: 3 items default. Used in: Dashboard "Up next" and "Later this week" sections. Always use ActionableCardList—never duplicate dashboard card list structure.
**Avatar**: Only for doctors and family members. If image exists, show it; else fallback with initials using `getAvatarColorByName(name)` from `@/Lib/avatar-colors` (7-color palette: Cyan, Purple, Indigo, Pink, Emerald, Orange, Amber). For non-doctor entities (updates, notifications, lab tests), use `<IconCircle>` component instead. Current user=`bg-muted text-muted-foreground`. Dashboard cards: doctors get avatars, lab tests get IconCircle. Notifications: doctors get avatars, updates get IconCircle. Family member groups: show up to 3 avatars with `-space-x-2`, then `+X` circle for remaining.
**IconCircle**: Global icon-in-circle component (`Components/ui/icon-circle`) for non-person entities. 4 sizes: sm (h-10, default), md (h-12), lg (h-14), xl (h-16). 7 variants: primary (bg-primary/10 + text-primary), success, destructive, warning, info, muted, secondary. Props: icon (required), size, variant, className (override), style (HSL alpha), iconClassName. Usage: `<IconCircle icon={Receipt} variant="primary" />`. Used in: dashboard cards, tables, option lists, billing, health records. Always use IconCircle for icon circles—never ad-hoc divs with bg-blue-200 or rounded-full patterns.
**Insurance Providers**: Display provider logo if available (`provider_logo` field), else fallback to avatar with initials. Logos: `h-10 w-10` (table) or `h-14 w-14` (detail), `object-contain`, no background. Logo assets in `/public/assets/images/{provider-slug}.png`.
**DetailRow/Section** (`Components/ui/`): Grid with `w-detail-label`, `px-6 py-4`. Edge-to-edge dividers: `noPadding` + `p-6` + `divide-y -mx-6`. No card-in-card—list items use `divide-y`, tables direct content.
**DetailCard** (`Components/ui/detail-card`): Global wrapper for Card/DetailSection + divide-y + DetailRow pattern. Standardizes detail information display across all detail pages. Props: rows (array of {label, children}), id/title/icon (optional for DetailSection wrapper), action, className, iconClassName, cardClassName. Use for: booking confirmations, insurance claims, appointments, billing, health records, family members. Examples: `<DetailCard rows={[{label: 'Patient', children: 'John Doe'}, {label: 'Date', children: 'Mon, 10 Feb'}]} />` (simple Card) | `<DetailCard id="overview" title="Details" icon={Calendar} rows={[...]} />` (DetailSection wrapper). Always use DetailCard instead of duplicating Card/DetailSection + divide-y + DetailRow structure. For conditional rows: `...(condition ? [{label: '...', children: ...}] : [])`.
**Tables**: `TableContainer` wrap + `TablePagination` + `w-col-*` tokens. Rows: `cursor-pointer hover:bg-muted/50 align-top`. Icons from `@/Lib/icons` not `lucide-react`. Cell helpers: `useDateCellContent()` (date+time), `useDateOnly()` (date), `formatCurrency(amount)`, `renderCurrencyCell(current, original?)` from `@/Lib/table-helpers`.
**Empty**: CtaBanner (action pages) | EmptyState (passive) | Filtered=EmptyState no CTA
**Financial rows**: `flex justify-between` (NOT DetailRow). Pattern: `px-6 py-4`, label=`text-body text-muted-foreground`, value=`text-label`, total=`text-card-title`.
**Sheets**: Composable primitives for right-side overlays (420px). Components: `SheetHeader` (auto center-aligned), `SheetBody`, `SheetFooter`, `SheetEdgeContent` (full-width), `SheetSectionHeading`. Patterns: Simple forms (header+body+footer) | List views (header+edge content with divide-y) | Details (mixed padded/edge sections) | Multi-step (header with onBack). Always use design tokens: `space-y-5` for sections, `px-6 py-4` for list items, `text-label` for headings. See [sheet.tsx](resources/js/Components/ui/sheet.tsx) for full pattern documentation.

## Booking Flow
**Page Structure**: `VStack gap={12}` for sections | `VStack gap={4}` for section content | `VStack gap={1}` for title+subtitle pairs
**Typography**: Section headings=`text-section-title` | Labels=`text-label` | Body=`text-body` | Prices=`text-card-title`
**Icons**: `<Icon icon={IconName} size={20} />` not `<IconName className="h-5 w-5" />` | Sizes: 12/14 (sm), 16 (default), 20 (lg), 24 (xl) | Adjacent icons in `HStack gap={1}`

**Selection Patterns** (use Card-based lists for all selections):
- **Doctor lists**: Use `<DoctorCard>` component for AI booking. Pass doctor data props + time slots. Component handles avatar, info, badges, pricing, time selection automatically.
- **Patient lists**: `Card` + `divide-y` + `Button variant="ghost"` (`px-6 py-4` `rounded-none`) + Avatar with `getAvatarColorByName()` | Selected: `bg-primary/5` | Hover: `hover:bg-muted/50`
- **Option lists** (follow-up reasons, appointment modes, urgency, collection methods): Use `<OptionList>` component. Never duplicate Card+divide-y+Button structure. Pass options array with icon/indicator and optional rightContent for pricing.
- **Chip selections** (symptoms, filters): `HStack gap={2}` with `flex-wrap` + `<Chip selected={bool}>Label</Chip>` | Use `Chip` component, never ad-hoc buttons
- **Time slots**: `HStack gap={2}` with `flex-wrap` + `<Chip variant="accent" selected={bool}>Time</Chip>` | Preferred slots: add `icon={<Star />}` prop

## AI Booking Chat
**AIPromptInput** (`Components/ui/ai-prompt-input`): Global chatbot component. Props: value, onValueChange, onSubmit, placeholder, enableFileAttachments, enableVoiceRecording. Features: Gradient border (intensifies on focus), 80px min-height (`min-h-20`), file attachments with chips, voice recording with waveform. Used in: booking entry, conversation, appointment creation. No other chatbot components allowed.
**AIBookingHeader** (`Components/Booking/AIBookingHeader`): Global header for AI booking flows. Props: progress (0-100), showModeToggle (entry page), activeMode/onModeChange (mode switching), cancelUrl. Features: Dynamic progress bar, AI/Guided mode toggle (entry page only), active AI indicator (conversation). Used in all AI booking pages.
**UI Pattern**: AI-first experience with no mode toggle. Header shows active AI indicator (filled icon in `bg-background shadow-md` pill) + link to guided mode. Gradient background: `linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--background) / 0.5) 13.94%, hsl(var(--background)) 30.77%)` applied to scrollable content area. Progress bar shows completion based on conversation state.
**File Attachments**: Users can attach files (images, PDFs, Word docs) to messages in AI booking conversation. Click "+" button to select files. Files stored in `storage/app/public/conversation-attachments/`. Backend: `BookingConversationController` handles uploads, stores metadata in `conversation_messages.attachments` JSON column. Frontend: Files preview as chips before send, display as thumbnails (images) or file icons (documents) in chat. Max 10MB per file. Accepted types: jpg, jpeg, png, pdf, doc, docx.
**File Upload Pattern**: Use FormData with `attachments[]` array for multiple files. Inertia: set `forceFormData: true` for file uploads. Backend validation: `attachments.*` rule validates each file.

## Settings & Preferences
**Video Consultation**: User preferences stored in `video_consultation` setting. Platforms: `google_meet` (default) | `zoom`. When booking video appointments, generate links based on user's preferred platform. Icons: `/assets/icons/google-meet.svg` | `/assets/icons/zoom.svg`.
**Calendar Sync**: User can connect Google Calendar or set Apple Calendar as preferred. Stored in `calendar_sync` setting. Google Calendar requires OAuth flow.
**Settings Structure**: All user preferences stored via `User::getSetting()` and `User::setSetting()`. Settings page has 4 tabs: Profile | Notifications | Preferences | Connections. Connections tab shows Video Consultation (top) then Calendar sections.

## Core Rules
- UUIDs everywhere
- Overlays: Sheets=forms (right 420px). Dialogs=security/search. AlertDialog=confirmations.
- JSON metadata for category-specific data
- Server-side status (controllers compute badges)
- Row click=details; 3-dot=actions only
- Inertia: `router.put()`/`router.post()` not `fetch()`
- Preferences: `useFormatPreferences()` for dates/times
- Optional arrays: `null` not `[]`

## Hard Rules
- No arbitrary Tailwind: `p-[13px]` `w-[200px]` `bg-[#hex]` `text-[14px]`
- No inline `style={{}}` for layout → Tailwind or Stack
- Inline `style` OK only for: `hsl(var(--*))` with alpha, animation, Razorpay/PDF
- Only use existing component variants—no duplicate styling
