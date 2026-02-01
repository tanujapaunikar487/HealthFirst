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

### Test Categories (32 tests, 103 assertions)

| Category | Tests | What's Covered |
|----------|-------|----------------|
| Happy Paths | 3 | Full doctor flow (8 steps), lab home collection, lab center visit |
| Compound Input | 1 | Single message extracts patient, type, doctor, date, time simultaneously |
| Regex Fallback | 3 | patient_relation "for me" → self, "for my mother" → mother, ambiguous input → no match |
| Intent Gating | 2 | Greeting with no progress → greeting response; greeting with progress → continues flow |
| Cancellation | 1 | Cancel intent mid-flow sets status=cancelled |
| Summary Changes | 6 | Change doctor, datetime, mode, appointment type, patient, address from summary |
| Flow Switching | 2 | booking_lab switches mid-doctor-flow, booking_doctor sets type |
| Follow-up Flow | 2 | Reason → notes full path; "skip" bypasses notes |
| Lab-Specific | 5 | Package search no-match, change location/package, home requires address, center requires center |
| Architecture | 7 | Component bypass, progress tracking, message persistence, auto-mode, entity merging, mixed input, empty start |

### Running
```bash
# Booking flow tests only (32 tests)
php artisan test --filter=BookingFlowTest

# All booking tests (32 + 19 state machine tests)
php artisan test --filter=Booking
```

### Key Helper Methods
- `conversation(type, data)` — Creates BookingConversation with seeded user
- `mockAI(intent, entities, confidence)` — Queues a single AI mock response
- `getAvailableDateForDoctor(doctorId)` — Finds a real available date from DB
- `summaryConversation()` — Pre-built conversation at summary step

---

## Inline Form Components: Add Family Member & Add Address (February 1, 2026)

Added inline form components to the booking chat flow, allowing users to add new family members and addresses directly without leaving the conversation.

### Add Family Member / Guest

Users can click "Add family member or guest →" from the patient selector to add a new member inline.

**Flow**: Patient selector → click "Add" → inline form (name, relation, age, gender) → submit → member created in DB, auto-selected → flow advances

**Files Created**:
- `resources/js/Features/booking-chat/embedded/EmbeddedFamilyMemberForm.tsx` — Inline form with Name (required), Relation dropdown (required), Age (optional), Gender (optional)

**Files Modified**:
- `EmbeddedComponent.tsx` — Added `family_member_form` switch case, wired `onAddMember` callback in PatientSelector
- `IntelligentBookingOrchestrator.php` — `add_family_member` handler (shows form), `new_member_name` handler (creates FamilyMember record + auto-selects)

### Add New Address

Users can click "Add new address" from the address selector during lab home collection. If no addresses exist, the form appears automatically.

**Flow**: Address selector → click "Add new address" → inline form (label, address, city, state, pincode) → submit → address created in DB, auto-selected → flow advances to date/time

**Files Created**:
- `resources/js/Features/booking-chat/embedded/EmbeddedAddressForm.tsx` — Inline form with Label, Address Line 1, Address Line 2 (optional), City, State, Pincode

**Files Modified**:
- `EmbeddedAddressSelector.tsx` — Added `onAddAddress` prop, replaced `alert()` placeholder
- `EmbeddedComponent.tsx` — Added `address_form` switch case, wired `onAddAddress` in address_selector
- `EmbeddedBookingSummary.tsx` — Wired `onChange` on Address summary row (`change_address` selection)
- `IntelligentBookingOrchestrator.php` — `add_address` handler (shows form), `new_address_label` handler (creates UserAddress record), `change_address` handler (clears address + downstream, keeps collectionType), auto-show form when no addresses exist

### Design Pattern
Both features follow the same pattern:
1. Button in selector sends `{ add_family_member: true }` or `{ add_address: true }` as a component selection
2. Orchestrator short-circuits `handleComponentSelection()` and returns the form component
3. Form submission sends field data as another component selection
4. Orchestrator creates DB record, auto-selects it, falls through to state machine
5. No new routes, controllers, state machine states, or migrations needed

### New collected_data Handlers
- `add_family_member` → shows `family_member_form` component
- `new_member_name` + `new_member_relation` → creates FamilyMember, sets patient fields
- `add_address` → shows `address_form` component
- `new_address_label` + `new_address_line_1` → creates UserAddress, sets address fields
- `change_address` → clears address + date/time, preserves collectionType='home'

---

## Individual Lab Test Booking in AI Chat (February 1, 2026)

Added the ability to book individual lab tests (not just health packages) through the AI chat flow. When a user searches for a specific test (e.g., "CBC", "thyroid"), the system now searches both packages and individual tests, showing results from both categories.

### What Changed

**LabService.php** — Added 3 new methods:
- `searchTests(string $query)` — Keyword + alias scoring against `lab_test_types` table (same pattern as `searchPackages`)
- `getTestById(int $id)` — Fetch single test as array
- `testToArray(LabTestType $test)` — Model-to-array converter

**BookingStateMachine.php** — Updated all package/test checks to also consider `selectedTestIds`:
- `determineLabState()`, `isReadyToBook()`, `getMissingFields()`, `hasField('package')`, `requestChange('package')`
- `getLabDateTimeMessage()` — Shows test name(s) or "X tests" in the scheduling prompt
- `getPackageSelectionMessage()` — Context-aware messages for test+package combined results

**IntelligentBookingOrchestrator.php** — Major updates:
- Package inquiry handler now searches both `searchPackages()` and `searchTests()` in parallel
- Auto-select logic: 1 test + 0 packages → auto-selects as `selectedTestIds: [id]`, `selectedTestNames: [name]`
- `test_ids` selection handler: iterates array, resolves names, computes max fasting hours across all tests
- `getPackageListData()` returns both packages and `individual_tests` arrays
- `buildLabSummaryData()` joins test names with commas, calculates fee for all selected tests
- `change_package` handler clears `selectedTestIds`, `selectedTestNames`

**EmbeddedPackageList.tsx** — Complete rewrite with tab UI:
- Two tabs: "Pick Tests" (default when tests exist) / "Health Packages"
- Tests tab: multi-select checkboxes with running total, "Continue with N tests — ₹X" confirm button
- Packages tab: unchanged single-select with instant "Book" buttons
- Tab switcher only shown when both tests and packages are available
- If only tests or only packages: shown directly without tabs

**EmbeddedComponent.tsx** — Updated `package_list` case:
- Passes `selectedTestIds` (array) and `onSelectTests` (array callback)
- Display message shows comma-separated test names

### Data Model Changes (collected_data)

```
selectedTestIds: number[]       // Array of selected test IDs
selectedTestNames: string[]     // Array of selected test names
testSearchResults: int[]        // Matching test IDs from search
testMatchCount: int             // Number of matching tests
```

### Tests
- 3 existing individual test tests updated to use array format (`selectedTestIds`/`selectedTestNames`)
- 1 new test: `test_multi_test_selection_sums_fees` — selects 2 tests, verifies fee is sum of both prices
- Total: 36 tests, 121 assertions (all passing)

---

## Guided Doctor Flow UX Improvements (February 1, 2026)

Major UX overhaul of the guided doctor booking flow, improving step organization, date selection, and doctor availability visibility.

### Move Urgency from PatientStep to DoctorTimeStep

Moved the "How soon do you need to see a doctor?" urgency selection from step 1 (PatientStep) to step 2 (DoctorTimeStep), where it logically belongs — urgency directly affects which dates and doctors are shown.

**PatientStep.tsx** — Removed:
- `UrgencyOption` interface, `urgencyOptions` prop, `urgency` state, `showUrgency` state
- Urgency JSX section and all urgency-related handlers (`handleSymptomContinue`, `handlePreviousDoctorsContinue`)
- Removed intermediate "Continue" buttons between sections — sections now auto-advance on selection
- Added inline "Add family member" form with AJAX endpoint (`/booking/doctor/add-family-member`)

