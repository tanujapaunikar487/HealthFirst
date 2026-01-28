# PatientStep Page

The first step in the guided doctor booking wizard where users select the patient and consultation type.

## Overview

This page combines three main sections on a single scrollable page:
1. **Patient Selection**: Choose who the appointment is for
2. **Consultation Type**: New consultation or follow-up
3. **Previous Consultations** (conditional): Quick booking from previous doctors

## Features

- ✅ Family member selection with avatars
- ✅ New consultation vs follow-up toggle
- ✅ Previous doctors display for follow-up consultations
- ✅ Quick book time slots for previous doctors
- ✅ Form validation with error messages
- ✅ State persistence via savedData prop
- ✅ Integrated with GuidedBookingLayout
- ✅ Responsive grid layout
- ✅ TypeScript support

## Page Structure

### Section 1: Patient Selection
- Grid of family member cards (2 columns)
- Avatar with initials fallback
- "Add family member or guest" link
- Selected state with blue border and background

### Section 2: Consultation Type
- Two option toggle: New Consultation / Follow-up
- Follow-up button disabled until patient is selected
- Selected state with blue border and background

### Section 3: Previous Consultations (Conditional)
- Only shows when:
  - Follow-up is selected
  - Patient is selected
  - Patient has previous consultations
- Lists previous doctors with time slots
- Click time slot to quick book
- Selected doctor/time gets highlighted

## Props

```typescript
interface Props {
  familyMembers: FamilyMember[];
  previousConsultations: PreviousConsultation[];
  savedData?: {
    patientId?: string;
    consultationType?: 'new' | 'followup';
    quickBookDoctorId?: string;
    quickBookTime?: string;
  };
}

interface FamilyMember {
  id: string;
  name: string;
  avatar: string | null;
  relationship: string;
}

interface PreviousConsultation {
  patientId: string;
  doctor: Doctor;
  symptoms: string[];
  date: string;
  slots: TimeSlot[];
}

interface Doctor {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experience_years: number;
  consultation_modes: string[];
  video_fee: number;
  in_person_fee: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}
```

## State Management

### Local State
- `patientId`: Currently selected patient ID
- `consultationType`: 'new' | 'followup' | null
- `quickBookDoctorId`: Selected doctor for quick booking (follow-up only)
- `quickBookTime`: Selected time slot (follow-up only)
- `errors`: Validation error messages

### State Initialization
Restores state from `savedData` prop if provided:
```typescript
const [patientId, setPatientId] = useState<string | null>(
  savedData?.patientId || null
);
```

## Validation

### Continue Button Disabled When:
- No patient is selected
- No consultation type is selected

### Error Messages:
- "Please select a patient" - if continuing without patient
- "Please select consultation type" - if continuing without type

## User Interactions

### Patient Selection
```typescript
const handlePatientSelect = (id: string) => {
  setPatientId(id);
  // Reset follow-up selection when changing patient
  if (consultationType === 'followup') {
    setQuickBookDoctorId(null);
    setQuickBookTime(null);
  }
};
```

### Consultation Type Selection
- Clicking "New Consultation" sets type to 'new'
- Clicking "Follow-up" sets type to 'followup'
- Follow-up button disabled if no patient selected

### Quick Booking (Follow-up)
```typescript
const handleQuickBook = (doctorId: string, time: string) => {
  setQuickBookDoctorId(doctorId);
  setQuickBookTime(time);
};
```

### Navigation
```typescript
const handleBack = () => {
  router.get('/booking');
};

const handleContinue = () => {
  // Validate inputs
  // Submit to /booking/doctor/patient via POST
  router.post('/booking/doctor/patient', {
    patientId,
    consultationType,
    quickBookDoctorId,
    quickBookTime,
  });
};
```

## DoctorCard Component

Embedded component for displaying previous consultation doctors.

### Props
```typescript
interface DoctorCardProps {
  doctor: Doctor;
  slots: TimeSlot[];
  selectedTime: string | null;
  isSelected: boolean;
  onSelectTime: (time: string) => void;
}
```

### Features
- Doctor avatar with initials fallback
- Name, specialization, and experience
- Consultation modes badge (Video, In-hospital, or both)
- Time slots grid with:
  - Preferred slots marked with star icon
  - Selected slot with black background
  - Unavailable slots grayed out
  - Hover effects on available slots
- Entire card highlights when selected

### Visual States
- **Normal**: White background
- **Selected**: Light blue background (bg-primary/5) with blue border
- **Time Slot Normal**: White with border
- **Time Slot Preferred**: Star icon in top-right
- **Time Slot Selected**: Black background, white text
- **Time Slot Unavailable**: 40% opacity, not clickable

## Visual Design

### Layout
- Max-width: 768px (from GuidedBookingLayout)
- Sections spaced with 40px gap (space-y-10)
- Blue gradient background at top (from layout)

