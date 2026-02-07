# Healthcare Platform

Laravel 11.x + React 18 + TypeScript + Inertia.js v2.0 + Tailwind CSS v4 + shadcn/ui + Vite 7.3.1. AI: Ollama qwen2.5:7b (pluggable). Razorpay (mock mode).

## Architecture
`app/Models, Http/Controllers, Services/{AI,Booking,Calendar}` | `resources/js/{Pages, Components/ui, Features/booking-chat, Layouts}`

## Run
`php artisan migrate:fresh --seed && php artisan serve --port=3000` | `npm run dev` | `ollama serve` (optional). Tests: `php artisan test` (92/265)

---

## Design System

**Layout**: Cards 20px radius/16px pad, rows `px-6 py-4` | Sheets 500px/20px radius/20px pad/right-side | Dialogs max-w-lg/20px radius/flex-col | Page 960px max/40px pad | Sections `space-y-12`

**Typography**: Token classes in `app.css` via `@utility` — never raw `text-[Xpx]`. Each sets size+weight+line-height. Sentence case (except acronyms/proper nouns).
`text-display`(72/700) `text-page-title`(36/700) `text-detail-title`(24/700) `text-banner-heading`(24/600) `text-section-title`(20/600) `text-step-title`(20/600) `text-subheading`(16/600) `text-card-title`(14/600) `text-label`(14/500) `text-body`(14/400) `text-caption`(12/500) `text-overline`(11/600/uppercase) `text-micro`(10/600)