**DoctorTimeStep.tsx** — Added:
- `UrgencyOption` interface, `urgencyOptions` prop (with `= []` default), `urgency` state
- Urgency validation in `handleContinue`, urgency in POST payload
- `continueDisabled` includes `!urgency`
- `handleUrgencyChange()` — resets doctor/time/mode, sets date per urgency type

**GuidedDoctorController.php** — Moved `urgencyOptions` from `patient()` to `doctorTime()`, moved urgency validation from `storePatient()` to `storeDoctorTime()`. Changed `doctorTime()` guard from checking `urgency` to checking `patientId`. Added `addFamilyMember()` AJAX endpoint.

### Dynamic Date Selection by Urgency

Date selection in DoctorTimeStep responds to urgency choice:
- **Urgent**: No date picker, auto-selects today with "Showing today's availability" note
- **This Week**: 7 date pills (extended from 5), each showing doctor count
- **Specific Date**: Native date input with Calendar icon, min=today

### Doctor Availability on Dates

Added doctor count per date and empty state handling across both booking flows:

**Guided flow** (DoctorTimeStep.tsx):
- Date pills show `doctorCount` per date, 0-doctor dates dimmed with dashed border
- Empty state Card when `filteredDoctors.length === 0`: "No doctors available on this date"

**AI chat flow** (EmbeddedComponent.tsx):
- `doctor_selector` case: Empty state when 0 doctors
- `date_doctor_selector` case: Doctor count on date pills, empty state when filtered doctors = 0

**Backend** (GuidedDoctorController.php, IntelligentBookingOrchestrator.php):
- Both query `doctor_availabilities` to count available doctors per day_of_week
- `doctorCount` / `doctor_count` included in date option arrays

### Fix: Auth Error in Guided Flows

Added `?? \App\User::first()` fallback to all `Auth::user()` calls in `GuidedDoctorController` and `GuidedLabController` for demo/development mode.

### Fix: Progress Bar Styling

Simplified the progress bar in `Conversation.tsx` from a labeled bar with percentage to a minimal 1px bar.

### Fix: TimeSlot SQLite Date Comparison (Bug Fix #21)

`TimeSlot::where('date', $selectedDate)` returned 0 results on SQLite because the `date` column stores datetime values (e.g., `2026-01-31 00:00:00`) and SQLite doesn't auto-cast `'2026-01-31'` to match. Fixed by using `whereDate('date', $selectedDate)` which properly extracts the date part for comparison. This caused doctors to appear with no time slots in the guided flow.

---

## Enforce 2-Week Maximum Booking Window (February 1, 2026)

Both booking flows now consistently enforce a 14-day maximum booking window.

### Guided Flow
- **DoctorTimeStep.tsx**: Added `max` attribute on the "Specific date" date input (14 days from today). Browser blocks dates beyond 2 weeks. Added helper text: "You can book up to 2 weeks in advance."
- **GuidedDoctorController.php**: Added `before_or_equal:` + 14 days validation rule on `selectedDate` in `storeDoctorTime()` as backend safety net.

### AI Chat Flow
- **EntityNormalizer.php**: Already enforced 14-day limit, but warning messages said "within the next week". Updated both past-date and too-far-out messages to say "within the next 2 weeks."
- **BookingPromptBuilder.php**: Added "Only within next 14 days" to the date extraction rule so the AI is aware of the constraint.

---

## Guided Lab Flow: Smart Search, Expandable Cards, Symptom Mapping (February 1, 2026)

Enhanced the guided lab test search with symptom-aware search, expandable detail cards, and improved UX.

### Smart Search with Symptom Mapping
- **LabService.php**: Added 20+ symptom-to-test aliases (nausea→LFT/KFT/CBC, headache→CBC/thyroid, fatigue→CBC/thyroid/vitamins, fever→CBC/CRP/urine, etc.) and symptom-to-package aliases (fatigue→complete-health-checkup, chest pain→heart-health)
- **GuidedLabController.php**: `searchTests()` detects symptom queries via keyword list, returns `isSymptomQuery` flag. Resolves package `test_ids` to actual test names via single DB query.
- **TestSearchStep.tsx**: Shows blue info banner for symptom queries. Improved empty state with suggestion chips. Dynamic footer button label ("Continue with N tests — ₹X" or package name).

### Expandable Detail Cards
- **EmbeddedPackageList.tsx**: Inline expandable cards for both packages and tests.
  - Package expanded view: savings highlight ("You save ₹X"), included tests grid (2-col), preparation notes
  - Test expanded view: fasting preparation details (hours, water allowed)
  - ChevronRight→ChevronDown toggle, one expanded at a time per category
- **Package interface** extended with `preparation_notes`, `requires_fasting`, `fasting_hours`, `included_test_names`
- **LabService.php**: Added `test_ids` to `packageToArray()` return

### Guided Mode for EmbeddedPackageList
- Added `mode` prop ('chat' | 'guided') and `onCheckedChange` callback
- In guided mode: confirm button hidden (footer handles it), tests remain toggleable, checked tests float to top

---

## Remove Urgency, Reorder Lab Schedule, Full Collection Flow (February 1, 2026)

Removed the "How soon do you want your test done?" urgency step from both guided doctor and lab flows, reordered the lab schedule sections, and implemented full address/center selection matching the AI chat flow.

### Remove Urgency from Both Flows
- **DoctorTimeStep.tsx**: Removed urgency state, UI section, and POST payload. Shows 14 date pills directly with doctor counts. `continueDisabled` no longer depends on urgency.
- **GuidedDoctorController.php**: Removed `urgencyOptions` from `doctorTime()`, removed urgency validation from `storeDoctorTime()`, extended date generation from 7 to 14 days.
- **ScheduleStep.tsx**: Removed urgency state and conditional visibility. Date and time shown directly on page load.
- **GuidedLabController.php**: Removed `urgencyOptions` from `schedule()`, removed urgency validation from `storeSchedule()`, extended dates from 5 to 14.

### Reorder Lab Schedule Sections
New order: Banner → Date (14 pills) → Time → Collection Type → Address/Center Selection

### Full Collection Flow with Address & Center Selection
Replaced the simplified `LocationSelector` (which only stored 'home'/'center' type) with the same components used in the AI chat flow.

**ScheduleStep.tsx** — Complete rewrite:
- Collection type selector with Home/Center cards (icons, fee display, check indicator)
- **Home Collection**: `EmbeddedAddressSelector` shows saved addresses, "Add new address" opens `EmbeddedAddressForm` inline, form POSTs to `/booking/lab/add-address`, auto-selects new address
- **Hospital Visit**: `EmbeddedCenterList` shows lab centers with name, address, rating, distance
- Continue disabled until address/center selected based on collection type
- POST payload: `selectedLocation`, `selectedDate`, `selectedTime`, `selectedAddressId` (home), `selectedCenterId` (center)

**GuidedLabController.php**:
- `schedule()` passes `userAddresses` and `labCenters` as Inertia props
- `storeSchedule()` validates `selectedAddressId` (exists:user_addresses) and `selectedCenterId` (exists:lab_centers) conditionally
- `addAddress()` AJAX endpoint: creates `UserAddress` record, returns JSON
- `confirm()` resolves actual address text or center name for display

**routes/web.php**: Added `POST /booking/lab/add-address`

**ConfirmStep.tsx**: Shows actual center name (e.g. "Visit Center — HealthFirst Diagnostics") and resolved address text

### New Session Data Keys (guided_lab_booking)
```
selectedAddressId: int          // User address ID for home collection
selectedCenterId: int           // Lab center ID for hospital visit
```

