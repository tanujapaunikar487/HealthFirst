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
  Models/              Eloquent models (15 hospital models + BookingConversation, ConversationMessage, User)
  Http/
    Controllers/       Thin orchestration (DashboardController, BookingConversationController, etc.)
    Requests/          Form request validation
    Middleware/         HandleInertiaRequests
  Services/
    AI/                AI provider abstraction (AIService, DeepSeekProvider, GroqProvider, OllamaProvider)
    Booking/           Booking orchestration (IntelligentBookingOrchestrator, BookingStateMachine, DoctorService, LabService)
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

### Fix 18: Past Date Not Rejected (e.g., "5th Dec" in January)
Typing a past date like "5th dec" was silently accepted (adjusted to Dec 2026, 10 months away). `EntityNormalizer.normalizeDate()` now detects past dates and dates >14 days out, returns `past_date_warning` with user-facing message. `mergeEntities()` clears date fields and stores warning. `buildResponseFromStateMachine()` shows amber alert above the date picker. Added `date_picker` case to `EmbeddedComponent.tsx` for date-only selection with warning support.

### Fix 19: Date Picker Selection Not Carried to Time Slot Selector
After selecting a date from `date_picker`, the time slot selector showed only "Today" instead of the selected date. `handleComponentSelection` stored the date but didn't update urgency, so `getAvailableDates()` used the old urgency. Now sets `urgency = 'specific_date'` when user picks a date via component.

