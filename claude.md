# Healthcare Platform

Laravel 11.x + React 18 + TypeScript + Inertia.js v2.0 + Tailwind CSS + shadcn/ui + Vite 7.3.1. AI via Ollama qwen2.5:7b (pluggable). Razorpay payments (mock mode).

## Architecture

```
app/Models, Http/Controllers, Services/{AI,Booking,Calendar}
resources/js/{Pages, Components/ui, Features/booking-chat, Layouts}
```

## Run

`php artisan migrate:fresh --seed && php artisan serve --port=3000` | `npm run dev` | `ollama serve` (optional)
Tests: `php artisan test` (92 tests, 265 assertions)

---

## Design System

**Layout**: Cards 20px radius/16px pad | Card rows `px-6 py-4` (24px H, 16px V) | Sheets 500px/20px radius/20px pad/right-side | Dialogs max-w-lg/20px radius/flex-col | Page 960px max/40px pad | Sections `space-y-12`

**Typography**: Fixed pixels (`text-[14px]` not `text-sm`) | Card title: #0A0B0D/14px/500 | Card sub: #737373/14px/400 | Section title (page): #171717/20px/600 | Section title (sheet): #737373/14px/500 | Sentence case everywhere (exceptions: acronyms, proper nouns)

**Colors**: Primary blue (#1E40AF bg, #BFDBFE icons) | Success/Warning/Error = Green/Amber/Red | Warning = amber (#FDE68A border, #FFFBEB bg, #D97706 text) | Light text: #171717 primary, #737373 secondary | Dark text: #fff primary, white/70 secondary | Icons: light bg `text-neutral-900`, dark bg `text-white`, nav active `#2563EB`

**Components**: Badges = pastel bg + colored text, `font-medium`, 2 sizes (`sm`=12px default, `lg`=14px), padding `py-1 px-2` (no icon) / `py-1 pl-1 pr-2` (with icon). Use `size="lg"` prop not `className="text-[14px]"` | Tabs = pill style: TabsList transparent container (no bg, `gap-1`), TabsTrigger `rounded-full px-4 py-2` with subtle box-shadow on active (`shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]`). Custom tab switchers (e.g. EmbeddedPackageList) must match same pill style | SupportFooter in AppLayout (global, fixed position) | Skeleton 300ms min/10s timeout | EmptyState #F5F5F5/20px radius (always message+description) | CtaBanner dark gradient/white text | Borders always 1px (spinner/Switch 2px) | Icon bg always `h-10 w-10 rounded-full` (40x40) + `h-5 w-5` icons, semantic CSS vars only | SideNav 14px/20px icons/6px gap/pill/#2563EB active/200px min

**Buttons**: 8 variants (`primary`/`secondary`/`accent`/`destructive`/`outline`/`ghost`/`link`/`white`) | 4 sizes: `lg`=48px, `md`=40px, `sm`=32px, `xs`=24px | `iconOnly` prop for square buttons | `white` = white bg on dark (CTA banners) | `buttonVariants()` for Link styling | Default = 48px/14px/pill | **Hierarchy** (excl. booking flow): Main action per screen = `primary lg`, secondary actions = `secondary md` (text or iconOnly), destructive = `destructive`, sheet/dialog footer = all buttons `lg` (secondary matches primary size), links-as-buttons = `ghost`

**Empty states**: CtaBanner for action pages (Appointments, Insurance, Family Members) | EmptyState for passive pages (Health Records, Billing) | Filtered empty = EmptyState no CTA

**Tables**: Date→Details→Member→Amount→Status→Actions | `useFormatPreferences()` for date/time | Details = Icon+Title+Subtitle | Status = pill badge | Row click + ChevronRight | Empty = `—` | Amount right-aligned `₹X,XXX`

---

## Technical Decisions

1. **User Model**: UUIDs, `App\User` (not Models)
2. **Overlay patterns**: Sheets for forms/wizards/content (right-side 500px). Dialogs for security/account actions (delete account, password change), search (Cmd+K), and share. AlertDialog for simple "are you sure?" with no fields. Legacy Breeze profile pages removed
3. **Flexible JSON** `metadata` fields for category-specific data
4. **Server-Side Status**: Controllers compute all badges
5. **AI Optional**: System works without AI
6. **2-Week Window** enforced across booking
7. **Doctor IDs**: Frontend 'd' prefix, backend strips
8. **Phone**: +91XXXXXXXXXX
9. **Row click** opens details; 3-dot menu for actions only
10. **Status-Based Actions**: Detail page primary button varies by status
11. **Breadcrumbs**: Navigation-path-aware via `?from=` params
12. **Auth**: Laravel Breeze, session guard, CSRF, rate limit (5 attempts)
13. **Notifications**: `NotificationService` → email/SMS/WhatsApp (Twilio) + in-app bell via `billing_notifications` table. 16 types, 5 categories, sub-prefs for health_alerts (lab_results, medication_reminders). `toBillingNotification()` on each notification class bridges to bell UI (type/key remapping for frontend contract). 5 scheduled commands in `routes/console.php`. Prescription reminders show per-drug days remaining + surface on Dashboard as "Up Next" cards
14. **Sheet/Dialog Body CSS**: `.sheet-body`/`.dialog-body` `> *` = 20px pad; `> * + *` = auto dividers. NO `SheetDivider` inside SheetBody. Dialog header/footer match Sheet: `16px 20px` pad, 1px border, integrated close button, 20px/semibold title
15. **Razorpay**: Checkout modal only, no saved methods. Settings = 4 tabs: Profile, Notifications, Preferences, Connections
16. **User Preferences**: Text size (CSS zoom), high contrast, date/time format, default family member — all end-to-end. Use `useFormatPreferences()` hook, never `formatTableDate()`/`formatTableTime()`. Notifications + Preferences tabs **auto-save** with 1s debounce (no save button). Language preference hidden from UI (backend keeps `'en'` default)
17. **Google Calendar**: OAuth + mock mode. Auto sync on book/reschedule/cancel. `calendar_sync` in user_settings. Privacy-safe events. 7 controller hooks in try/catch
18. **Calendar Preference**: `preferred` field (`'google'`|`'apple'`|`null`). Connect auto-sets; disconnect clears. Confirmation page adapts per preference
19. **Toast**: #171717 text, status-colored icons, `fit-content` width. No `richColors`
20. **High Contrast**: CSS vars in `app.css` (`:root` defaults, `.high-contrast` overrides). Tailwind `hsl(var(--*) / <alpha-value>)`. All 55 files use semantic classes (`text-foreground`, `bg-primary`, etc.). Shared avatar palette in `Lib/avatar-colors.ts`. Exceptions: Razorpay `theme.color` stays hex; PDF Blade template + print HTML keep hex (CSS vars unavailable in DomPDF/standalone HTML)
21. **Download My Data**: Direct PDF download via `barryvdh/laravel-dompdf`. Blade view at `resources/views/pdf/data-export.blade.php`. Uses standalone HTML/CSS (no Tailwind/CSS vars). `window.location.href` triggers download without page navigation
22. **Dashboard Onboarding**: 3-step profile checklist opens Sheets inline (health profile, insurance, family member). `AddInsuranceSheet` extracted to `Components/Insurance/` for reuse. `_from_dashboard` flag on POST redirects `back()` instead of to insurance index. `EmbeddedFamilyMemberFlow` in `mode="standalone"` for family step
23. **Booking Entry**: AI mode shows prompt suggestion pills (left-aligned, stacked). Click populates input; user must manually send. Guided mode shows two option cards (doctor/test) with icons and descriptions. `PromptSuggestion` component from `Components/ui/prompt-suggestion.tsx`
24. **Smart Patient Resolution**: `mergeEntities()` does DB lookup by relation. If family member found → auto-select + skip patient_selection. If not found → show patient selector with contextual "I don't see a family member listed as X" message. Works for all relations including `self` (no hardcoded IDs)
25. **Alert Migration**: All ad-hoc alert divs (`bg-primary/10 border-primary/20`, `bg-destructive/10`, etc.) replaced with `<Alert>` component across auth, health records, insurance, booking, settings, and clinical summary. No custom alert divs remain outside exceptions (EmergencyAlert, EmergencyWarning, ClaimDetail status banner)
26. **Lab Tests (Appointment Detail)**: Info-card rows (not table) with 40x40 icons, Normal/Abnormal/Pending badges. Completed tests link to `/health-records/{id}` via `health_record_id`. Backend queries `HealthRecord` by `appointment_id` + `category='lab_report'` for linking. Empty states inside Section cards use simple centered text, not `EmptyState` component

---

## Hard Rules (enforced by ESLint: `npm run lint`)

**No raw values in app UI** — everything must use design tokens:
- No arbitrary Tailwind: `p-[13px]`, `w-[200px]`, `bg-[#hex]` → use spacing scale or theme tokens. **Exception**: `text-[Xpx]` allowed (typography tokens handled separately)
- No inline `style={{}}` for layout: `display`, `flexDirection`, `gap`, `padding`, `margin`, `width`, `height`, `borderRadius`, `gridTemplateColumns`, `alignItems`, `justifyContent`, `flexGrow` → use Tailwind classes or Stack components
- Inline `style` allowed for: colors using `hsl(var(--*))` with alpha, `animation`, typography (temporary), Razorpay/PDF (can't use CSS vars)
- No raw hex colors in Tailwind or inline styles — use semantic tokens (`text-foreground`, `bg-primary`, etc.)

**Stack components** (`Components/ui/stack.tsx`): Use `<VStack>` / `<HStack>` for flex layouts instead of inline styles
- `gap` prop uses Tailwind numeric scale: `gap={6}` → `gap-6` = 24px
- `align` prop: `'start'|'center'|'end'|'stretch'|'baseline'`
- `justify` prop: `'start'|'center'|'end'|'between'`
- `<Spacer />` for flex-1 spacers

**Custom theme tokens** (in `tailwind.config.js`):
- `max-w-page` (960px) | `max-w-content` (800px) | `min-w-sidebar` (200px) | `spacing.detail-label` (130px)

**Only use existing component variants** — don't create ad-hoc styling that duplicates Button/Badge/Alert/Card APIs