---

## Package/Test UX Polish (February 1, 2026)

Three UX improvements to the lab test/package selection and scheduling flow.

### Contextual Info Badges on Cards

**EmbeddedPackageList.tsx** — Added inline pill badges below descriptions (always visible, no expand needed):
- **Packages**: duration (`2-3 hrs`), tests count (`12 tests`), fasting (`10h fasting` in orange), age range
- **Tests**: turnaround time (`Report in 10h`), fasting (`8h fasting` in orange), category
- Style: `text-xs bg-muted px-2 py-0.5 rounded-full`, fasting uses `bg-orange-50 text-orange-700`

### Unified Selection UX

**EmbeddedPackageList.tsx** — Replaced the "Book"/"Selected" button on packages with the same checkbox-style selection used for tests:
- CheckSquare/Square icons instead of Button component
- `bg-primary/5` row highlight on selection (replaced blue left-border)
- Expand chevron moved to dedicated column (same layout as test cards)
- Packages remain single-select, tests remain multi-select

### Removed Pre-Selected Banner from ScheduleStep

**ScheduleStep.tsx** — Deleted the blue banner (Section 1) that showed selected test/package name, price, and "Change" button at the top of step 3. Removed 7 props (`hasPreSelectedPackage`, `hasPreSelectedTests`, `preSelectedPackageName`, `preSelectedTestNames`, `preSelectedPrice`, `preSelectedRequiresFasting`, `preSelectedFastingHours`), `getPriceEstimate()`, `priceEstimate`, and `preSelectionName`. Kept `FastingAlert` with simplified `requiresFasting`/`fastingHours` props.

**GuidedLabController.php** — Simplified `schedule()` to only compute and pass `requiresFasting` and `fastingHours` instead of the full banner data.

---

## My Appointments Page (February 1, 2026)

Built a full-featured appointments management page at `/appointments` with tabbed views, action sheets, and inline appointment management.

### Core Page Structure
**File**: `resources/js/Pages/Appointments/Index.tsx` (NEW)

- Three tabs: Upcoming, Past, Cancelled — each with filtered appointment table
- shadcn Table component with columns: Appointment (icon + title + subtitle), Patient, Date & Time, Mode, Fee + Payment Status, Actions
- Client-side search bar (filters across title, patient_name, subtitle) positioned right of filter row
- Table cells aligned `align-top` for consistent row layout

### Payment Status Tags
- Colored text (no background): paid=`text-green-600`, pending=`text-amber-600`, partially_refunded=`text-amber-600`, fully_refunded=`text-red-600`
- Displayed below the fee amount in each row

### Action Sheets (Side Sheets, not Modals)
Platform-wide UX decision: use sheets instead of modals for quick actions.

**DetailsSheet** — Shows full appointment details with contextual actions:
- Upcoming: Primary button = "Reschedule", 3-dot dropdown with Share + Cancel
- Past: Primary button = "Book Again", 3-dot dropdown with Share
- Cancelled: Primary button = "Book Again" only

**CancelSheet** — Warning banner, 5 selectable reason options, destructive cancel button. Calls `POST /appointments/{id}/cancel` via Inertia `router.post()`.

**RescheduleSheet** — Guided-flow-style date pills + time slot pills:
- Date pills: `bg-foreground text-background` when selected, `rounded-xl`, `min-w-[100px]`
- Time slots: `rounded-full`, `bg-foreground text-background` when selected
- Fetches available slots via `GET /appointments/{id}/available-slots?date=`
- Calls `POST /appointments/{id}/reschedule`

**ShareSheet** — Appointment summary preview, Copy to Clipboard with checkmark feedback, WhatsApp share button.

### Toast Notifications
- Cancel success: "Appointment cancelled. Refund initiated."
- Reschedule success: "Appointment rescheduled successfully."
- Auto-dismiss after 3 seconds

### Backend: AppointmentsController
**File**: `app/Http/Controllers/AppointmentsController.php` (NEW)

| Method | Route | Purpose |
|--------|-------|---------|
| `index()` | `GET /appointments` | List all appointments with family members and doctors for filters |
| `cancel()` | `POST /appointments/{id}/cancel` | Cancel confirmed appointment, set payment_status='fully_refunded' |
| `reschedule()` | `POST /appointments/{id}/reschedule` | Update date/time (validated: after today, within 14 days) |
| `availableSlots()` | `GET /appointments/{id}/available-slots` | Return dates (filtered by doctor availability) + time slots |
| `bookAgain()` | `GET /appointments/{id}/book-again` | Pre-fill session and redirect to guided booking flow |
| `showConfirmation()` | `GET /booking/confirmation/{id}` | Show booking confirmation (replaces old mock route) |

### Database Changes

**Migration**: `2026_02_01_300001_add_payment_status_to_appointments_table.php`
- Added `payment_status` (default: 'paid') and `cancellation_reason` (nullable) columns

**Migration**: `2026_02_01_200001_add_lab_fields_to_appointments_table.php`
- Added lab-related columns: `lab_package_id`, `lab_test_ids`, `collection_type`, `lab_center_id`, `user_address_id`

**Appointment model** — Added `payment_status`, `cancellation_reason`, `lab_test_ids`, `lab_package_id`, `collection_type`, `lab_center_id`, `user_address_id` to fillable. Added `labPackage()`, `labCenter()`, `userAddress()` relationships. Added `lab_test_ids` array cast.

**HospitalSeeder** — Added 3 new seed appointments (2 upcoming confirmed, 1 cancelled) with `payment_status` values. All existing appointments now include `payment_status`.

### Guided Flow → Real Appointment Records

**GuidedDoctorController.php** — `processPayment()` now creates a real `Appointment` record in DB (previously just cleared session and redirected with a fake ID). Calculates fee from doctor consultation modes.

**GuidedLabController.php** — `processPayment()` now creates a real `Appointment` record. Calculates fee from package price or sum of individual test prices + home collection fee.

### Confirmation Page Improvements

**Booking/Confirmation.tsx** — Replaced mock data route with `AppointmentsController::showConfirmation()` that loads real appointment from DB. Added "Book Another Appointment" button below "View My Appointments".

**routes/web.php** — Replaced inline mock confirmation closure with controller method. Added 5 appointment management routes.

### Dynamic Sidebar & Header

**AppLayout.tsx** — Added `pageTitle` and `pageIcon` optional props. Header dynamically shows page-specific title/icon. Sidebar now uses `usePage().url` for active link detection instead of hardcoded `active` prop on Home.

### Other Improvements

**ScheduleStep.tsx** (Lab guided flow) — Time section now hidden until a date is selected. Auto-scrolls to time section on date selection. Removed auto-selecting first date on mount.

**IntelligentBookingOrchestrator.php** — `getPackageListData()` now resolves `included_test_names` from `test_ids` JSON, and includes `preparation_notes` for each package.

### New UI Components
- `resources/js/Components/ui/sheet.tsx` — shadcn Sheet (side drawer) built on `@radix-ui/react-dialog`
- `resources/js/Components/ui/table.tsx` — shadcn Table component
- `resources/js/Components/ui/tabs.tsx` — shadcn Tabs component

---

## Appointment Detail Page (February 1, 2026)

Full-page past appointment details screen at `/appointments/{id}` with sticky side navigation and 10 sections.

### Route & Controller

**routes/web.php** — `GET /appointments/{appointment}` → `AppointmentsController@show`

