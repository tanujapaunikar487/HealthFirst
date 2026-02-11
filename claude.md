# Healthcare Platform
Laravel 11 + React 18 + TS + Inertia v2 + Tailwind v4 + shadcn/ui | `php artisan serve --port=3000` + `npm run dev`

## Design Tokens (ESLint enforced)
**Typography**: `text-page-title` `text-detail-title` `text-section-title` `text-card-title` `text-label` `text-body` `text-caption` (never `text-[Xpx]`)
**Colors**: `text-foreground` `text-muted-foreground` `text-placeholder` `text-inverse` | Status: `bg-success-subtle` `text-success-subtle-foreground` `border-success-border` (same for destructive/warning/info) | Never: `text-neutral-*` `text-gray-*` `text-[#hex]` `bg-[#hex]`
**Spacing**: `max-w-page` `max-w-content` `w-sidebar` `w-detail-label` `w-col-*` | **Stack**: `<VStack>`/`<HStack>` `gap={N}` (N×4=px), `<Spacer/>`=flex-1

## Components
See detailed specs in memory files:
- **UI Components**: Badge, Alert, Toast, BulkActionBar, Button, Chip, OptionList, DoctorCard, ActionableCardList, Avatar, IconCircle, DetailCard, Tables, Empty, Financial rows, Modals, ShareDialog
- **Booking**: AIBookingHeader, AIPromptInput, Selection patterns, File attachments, Progressive disclosure
- **Sheets**: Right-side overlays (420px). Components: SheetHeader, SheetBody, SheetFooter, SheetEdgeContent. 4 patterns: List, Form, Accordion, Card List
- **Layout**: Mobile (<768px) hamburger, Desktop (≥768px) fixed sidebar, Breadcrumbs, Responsive tables

Quick rules:
- Lists: Card+divide-y, Button px-6 py-4
- After edits: Compaction → re-read. Avatar upload → `router.reload({ only: ['auth'] })`
- DetailCard: Use standalone or with id/title/icon. Inside Section: `<div className="divide-y">` + conditional `<DetailRow>` to avoid double borders
- Empty data: Show "—" for missing optional fields

## Settings & Preferences
**Video Consultation**: `video_consultation` setting. Platforms: `google_meet` (default) | `zoom`. Icons: `/assets/icons/google-meet.svg` | `/assets/icons/zoom.svg`.
**Calendar Sync**: Google Calendar (OAuth) or Apple Calendar. Stored in `calendar_sync` setting.
**Settings Structure**: `User::getSetting()` / `User::setSetting()`. 4 tabs: Profile | Notifications | Preferences | Connections.

## Core Rules
- UUIDs everywhere
- Overlays: Sheets=forms (right 420px). Dialogs=security/search. AlertDialog=confirmations
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
