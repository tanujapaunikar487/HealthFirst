# Healthcare Platform

Laravel 11.x + React 18 + TypeScript + Inertia.js v2.0 + Tailwind CSS v4 + shadcn/ui. AI: Ollama (optional). Razorpay mock.

**Architecture**: `app/{Models,Http/Controllers,Services}` | `resources/js/{Pages,Components/ui,Layouts}`
**Run**: `php artisan serve --port=3000` | `npm run dev`
**Docs**: See [REFERENCE.md](REFERENCE.md) for detailed specs

---

## Design System Essentials

**Typography**: Token classes only — never `text-[Xpx]`. See `app.css` for full list.
Common: `text-page-title` `text-detail-title` `text-section-title` `text-card-title` `text-label` `text-body` `text-caption`

**Colors**: Semantic tokens only:
- Text: `text-foreground` `text-muted-foreground` `text-placeholder` `text-inverse` `text-inverse-muted`
- Status: `bg-success-subtle` `text-success-subtle-foreground` `border-success-border` (same for `destructive`/`warning`/`info`)
- Never: `text-neutral-*` `text-gray-*` `text-[#hex]` `bg-[#hex]`

**Badge**: 5 variants (`success`/`danger`/`warning`/`info`/`neutral`), 2 sizes (`sm`/`lg`), optional `icon`. Always use component, never ad-hoc spans.

**Alert**: 4 variants (`info`/`success`/`warning`/`error`), 2 modes (`standalone`/`sticky`). Props: `title` `hideIcon` `onDismiss` `action` `children`. ESLint enforces no ad-hoc alert divs.

**Button**: 8 variants, 4 sizes (lg/md/sm/xs). Use `buttonVariants()` on Links. Default: `primary lg`. Hierarchy: main=`primary lg`, secondary=`secondary md`, destructive=`destructive`. **Adjacent sizing**: Icon buttons next to `lg` buttons must also be `lg` for visual alignment.

**Avatar**: Use `Avatar`/`AvatarImage`/`AvatarFallback` components. Fallback colors: `getAvatarColor(idx)` from `@/Lib/avatar-colors` for variety (uses `-subtle` tokens). User default: `bg-muted text-muted-foreground`. Doctor: `bg-warning text-warning-foreground`. Provider/org: `bg-icon-bg text-icon`.

**DetailRow** (`Components/ui/`): Grid with `w-detail-label`, label=`text-body text-muted-foreground`, value=`text-label`. Pattern: `px-6 py-4`.

**DetailSection** (`Components/ui/`): Icon+title header + Card wrapper (`overflow-hidden`). `noPadding` prop for edge-to-edge dividers. **No card-in-card** — list items use `divide-y` rows, tables go directly as content.

**Financial rows**: Amounts use `flex justify-between` (NOT DetailRow). Right-aligned values. Pattern: `px-6 py-4`, label=`text-body text-muted-foreground`, value=`text-label`, total=`text-card-title`.

**Tables**: `TableContainer` wraps list tables. `TablePagination` for footers. Columns use `w-col-*` tokens. Rows: `cursor-pointer hover:bg-muted/50 align-top`. Details: Icon(40px)+Title+Subtitle. Status: Badge. Actions: ChevronRight.

**Empty states**: CtaBanner for action pages | EmptyState for passive pages | Filtered=EmptyState no CTA

---

## Core Technical Rules

1. **UUIDs** everywhere
2. **Overlays**: Sheets=forms (right 500px). Dialogs=security/search. AlertDialog=confirmations.
3. **JSON metadata** for category-specific data
4. **Server-side status** — controllers compute badges
5. **Row click**=details; 3-dot menu=actions only
6. **Inertia.js**: Use `router.put()`/`router.post()` not `fetch()`
7. **Preferences**: Use `useFormatPreferences()` hook for dates/times
8. **Optional arrays**: Send `null` if empty, not `[]`

---

## Hard Rules (ESLint enforced)

**No raw values** — use tokens:
- No arbitrary Tailwind: `p-[13px]` `w-[200px]` `bg-[#hex]` `text-[14px]`
- No raw `text-[Xpx]` → typography token classes
- No inline `style={{}}` for layout props → Tailwind or Stack
- Inline `style` OK only for: `hsl(var(--*))` colors with alpha, `animation`, Razorpay/PDF
- No raw color classes: `text-neutral-*` `text-gray-*` `bg-green-50`

**Stack** (`Components/ui/stack.tsx`): `<VStack>`/`<HStack>` for flex. `gap={6}`=24px. Props: `align` `justify`. `<Spacer/>`=flex-1.

**Theme tokens**: `max-w-page` `max-w-content` `w-sidebar` `w-detail-label` `w-col-*`. See `app.css @theme inline`.

**No ad-hoc alerts** — always use `<Alert>` component with semantic variants.

**Only use existing component variants** — no duplicate styling.