### Patient Cards
- 2-column grid
- 12px gap between cards
- Padding: 12px
- Border radius: 12px (rounded-xl)
- Avatar: 40px circle
- Selected: Blue border (border-primary) and light blue bg (bg-primary/5)
- Hover: Blue border at 50% opacity

### Consultation Type Buttons
- 2-column grid
- 12px gap between buttons
- Padding: 16px
- Border radius: 12px (rounded-xl)
- Selected: Blue border and light blue bg
- Hover: Blue border at 50% opacity
- Disabled: 50% opacity, not clickable

### Doctor Cards
- Border: Rounded-xl container
- Divide: Border between cards
- Padding: 16px
- Avatar: 48px circle
- Time slots: Flex-wrap with 8px gap
- Preferred star: 12px icon, absolute positioned

### Typography
- Page title (h2): text-xl font-semibold
- Subtitle: text-sm text-muted-foreground
- Section label: text-sm font-medium text-muted-foreground
- Patient name: text-sm font-medium
- Doctor name: font-semibold text-foreground
- Doctor info: text-sm text-muted-foreground
- Time slots: text-sm

## Backend Integration

### Route
```php
Route::post('/booking/doctor/patient', [DoctorBookingController::class, 'storePatient']);
```

### Controller Method
```php
public function storePatient(Request $request)
{
    $validated = $request->validate([
        'patientId' => 'required|string',
        'consultationType' => 'required|in:new,followup',
        'quickBookDoctorId' => 'nullable|string',
        'quickBookTime' => 'nullable|string',
    ]);

    // Save to session or database
    session()->put('doctor_booking', $validated);

    // Redirect to next step
    return redirect()->route('booking.doctor.concerns');
}
```

### Data Loading
```php
public function showPatientStep()
{
    $user = auth()->user();

    return inertia('Booking/Doctor/PatientStep', [
        'familyMembers' => $user->familyMembers()->get(),
        'previousConsultations' => $this->getPreviousConsultations($user),
        'savedData' => session('doctor_booking'),
    ]);
}

private function getPreviousConsultations($user)
{
    // Get consultations for all family members
    // Group by patient and include doctor with available slots
    return BookingConversation::with(['patient', 'doctor'])
        ->whereIn('patient_id', $user->familyMembers()->pluck('id'))
        ->where('status', 'completed')
        ->latest()
        ->get()
        ->groupBy('patient_id')
        ->map(function ($consultations) {
            return $consultations->map(function ($consultation) {
                return [
                    'patientId' => $consultation->patient_id,
                    'doctor' => [
                        'id' => $consultation->doctor->id,
                        'name' => $consultation->doctor->name,
                        'avatar' => $consultation->doctor->avatar,
                        'specialization' => $consultation->doctor->specialization,
                        'experience_years' => $consultation->doctor->experience_years,
                        'consultation_modes' => $consultation->doctor->consultation_modes,
                        'video_fee' => $consultation->doctor->video_fee,
                        'in_person_fee' => $consultation->doctor->in_person_fee,
                    ],
                    'symptoms' => $consultation->symptoms,
                    'date' => $consultation->created_at->format('d M'),
                    'slots' => $this->getAvailableSlots($consultation->doctor),
                ];
            });
        })
        ->flatten(1);
}
```

## Accessibility

- Semantic button elements for all interactive cards
- Disabled states properly communicated
- Error messages associated with form sections
- Keyboard navigation supported
- Avatar fallbacks for missing images
- Clear visual feedback for selected states

## Edge Cases

### No Previous Consultations
- Follow-up option is still available
- Previous consultations section doesn't show
- User proceeds to concerns step normally

### Patient Has No Previous Doctors
- Same as above - section hidden

### Changing Patient After Selecting Follow-up
- Quick book selections (doctor/time) are reset
- User must reselect from new patient's previous doctors

### Quick Booking (Optional)
- User can select follow-up without choosing a time slot
- If time slot selected, it's passed to next step for context
- Next step can pre-fill doctor selection or skip directly to confirmation

## Related Components

- `GuidedBookingLayout` - Wrapper layout with header/footer
- `StepIndicator` - Progress indicator in header
- `Avatar` - User avatar component from shadcn/ui
- `Button` - Button component from shadcn/ui

## Next Steps

After this step, user proceeds to:
- **If New Consultation**: Concerns step (symptoms selection)
- **If Follow-up**: Could skip directly to confirmation if time slot was selected, or go to concerns step

## Notes

- This is the first step in the guided doctor booking wizard
- Combines multiple logical sections into one page for better UX
- Previous consultations enable quick rebooking
- State is persisted via session for back/forward navigation
- Validation ensures required selections are made
- Quick booking feature streamlines follow-up appointments
