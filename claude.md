# Healthcare Platform - Project Progress

## Overview

AI-powered healthcare platform for appointment booking (doctor and lab tests) with a conversational chat interface. Built with Laravel 11.x + React 18 + TypeScript + Inertia.js v2.0 + Tailwind CSS.

---

## Tech Stack

- **Backend**: Laravel 11.x, PHP 8.5
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: Inertia.js v2.0
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: CVA (class-variance-authority) + tailwind-merge
- **Build**: Vite 7.3.1 with HMR
- **AI Providers**: DeepSeek, Groq, Ollama (pluggable via AIProviderInterface)
- **Font**: Inter (400, 500, 600, 700)

---

## Architecture

### MVC + Service Layer

```
app/
  Models/              Eloquent models (BookingConversation, ConversationMessage, User)
  Http/
    Controllers/       Thin orchestration (DashboardController, BookingConversationController, etc.)
    Requests/          Form request validation
    Middleware/         HandleInertiaRequests
  Services/
    AI/                AI provider abstraction (AIService, DeepSeekProvider, GroqProvider, OllamaProvider)
    Booking/           Booking orchestration (IntelligentBookingOrchestrator, BookingStateMachine)
    Calendar/          CalendarService (Google Calendar URLs, ICS file generation)
  Policies/            Authorization (BookingConversationPolicy)
  Providers/           AppServiceProvider

resources/js/
  Pages/               Inertia page components (Dashboard, Booking/*, Auth/*, etc.)
  Components/
    ui/                shadcn components (button, card, badge, avatar, toast, etc.)
    Booking/           Booking-specific components (StepIndicator, SymptomChips, etc.)
  Features/
    booking-chat/      Conversational booking UI
      embedded/        Embedded step components (DoctorList, BookingSummary, DateTimePicker, etc.)
  Layouts/             AppLayout, GuestLayout, GuidedBookingLayout
  Lib/                 Utilities (utils.ts, design-system.ts)
  Types/               TypeScript types

routes/web.php         All Inertia routes
```

### AI Service Layer

- AI is optional and assistive - system functions fully without it
- Provider interface (`AIProviderInterface`) allows swapping providers
- 4-stage booking pipeline: System Prompt -> Intent Classification -> Response Generation -> Follow-up
- Feature flags control AI features via `config/ai.php`
- AI never writes to the database directly

### Booking Flow Architecture

Two parallel booking systems:

1. **Guided Booking** (multi-step wizard): Session-based, step-by-step form flow
   - Doctor flow: Patient -> Concerns -> Doctor/Time -> Confirm
   - Lab flow: Patient/Test -> Packages/Schedule -> Confirm

2. **AI Chat Booking** (conversational): `IntelligentBookingOrchestrator` + `BookingStateMachine`
   - Natural language input parsed by AI
   - State machine determines next step based on `collected_data`
   - Embedded UI components rendered inline in chat
   - Entity merging with validation and conflict resolution

---

## Completed Features

### Dashboard
- Sidebar navigation with active/inactive states
- Top header with search, notifications, AI assistant button
- Welcome section with greeting and book appointment CTA
- Profile completion steps (3-step progress)
- CTA banner with radial gradient background
- Family overview section with member cards

### AI-Powered Booking Flow
- Conversational chat interface with Prompt Kit
- Auto-resizing textarea with gradient border
- Patient selector, appointment type, urgency selector
- Doctor list with time slots and date pills
- Consultation mode selector (video/in-person)
- Follow-up flow with previous visit context
- Booking summary with change/confirm actions
- Add to Calendar (Google Calendar + Apple Calendar ICS)

### Guided Booking Flow
- Session-based multi-step wizard for doctor and lab bookings
- Dynamic doctor availability based on selected date
- shadcn Card components throughout
- Step indicator with proper alignment

### Design System
- shadcn/ui component library
- Design tokens (colors, spacing, typography, borders)
- Button variants (default, destructive, outline, secondary, ghost, link, cta)
- Toast notifications, tooltips, dropdown menus
- Prompt input components with gradient container

---

## Bug Fixes (January 31, 2026)

### Fix 1: Urgency Step Skipped After "New Appointment"
AI parsing extracted urgency/date prematurely from initial message. Fixed by clearing non-confirmed urgency/date when appointment_type is selected.

### Fix 2: Dr. Vikram Patel Showing Video Mode with Rs.0 Fee
Multiple fallback points defaulted to 'video'. Added `getDefaultModeForDoctor()` helper and auto-selection for single-mode doctors.

### Fix 3: Time Slot Selector Infinite Loop
Frontend used 12-hour format ("11:00 AM") while backend validated 24-hour ("11:00"). Rewrote DateTimePicker to use backend slots with 24-hour values, display in 12-hour format.

### Fix 4: Test Failures in BookingStateMachineTest
Two follow-up flow tests missing `urgency` field. Added `'urgency' => 'this_week'` to test data.

### Fix 5: Mode Not Validated on Doctor Change
`change_doctor` handler didn't clear `consultationMode`. Now clears mode and removes from completedSteps on doctor change.

### Fix 6: Mode Conflict Not Communicated to User
System silently auto-corrected video->in-person. Added `mode_conflict` context with user-facing notification message.

