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
**Button**: 8 variants, 4 sizes (lg/md/sm/xs). Use `buttonVariants()` on Links. Default: primary lg. Adjacent icons match parent size (lg→lg).
**Avatar**: Only for doctors and family members. If image exists, show it; else fallback with initials using `getAvatarColorByName(name)` from `@/Lib/avatar-colors` (7-color palette: Cyan, Purple, Indigo, Pink, Emerald, Orange, Amber). For non-doctor entities (updates, notifications, lab tests), use colored icons in `bg-primary/10` circle with `text-primary`. Current user=`bg-muted text-muted-foreground`. Dashboard cards: doctors get avatars, lab tests get icons. Notifications: doctors get avatars, updates get icons. Family member groups: show up to 3 avatars with `-space-x-2`, then `+X` circle for remaining.
**Insurance Providers**: Display provider logo if available (`provider_logo` field), else fallback to avatar with initials. Logos: `h-10 w-10` (table) or `h-14 w-14` (detail), `object-contain`, no background. Logo assets in `/public/assets/images/{provider-slug}.png`.
**DetailRow/Section** (`Components/ui/`): Grid with `w-detail-label`, `px-6 py-4`. Edge-to-edge dividers: `noPadding` + `p-6` + `divide-y -mx-6`. No card-in-card—list items use `divide-y`, tables direct content.
**Tables**: `TableContainer` wrap + `TablePagination` + `w-col-*` tokens. Rows: `cursor-pointer hover:bg-muted/50 align-top`. Icons from `@/Lib/icons` not `lucide-react`.
**Empty**: CtaBanner (action pages) | EmptyState (passive) | Filtered=EmptyState no CTA
**Financial rows**: `flex justify-between` (NOT DetailRow). Pattern: `px-6 py-4`, label=`text-body text-muted-foreground`, value=`text-label`, total=`text-card-title`.
**Sheets**: Composable primitives for right-side overlays (500px). Components: `SheetHeader` (auto center-aligned), `SheetBody`, `SheetFooter`, `SheetEdgeContent` (full-width), `SheetSectionHeading`. Patterns: Simple forms (header+body+footer) | List views (header+edge content with divide-y) | Details (mixed padded/edge sections) | Multi-step (header with onBack). Always use design tokens: `space-y-5` for sections, `px-6 py-4` for list items, `text-label` for headings. See [sheet.tsx](resources/js/Components/ui/sheet.tsx) for full pattern documentation.

## Booking Flow
**Page Structure**: `VStack gap={12}` for sections | `VStack gap={4}` for section content | `VStack gap={1}` for title+subtitle pairs
**Typography**: Section headings=`text-section-title` | Labels=`text-label` | Body=`text-body` | Prices=`text-card-title`
**Icons**: `<Icon icon={IconName} size={20} />` not `<IconName className="h-5 w-5" />` | Sizes: 12/14 (sm), 16 (default), 20 (lg), 24 (xl) | Adjacent icons in `HStack gap={1}`

**Selection Patterns** (use Card-based lists for all selections):
- **Patient/Doctor lists**: `Card` + `divide-y` + `Button variant="ghost"` (`px-6 py-4` `rounded-none`) + Avatar with `getAvatarColorByName()` | Selected: `bg-primary/5` | Hover: `hover:bg-muted/50`
- **Option lists** (follow-up reasons, appointment modes, etc.): `Card` + `divide-y` + `Button variant="ghost"` (`px-6 py-4` `rounded-none`) + Icon in `bg-primary/10` circle (size 10, icon size 20) | Selected: `bg-primary/5` | Hover: `hover:bg-muted/50`
- **Chip selections** (symptoms, filters): `HStack gap={2}` with `flex-wrap` + `Button variant="outline"` (`px-4 py-2` `rounded-full`) | Selected: `bg-primary/10 border-primary text-label`
- **Time slots**: `HStack gap={2}` with `flex-wrap` + `Button variant="accent/outline"` (`px-4 py-2` `rounded-full`) | Selected: `variant="accent" border-foreground` | Preferred: Star icon (`absolute -top-1 -right-1`)

## AI Booking Chat
**UI Pattern**: AI-first experience with no mode toggle. Header shows active AI indicator (filled icon in `bg-background shadow-md` pill) + link to guided mode. Gradient background: `linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--background) / 0.5) 13.94%, hsl(var(--background)) 30.77%)` applied to scrollable content area. Progress bar shows completion based on conversation state.
**File Attachments**: Users can attach files (images, PDFs, Word docs) to messages in AI booking conversation. Click "+" button to select files. Files stored in `storage/app/public/conversation-attachments/`. Backend: `BookingConversationController` handles uploads, stores metadata in `conversation_messages.attachments` JSON column. Frontend: Files preview as chips before send, display as thumbnails (images) or file icons (documents) in chat. Max 10MB per file. Accepted types: jpg, jpeg, png, pdf, doc, docx.
**File Upload Pattern**: Use FormData with `attachments[]` array for multiple files. Inertia: set `forceFormData: true` for file uploads. Backend validation: `attachments.*` rule validates each file.

## Settings & Preferences
**Video Consultation**: User preferences stored in `video_consultation` setting. Platforms: `google_meet` (default) | `zoom`. When booking video appointments, generate links based on user's preferred platform. Icons: `/assets/icons/google-meet.svg` | `/assets/icons/zoom.svg`.
**Calendar Sync**: User can connect Google Calendar or set Apple Calendar as preferred. Stored in `calendar_sync` setting. Google Calendar requires OAuth flow.
**Settings Structure**: All user preferences stored via `User::getSetting()` and `User::setSetting()`. Settings page has 4 tabs: Profile | Notifications | Preferences | Connections. Connections tab shows Video Consultation (top) then Calendar sections.

## Core Rules
- UUIDs everywhere
- Overlays: Sheets=forms (right 500px). Dialogs=security/search. AlertDialog=confirmations.
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
