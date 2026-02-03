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
| EmptyState | #F5F5F5 bg, 60px padding, 500px height, 20px radius |
| Page Container | 960px max-width, 40px top/bottom padding |

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
| Feb 4 | EmptyState redesign: #F5F5F5 background, 60px padding, 500px height, 20px radius |
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
