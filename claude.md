# Healthcare Platform

AI-powered healthcare platform for appointment booking (doctor and lab tests) with a conversational chat interface. Laravel 11.x + React 18 + TypeScript + Inertia.js v2.0 + Tailwind CSS + shadcn/ui + Vite 7.3.1. AI via Ollama qwen2.5:7b (pluggable). Payments via Razorpay (mock mode).

## Architecture

```
app/
  Models/              Eloquent models
  Http/Controllers/    Thin orchestration
  Services/
    AI/                AIService, providers
    Booking/           Orchestrator, StateMachine, DoctorService, LabService
    Calendar/          Google Calendar, ICS
    VideoMeeting/      Google Meet, Zoom

resources/js/
  Pages/               Inertia pages
  Components/ui/       shadcn components
  Features/booking-chat/  Conversational booking
  Layouts/             AppLayout, GuestLayout, GuidedBookingLayout
```

## How to Run

```bash
php artisan migrate:fresh --seed  # Fresh DB
php artisan serve --port=3000     # Laravel
npm run dev                       # Vite
ollama serve                      # AI (optional)
```

**Tests**: `php artisan test` (92 tests, 265 assertions)

**AI Config** (.env):
```
AI_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:7b
```

---

## Design System

| Element | Specification |
|---------|---------------|
| Cards | 20px border-radius, 16px padding |
| Primary | Blue (#1E40AF bg, #BFDBFE icons) |
| Success/Warning/Error | Green/Amber/Red |
| Sheets | 500px width, 24px radius, 20px header/body padding, 16px footer padding, 24px close icon, edge-to-edge dividers, right-side |
| Badges | Pastel backgrounds, colored text |
| Skeleton | 300ms min, 10s timeout |
| EmptyState | #F5F5F5 bg, 24px/48px padding, content-based height, 20px radius, optional image, always include message + description |
| CtaBanner | Dark radial gradient, white text, illustration, primary large button style |
| Page Container | 960px max-width, 40px top/bottom padding |
| Card Title | #0A0B0D, 14px, font-weight 500, line-height 20px, truncate |
| Card Subtext | #737373, 14px, font-weight 400, line-height 20px |
| Section Title (Page) | #171717, 20px, font-weight 600, line-height 28px (detail pages and Settings) |
| Section Title (Sheet) | #737373, 14px, font-weight 500 (inside SheetBody sections) |
| Icon Colors | Light bg: `#171717` (`text-neutral-900`), dark bg: `#fff` (`text-white`), nav active: `#2563EB` |
| SideNav | 14px font, 20px icons, 6px gap, pill buttons with #2563EB active state, 200px min-width |
| Section Spacing | `space-y-12` (3rem/48px) between major sections |
| Font Sizes | Use fixed pixels (`text-[14px]`) not rem (`text-sm`) to prevent accessibility scaling issues |
| Borders | Always 1px (except spinner/Switch components which use 2px) |
| Icon Backgrounds | Always `rounded-full` (never `rounded-lg`) |

### Button Specs

| Variant | Specification |
|---------|---------------|
| Primary Large (`size="lg"`) | 48px height, 16px font, 8px gap, flex display, `icon` prop renders at 20px |
| Secondary Icon (`size="icon"`) | 40x40, 8px padding, 1px #E5E5E5 border, #F5F5F5 bg, #171717 icon, full rounded, icon at 16px |
| Default | 48px height, 14px font, pill rounded |
| CTA | White bg on dark, inherits primary large sizing |

### Empty State Pattern

Use CtaBanner (dark gradient, prominent CTA) only for action-first pages where users need to create something. Use standard EmptyState for info-first pages where content appears passively. Each page has one CTA max.

| Page | Component | CTA |
|------|-----------|-----|
| **Appointments** | CtaBanner | "Book appointment" |
| **Insurance** | CtaBanner | "Add insurance" |
| **Family Members** | CtaBanner | "Add family member" |
| **Health Records** | EmptyState | None (records appear after visits/tests) |
| **Billing** | EmptyState | None (bills appear after payments) |

For filtered results that are empty, always use EmptyState with no CTA.

### Table Consistency

| Rule | Specification |
|------|---------------|
| Column Order | Date → Details → Member → Amount → Status → Actions |
| Date Format | User-preferred format via `useFormatPreferences()` hook → `formatDate()` |
| Time (Appointments) | Subtext line below date via `useFormatPreferences()` hook → `formatTime()` |
| Details Cell | Icon + Title + Subtitle (what + meta) |
| Status | Dedicated column; pill badge only |
| Actions | Row clickable + ChevronRight indicator |
| Empty Values | Show `—` (em dash) |
| Amount | Right-aligned; `₹X,XXX` format |

### Text Color Standards

| Background | Usage | Color | Tailwind |
|------------|-------|-------|----------|
| Light | Primary text | `#171717` | `text-neutral-900` |
| Light | Secondary text | `#737373` | `text-neutral-500` |
| Dark | Primary text | `#FFFFFF` | `text-white` |
| Dark | Secondary text | `rgba(255,255,255,0.7)` | `text-white/70` |

### Capitalization (Sentence Case)

All UI text uses **sentence case** (only first word capitalized):

| Element | Example |
|---------|---------|
| Page titles | "Health records", "Family members" |
| Buttons | "Book appointment", "Save changes" |
| Tab labels | "Upcoming", "Outstanding" |
| Table headers | "Family member", "Date" |
| Badge/status | "Paid", "Awaiting approval" |
| Placeholders | "All doctors", "Search appointments..." |

**Exceptions**: Acronyms (EMI, OTP), proper nouns, brand names

---

## Technical Decisions

1. **User Model**: UUIDs, at `App\User` (not Models)
2. **Sheets over Modals**: Platform-wide UX
3. **Flexible JSON**: `metadata` fields for category-specific data
4. **Server-Side Status**: Controllers compute all badges
5. **AI Optional**: System works without AI
6. **2-Week Window**: Enforced across booking
7. **Doctor IDs**: Frontend 'd' prefix, backend strips it
8. **Phone Format**: +91XXXXXXXXXX required
9. **Table Row Click**: Row click opens details (sheet or page); 3-dot menu for actions only
10. **Status-Based Actions**: Primary button on detail pages varies by status (e.g., rejected→File Appeal, approved→Download EOB, pending→Track Status)
11. **Context-Aware Breadcrumbs**: Breadcrumbs reflect actual navigation path, not just data hierarchy (use `?from=` query params)
12. **Session-Based Auth**: Laravel Breeze with session guard, CSRF protection, rate limiting (5 attempts)
13. **Notification System**: Preference-aware delivery via `NotificationService`. Supports email, SMS (Twilio), WhatsApp (Twilio). 15 notification types across 5 categories. Sub-preferences for health_alerts (medication_reminders, lab_results, doctor_messages). 5 scheduled commands in `routes/console.php`.
14. **SheetBody CSS**: `.sheet-body > *` adds 20px padding; `.sheet-body > * + *` adds auto dividers. Do NOT use `SheetDivider` inside `SheetBody`.
15. **Razorpay Payments**: Razorpay checkout modal handles all payment entry directly. No saved payment methods — Settings has 4 tabs: Profile, Notifications, Preferences, Connections.
16. **User Preferences**: Text size (CSS zoom), high contrast, date/time format, default family member are all integrated end-to-end. Use `useFormatPreferences()` hook for date/time formatting, never hardcoded `formatTableDate()`/`formatTableTime()`.