### Fix 20: Time Slot Selector Showed Only 1 Date
`getDateTimeSelectorData()` relied on `getAvailableDates()` which returned a single date for `specific_date` urgency. Rewrote to always generate up to 5 available dates from today (filtered by doctor's days off), giving users flexibility to adjust their date.

---

## Architectural Refactor: Better AI Entity Extraction (January 31, 2026)

Replaced the fragile pattern of individual fixes in a 350+ line `mergeEntities()` with a 3-service architecture:

### New Services

| Service | File | Purpose |
|---------|------|---------|
| `DoctorService` | `app/Services/Booking/DoctorService.php` | Single source of truth for doctor data. Replaces 3 duplicate hardcoded arrays. Methods: `getById()`, `findByName()`, `getDaysOff()`, `isAvailableOn()`, `getAvailableDates()`, `getSupportedModes()`, `getDefaultMode()`, `checkAvailability()`, `formatForPrompt()`, `search()` |
| `BookingPromptBuilder` | `app/Services/Booking/BookingPromptBuilder.php` | Builds a dynamic AI system prompt with today's date (resolves "tomorrow"), full doctor list with modes/fees/days-off, current booking state, strict format rules (24h time, ISO dates), and examples |
| `EntityNormalizer` | `app/Services/Booking/EntityNormalizer.php` | Post-AI validation/normalization: date fixing (past year→current), time (12h→24h), doctor name→ID resolution, mode normalization ("online"→"video"), patient relation mapping, doctor+date and doctor+mode conflict detection |

### Changes to Existing Files

- **`AIService.php`**: Added optional `?string $systemPrompt` parameter to `classifyIntent()` (backward-compatible)
- **`IntelligentBookingOrchestrator.php`**: Injected 3 new services via constructor. `parseUserMessage()` uses dynamic prompt. `mergeEntities()` reduced from ~350 to ~120 lines — delegates validation to `EntityNormalizer`, keeps merge logic and cascade clearing. Removed 4 dead methods and 3 duplicate doctor arrays (~420 lines removed).

### How the Pipeline Works

```
User message
  → BookingPromptBuilder.build(collectedData)    # dynamic prompt with date/doctors/state
  → AIService.classifyIntent(msg, history, prompt) # AI extracts entities
  → EntityNormalizer.normalize(entities, data)    # validate, fix formats, detect conflicts
  → mergeEntities(data, normalized, parsed)       # merge + cascade clearing
  → BookingStateMachine.determineCurrentState()   # next UI step
```

---

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `app/Services/Booking/IntelligentBookingOrchestrator.php` | Main AI booking orchestrator |
| `app/Services/Booking/BookingStateMachine.php` | State machine for booking flow |
| `app/Services/Booking/DoctorService.php` | Centralized doctor data and availability |
| `app/Services/Booking/BookingPromptBuilder.php` | Dynamic context-aware AI prompt builder |
| `app/Services/Booking/EntityNormalizer.php` | Post-AI entity validation and normalization |
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
# Fresh database with seed data
php artisan migrate:fresh --seed

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

# Booking flow integration tests (31 tests)
php artisan test --filter=BookingFlowTest
```

---

## Database Schema

### Existing Tables
- `users` - User accounts
- `booking_conversations` - UUID primary key, user_id, type, status, current_step, collected_data (JSON)
- `conversation_messages` - UUID, conversation_id, role, content, component_type, component_data (JSON), user_selection (JSON)

### Hospital Data Tables (15 tables, seeded via `HospitalSeeder`)

| Table | Records | Purpose |
|-------|---------|---------|
| `departments` | 10 | Hospital departments (General Medicine, Cardiology, Dermatology, etc.) |
| `doctors` | 10 | Doctors with specialization, experience, rating, avatar |
| `doctor_consultation_modes` | 17 | Video/in-person modes with fees per doctor |
| `doctor_availabilities` | 70 | Day-of-week availability per doctor |
| `doctor_aliases` | 31 | Name aliases for AI name matching (e.g., "Meera Iyer" → doctor 3) |
| `time_slots` | ~800 | 14-day generated slots, 8am-5pm, ~20% pre-booked |
| `family_members` | 6 | Patient profiles (Self, Mother, Father, Brother, Grandmother, Spouse) |
| `symptoms` | 20 | Common symptoms mapped to departments with severity |
| `emergency_keywords` | 15 | Emergency detection (chest pain, heart attack, etc.) |
| `lab_test_types` | 15 | Lab tests (CBC, Lipid Profile, Thyroid, etc.) with pricing |
| `lab_packages` | 6 | Health packages (Complete Health ₹4999, Diabetes ₹1499, etc.) |
| `lab_centers` | 4 | Lab centers in Pune with home collection support |
| `insurance_providers` | 5 | Indian insurance providers (Star Health, HDFC ERGO, etc.) |
| `insurance_claims` | 4 | Sample claims for testing |
| `appointments` | 4 | Past appointments for follow-up context |
| `user_addresses` | 3 | Saved addresses (Home, Office, Parent's House) for home collection |

### Models (`app/Models/`)

Department, Doctor, DoctorConsultationMode, DoctorAvailability, DoctorAlias, TimeSlot, FamilyMember, Symptom, EmergencyKeyword, LabTestType, LabPackage, LabCenter, InsuranceProvider, InsuranceClaim, Appointment, UserAddress

All models have proper Eloquent relationships. Key relationships:
- Department hasMany Doctors
- Doctor belongsTo Department, hasMany ConsultationModes/Availabilities/Aliases
- User hasMany FamilyMembers/Appointments/InsuranceClaims/UserAddresses
- Appointment belongsTo Doctor/User/FamilyMember/Department

---

## Database Migration (January 31, 2026)

Replaced all hardcoded data arrays with a proper database layer:

### What Changed
- **Created 15 migrations** in `database/migrations/` with foreign keys and indexes
- **Created 15 Eloquent models** in `app/Models/` with relationships
- **Created `HospitalSeeder`** with realistic Indian healthcare data (10 doctors, 6 family members, 20 symptoms, 15 lab tests, etc.)
- **Rewrote `DoctorService.php`** — all methods now use Eloquent queries instead of hardcoded arrays (same public API preserved)
- **Rewrote `GuidedDoctorController.php`** — family members, doctors, symptoms, emergency keywords, appointments all from DB
- **Rewrote `GuidedLabController.php`** — packages, test types, lab centers all from DB
- **Updated `BookingConversationController.php`** — passes family members from DB to frontend via Inertia props
- **Updated frontend** — removed hardcoded dummy arrays from `EmbeddedComponent.tsx`, `Conversation.tsx` accepts `familyMembers` prop

### Key Design Decisions
- User model uses UUIDs (`HasUuids` trait) → all user FK references use `foreignUuid()`
- User model lives at `App\User` (not `App\Models\User`)
- Doctor IDs 1-5 preserved for backward compatibility
- Frontend doctor IDs use 'd' prefix (e.g., 'd1', 'd2') — extracted with `str_replace('d', '', $id)`
- `DoctorService.toArray()` converts Eloquent model to the array format expected system-wide

### Seeding
```bash
php artisan migrate:fresh --seed
```

---

## Lab Test Booking in AI Chat Flow (January 31, 2026)

Added lab test booking path to the AI chat flow, parallel to the existing doctor appointment flow.

### How It Works
- `BookingStateMachine` branches on `collected_data['booking_type']`:
  - `'doctor'` → patient → appointment_type → urgency → doctor → time → mode → summary
  - `'lab_test'` → patient → package_inquiry → package → collection_type → [home: address | center: center_selection] → date+time → summary
- AI intent `booking_lab` auto-sets `booking_type = 'lab_test'`
- AI intent `booking_doctor` keeps `booking_type = 'doctor'`

### Files Created
- `app/Services/Booking/LabService.php` — Centralized lab data service (packages, centers, fees, prompt formatting)

### Files Modified
- `BookingStateMachine.php` — `bookingType` property, `determineLabState()`, lab states/fields/completeness
- `EntityNormalizer.php` — Lab entity mappings (`package_name`, `package_id`, `collection_type`), normalizers
- `BookingPromptBuilder.php` — Lab package list in AI prompt, lab extraction rules and examples
- `IntelligentBookingOrchestrator.php` — Lab component data providers (`getPackageListData`, `getLocationSelectorData`, `getLabDateTimeSelectorData`), lab summary builder, lab selection handlers
- `EmbeddedComponent.tsx` — `display_message` in package/location selection callbacks, fasting prop key compat

### Lab Test collected_data Keys
```
booking_type: 'lab_test'
selectedPatientId, selectedPatientName, selectedPatientAvatar
selectedPackageId, selectedPackageName
packageRequiresFasting, packageFastingHours
collectionType: 'home' | 'center'
selectedCenterId, selectedCenterName (if center)
selectedDate, selectedTime
```

### Frontend Components (pre-existing, now wired to backend)
- `EmbeddedPackageList` — package selection with pricing
- `EmbeddedLocationSelector` — home collection vs lab center
- `EmbeddedDateTimeSelector` — dates + time slots with fasting warning
- `EmbeddedBookingSummary` — already supports lab fields (package, collection, prepInstructions)

---

## Lab Booking Flow Redesign: Smart Search + 2-Step Collection (January 31, 2026)

Redesigned the lab test booking flow from "show all packages upfront" to a smarter, conversational approach.

### New Flow
```
Patient → "What test are you looking for?" (chat input)
       → Filtered package list (or auto-select if 1 match)
       → Collection type: Home Collection / Hospital Visit
       → [If hospital] Center selection (sorted by distance)
       → Date + Time → Summary
```

### What Changed

**LabService.php** — Added `searchPackages(string $query)` method:
- Keyword scoring: exact name match (+10), keyword in name (+5), description (+2), slug (+3)
- Alias matching (+8): maps common terms like "diabetes"→diabetes-screening, "heart"/"cardiac"→heart-health, "full body"→complete-health-checkup, "women"→womens-health, "senior"→senior-citizen-health
- Returns packages sorted by relevance score; empty array if no matches

**BookingStateMachine.php** — Added 3 new states to lab flow:
- `package_inquiry` — chat input asking what test user wants (`awaiting_chat_input: true`)
- `collection_type_selection` — 2 options: Home Collection / Hospital Visit
- `center_selection` — lab center list (only shown for hospital visits)
- Updated `isReadyToBook()` to require `selectedCenterId` when `collectionType === 'center'`
- Updated `getMissingFields()`, `hasField()`, `getCompletenessPercentage()` for center requirement
- Added `getPackageSelectionMessage()` for contextual messages (search results vs fallback)

**IntelligentBookingOrchestrator.php** — Major updates:
- Package inquiry handler in `process()`: searches packages, auto-selects on single match, stores filtered results for multi-match
- New data providers: `getCollectionTypeSelectorData()`, `getCenterListData()`
- Modified `getPackageListData()` to filter by `packageSearchResults` IDs
- New selection handlers: `collection_type` (sets collectionType, clears center if home), `center_id` (sets center)
- Updated `change_package` to clear inquiry/search state
- Updated `change_location` to clear collection type and center

**EmbeddedComponent.tsx** — Two new switch cases:
- `collection_type_selector` — reuses existing `EmbeddedCollectionMethod` component
- `center_list` — uses new `EmbeddedCenterList` component

**EmbeddedCenterList.tsx** (NEW) — Lab center list component:
- Shows center name, address, rating (star icon), distance in km
- Pre-sorted by distance from backend
- Consistent styling with other embedded components

**EmbeddedBookingSummary.tsx** — Added `onChange` handler to collection row for changing location

### New collected_data Keys
```
package_inquiry_asked: boolean       // Whether user was asked what test they want
packageSearchQuery: string           // What user typed (for filtering)
packageSearchResults: int[]          // Matching package IDs
packageMatchCount: int               // Number of matches found
```

### Bug Fixes Included
- Fixed `ReferenceError: user is not defined` in Conversation.tsx (removed unused `user` prop from MessageBubble)
- Fixed missing family member cards in patient selector (operator precedence bug in EmbeddedComponent.tsx)
- Updated `getPatientSelectorData()` to query real DB family members instead of hardcoded dummy data

---

## Address Selection for Home Collection (January 31, 2026)

Added user address management and address selection step in the lab home collection flow.

### New Flow
```
Patient → Package Search → Package Selection → Collection Type
  → [If Home] Address Selection (new state) → Date+Time → Summary
  → [If Hospital] Center Selection → Date+Time → Summary
```

### Files Created
- `database/migrations/2026_01_31_145001_create_user_addresses_table.php` — Migration for user_addresses table
- `app/Models/UserAddress.php` — Eloquent model with `getFullAddress()`, `scopeActive()`, `belongsTo(User)`
- `resources/js/Features/booking-chat/embedded/EmbeddedAddressSelector.tsx` — Address card selector with saved addresses + "Add new" placeholder

### Files Modified
- `database/seeders/HospitalSeeder.php` — Seeds 3 addresses (Home, Office, Parent's House) for default user
- `app/Services/Booking/BookingStateMachine.php` — Added `address_selection` state, updated `isReadyToBook()`, `getMissingFields()`, `hasField()`, `getCompletenessPercentage()`, `requestChange()` for home address requirement
- `app/Services/Booking/IntelligentBookingOrchestrator.php` — Added `getAddressSelectorData()`, address selection handler, updated summary to show actual address, updated `change_location` to clear address fields
- `resources/js/Features/booking-chat/EmbeddedComponent.tsx` — Wired `address_selector` case

### New Database Table: `user_addresses`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | auto-increment |
| user_id | uuid | FK → users |
| label | string | "Home", "Office", etc. |
| address_line_1 | string | Street address |
| address_line_2 | string (nullable) | Landmark/area |
| city | string | City |
| state | string | State |
| pincode | string | PIN code |
| is_default | boolean | Default address flag |
| is_active | boolean | Soft delete flag |

### New collected_data Keys
```
selectedAddressId: number       // Selected user address ID
selectedAddressLabel: string    // Address label (e.g., "Home")
selectedAddressText: string     // Full address text for summary display
```

---

## Bug Fix: AI Fallback Shows Generic Greeting (January 31, 2026)

When Groq API hits rate limit (HTTP 429), the fallback returns `intent: "unclear"`. The orchestrator treated this as a non-booking intent and showed "I can help you book a doctor appointment or a lab test" even when the conversation already had `booking_type` set from the `start` endpoint.

**Fix**: Added `!empty($currentData['booking_type'])` to the `hasBookingProgress` check in `IntelligentBookingOrchestrator.php`. When `booking_type` is already set (e.g., `lab_test`), the orchestrator skips the greeting and proceeds to the state machine, which shows the correct next component (e.g., patient selector).

---

## AI Provider: Switched to Local Ollama qwen2.5:7b (January 31, 2026)

Switched from Groq cloud API (rate-limited at 100K tokens/day free tier) to local Ollama with qwen2.5:7b for unlimited, free AI inference.

### Why qwen2.5:7b
- Best JSON output reliability among 7B models (trained specifically for structured output)
- Outperforms Llama 3.1 8B on classification benchmarks despite fewer parameters
- Fast inference (~30-40 tok/s on Apple Silicon)
- 4.7 GB download, ~6-7 GB RAM usage
- Ollama's `format: 'json'` parameter enforces valid JSON via grammar-based constrained decoding

### Files Modified
- `app/Services/AI/OllamaProvider.php` — Added `format` parameter support (`json_mode`, `json_schema` options) for Ollama's constrained JSON decoding, updated defaults to qwen2.5:7b
- `app/Services/AI/AIService.php` — Added `json_mode: true` to `classifyIntent()` call
- `config/ai.php` — Changed Ollama defaults from deepseek-r1:7b to qwen2.5:7b, temperature 0.7→0.3
- `.env` — Switched `AI_PROVIDER=ollama`, `OLLAMA_MODEL=qwen2.5:7b`

### Current Providers
| Provider | Model | Status | Notes |
|----------|-------|--------|-------|
| Ollama (local) | qwen2.5:7b | **Active** | Free, unlimited, best JSON reliability at 7B |
| Groq (cloud) | llama-3.3-70b-versatile | Available | 100K tokens/day free tier, faster but rate-limited |
| DeepSeek (cloud) | deepseek-chat | Available | Paid service |

### Switching Providers
```bash
# In .env:
AI_PROVIDER=ollama    # or groq, deepseek, none
OLLAMA_MODEL=qwen2.5:7b
GROQ_MODEL=llama-3.3-70b-versatile
```

### Running Ollama
```bash
ollama serve          # Start service (required before app use)
ollama list           # Check available models
ollama pull qwen2.5:7b  # Download model (~4.7 GB)
```

### Verified Intent Classification Results
| Input | Intent | Confidence | Entities |
|---|---|---|---|
| "I want to book a lab test" | booking_lab | 0.95 | — |
| "Book an appointment with Dr. Sarah" | booking_doctor | 0.9 | doctor_name: "Dr. Sarah" |
| "Hello" | greeting | 0.8 | — |
| "I have a headache and fever" | emergency | 0.95 | symptoms: ["headache", "fever"] |
| "blood test for my mother" | booking_lab | 0.85 | test_type, patient_relation: "mother" |

---

## Bug Fix: AI Not Extracting patient_relation from "for me" (January 31, 2026)

When the user typed "Book an appointment for me on 5th of Feb", the AI (qwen2.5:7b) extracted the date correctly but missed `patient_relation: "self"` from the "for me" phrase. This caused the state machine to show the patient selector ("Who is this appointment for?") instead of auto-selecting "Yourself" and proceeding to the next step.

### Root Cause
1. **Ollama not running** — when the local AI server was down, the fallback returned zero entities, so the patient selector always appeared
2. **Insufficient prompt examples** — the 7B model had only one example for patient_relation in doctor bookings (`"book new appointment for myself"`), which wasn't enough for it to generalize to variations like "for me" combined with other entities

### Fix

**BookingPromptBuilder.php** — Enhanced AI prompt:
- Expanded `patient_relation` extraction notes: `'for me'/'myself'/'I need'/'I want' → 'self', 'for my mother' → 'mother'`
- Added two new examples:
  - `"Book an appointment for me on 5th Feb"` → `{patient_relation: "self", date: "2026-02-05"}`
  - `"I want to see a doctor for my mother"` → `{patient_relation: "mother"}`

**IntelligentBookingOrchestrator.php** — Added regex fallback after AI response:
- If AI misses `patient_relation`, checks for `"for my <relation>"` first (more specific), then `"for me/myself"` (general)
- Family member patterns checked before "self" to avoid false positives (e.g., "I want to book for my mother" must not match as "self")
- Only fires on explicit `"for me/myself"` or `"for my <relation>"` — does not match ambiguous phrases like "I need a doctor" (correctly returns null)

### Verified Results
| Input | patient_relation | Other entities |
|---|---|---|
| "Book an appointment for me on 5th of Feb" | self | date: 2026-02-05 |
| "I want to book for my mother" | mother | — |
| "Book for myself tomorrow" | self | date: tomorrow |
| "I need a doctor appointment" | null (correct) | — |
| "book for my father on Monday" | father | — |

---

## Booking Flow Integration Tests (January 31, 2026)

Created comprehensive integration test suite (`tests/Feature/BookingFlowTest.php`) with 31 tests covering the full AI booking orchestrator flow.

### Test Architecture
- **Mocks only AIService** (external dependency) via Mockery
- Uses real `DoctorService`, `LabService`, `EntityNormalizer`, `BookingPromptBuilder` with seeded DB data
- `RefreshDatabase` + `HospitalSeeder` for realistic test data
- Component selections bypass AI entirely (tested explicitly)

### Test Categories (31 tests, 97 assertions)

| Category | Tests | What's Covered |
|----------|-------|----------------|
| Happy Paths | 3 | Full doctor flow (8 steps), lab home collection, lab center visit |
| Compound Input | 1 | Single message extracts patient, type, doctor, date, time simultaneously |
| Regex Fallback | 2 | patient_relation "for me" → self, "for my mother" → mother when AI misses it |
| Intent Gating | 2 | Greeting with no progress → greeting response; greeting with progress → continues flow |
| Cancellation | 1 | Cancel intent mid-flow sets status=cancelled |
| Summary Changes | 5 | Change doctor, datetime, mode, appointment type, patient from summary |
| Flow Switching | 1 | booking_lab intent switches booking_type mid-doctor-flow |
| Follow-up Flow | 2 | Reason → notes full path; "skip" bypasses notes |
| Lab-Specific | 5 | Package search no-match, change location/package, home requires address, center requires center |
| Architecture | 6 | Component bypass, progress tracking, message persistence, auto-mode, entity merging, mixed input |

### Running
```bash
# Booking flow tests only (31 tests)
php artisan test --filter=BookingFlowTest

# All booking tests (31 + 19 state machine tests)
php artisan test --filter=Booking
```

### Key Helper Methods
- `conversation(type, data)` — Creates BookingConversation with seeded user
- `mockAI(intent, entities, confidence)` — Queues a single AI mock response
- `getAvailableDateForDoctor(doctorId)` — Finds a real available date from DB
- `summaryConversation()` — Pre-built conversation at summary step

---

**Last Updated**: January 31, 2026
**Status**: Dashboard Complete | AI Booking Flow Complete | Guided Booking Flow Complete | Calendar Integration Complete | Critical Bug Fixes Applied | AI Entity Extraction Refactored | Hospital Database Created | Lab Test AI Chat Flow Added | Lab Flow Redesigned with Smart Search | Address Selection Added | Ollama Local AI Ready | Patient Relation Extraction Fixed | Integration Tests Added (31 tests)