**AppointmentsController.php** — `show()` method:
- Authorization check (`$appointment->user_id !== $user->id` → 403)
- Eager loads doctor, familyMember, labPackage, labCenter, userAddress, department
- `formatDetailedAppointment()` extends `formatAppointment()` with mock medical data:
  - Doctor details (name, specialization, qualification, rating, avatar)
  - Patient details (name, relation, age, gender, blood_group)
  - 7 vitals (BP, Pulse, Weight, Height, BMI, SpO2, Temperature) with status/reference
  - Clinical summary (diagnosis with ICD code, 8 subsections: chief complaint, HPI, PMH, family history, allergies, social history, examination, assessment, treatment plan)
  - 4 prescriptions (drug, strength, dosage, frequency, duration, purpose, status)
  - 3 lab tests (name, reason, status, result, is_normal)
  - Billing breakdown (consultation fee, platform fee, GST, discount, total, payment method)
  - 2-3 documents (Prescription, Visit Summary, Lab Report PDFs)
  - Activity timeline (booked → payment → check-in → consultation → prescription → lab order → follow-up)
  - Follow-up info (recommended date + notes)

### Frontend: Show.tsx

**File**: `resources/js/Pages/Appointments/Show.tsx` (NEW)

10 sub-components: SideNav, OverviewSection, VitalsSection, ClinicalSummarySection, PrescriptionsSection, LabTestsSection, BillingSection, DocumentsSection, ActivitySection, FooterActions

**Sticky Side Navigation**:
- Left column (w-56), sticky at `top: 100px`
- IntersectionObserver tracks which section is in view → highlights active nav item
- Smooth scroll on click (`scrollIntoView({ behavior: 'smooth' })`)

**Edge Cases**:
- **Skeleton loading**: Full-page skeleton when `appointment` is null/undefined (pulse animation placeholders)
- **Empty states**: Lab tests, documents, activity sections show "No X available" with icon when data is empty
- **CollapsibleRow**: Skips rendering when content is empty string; auto-expands on print
- **PDF preview**: Sheet component opens on document row click, shows placeholder preview with Download/Close buttons
- **Share button**: Copies appointment URL to clipboard, shows toast feedback
- **Download invoice**: Generates text blob with billing details, triggers browser download
- **Print CSS**: `@media print` hides nav, header, CTAs; expands all collapsed rows; shows allergies prominently

### Global Error Page

**File**: `resources/js/Pages/Error.tsx` (NEW)
- Handles 403 (ShieldX icon, "Access Denied", Go Back), 404 (FileQuestion, "Page Not Found", Go Back), 500 (ServerCrash, "Something Went Wrong", Try Again)
- Fallback for unknown status codes (AlertTriangle)
- Centered layout, no sidebar

**bootstrap/app.php** — Wired via Laravel exception handler:
```php
$exceptions->respond(function (Response $response) {
    if (in_array($status, [403, 404, 500, 503]) && !request()->expectsJson()) {
        return Inertia::render('Error', ['status' => $status]);
    }
});
```

### Error Toast on Reschedule/Cancel

**Index.tsx** — Added `onError` callback to CancelSheet and RescheduleSheet:
- Fetch failures (available slots load) → error toast
- `router.post` failures (cancel/reschedule) → error toast with `onError` callback
- All error messages surface via the existing Toast component

### Past Appointments Navigate Directly to Detail Page

**Index.tsx** — Past and cancelled appointment rows are clickable → `router.visit(/appointments/{id})`:
- Table rows get `cursor-pointer` class and `onClick` handler for non-upcoming tabs
- Actions menu cell uses `stopPropagation` to prevent row click
- "View Details" in dropdown also navigates directly for past/cancelled (side sheet only for upcoming)

---

## Billing Pages (February 1, 2026)

Full billing management system with list page, detail page, and payment summary modal.

### Files Created
- `app/Http/Controllers/BillingController.php` — Controller with `index()` and `show()` methods
- `resources/js/Pages/Billing/Index.tsx` — Billing list page with full feature set
- `resources/js/Pages/Billing/Show.tsx` — Invoice detail page

### Files Modified
- `routes/web.php` — Added `/billing` and `/billing/{appointment}` routes
- `resources/js/Pages/Appointments/Show.tsx` — Added "View Full Bill" cross-link in BillingSection

### Architecture
- No separate billing database tables — all billing data is mock-generated from `Appointment` records
- Each appointment produces one bill with invoice number format `INV-000001`
- `BillingController` queries `Appointment` model and formats data as bills
- Bidirectional navigation between Appointments and Billing pages

### BillingController
- `getBillingStatus()` — Maps 4 real `payment_status` values (paid, pending, fully_refunded, partially_refunded) to 10 billing statuses using deterministic index-based variation
- `computeAmountDetails()` — Calculates `due_amount`, `insurance_covered`, `emi_current/emi_total` per status
- Props: `bills`, `stats` (outstanding count/total), `familyMembers` (for filter dropdown)
- Bill fields: `billing_status`, `due_amount`, `original_amount`, `insurance_covered`, `emi_current`, `emi_total`, `patient_id`, `time`

### 10 Billing Status Types

| Status | Label | Color | Source payment_status |
|--------|-------|-------|----------------------|
| due | Due | red | pending |
| paid | Paid | green | paid |
| refunded | Refunded | gray | fully_refunded |
| awaiting_approval | Awaiting Approval | orange | pending |
| claim_pending | Claim Pending | orange | pending |
| copay_due | Co-pay Due | red | pending |
| emi | EMI X/Y | blue | paid |
| disputed | Disputed | red | partially_refunded |
| covered | Covered | green | paid |
| reimbursed | Reimbursed | green | paid |

