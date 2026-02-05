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
| **Authentication** | Sign in/up (email + Google/Apple OAuth), logout, forgot/reset password, route protection, rate limiting |
| **Global** | Cmd+K search, notifications (27 types, 5 categories), skeleton loading, error pages |

---

## Database (30 Tables)

**Core**: users, social_accounts, family_members, appointments, booking_conversations, conversation_messages, user_settings

**Hospital**: departments, doctors, doctor_consultation_modes, doctor_availabilities, time_slots, symptoms

**Lab**: lab_test_types, lab_packages, lab_centers, user_addresses

**Insurance**: insurance_providers, insurance_policies, insurance_claims

**Health**: health_records, billing_notifications, promotions

---

## Key Files

### Controllers
- `Auth/*Controller` - Login, register, password reset (Laravel Breeze), social auth (Google/Apple OAuth)
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
- `Auth/SocialLoginButtons.tsx` - Google and Apple OAuth buttons with branded icons
- `Auth/SocialDivider.tsx` - "or continue with email" divider
- `Alert.tsx` - Standalone alert component with CVA variants (info/warning/success/error), 20px radius, bottom border
- `SideNav.tsx` - Reusable side navigation with pill buttons, 8px/12px padding, 20px icons, blue active state

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
| Section Title | #171717, 20px, font-weight 600, line-height 28px (consistent across detail pages and Settings) |
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

### Feb 5 - Design System Enforcement & UI Polish
- **Sheet Redesign**: 500px width, 24px radius, 20px header/body padding, 16px footer padding, 24px close icon, edge-to-edge dividers. New: SheetBody, SheetSection, SheetSectionRow
- **Button Component**: Primary large enforced at component level (48px height, 16px font, 8px gap, `icon` prop at 20px). Secondary icon enforced (40x40, 8px padding, border/bg). CTA buttons use primary large style
- **Global UI Consistency**: All borders 1px (except spinners/Switch), all icon backgrounds `rounded-full`, section spacing `space-y-12` (3rem), fixed pixel fonts (`text-[14px]`) across 105+ files
- **Section Titles**: Consistent 20px/600 weight/#171717 across all detail pages and Settings tabs
- **Card Typography**: #0A0B0D title, #737373 subtext, 14px/20px line-height across all card components
- **Alert Component**: CVA variants (info/warning/success/error), 20px radius, 2px bottom border
- **SideNav**: 20px icons, 6px gap, 14px font, 200px min-width, pill buttons with blue active state
- **Settings**: Profile photo remove, TagInput with comma support, accessibility text size/contrast, data export PDF, notifications toggles, "Doctor's language" label
- **Family Members**: Admin badge next to name, edit/delete hidden for self, 4 consolidated profile sections, 16px member name font
- **EmptyState/CtaBanner**: 16px title, custom images, dismissible banners, primary large button on CtaBanner. All EmptyState must have message + description
- **Icon Colors**: Standardized to #171717 (`text-neutral-900`) on light backgrounds, #fff on dark backgrounds across ~70 instances in 23 files. SideNav/AppLayout active state: #2563EB
- **Secondary Icon Button**: Added `color: '#171717'` to `iconStyle` — fixes invisible white-on-gray icons in `<Button size="icon">`
- **Empty State Images**: Table tab empty states now use images from /assets/images/ instead of generic icons (Appointments, Billing, HealthRecords, Insurance)
- **AI Chat Booking Fix**: PaymentController `createBooking()` now creates actual Appointment records (was only storing in conversation data)
- **Social Login UI**: Google/Apple OAuth at end of auth forms, side-by-side layout

### Feb 4 - Authentication, Tables & Components
- **Authentication**: Complete auth system (sign in/up, logout, forgot/reset password, Google/Apple OAuth, route protection, rate limiting, 25 tests)
- **Table Consistency**: Unified column order, date format helpers, Insurance Policies in table layout, date/time split display
- **DatePicker**: Replaced native inputs with shadcn Calendar + Popover across 10 files, react-day-picker v9 with dropdowns
- **Search Modal**: 714px frosted glass, category tags, 420px height, centered empty state
- **Notifications**: 14 new types with category-specific icons and navigation
- **Empty State Pattern**: CtaBanner for empty action pages, standard EmptyState for info pages
- **Sentence Case**: All UI text standardized to sentence case
- **Terminology**: "Consultation" → "Appointment", "Medication" → "Prescription"
- **Status-Based Actions**: Contextual primary buttons on detail pages (File Appeal, Download EOB, etc.)
- **Settings UPI**: Full UPI ID management with backend routes

### Feb 3 - Actions, Sharing & Content
- **Action Consistency**: 1 Primary + 3-dot menu on all detail views, support CTA in page footers only
- **ShareSheet**: Consistent share UI (Copy Link, WhatsApp, Email) across all detail pages
- **Health Records**: AI-generated summaries, PDF category-specific formatters, Apple/Google Health integration
- **Appointments**: Check-in (24-48h window), Add to Calendar, Get Directions, Book Again, Follow-up booking
- **Insurance**: Pre-auth admission flow, backend routes for appeal/edit/set primary
- **Family Members**: Unified 3-mode add member flow, OTP verification, 20px card radius
- **Page Layout**: 960px standardization, 40px bottom padding, skeleton loading

### Feb 2 - Foundation
- Family member 3-option flow (Guest/New/Link)
- PhoneInput component (+91 fixed), OTP verification (phone + email)
- Side sheet footer standardization

---

**Status**: Production-ready healthcare platform

**Last Updated**: February 5, 2026
