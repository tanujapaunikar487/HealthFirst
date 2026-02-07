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
**Avatar**: `getAvatarColor(idx)` from `@/Lib/avatar-colors` for identity (7 colors: Cyan, Purple, Indigo, Pink, Emerald, Orange, Amber). User=`bg-muted text-muted-foreground`. Doctor=`bg-warning text-warning-foreground`. Provider=`bg-icon-bg text-icon`.
**DetailRow/Section** (`Components/ui/`): Grid with `w-detail-label`, `px-6 py-4`. Edge-to-edge dividers: `noPadding` + `p-6` + `divide-y -mx-6`. No card-in-card—list items use `divide-y`, tables direct content.
**Tables**: `TableContainer` wrap + `TablePagination` + `w-col-*` tokens. Rows: `cursor-pointer hover:bg-muted/50 align-top`. Icons from `@/Lib/icons` not `lucide-react`.
**Empty**: CtaBanner (action pages) | EmptyState (passive) | Filtered=EmptyState no CTA
**Financial rows**: `flex justify-between` (NOT DetailRow). Pattern: `px-6 py-4`, label=`text-body text-muted-foreground`, value=`text-label`, total=`text-card-title`.

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
