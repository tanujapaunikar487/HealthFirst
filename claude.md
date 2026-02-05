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

**Layout**: Cards 20px radius/16px pad | Sheets 500px/24px radius/20px pad/right-side | Page 960px max/40px pad | Sections `space-y-12`

**Typography**: Fixed pixels (`text-[14px]` not `text-sm`) | Card title: #0A0B0D/14px/500 | Card sub: #737373/14px/400 | Section title (page): #171717/20px/600 | Section title (sheet): #737373/14px/500 | Sentence case everywhere (exceptions: acronyms, proper nouns)

**Colors**: Primary blue (#1E40AF bg, #BFDBFE icons) | Success/Warning/Error = Green/Amber/Red | Light text: #171717 primary, #737373 secondary | Dark text: #fff primary, white/70 secondary | Icons: light bg `text-neutral-900`, dark bg `text-white`, nav active `#2563EB`

**Components**: Badges = pastel bg + colored text | Skeleton 300ms min/10s timeout | EmptyState #F5F5F5/20px radius (always message+description) | CtaBanner dark gradient/white text | Borders always 1px (spinner/Switch 2px) | Icon bg always `rounded-full` | SideNav 14px/20px icons/6px gap/pill/#2563EB active/200px min

**Buttons**: Primary lg = 48px/16px font/8px gap/`icon` at 20px | Secondary icon = 40x40/8px pad/#E5E5E5 border/#F5F5F5 bg/16px icon | Default = 48px/14px/pill | CTA = white bg on dark

**Empty states**: CtaBanner for action pages (Appointments, Insurance, Family Members) | EmptyState for passive pages (Health Records, Billing) | Filtered empty = EmptyState no CTA

**Tables**: Date→Details→Member→Amount→Status→Actions | `useFormatPreferences()` for date/time | Details = Icon+Title+Subtitle | Status = pill badge | Row click + ChevronRight | Empty = `—` | Amount right-aligned `₹X,XXX`

---

## Technical Decisions

1. **User Model**: UUIDs, `App\User` (not Models)
2. **Sheets over Modals** platform-wide
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
13. **Notifications**: `NotificationService` → email/SMS/WhatsApp (Twilio). 15 types, 5 categories, sub-prefs for health_alerts. 5 scheduled commands in `routes/console.php`
14. **SheetBody CSS**: `.sheet-body > *` = 20px pad; `> * + *` = auto dividers. NO `SheetDivider` inside SheetBody
15. **Razorpay**: Checkout modal only, no saved methods. Settings = 4 tabs: Profile, Notifications, Preferences, Connections
16. **User Preferences**: Text size (CSS zoom), high contrast, date/time format, default family member — all end-to-end. Use `useFormatPreferences()` hook, never `formatTableDate()`/`formatTableTime()`
17. **Google Calendar**: OAuth + mock mode. Auto sync on book/reschedule/cancel. `calendar_sync` in user_settings. Privacy-safe events. 7 controller hooks in try/catch
18. **Calendar Preference**: `preferred` field (`'google'`|`'apple'`|`null`). Connect auto-sets; disconnect clears. Confirmation page adapts per preference
19. **Toast**: #171717 text, status-colored icons, `fit-content` width. No `richColors`
20. **High Contrast**: CSS vars in `app.css` (`:root` defaults, `.high-contrast` overrides). Tailwind `hsl(var(--*) / <alpha-value>)`. All 55 files use semantic classes (`text-foreground`, `bg-primary`, etc.). Shared avatar palette in `Lib/avatar-colors.ts`. Exceptions: Razorpay `theme.color` stays hex; print/download template HTML keeps hex (CSS vars unavailable)