**Colors**: Semantic text tokens — `text-foreground`(#171717) `text-muted-foreground`(#737373) `text-placeholder`(#A1A1A1) `text-inverse`(#FFF, on dark bg) `text-inverse-muted`(white/70%, on dark bg). Never raw `text-neutral-*`/`text-gray-*`/`text-[#hex]` — use semantic tokens. Primary blue #1E40AF bg/#BFDBFE icons | Icons: `text-foreground` (light), `text-inverse` (dark bg), nav active=#2563EB | **Status colors** (4 statuses × 5 tokens each): `bg-success`/`text-success-foreground` (strong), `bg-success-subtle`/`text-success-subtle-foreground`/`border-success-border` (pastel). Same pattern for `destructive`, `warning`, `info`. Badges/Alerts use pastel variants. All defined in `app.css` with `:root`/`.dark`/`.high-contrast` overrides

**Components**: Badge (shadcn/cva): `<span>`, 5 variants `success`/`danger`/`warning`/`info`/`neutral` (all pastel), 2 sizes `sm`(12px)/`lg`(14px), pad `px-2 py-0.5`, optional `icon` prop. Exports `Badge`/`badgeVariants`/`BadgeVariant`. Use `variant` + `size` props, never ad-hoc spans | Alert (shadcn/cva): 4 variants `info`/`success`/`warning`/`error`, 2 modes `standalone`(rounded-lg)/`sticky`(no radius). Pad `px-4 py-3`, filled circle icons. Props: `title`/`hideIcon`/`onDismiss`/`action`/`children`. `action` renders right-aligned (e.g. Button). Exports `Alert`/`AlertTitle`/`AlertDescription`/`alertVariants` | Tabs=pill: TabsList transparent `gap-1`, TabsTrigger `rounded-full px-4 py-2`, active `shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]`. Custom tab switchers match pill style | SupportFooter global fixed | Skeleton 300ms min/10s timeout | EmptyState #F5F5F5/20px radius (message+description) | CtaBanner dark gradient/white text | Borders 1px (spinner/Switch 2px) | Icon bg `h-10 w-10 rounded-full`+`h-5 w-5`, semantic CSS vars | SideNav 14px/20px icons/6px gap/pill/#2563EB active/200px min

**Detail pages**: `DetailRow` (`Components/ui/detail-row.tsx`): grid `grid-cols-[theme(spacing.detail-label)_1fr]` with `px-6 py-4`, label=`text-body text-muted-foreground`, value=`text-label`. `DetailSection` (`Components/ui/detail-section.tsx`): icon+title header + Card wrapper (`overflow-hidden`), `noPadding` prop (default false). All 6 detail pages use these. Edge-to-edge dividers pattern: `noPadding` on Section, `p-6` on outer content wrapper, `divide-y -mx-6` on row groups. Pure row sections (Patient/Provider): `noPadding` + `divide-y` directly. **No card-in-card**: never `rounded-lg border` inside a Section card — list items use `divide-y` rows (`px-6 py-4`), tables go directly as content (Card clips corners)

**Buttons**: 8 variants: primary/secondary/accent/destructive/outline/ghost/link/white | 4 sizes: lg=48/md=40/sm=32/xs=24 | `iconOnly` for square | `white`=white bg on dark | `buttonVariants()` for Links | Default 48px/14px/pill | **Hierarchy** (excl booking): main=`primary lg`, secondary=`secondary md`(text/iconOnly), destructive=`destructive`, sheet/dialog footer=all `lg`, links-as-buttons=`ghost`

**Empty states**: CtaBanner for action pages (Appointments/Insurance/Family) | EmptyState for passive (Records/Billing) | Filtered=EmptyState no CTA

**Tables**: Date→Details→Member→Amount→Status→Actions | `useFormatPreferences()` for dates | Details=Icon+Title+Subtitle | Status=pill badge | Row click+ChevronRight | Empty=`—` | Amount right `₹X,XXX`

---

## Technical Decisions

1. UUIDs, `App\User` (not Models)
2. **Overlays**: Sheets=forms/wizards (right 500px). Dialogs=security/account/search(Cmd+K)/share. AlertDialog=confirmations (no fields). Legacy Breeze profile removed
3. Flexible JSON `metadata` for category-specific data
4. Server-side status: controllers compute all badges
5. AI optional — system works without it
6. 2-week booking window enforced
7. Doctor IDs: frontend 'd' prefix, backend strips
8. Phone: +91XXXXXXXXXX
9. Row click=details; 3-dot menu=actions only
10. Detail page primary button varies by status
11. Breadcrumbs: path-aware via `?from=` params
12. Auth: Breeze, session guard, CSRF, rate limit (5 attempts)
13. **Notifications**: `NotificationService`→email/SMS/WhatsApp(Twilio)+in-app bell via `billing_notifications`. 16 types, 5 categories, sub-prefs for health_alerts(lab_results/medication_reminders). `toBillingNotification()` bridges to bell UI (type/key remap). 5 scheduled commands in `routes/console.php`. Rx reminders show per-drug days remaining + Dashboard "Up Next" cards
14. **Sheet/Dialog Body CSS**: `.sheet-body`/`.dialog-body` `> *`=20px pad; `> * + *`=auto dividers. NO `SheetDivider` inside SheetBody. Header/footer: `16px 20px` pad, 1px border, close button, 20px/semibold title
15. Razorpay: checkout modal only, no saved methods. Settings=4 tabs: Profile/Notifications/Preferences/Connections
16. **Preferences**: Text size(CSS zoom), high contrast, date/time format, default family member — all e2e. Use `useFormatPreferences()`, never `formatTableDate()`/`formatTableTime()`. Notifications+Preferences auto-save 1s debounce. Language hidden (backend `'en'`)
17. **Google Calendar**: OAuth+mock. Auto sync on book/reschedule/cancel. `calendar_sync` in user_settings. Privacy-safe. 7 controller hooks in try/catch
18. Calendar `preferred` field (`'google'|'apple'|null`). Connect auto-sets; disconnect clears. Confirmation adapts per preference
19. Toast: #171717 text, status-colored icons, `fit-content` width. No `richColors`
20. **High Contrast**: CSS vars in `app.css` (`:root` defaults, `.high-contrast` overrides). Tailwind v4 `@theme inline` maps `--color-*: hsl(var(--*))`. 55 files use semantic classes. Avatar palette in `Lib/avatar-colors.ts`. Exceptions: Razorpay/PDF/print keep hex (no CSS vars)
21. **Download Data**: PDF via `barryvdh/laravel-dompdf`. Blade: `resources/views/pdf/data-export.blade.php`. Standalone HTML/CSS. `window.location.href` (no page nav)
22. **Dashboard Onboarding**: 3-step checklist opens Sheets (health/insurance/family). `AddInsuranceSheet` in `Components/Insurance/`. `_from_dashboard` flag→`back()`. `EmbeddedFamilyMemberFlow` `mode="standalone"`
23. **Booking Entry**: AI=prompt pills (left, stacked, click populates, manual send). Guided=two option cards. `PromptSuggestion` from `Components/ui/prompt-suggestion.tsx`
24. **Smart Patient**: `mergeEntities()` DB lookup by relation. Found→auto-select+skip. Not found→selector with "I don't see…" message. All relations incl `self`
25. **Alerts**: All ad-hoc alert divs→`<Alert>` component. ESLint `no-ad-hoc-alert` catches inline `backgroundColor` with status tokens on `div`/`section`. Exceptions: EmergencyAlert, EmergencyWarning
26. **Lab Tests**: `noPadding` + `divide-y` rows. Completed→Normal/Abnormal badge + chevron→`/health-records/{id}` via `health_record_id`. Pending→muted name + "Pending" warning badge. "Book pending tests" header action (not per-row). Backend: `HealthRecord` by `appointment_id`+`category='lab_report'`. Empty inside Section=centered text, not `EmptyState`
27. **Financial rows**: Billing fee breakdowns and payment details use `flex justify-between` (NOT DetailRow) — amounts/values right-aligned. `px-6 py-4`, label=`text-body text-muted-foreground`, value=`text-label text-foreground`. Total row uses `text-card-title`. Same pattern on Billing/Show.tsx and ClaimDetail financial section
28. **Appointment Overview**: Merged Date+Time into single "Date & time" row. No Status row. Clinical Summary uses `noPadding` + DetailRow for diagnosis (inline ICD+severity badges) and allergies (danger badges). "If Symptoms Worsen" Alert stays at bottom with `p-6 pt-4` wrapper
29. **Doctor Avatars**: Detail header shows 48px Avatar (image or initial fallback `bg-warning text-warning-foreground`). Lab tests show 48px icon circle (`bg-info-subtle`/`text-info-subtle-foreground` + TestTube2). Table Details column: 40px Avatar for doctors, 40px icon circle for lab tests. `doctor_avatar_url` field on `Appointment` interface + `formatAppointment()` backend
30. **Appointment Filters**: Type filter (All types/Doctor visit/Lab test) + Doctor filter + Member filter. Type filter uses `a.type` field. Completed lab tests in past tab show FileText icon linking to `/health-records/{id}` instead of ChevronRight. `health_record_id` from `formatAppointment()` backend via `HealthRecord::where('appointment_id',...)->where('category','lab_report')->value('id')`
31. **Health Record Detail**: Dynamic sidenav: Summary + category-specific sections + Patient + Provider. `CategorySection` interface `{id, title, icon, content, action?}` — each category function (`getConsultationSections()`, `getLabReportSections()`, etc.) returns `CategorySection[]`. `getCategorySections()` router dispatches by `record.category`. No `SectionTitle` inside cards — each logical group is its own top-level `DetailSection` (matches Appointments pattern). Summary section: record info rows at top (`divide-y`), then description + AI summary (`p-6 space-y-6`). `VitalsRows` renders vitals as DetailRow rows in `divide-y`. Pure-row content: `<div className="divide-y">`. Padded content (tables, alerts): `<div className="p-6">`. Invoice line items use financial row pattern (`flex justify-between`). Inline tables (lab/PFT/vaccination): `<table className="w-full text-body">` directly as section content (no inner border/wrapper — Card `overflow-hidden` clips corners). Drug names as section titles with Active/Inactive badge as `action` prop

---

## Hard Rules (ESLint: `npm run lint`)

**No raw values** — use design tokens:
- No arbitrary Tailwind (`p-[13px]`, `w-[200px]`, `bg-[#hex]`, `text-[14px]`) → spacing scale/theme/typography tokens
- No raw `text-[Xpx]` → typography token classes from `app.css`
- No inline `style={{}}` for layout (`display`/`flexDirection`/`gap`/`padding`/`margin`/`width`/`height`/`borderRadius`/`gridTemplateColumns`/`alignItems`/`justifyContent`/`flexGrow`) → Tailwind or Stack
- Inline `style` OK for: `hsl(var(--*))` colors with alpha, `animation`, Razorpay/PDF
- No raw hex → semantic tokens (`text-foreground`, `bg-primary`, etc.)
- No raw `text-neutral-*`/`text-gray-*`/`text-slate-*` → `text-foreground`/`text-muted-foreground`/`text-placeholder`/`text-inverse`/`text-inverse-muted`

**Stack** (`Components/ui/stack.tsx`): `<VStack>`/`<HStack>` for flex layouts. `gap={6}`→`gap-6`=24px. `align`: start/center/end/stretch/baseline. `justify`: start/center/end/between. `<Spacer/>`=flex-1

**Theme tokens** (`app.css @theme inline`): `max-w-page`(960px) `max-w-content`(800px) `min-w-sidebar`(200px) `spacing.detail-label`(130px)

**No ad-hoc alerts** — `div`/`section` with inline `backgroundColor` using status tokens (`--warning`/`--destructive`/`--info`/`--success`) → use `<Alert>` component. ESLint `no-ad-hoc-alert` enforces this

**Only use existing component variants** — no ad-hoc styling duplicating Button/Badge/Alert/Card APIs