### Billing List Page (Index.tsx)
- **Tabs**: All / Outstanding / Paid (Outstanding = due + copay_due + awaiting_approval + claim_pending + emi; Paid = paid + covered + reimbursed)
- **Outstanding summary card**: Count + total with "Pay All" CTA (mock toast)
- **Filters**: Status dropdown (10 types), Family member dropdown, Search (invoice #, title, patient name)
- **Table columns**: Checkbox, Date & time, Description (type icon + title + invoice #), Patient, Amount (struck-through original for partial), Status tag, Actions (3-dot)
- **Multi-select checkboxes**: Only enabled for `due`/`copay_due`; floating bar shows "X bills selected" + "Pay ₹X" CTA
- **Contextual row actions**: View Details, Download Invoice, Pay Now (due/copay_due), Raise Dispute (paid/disputed), Request Reimbursement Letter (paid), View Insurance Claim (claim_pending/awaiting_approval/covered)
- **Pagination**: 10 items per page with page numbers and prev/next
- **Empty state**: FileText icon + "No records yet" + "Book Appointment" CTA
- **Footer**: "Need help with billing? Contact support →"

### Payment Summary Modal
- Right-side Sheet triggered by clicking a payable row (due/copay_due) or "Pay Now" dropdown action
- Shows: Patient avatar + name, service description with type icon, reference ID, date, amount (with "of ₹X" for partial co-pay)
- Primary CTA: "Pay ₹[amount]" button (mock toast)

### Invoice Detail Page (Show.tsx) — Full Rewrite
- Breadcrumb navigation back to billing list
- Status badge + contextual action buttons in header
- **Overview section**: 2-column grid with patient, service type, invoice #, amount, due date, payment method
- **Service Details section**: Doctor/lab info, consultation mode, department
- **Itemized Charges table**: Item / Qty / Unit Price / Total columns
- **Payment Information** (conditional): method, transaction ID, payment date
- **Insurance Details** (conditional): provider, policy, claim status, coverage, co-pay
- **EMI Details** (conditional): progress bar, installment X/Y, monthly amount, next due date
- **Dispute Information** (conditional): reason, status, filed date
- **Activity Log**: Vertical timeline with status-specific events
- **Footer Actions**: Contextual per billing status (Pay/Dispute/Download)

---

## Bill Detail Page Rewrite (February 1, 2026)

Complete rewrite of `Billing/Show.tsx` from a basic invoice layout to a comprehensive bill detail page with all billing status contexts.

### `BillingController::formatBillDetail()`
Returns rich data structure: `billing_status`, overview fields, service details, `line_items` with qty/unit_price, `payment_info`, `insurance_details`, `emi_details`, `dispute_details`, `activity_log`. Each section is conditionally populated based on billing status.

### `buildActivityLog()`
Generates timeline events based on billing status — e.g., "Bill Generated", "Payment Received", "Insurance Claim Filed", "Dispute Raised", etc.

---

## Pay All Flow (February 1, 2026)

Enhanced the Payment Summary Sheet in `Billing/Index.tsx` to support paying multiple bills at once.

### Behavior
- "Pay All" button in outstanding summary opens the payment sheet with ALL outstanding bills
- Each bill card has a checkbox — users can uncheck bills they don't want to pay
- Last remaining bill's checkbox is disabled (must pay at least one)
- Dynamic subtitle: "X of Y bills selected" when some are unchecked
- Processing state: Loader2 spinner + "Processing..." disabled CTA
- Success state: Green CheckCircle2 + "Payment Successful" + "Done" button
- Sheet close prevented during processing

### Implementation
- `excludedPayBillIds: Set<number>` state tracks unchecked bills
- `paymentState: 'idle' | 'processing' | 'success'` state machine
- `activePayBills` derived from filter, totals recalculated dynamically
- 2s simulated processing delay (mock)

---

## Edge Cases & Validation Banners (February 1, 2026)

Added status-aware validation banners and edge case handling across both billing pages.

### Backend: `BillingController.php`
Added `is_overdue` + `days_overdue` to both `formatBillSummary()` and `formatBillDetail()`:
- `is_overdue`: true when bill is due/copay_due AND >30 days past appointment date
- `days_overdue`: days since due date (appointment_date + 7 days), 0 if not overdue

### Index.tsx (List Page)
- **Overdue indicator**: "Overdue Xd" sub-label below status badge for overdue bills
- **EMI dropdown action**: "View EMI Schedule" navigating to `/billing/{id}`
- **Payment sheet overdue warning**: Red inline warning for overdue bills

### Show.tsx (Detail Page)
- **StatusAlertBanner component**: 11 variants covering all billing statuses:
  - `due` (normal/overdue), `copay_due` (normal/overdue): Blue/Red with payment info
  - `awaiting_approval`, `claim_pending`: Amber "Insurance Pending" / "Claim Submitted"
  - `disputed`: Red "Bill Under Dispute" — payment disabled
  - `refunded`: Gray "Refund Processed"
  - `emi`: Blue "EMI Active" with installment progress
  - `covered`, `reimbursed`: Green "Fully Covered" / "Reimbursed"
  - `paid`: No banner
- **EMI-specific CTA**: "Pay EMI ₹X" showing monthly amount (not full) in header + footer
- **Overdue badge**: Red "{X}d overdue" pill next to Due Date in Overview

---

## Billing Notifications (February 1, 2026)

Added a notification system for billing events with seeded mock data and a side sheet UI.

### Database
- **Migration**: `billing_notifications` table (id, user_id UUID FK, appointment_id nullable FK, type, title, message, channels JSON, data JSON, read_at nullable, timestamps)
- **Model**: `App\Models\BillingNotification` with array casts, `scopeUnread()`, `markAsRead()`
- **User relationship**: `billingNotifications()` HasMany added to `App\User`

### Seed Data (15 notifications, 7 unread)
Tied to the 7 seeded appointments covering all 8 notification types:

| Type | Channels | Icon | Color |
|------|----------|------|-------|
| bill_generated | push, email | Receipt | Blue |
| payment_due_reminder | push, email | Clock | Amber |
| payment_successful | push, email, sms | CheckCircle2 | Green |
| payment_failed | push, email | XCircle | Red |
| insurance_claim_approved | push, email | ShieldCheck | Green |
| insurance_claim_rejected | push, email | ShieldAlert | Red |
| dispute_update | push, email | MessageSquare | Amber |
| emi_due_reminder | push, email | CreditCard | Blue |

### Backend
- **NotificationController**: `markAsRead(BillingNotification)` + `markAllAsRead()` (bulk update)
- **Routes**: `POST /notifications/{billing_notification}/read`, `POST /notifications/mark-all-read`
- **HandleInertiaRequests**: Shares `notificationUnreadCount` (int) and `allNotifications` (array) globally on every page

### Frontend — Bell Side Sheet (AppLayout.tsx)
- Bell icon in header with **red dot badge** when unread count > 0
- Click opens a **right-side Sheet** with:
  - Header: "Notifications" title + unread count badge + "Mark all read" button
  - Filter tabs: All / Unread (with count)
  - Scrollable notification cards: type-specific colored icon, title, message, channel badges (Push/Email/SMS), time ago, blue unread dot
  - Unread cards have blue-tinted background
  - Empty state when no notifications
- Click notification → marks as read + navigates to `/billing/{appointment_id}`

### Files Created
| File | Purpose |
|------|---------|
| `database/migrations/2026_02_01_400001_create_billing_notifications_table.php` | Migration |
| `app/Models/BillingNotification.php` | Eloquent model |
| `app/Http/Controllers/NotificationController.php` | Mark read/all read |

### Files Modified
| File | Changes |
|------|---------|
| `app/User.php` | Added `billingNotifications()` relationship |
| `database/seeders/HospitalSeeder.php` | Added `seedBillingNotifications()` with 15 entries |
| `app/Http/Middleware/HandleInertiaRequests.php` | Shares `notificationUnreadCount` + `allNotifications` |
| `resources/js/Layouts/AppLayout.tsx` | Bell → Sheet with notification list, filter tabs, mark-all-read |
| `routes/web.php` | 2 notification POST routes |

---

## Health Records Page (February 1, 2026)

Full health records management page at `/health-records` with table-based list view, server-computed status badges, filtering, bulk actions, and 21 category-specific detail sheet templates.

### Database

**Migration**: `2026_02_01_500001_create_health_records_table.php`
- Columns: id, user_id (UUID FK), appointment_id (nullable FK), family_member_id (nullable FK), category, title, description, doctor_name, department_name, record_date, metadata (JSON), file_url, file_type, timestamps
- Indexes on [user_id, category], [user_id, record_date], [appointment_id]
- Flexible JSON `metadata` column stores category-specific data without schema changes

**Model**: `App\Models\HealthRecord` with `metadata` (array) and `record_date` (date) casts, relationships to User, Appointment, FamilyMember, `scopeForCategory()`.

**User model**: Added `healthRecords(): HasMany` relationship.
**Appointment model**: Added `healthRecords(): HasMany` relationship.

### 21 Record Categories (4 Groups)

**Reports** (8): lab_report, xray_report, mri_report, ultrasound_report, ecg_report, pathology_report, pft_report, other_report
**Visits** (6): consultation_notes, procedure_notes, discharge_summary, er_visit, referral, other_visit
**Medications** (3): prescription, medication_active, medication_past
**Documents** (4): vaccination, medical_certificate, invoice, uploaded_document

### Seed Data (42 records)

Tied to 4 completed appointments + standalone records:
- Appointment 1 (Viral Fever): consultation, prescription, CBC lab report, invoice
- Appointment 2 (Chest Pain, Mother): consultation, prescription, lipid profile, chest X-ray, ECG, referral, invoice
- Appointment 3 (Eczema): consultation, prescription, pathology biopsy, invoice
- Appointment 4 (Annual Checkup): 6 lab reports (CBC, Lipid, Thyroid, Blood Sugar, Liver, Kidney), invoice
- Standalone: discharge summary (dengue), 2 uploaded docs, Vitamin D3 prescription, MRI knee (mother), ultrasound, PFT, audiometry, lumbar X-ray, wound suturing procedure, ER visit (food poisoning), physiotherapy (mother), 2 active meds, 2 past meds, 2 vaccinations, 2 medical certificates

### Server-Side Status Computation

**HealthRecordController.php** — `computeStatus(category, metadata)` returns `{ label, variant }` for each record:

| Category | Logic | Statuses |
|----------|-------|----------|
| lab_report | Scan results[].status for abnormal/high/borderline | Normal (success), Needs Attention (destructive), Borderline (warning) |
| prescription | Compare valid_until to today | Active (info), Completed (secondary) |
| medication_active | Always | Active (info) |
| medication_past | Check reason_stopped for "discontinu" | Discontinued (destructive), Completed (secondary) |
| consultation/procedure/er/other_visit | Check follow_up field | Completed (success), Follow-up Required (warning) |
| discharge_summary | Always | Completed (success) |
| referral | Check priority | Urgent (destructive), Pending (warning) |
| vaccination | Compare dose_number to total_doses | Complete (success), In Progress (info) |
| medical_certificate | Compare valid_until to today | Valid (success), Expired (destructive) |
| invoice | Check payment_status | Paid (success), Pending (warning), Due (destructive) |

`abnormalCount` prop: count of records with "Needs Attention" status for the alert banner.

### Frontend: Table-Based List View

**File**: `resources/js/Pages/HealthRecords/Index.tsx`

**Header**: "Health Records" title + Upload Record / Download All / Share Records buttons (toast placeholders)

**Alert Banner** (conditional): Shows when abnormalCount > 0 — "X reports need attention" with View button that filters to those records.

**5 Filter Controls**:
1. Document Type: All Types, group filters (All Reports/Visits/Medications/Documents), individual categories
2. Status: All, Normal, Needs Attention, Active, Completed, Pending, Follow-up Required, Valid, Expired, Discontinued
3. Family Member: All Members, Yourself, each family member
4. Date Range: From/To date inputs
5. Search: title, description, doctor, department, patient name

**Table** (shadcn Table component):
- Columns: Checkbox, Date, Record (icon + title + category badge + doctor), Patient, Status (badge + Review button for Needs Attention), Actions (3-dot menu)
- Row click opens detail sheet
- Checkbox selection with select-all header checkbox

**Bulk Actions Bar**: Appears when checkboxes selected — "N selected" + Download/Share buttons + Clear

**Row Actions** (DropdownMenu): View Details, Download, Share, Print, Link to Appointment (if linked), Delete (only for uploaded_document, destructive styling)

**Pagination**: 10 per page, page numbers, prev/next buttons, "Showing X–Y of Z records"

**Empty State**: FolderOpen icon, "No records yet", "Book an appointment to get started", Book Appointment CTA

**Footer**: "Need help? Contact support →"

### Detail Side Sheet (21 category-specific templates)

Opens via row click, "View Details" action, or "Review" button. Contains:
- Header: Category icon + title + date + doctor
- Common fields: Department, Patient, Category badge, Status badge, File type
- Summary text
- **Category-specific detail component** (switch router):
  - ConsultationDetail: diagnosis (ICD code), symptoms badges, examination findings, treatment plan
  - PrescriptionDetail: drugs table (name, dosage, frequency, duration, instructions), valid_until
  - LabReportDetail: test category badge, results table (parameter, value, reference, status dots)
  - XrayDetail/MriDetail/UltrasoundDetail: body part, indication, technique, FindingsImpression component
  - EcgDetail: heart rate, rhythm, axis, intervals grid (PR/QRS/QT), findings/impression
  - PathologyDetail: specimen, gross/microscopic findings, diagnosis with grade
  - PftDetail: results table (parameter, actual, predicted, %, status), interpretation
  - ProcedureDetail: procedure name, anesthesia, technique, findings, post-op instructions
  - ErVisitDetail: chief complaint (red box), triage, vitals grid, treatment, disposition
  - MedicationActiveDetail: green drug badge, dosage, frequency, condition, refills
  - MedicationPastDetail: gray drug badge, start/end dates, reason stopped
  - VaccinationDetail: vaccine name, dose progress bar, batch, next due date
  - MedicalCertificateDetail: type, issued for, validity dates
  - InvoiceDetail: invoice number, amount, payment status, line items table
  - UploadedDocDetail: source, notes
- Footer actions: View Appointment, View Bill, Download

### Design System Additions

**CSS Variables** (`resources/css/app.css`): Added `--success`, `--warning`, `--info` with foreground variants (both light and dark themes)

**Tailwind Config**: Registered `success`, `warning`, `info` color tokens matching the CSS variables

**New Component**: `resources/js/Components/ui/checkbox.tsx` — Standard shadcn Checkbox using `@radix-ui/react-checkbox`

### Files Created
| File | Purpose |
|------|---------|
| `database/migrations/2026_02_01_500001_create_health_records_table.php` | Migration |
| `app/Models/HealthRecord.php` | Eloquent model |
| `app/Http/Controllers/HealthRecordController.php` | Controller with status computation |
| `resources/js/Pages/HealthRecords/Index.tsx` | Full page with table, filters, 21 detail templates |
| `resources/js/Components/ui/checkbox.tsx` | shadcn Checkbox component |

### Files Modified
| File | Changes |
|------|---------|
| `app/User.php` | Added `healthRecords()` relationship |
| `app/Models/Appointment.php` | Added `healthRecords()` relationship |
| `database/seeders/HospitalSeeder.php` | Added `seedHealthRecords()` with 42 records across 21 categories |
| `routes/web.php` | Added `GET /health-records` route |
| `resources/css/app.css` | Added success/warning/info CSS variables |
| `tailwind.config.js` | Added success/warning/info color tokens |
| `package.json` | Added `@radix-ui/react-checkbox` dependency |

---

## Health Records: Visit Detail Redesign (February 1, 2026)

Redesigned 3 visit-type detail components (Consultation, Discharge Summary, ER Visit) in the Health Records side sheet with richer metadata sections matching clinical document standards.

### New Shared Helper Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `VitalsGrid` | vitals, statuses?, painScore? | 2-column grid of vital sign cards with optional colored status pills (Normal/High/Elevated) |
| `NumberedList` | items, variant? | Numbered steps (default), green checkmarks (check), red X marks (x), amber warnings (warning) |
| `LinkedRecordsList` | records, onView | Cross-reference cards with category icons and "View →" links triggering toast |

Extended `StatusDot` with "elevated" variant (amber).

### Component Rewrites

**ConsultationDetail** — 6 sections: Visit Details (type/OPD/duration/location), Vitals Recorded (VitalsGrid with status pills), Clinical Summary (chief complaint box + symptoms badges + HPI + examination + diagnosis with ICD), Treatment Plan (NumberedList, fallback to paragraph), Linked Records, Follow-up with booking button

**DischargeDetail** — 10 sections: Admission Details (IPD/LOS/room/doctor), Diagnosis (primary box + secondary + procedure), Hospital Course, Vitals at Discharge, Procedures, Discharge Medications (numbered), Instructions (dos with checkmarks + donts with X marks), Warning Signs (red container + emergency contact), Follow-up Schedule (with booking buttons), Linked Records

**ErVisitDetail** — 9 sections: Visit Details (ER number/triage badge/mode of arrival), Chief Complaint (red box), Vitals with pain score, Examination, Investigations Done (with optional View links), Diagnosis, Treatment Given (NumberedList), Disposition + detail, Follow-up

**ProcedureDetail** — Minor: added linked_records section

### Architecture Changes

- `onAction` callback threaded through `RecordDetailSheet` → `CategoryDetail` → detail components for toast notifications
- 4 new sub-interfaces: `LinkedRecord`, `DischargeMedication`, `FollowUpItem`, `Investigation`
- ~25 new optional fields on `RecordMetadata` (consultation, discharge, ER visit)
- New icon imports: Check, X, MapPin, Clock, Phone, ArrowRight, Calendar, Activity

### Seeder Expansion

- 3 consultation records expanded with vitals, clinical summary, treatment steps, linked records
- 1 discharge summary expanded with 15+ new fields (hospital course, meds, dos/donts, warning signs, follow-up schedule)
- 1 ER visit expanded with investigations, treatment items, disposition detail
- 1 new ER visit added (mother — Syncope Episode, Level 2 triage, ambulance, ECG/CT/CBC, admitted)

---

## Health Records: Medication & Document Detail Redesign (February 1, 2026)

Redesigned 4 detail components (MedicationActive, MedicationPast, Vaccination, MedicalCertificate) with richer metadata sections matching clinical wireframes.

### New Sub-Interfaces

| Interface | Fields | Purpose |
|-----------|--------|---------|
| `VaccinationEntry` | vaccine_name, date, dose_label, administered_by, batch_number, site | Vaccination history table rows |
| `UpcomingVaccine` | vaccine_name, due_date, dose_label | Upcoming vaccination cards |
| `AttachedFile` | name, type, size? | Downloadable certificate files |

### RecordMetadata Additions

**Medications** (~10 new fields): timing, with_food (boolean), medication_duration, how_it_works, original_quantity, side_effects (string[]), side_effects_warning, adherence_this_week (7-element array of 'taken'|'missed'|'upcoming'), adherence_rate (0-100)

**Vaccination** (3 new fields): vaccination_history (VaccinationEntry[]), upcoming_vaccinations (UpcomingVaccine[]), attached_certificates (AttachedFile[])

**Medical Certificate** (5 new fields): certificate_number, certificate_content, examination_findings_list (string[]), digitally_signed (boolean), verification_url

### Component Rewrites

**MedicationActiveDetail** — 7 sections: Drug header (green, animated pulse dot), Dosage Instructions (dose/frequency/timing/food badge/duration/route), Purpose (condition + mechanism), Prescription Details (doctor/date/qty/refills), Side Effects (bullet list + amber warning box), Adherence Tracking (7-day Mon-Sun visual grid with check/X/circle + percentage bar + Log Dose + View History buttons), Related Records

**MedicationPastDetail** — 7 sections: Drug header (gray), Dosage Instructions, Purpose, Prescription Details (with end date), Reason Stopped (amber box), Side Effects, Related Records

**VaccinationDetail** — 6 sections: Vaccine header, Patient Details (name/age/gender/blood group from memberMap), Administration Details (dose progress bar + batch/site/next due), Vaccination History (HTML table), Upcoming Vaccinations (cards with Schedule buttons), Attached Certificates (file cards with download)

**MedicalCertificateDetail** — 5 sections: Certificate type header, Certificate Details (number/issuer/dates), Certificate Content (narrative + examination findings with checkmark list), Verification (ShieldCheck badge green/gray + verify URL), Linked Records

### Architecture Changes

- `FamilyMember` interface expanded with `age?`, `gender?`, `blood_group?`
- `HealthRecordController` query updated to include age/gender/blood_group
- `CategoryDetail` signature expanded with `record` + `memberMap` props (for VaccinationDetail patient details)
- New icon imports: ShieldCheck, FileDown

### Seeder Expansion

All 8 medication/document records expanded:
- 2 medication_active: timing, food, mechanism, side effects, adherence data, linked records
- 2 medication_past: timing, food, mechanism, side effects, linked records
- 2 vaccination: vaccination history arrays, upcoming vaccinations, attached certificates
- 2 medical_certificate: certificate number, content, examination findings, digital signature, verification URL, linked records

---

## Health Records: Remove Upload & Cleanup (February 1, 2026)

Removed upload functionality (placeholder-only, no backend) and header clutter from Health Records page.

### Removed
- **Upload button** from header
- **MoreHorizontal dropdown** (Download All / Share Records) from header
- **Summary stats grid** (5-6 clickable cards below title)
- **`uploaded_document` category** from `categoryConfig` and `typeGroups`
- **`is_user_uploaded` field** from HealthRecord type and controller mapping
- **Delete option** in row dropdown (was only for uploaded docs)
- **UploadedDocDetail component** and its case in CategoryDetail switch
- **2 seeder records** (Previous Hospital Discharge Summary, Old Prescription) from HospitalSeeder
- **Unused imports** (Upload, Trash2)

### Files Modified
- `resources/js/Pages/HealthRecords/Index.tsx` — All removals above
- `app/Http/Controllers/HealthRecordController.php` — Removed `is_user_uploaded` mapping
- `database/seeders/HospitalSeeder.php` — Removed 2 uploaded_document records

---

## Razorpay Integration for Billing (February 1, 2026)

Replaced placeholder payment toasts with real Razorpay integration in both billing pages. Supports mock mode when credentials are not configured.

### Backend: BillingController.php
Added 2 methods:
- `createOrder(Request, Appointment)` — Creates Razorpay order (or mock order). Validates amount, checks auth.
- `verifyPayment(Request, Appointment)` — Verifies Razorpay signature (or auto-verifies mock). Updates `appointment.payment_status = 'paid'`.

Mock mode auto-detects when `RAZORPAY_KEY`/`RAZORPAY_SECRET` are empty or placeholder values.

### Routes
```php
Route::post('/billing/{appointment}/payment/create-order', [BillingController::class, 'createOrder']);
Route::post('/billing/{appointment}/payment/verify', [BillingController::class, 'verifyPayment']);
```

### Frontend
- **Billing/Index.tsx** — `handlePayment()` creates order via POST, opens Razorpay checkout (or auto-verifies in mock mode), reloads page on success
- **Billing/Show.tsx** — `handlePayment(amount)` wired to all 4 Pay buttons (header Pay, header Pay EMI, footer Pay, footer Pay EMI) with loading states

### Files Modified
- `app/Http/Controllers/BillingController.php` — Added `createOrder()`, `verifyPayment()`
- `routes/web.php` — Added 2 billing payment routes
- `resources/js/Pages/Billing/Index.tsx` — Real Razorpay flow
- `resources/js/Pages/Billing/Show.tsx` — Real Razorpay flow for all Pay buttons

---

## Uniform Blue Icons Across All Tables (February 1, 2026)

Standardized all category/department icons to use uniform blue styling: background `#BFDBFE` and icon color `#1E40AF`.

### Health Records
- All 21 entries in `categoryConfig` updated from varied colors to uniform `color: '#1E40AF', bg: '#BFDBFE'`

### Billing Pages
- **Billing/Index.tsx** — 2 icon circles (table row + payment sheet) updated
- **Billing/Show.tsx** — 1 icon circle (service details) updated

### Appointments Pages
- **Appointments/Index.tsx** — Added icon circles to table rows (previously had no icons), updated 2 existing icons (detail sheet + reschedule summary)
- **Appointments/Show.tsx** — 1 icon circle (doctor section) updated

Previously: doctor icons used `bg-blue-50`/`text-blue-600`, lab icons used `bg-purple-50`/`text-purple-600`. Now all use `#BFDBFE`/`#1E40AF`.

---

## Health Records: Spacing Fix (February 1, 2026)

Fixed gap between filters/bulk actions bar and the table in Health Records page. Added `mt-4` margins between Tabs section and the table/bulk actions area.

---

## Family Members Page (February 1, 2026)

Created a dedicated Family Members management page with card-grid layout, Sheet form for add/edit, delete confirmation, and toast notifications.

### Files Created
- `app/Http/Controllers/FamilyMembersController.php` — CRUD controller (index, create redirect, store, update, destroy)
- `resources/js/Pages/FamilyMembers/Index.tsx` — Card-grid page

### Files Modified
- `routes/web.php` — 5 family member routes (GET index, GET create, POST store, PUT update, DELETE destroy)
- `app/Http/Middleware/HandleInertiaRequests.php` — Added `toast` flash data sharing for server-side toast messages

### Routes
```php
Route::get('/family-members', [FamilyMembersController::class, 'index']);
Route::get('/family-members/create', [FamilyMembersController::class, 'create']);  // Redirects to ?create=1
Route::post('/family-members', [FamilyMembersController::class, 'store']);
Route::put('/family-members/{member}', [FamilyMembersController::class, 'update']);
Route::delete('/family-members/{member}', [FamilyMembersController::class, 'destroy']);
```

### Controller
- `index()` — Returns members ordered (self first), max 10 members (`canCreate` prop)
- `create()` — Redirects to `/family-members?create=1` (for dashboard profile step link)
- `store()` — Validates name, relation (11 options), age (0-150), gender, blood_group (8 types). Creates FamilyMember.
- `update()` — Same validation, updates member
- `destroy()` — Prevents deleting "self" relation. Deletes member.

### Frontend Page
- **Header**: Title + member count + "Add Member" button
- **Card Grid**: 2-column responsive grid. Each card: colored avatar circle (by relation), name, relation badge, age/gender/blood group details
- **Actions**: Hover-reveal Edit (Pencil) + Delete (Trash2) buttons. Delete hidden for "self" member.
- **Sheet Form**: Name (required), Relation (required, Select), Age (optional), Gender (optional), Blood Group (optional)
- **Delete Confirmation**: Overlay dialog with warning icon, member name, Cancel/Remove buttons
- **Empty State**: Users icon + "No family members yet" + "Add your first member" CTA
- **Auto-open**: `?create=1` URL param opens Sheet on mount (handles dashboard profile step link)
- **Toast**: Server flash messages via `usePage().props.toast`

### Avatar Colors by Relation
self=blue, mother=pink, father=indigo, brother=green, sister=purple, spouse=rose, son=teal, daughter=amber, grandmother=orange, grandfather=slate, other=gray

---

## Family Members List Redesign + Detail Page (February 1, 2026)

Redesigned the Family Members index from a card grid to a simple list layout, and created a comprehensive member detail page with medical profile, emergency contacts, and health navigation.

### List Page Redesign (Index.tsx)

Replaced 2-column card grid with a single-column list:
- Each row: avatar (initials with relation color) + name + amber attention dot (if health alerts) + ChevronRight
- Row click navigates to `/family-members/{id}`
- Alert banner (conditional): "X members need attention" when members have abnormal lab results
- Removed edit/delete from list (moved to detail page)
- Sheet form simplified to add-only

### Member Detail Page (Show.tsx) — NEW

**File**: `resources/js/Pages/FamilyMembers/Show.tsx`

Full medical profile page with 8 sections:
1. **Back nav**: "← Family Members"
2. **Alert banner** (conditional): "{alertType} needs attention" + "View records →"
3. **Profile header**: Large avatar (h-20 w-20), name, patient ID (PT-XXXXXX), "Edit Profile" button
4. **Personal Information Card**: 2-column grid (DOB, Blood Group, Phone, Address, Primary Doctor, Relationship)
5. **Medical Conditions Card**: Condition tags (Badge secondary) + Allergy tags (Badge destructive/red)
6. **Emergency Contact Card**: Avatar + name + relation + phone (or dashed empty state)
7. **Health Data Links**: 3 clickable cards (Appointments, Health Records, Medications) with blue icons
8. **Actions**: Edit Profile + Remove Member (non-self only)

**Edit Sheet**: Expanded form with grouped sections (Basic, Contact, Address, Primary Doctor, Medical, Emergency Contact). Inline tag input for conditions/allergies (Input + Enter + Badge chips with × remove).

**Delete overlay**: Confirmation dialog with warning icon, Cancel/Remove buttons.

### Database Migration

**File**: `database/migrations/2026_02_01_600001_add_profile_fields_to_family_members_table.php`

Added 14 columns to `family_members`:

| Column | Type | Notes |
|--------|------|-------|
| `patient_id` | string, unique | Auto-generated "PT-000001" format |
| `date_of_birth` | date, nullable | Primary age source; age computed from DOB |
| `phone` | string, nullable | Contact number |
| `address_line_1` | string, nullable | Street address |
| `address_line_2` | string, nullable | Landmark/area |
| `city` | string, nullable | |
| `state` | string, nullable | |
| `pincode` | string, nullable | |
| `primary_doctor_id` | FK → doctors, nullable, nullOnDelete | |
| `medical_conditions` | json, nullable | `["Type 2 Diabetes", "Hypertension"]` |
| `allergies` | json, nullable | `["Penicillin", "Peanuts"]` |
| `emergency_contact_name` | string, nullable | |
| `emergency_contact_relation` | string, nullable | |
| `emergency_contact_phone` | string, nullable | |

### Model Changes (FamilyMember.php)

- 14 new fields added to `$fillable`
- Casts: `date_of_birth` → date, `medical_conditions` → array, `allergies` → array
- `primaryDoctor(): BelongsTo` relationship to Doctor
- `getComputedAgeAttribute()` — DOB-based age or falls back to raw `age` column
- `getFullAddressAttribute()` — joins address fields with commas
- `boot()` — auto-generates `patient_id` as `PT-XXXXXX` on creation

### Controller Changes (FamilyMembersController.php)

- `show()` — Returns all new member fields, doctors list (for edit form), `hasAlerts` boolean, `alertType`
- `update()` — Expanded validation for 18 fields, auto-computes `age` from DOB for backward compatibility
- Removed unused `computeStatus()` + 8 status helper methods (health records no longer shown on detail page)

### Seeder Updates (HospitalSeeder.php)

All 6 family members enriched with: DOB, phone, addresses (Pune), medical conditions, allergies, emergency contacts. Patient IDs auto-generated.

### Routes

```php
Route::get('/family-members/{member}', [FamilyMembersController::class, 'show'])->name('family-members.show');
```

---

## Unified Booking Links (February 1, 2026)

Standardized all "Book Appointment" buttons across the app to point to `/booking` (the AI booking entry page).

### Changes
- **Dashboard.tsx**: "Book Appointment" link changed from `/appointments/create` → `/booking`
- **HealthRecords/Index.tsx**: Empty state "Book Appointment" link changed from `/booking/doctor` → `/booking`

All other booking CTAs (Appointments Index, Billing, Booking Index) already pointed to `/booking` or valid booking routes.

---

**Last Updated**: February 1, 2026
**Status**: Dashboard Complete | AI Booking Flow Complete | Guided Booking Flow Complete | Calendar Integration Complete | Critical Bug Fixes Applied | AI Entity Extraction Refactored | Hospital Database Created | Lab Test AI Chat Flow Added | Lab Flow Redesigned with Smart Search | Address Selection Added | Ollama Local AI Ready | Patient Relation Extraction Fixed | Integration Tests Added (36 tests) | Inline Add Member & Address Forms | Individual Test Booking with Multi-Select | Guided Flow UX Overhaul | 2-Week Booking Window | Smart Search & Symptom Mapping | Expandable Detail Cards | Urgency Removed | Full Collection Flow | Package/Test UX Polish | My Appointments Page | Action Sheets | Payment Status | Real Booking Records | Appointment Detail Page | Global Error Page | Billing Pages | Pay All Flow | Edge Cases & Validation Banners | Billing Notifications | Health Records Page | Visit Detail Redesign | Medication & Document Detail Redesign | Upload Removed | Razorpay Billing Integration | Uniform Blue Icons | Family Members List + Detail Page | Unified Booking Links
