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
  Layouts/             AppLayout, GuidedBookingLayout
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
| **Health Records** | 21 categories, server-side status, deep-linking |
| **Insurance** | Policies, claims (14 statuses), pre-auth flow |
| **Family Members** | 18 fields, OTP verification, alert deep-links |
| **Settings** | 4 tabs (Profile, Notifications, Preferences, Connections) |
| **Global** | Cmd+K search, notifications, skeleton loading, error pages |

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
- `Dashboard.tsx`, `Booking/Conversation.tsx`, `Booking/Index.tsx`
- `Appointments/Index.tsx`, `Appointments/Show.tsx`
- `Billing/Index.tsx`, `Billing/Show.tsx`
- `HealthRecords/Index.tsx`, `Insurance/*.tsx`
- `FamilyMembers/Index.tsx`, `FamilyMembers/Show.tsx`
- `Settings/Index.tsx`

### Key Components
- `EmbeddedFamilyMemberFlow.tsx` - 3-mode add member wizard (embedded/standalone/guided)
- `AppointmentSheets.tsx` - Detail, cancel, reschedule, follow-up, book-again sheets
- `ShareSheet.tsx` - Consistent share UI (Copy Link, WhatsApp, Email) used app-wide
- `PhoneInput.tsx` - +91 fixed prefix input

---

## How to Run

```bash
php artisan migrate:fresh --seed  # Fresh DB
php artisan serve --port=3000     # Laravel
npm run dev                       # Vite
ollama serve                      # AI (optional)
```

**Tests**: `php artisan test` (36 tests, 121 assertions)

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

---

## Recent Changes (Feb 2026)

| Date | Feature |
|------|---------|
| Feb 3 | Table row click opens details; 3-dot menu for actions only (Appointments, Billing, Insurance) |
| Feb 3 | Consistent ShareSheet across app (Billing, Insurance, Health Records, Appointments) |
| Feb 3 | Fix OTP send in Link Existing Patient flow (event handler bug) |
| Feb 3 | Family Members card 20px border-radius |
| Feb 3 | Settings page 960px width alignment with detail pages |
| Feb 3 | Unified "Add Member" across all booking flows (3 modes) |
| Feb 3 | Insurance pages 960px width fix |
| Feb 3 | Settings 4-tab redesign with full functionality |
| Feb 3 | Page container standardization (960px, 80px bottom) |
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

**Last Updated**: February 3, 2026
