# Healthcare Platform - Project Documentation

## Overview

AI-powered healthcare platform for appointment booking (doctor and lab tests) with a conversational chat interface. Built with Laravel 11.x + React 18 + TypeScript + Inertia.js v2.0 + Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 11.x, PHP 8.5 |
| Frontend | React 18, TypeScript, Tailwind CSS |
| Routing | Inertia.js v2.0 |
| UI | shadcn/ui + Radix UI, CVA |
| Build | Vite 7.3.1 |
| AI | Ollama qwen2.5:7b (pluggable) |
| Payment | Razorpay (mock mode) |

---

## Architecture

```
app/
  Models/              28 Eloquent models
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

**AI Pipeline**: `User message → BookingPromptBuilder → AIService → EntityNormalizer → BookingStateMachine`

**Booking Flows**:
1. **Guided**: Multi-step wizard (Patient → Doctor/Time → Confirm)
2. **AI Chat**: Natural language with state machine, embedded UI components

---

## Core Features

| Feature | Key Capabilities |
|---------|------------------|
| **Dashboard** | Profile completion, aggregated tasks, promotions, skeleton loading |
| **Booking** | AI chat + guided wizard, 15+ intents, 2-week window, calendar sync |
| **Appointments** | 3 tabs, 10-section detail, video calls, reschedule/cancel/book again |
| **Billing** | 10 statuses, Razorpay, EMI, disputes, PDF downloads |
| **Health Records** | 21 categories, server-side status, deep-linking, AI summaries |
| **Insurance** | Policies, claims (14 statuses), pre-auth flow |
| **Family Members** | 18 fields, OTP verification, alert deep-links |
| **Settings** | 4 tabs (Profile, Notifications, Preferences, Connections) |
| **Authentication** | Sign in/up, logout, forgot/reset password, route protection, rate limiting |
| **Global** | Cmd+K search, notifications (27 types, 5 categories), skeleton loading, error pages |

---

## Database (29 Tables)

**Core**: users, family_members, appointments, booking_conversations, conversation_messages, user_settings

**Hospital**: departments, doctors, doctor_consultation_modes, doctor_availabilities, time_slots, symptoms

**Lab**: lab_test_types, lab_packages, lab_centers, user_addresses

**Insurance**: insurance_providers, insurance_policies, insurance_claims

**Health**: health_records, billing_notifications, promotions

---

## Key Files

### Controllers
- `Auth/*Controller` - Login, register, password reset (Laravel Breeze)
- `DashboardController` - Aggregated data
- `BookingConversationController` - AI chat
- `GuidedDoctorController` / `GuidedLabController` - Wizard flows
- `AppointmentsController` - List, detail, actions
- `BillingController` - Razorpay integration
- `HealthRecordController` - Status computation
- `InsuranceController` - Policies, claims
- `FamilyMembersController` - CRUD, OTP verification
- `SettingsController` - All settings endpoints

### Services
- `IntelligentBookingOrchestrator` - Main AI orchestrator
- `BookingStateMachine` - State management
- `OtpService` - Phone/email verification
- `CalendarService` - Event generation
- `VideoMeetingService` - Google Meet/Zoom

### Frontend Pages
- `Auth/Login.tsx`, `Auth/Register.tsx`, `Auth/ForgotPassword.tsx`, `Auth/ResetPassword.tsx`
- `Dashboard.tsx`, `Booking/Conversation.tsx`, `Booking/Index.tsx`
- `Appointments/Index.tsx`, `Appointments/Show.tsx`
- `Billing/Index.tsx`, `Billing/Show.tsx`
- `HealthRecords/Index.tsx`, `Insurance/*.tsx`
- `FamilyMembers/Index.tsx`, `FamilyMembers/Show.tsx`
- `Settings/Index.tsx`

### Key Components
- `EmbeddedFamilyMemberFlow.tsx` - 3-mode add member wizard (embedded/standalone/guided)
- `AppointmentSheets.tsx` - Detail, cancel, reschedule, follow-up, book-again, check-in sheets
- `ShareSheet.tsx` - Consistent share UI (Copy Link, WhatsApp, Email) used app-wide
- `PhoneInput.tsx` - +91 fixed prefix input
- `DatePicker.tsx` - shadcn Calendar + Popover wrapper with calendar icon on right, dd/MM/yyyy display
- `SearchModal.tsx` - Cmd+K search with category filters, Clear button, 24px close icon

### Utilities
- `Lib/utils.ts` - `formatTableDate()`, `formatTableTime()` for consistent table date display
- `Lib/pdf-content.ts` - Category-specific PDF content generators for health records (15+ formatters)
- `Lib/download.ts` - Client-side PDF generation via browser print-to-PDF

---

## How to Run

```bash
php artisan migrate:fresh --seed  # Fresh DB
php artisan serve --port=3000     # Laravel
npm run dev                       # Vite
ollama serve                      # AI (optional)
```

**Tests**: `php artisan test` (61 tests, 171 assertions)

**AI Config** (.env):
```
AI_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:7b
```

---

## Design System

| Element | Specification |
|---------|---------------|
| Cards | 20px border-radius |
| Primary | Blue (#1E40AF bg, #BFDBFE icons) |
| Success/Warning/Error | Green/Amber/Red |
| Sheets | Right-side, 1 primary button + 3-dot menu |
| Badges | Pastel backgrounds, colored text |
| Skeleton | 300ms min, 10s timeout |
| EmptyState | #F5F5F5 bg, 24px/48px padding, content-based height, 20px radius, optional image |
| CtaBanner | Dark radial gradient, white text, illustration, used for empty pages |
| Page Container | 960px max-width, 40px top/bottom padding |

### Empty State Pattern

Use CtaBanner (dark gradient, prominent CTA) only for action-first pages where users need to create something. Use standard EmptyState for info-first pages where content appears passively. Each page has one CTA max.

| Page | Component | CTA |
|------|-----------|-----|
| **Appointments** | CtaBanner | "Book appointment" |
| **Insurance** | CtaBanner | "Add insurance" |
| **Family Members** | CtaBanner | "Add family member" |
| **Health Records** | EmptyState | None (records appear after visits/tests) |
| **Billing** | EmptyState | "Add payment method" |

For filtered results that are empty, always use EmptyState with no CTA.

### Table Consistency

| Rule | Specification |
|------|---------------|
| Column Order | Date → Details → Member → Amount → Status → Actions |
| Date Format | `03 Feb 2026` via `formatTableDate()` |
| Time (Appointments) | Subtext line below date via `formatTableTime()` |
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

---

## Recent Changes (Feb 2026)

| Date | Feature |
|------|---------|
| Feb 4 | **Calendar Upgrade (react-day-picker v9)**: Updated to v9 API with dropdown month/year selectors, 3-letter month format (MMM), proper styling (8px radius dropdowns, centered layout, nav arrows on edges) |
| Feb 4 | **DatePicker Improvements**: Popover width matches trigger field, rounded-md styling to match inputs/selects |
| Feb 4 | **DatePicker Component**: Replaced all native `<input type="date">` with shadcn DatePicker (Calendar + Popover) across 10 files (20+ fields) - consistent UI with calendar icon on right |
| Feb 4 | **Search Modal UI**: Fixed height 420px, category tag in search field with remove button, centered empty state with search.png image, scrollable results |
| Feb 4 | **Settings UPI Payments**: Full UPI ID management in Settings > Payments (add, delete, set default) with backend routes |
| Feb 4 | **Avatar Sync**: Profile photo upload now syncs to sidebar via `router.reload({ only: ['auth'] })` and User model `$appends` |
| Feb 4 | **Search Modal Styling**: Frosted glass effect (714px width, 20px radius, backdrop blur, layered shadows) |
| Feb 4 | **SideNav Component**: Reusable navigation component with pill-shaped buttons and blue active state |
| Feb 4 | **Section Title Styling**: Consistent 20px/600 weight/#171717 titles across all Settings tabs |
| Feb 4 | **Tag Input UX**: Tags now appear below input field instead of above |
| Feb 4 | **Page Padding**: Added pb-10 to all detail pages and Settings content area for consistent bottom spacing |
| Feb 4 | **Prescriptions Filter**: Health Records prescriptions tab now filters by Active/Past based on medication duration |
| Feb 4 | **Sentence Case Standardization**: All buttons and headings converted to sentence case (e.g., "Book Appointment" → "Book appointment", "Save Changes" → "Save changes") for better UX and modern design alignment |
| Feb 4 | **Terminology Consistency**: "Consultation" → "Appointment", "Medication" → "Prescription", "Member" → "Family member" across all pages |
| Feb 4 | **Empty State Images**: Custom images for CtaBanner (booking, family, insurance) and EmptyState (health-records, billing) |
| Feb 4 | **CtaBanner Enhancement**: Dismissible banners with onDismiss prop, image clipping at bottom (-72px offset) |
| Feb 4 | **Button Styling**: Primary CTA large updated to 48px height, 8px/32px padding, full pill radius, #2563EB background |
| Feb 4 | Dashboard promotional banner converted to use CtaBanner component |
| Feb 4 | **Empty Page CTA Pattern**: CtaBanner for fully empty pages, header button hidden when empty |
| Feb 4 | CtaBanner: Added `onButtonClick` prop for sheet-based actions (FamilyMembers, Insurance) |
| Feb 4 | Profile step links: "Complete your health profile" now goes to /settings |
| Feb 4 | EmptyState height reduced to 400px |
| Feb 4 | EmptyState redesign: #F5F5F5 background, 60px padding, 20px radius |
| Feb 4 | Page container padding reduced from 80px to 40px bottom |
| Feb 4 | Sticky support footer: `mt-auto pt-8` pattern for bottom-anchored CTAs |
| Feb 4 | **Extended Notifications**: 14 new notification types (appointments, health records, family members, insurance policies) with category-specific icons and navigation |
| Feb 4 | **Authentication**: Complete auth system with sign in/up, logout, forgot/reset password, route protection, rate limiting |
| Feb 4 | Auth pages converted to TypeScript + shadcn/ui (Login, Register, ForgotPassword, ResetPassword, VerifyEmail, ConfirmPassword) |
| Feb 4 | AppLayout updated with auth-aware sidebar: logout button when authenticated, sign in/up buttons for guests |
| Feb 4 | Route protection: All app routes wrapped in `auth` middleware, smart root redirect based on auth state |
| Feb 4 | Auth feature tests: 25 tests covering login, registration, password reset, route protection |
| Feb 4 | Context-aware breadcrumbs: ClaimDetail shows policy in breadcrumb only when navigated from policy page (uses `?from=policy` query param) |
| Feb 4 | Status-based primary actions: Billing/Claims detail pages show contextual buttons (File Appeal, Download EOB, Track Claim, etc.) instead of generic "Check Status" |
| Feb 4 | Table consistency: Unified column order (Date→Details→Member→Amount→Status→Actions), date format helpers |
| Feb 4 | Insurance Policies converted from cards to table layout |
| Feb 4 | Date/time split: Date on line 1, time as subtext on line 2 (Appointments, Billing) |
| Feb 4 | "Book Lab Test" button for lab test appointments (instead of "Book Again") |
| Feb 4 | Removed support CTAs from side sheets (now only in page footers) |
| Feb 4 | Sidebar cleanup: Removed Sign Out button (available in Settings/Profile instead) |
| Feb 3 | PDF formatting overhaul: Category-specific formatters, tables for lab results, AI summary callouts, status dots |
| Feb 3 | Health Records table: Category badges replaced with plain text (Lab Report • Dr. Name) |
| Feb 3 | Backend routes: Set Primary, Edit, Appeal (Insurance), Cancel Dispute (Billing) |
| Feb 3 | QA_ACTION_CONSISTENCY.md - Full test script for action audit |
| Feb 3 | Persistent support CTA at bottom of all table pages and detail views (mailto link with border-t separator) |
| Feb 3 | Removed Contact Support from all 3-dot menus (now only via footer CTA) |
| Feb 3 | Button consistency: 1 Primary + 3-dot menu across all detail views |
| Feb 3 | Appointments: Check-in button (within 24-48h), Add to Calendar, Get Directions |
| Feb 3 | Health Records: Add to Apple/Google Health (platform-based), Request Amendment |
| Feb 3 | Past appointments: Book Again primary + Share menu on detail page |
| Feb 3 | AI-generated summaries on health records (plain language explanations with next steps) |
| Feb 3 | Table row click opens details; 3-dot menu for actions only (Appointments, Billing, Insurance) |
| Feb 3 | Consistent ShareSheet across app (Billing, Insurance, Health Records, Appointments) |
| Feb 3 | Fix OTP send in Link Existing Patient flow (event handler bug) |
| Feb 3 | Family Members card 20px border-radius |
| Feb 3 | Settings page 960px width alignment with detail pages |
| Feb 3 | Unified "Add Member" across all booking flows (3 modes) |
| Feb 3 | Insurance pages 960px width fix |
| Feb 3 | Settings 4-tab redesign with full functionality |
| Feb 3 | Page container standardization (960px, 40px bottom) |
| Feb 3 | Book Again side sheet |
| Feb 3 | Follow-up booking sheet |
| Feb 3 | Secure OTP flow with masked contacts |
| Feb 3 | Empty states and loading skeletons |
| Feb 3 | Insurance pre-auth admission flow |
| Feb 2 | Family member 3-option flow (Guest/New/Link) |
| Feb 2 | PhoneInput component (+91 fixed) |
| Feb 2 | Side sheet footer standardization |
| Feb 2 | OTP verification (phone + email) |

---

**Status**: Production-ready healthcare platform

**Last Updated**: February 4, 2026