### Fix 7: Date Picker Not Shown on Text Date Change
Typing "book for this week" at summary looped back to summary. Added pre-merge date change detection and urgency change handler to clear downstream fields.

### Fix 8: Wrong Time in Summary (Timezone)
`toIso8601String()` appended timezone offset, `parseISO` then converted. Fixed with `format('Y-m-d\TH:i:s')` for timezone-naive output.

### Fix 9: Calendar Showing Unavailable Dates/Doctors
Date picker showed all 7 days regardless of doctor availability. Backend now filters dates by doctor days-off and sends `available_dates` per doctor. Frontend filters doctor list per active date.

### Fix 10: "Hi" Showed Patient Selector Instead of Greeting
`process()` always fell through to the state machine even for greetings. Added intent gate for non-booking intents (`greeting`, `question`, `general_info`, `unclear`) when no booking progress exists — returns a conversational response instead of a component.

### Fix 11: Date and Doctor Selection Combined Into One Step
User had to see dates and doctors simultaneously. Split into two states: `date_selection` (date pills only via `date_picker` component) → `doctor_selection` (doctors filtered to selected date via `doctor_selector` component). Added `getDatePickerData()` and `getDoctorListForDate()` backend methods.

### Fix 12: AI-Extracted Date/Doctor Cleared on Appointment Type Selection
When user said "Book on 5th Feb with Dr. Vikram" then clicked "New Appointment", the date and doctor were wiped because they weren't in `completedSteps`. Added `textMentionedFields` tracking in `mergeEntities()` to distinguish user-mentioned values from AI-hallucinated ones. The appointment_type handler now preserves fields in `textMentionedFields`.

### Fix 13: Doctor-Date Conflict Shows Empty List
When searched doctor is unavailable on the selected date, system showed 0 doctors with no explanation. Now detects the conflict, shows the doctor with their available dates this week, clears the conflicting date, and displays a message like "Dr. Vikram isn't available on Feb 5. They're available Mon, Wed, Fri, Sat this week."

### Fix 14: "Dr. Dr. Vikram" Double Prefix in Conflict Message
`doctorSearchQuery` stored "Dr. Vikram" and the conflict message prepended another "Dr.". Added `preg_replace('/^Dr\.?\s*/i', '', $searchQuery)` to strip existing prefix.

### Fix 15: Urgency Regression After Doctor-Date Conflict
Conflict handler cleared `selectedDate` but left `urgency` empty, causing the state machine to regress from doctor_selection all the way back to urgency. Now sets `urgency = 'this_week'` as default when clearing date due to conflict.

### Fix 16: Text Input "Dr. Vikram at 10:00" Not Auto-Selecting Doctor
When user typed both doctor name + time, `mergeEntities` only stored the name as a search query without setting `selectedDoctorId`. Now auto-selects the doctor when both name and time are provided in the same message.

### Fix 17: Duplicate Frontend Component Cases (Dead Code)
`EmbeddedComponent.tsx` had duplicate `case 'date_picker':` and `case 'doctor_selector':` — the first match always won, making the new date-only and filtered doctor components dead code. Removed duplicates so the correct components render.

---

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `app/Services/Booking/IntelligentBookingOrchestrator.php` | Main AI booking orchestrator |
| `app/Services/Booking/BookingStateMachine.php` | State machine for booking flow |
| `app/Http/Controllers/BookingConversationController.php` | Conversation HTTP handler |
| `app/Http/Controllers/GuidedDoctorController.php` | Guided doctor booking flow |
| `app/Http/Controllers/GuidedLabController.php` | Guided lab booking flow |
| `app/Services/AI/AIService.php` | AI service orchestrator |
| `app/Services/Calendar/CalendarService.php` | Calendar event generation |
| `app/BookingConversation.php` | Conversation model (UUID, JSON) |
| `app/ConversationMessage.php` | Message model |

### Frontend
| File | Purpose |
|------|---------|
| `resources/js/Pages/Dashboard.tsx` | Main dashboard page |
| `resources/js/Pages/Booking/Conversation.tsx` | Conversational booking page |
| `resources/js/Features/booking-chat/EmbeddedComponent.tsx` | Component router for chat |
| `resources/js/Features/booking-chat/embedded/` | All embedded step components |
| `resources/js/Layouts/AppLayout.tsx` | Main app layout with sidebar |
| `resources/js/Components/ui/` | shadcn component library |

---

## How to Run

```bash
# Start Laravel server
php artisan serve --port=3000

# Start Vite dev server (separate terminal)
npm run dev

# Access application
open http://127.0.0.1:3000
```

### Running Tests

```bash
# All tests
php artisan test

# BookingStateMachine tests (19 tests)
php artisan test --filter=BookingStateMachine
```

---

## Database Schema

### Existing Tables
- `users` - User accounts
- `booking_conversations` - UUID primary key, user_id, type, status, current_step, collected_data (JSON)
- `conversation_messages` - UUID, conversation_id, role, content, component_type, component_data (JSON), user_selection (JSON)

### Mock Data (to be replaced with real DB)
- 5 doctors with varying specializations, availability, and consultation modes
- Doctor days-off schedule (per day-of-week)
- Time slots 08:00-17:00

---

**Last Updated**: January 31, 2026
**Status**: Dashboard Complete | AI Booking Flow Complete | Guided Booking Flow Complete | Calendar Integration Complete | Critical Bug Fixes Applied
