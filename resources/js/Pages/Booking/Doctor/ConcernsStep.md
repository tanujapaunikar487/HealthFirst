# ConcernsStep Page

The second step in the guided doctor booking wizard where users describe their symptoms and select appointment urgency.

## Overview

This page combines three main sections:
1. **Follow-up Banner** (conditional): Shows previous consultation context
2. **Symptoms Section**: Multi-select chips + freeform text description
3. **Urgency Section**: Timing selection with doctor availability counts

## Features

- ✅ Optional follow-up consultation banner
- ✅ Multi-select symptom chips
- ✅ Freeform text area for detailed symptom description
- ✅ Urgency selection with doctor counts
- ✅ Color-coded urgency indicators (red, amber)
- ✅ Form validation for urgency selection
- ✅ State persistence via savedData prop
- ✅ Integrated with GuidedBookingLayout
- ✅ TypeScript support

## Page Structure

### Section 1: Follow-up Banner (Conditional)
Shows only if user selected follow-up consultation in previous step:
- Light blue banner with info icon
- "Following up on: {previous symptoms}"
- "From {doctor name} on {date}. Add any new symptoms below."

### Section 2: Symptoms
- Heading: "What symptoms are you experiencing?"
- Subtitle: "Select all that apply, or describe in your own words"
- SymptomChips component for quick selection
- Textarea for detailed description (4 rows)
- Both inputs are optional (user can select chips, type text, or both)

### Section 3: Urgency
- Heading: "How soon do you need to see a doctor?"
- Subtitle: "This determines which slots you'll see"
- Three urgency options with:
  - Color-coded dot indicator
  - Label and description
  - Doctor count or "Full flexibility"
- Selected state: light blue background
- Hover state: light gray background

## Props

```typescript
interface Props {
  symptoms: Symptom[];
  urgencyOptions: UrgencyOption[];
  followUp?: FollowUpData;
  savedData?: {
    selectedSymptoms?: string[];
    symptomNotes?: string;
    urgency?: string;
  };
}

interface Symptom {
  id: string;
  name: string;
}

interface UrgencyOption {
  value: string;         // 'urgent', 'this_week', 'specific_date'
  label: string;         // 'Urgent - Today', 'This Week', 'Specific date'
  description: string;   // 'Only today's slots', 'Next 7 days', etc.
  doctorCount?: number;  // Number of available doctors (optional)
}

interface FollowUpData {
  symptoms: string[];    // Previous symptoms
  doctorName: string;    // Previous doctor's name
  date: string;          // Previous visit date
}
```

## State Management

### Local State
- `selectedSymptoms: string[]` - Selected symptom chip IDs
- `symptomNotes: string` - Freeform text description
- `urgency: string | null` - Selected urgency option
- `errors: Record<string, string>` - Validation errors

### State Initialization
Restores from `savedData` if provided:
```typescript
const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
  savedData?.selectedSymptoms || []
);
const [symptomNotes, setSymptomNotes] = useState(savedData?.symptomNotes || '');
const [urgency, setUrgency] = useState<string | null>(savedData?.urgency || null);
```

## Validation

### Required Fields
- **Urgency**: Must be selected to continue

### Optional Fields
- **Symptoms**: Can be empty (chips or text)
- **Symptom Notes**: Can be empty

### Continue Button
- Disabled when: `!urgency`
- Error message: "Please select how soon you need to see a doctor"

## User Interactions

### Symptom Selection
```typescript
const handleSymptomToggle = (symptomId: string) => {
  setSelectedSymptoms((prev) =>
    prev.includes(symptomId)
      ? prev.filter((id) => id !== symptomId)
      : [...prev, symptomId]
  );
};
```

### Text Input
```typescript
<Textarea
  value={symptomNotes}
  onChange={(e) => setSymptomNotes(e.target.value)}
  rows={4}
/>
```

### Urgency Selection
```typescript
const handleUrgencyClick = (value: string) => {
  setUrgency(value);
  // Clear error when selection is made
  setErrors((prev) => {
    const { urgency, ...rest } = prev;
    return rest;
  });
};
```

### Navigation
```typescript
const handleBack = () => {
  router.get('/booking/doctor/patient');
};

const handleContinue = () => {
  // Validate urgency
  if (!urgency) {
    setErrors({ urgency: 'Please select how soon you need to see a doctor' });
    return;
  }

  // Submit form
  router.post('/booking/doctor/concerns', {
    selectedSymptoms,
    symptomNotes,
    urgency,
  });
};
```

## Urgency Options

### Color Coding
```typescript
const dotColors: Record<string, string> = {
  urgent: 'bg-red-500',           // Red dot
  this_week: 'bg-amber-500',      // Amber/Orange dot
  specific_date: 'bg-amber-500',  // Amber/Orange dot
};
```

### Default Options
```typescript
const urgencyOptions = [
  {
    value: 'urgent',
    label: 'Urgent - Today',
    description: 'Only today\'s slots',
    doctorCount: 3,
  },
  {
    value: 'this_week',
    label: 'This Week',
    description: 'Next 7 days',
    doctorCount: 12,
  },
  {
    value: 'specific_date',
    label: 'Specific date',
    description: 'Choose your date',
    // No doctorCount = shows "Full flexibility"
  },
];
```

## Visual Design

### Layout
- Max-width: 768px (from GuidedBookingLayout)
- Section spacing: 40px (space-y-10)
- Blue gradient background at top (from layout)

### Follow-up Banner
- Background: bg-primary/10 (light blue)
- Border radius: rounded-xl (12px)
- Padding: 16px
- Icon: 24px blue circle with white Info icon
- Gap: 12px between icon and text

### Symptoms Section
- Heading: text-xl font-semibold
- Subtitle: text-sm text-muted-foreground
- SymptomChips: Flex-wrap grid with 8px gap
- Textarea: 16px margin-top, border, rounded-lg, 4 rows

### Urgency Section
- Container: Border, rounded-xl, overflow hidden
- Options: Divide-y (horizontal dividers)
- Each option: Flex layout, 16px padding
- Dot: 12px circle (w-3 h-3), flex-shrink-0
- Gap: 12px between elements
- Selected: bg-primary/5 (light blue)
- Hover: bg-muted/50 (light gray)

### Typography
- Page titles (h2): text-xl font-semibold
- Subtitles: text-sm text-muted-foreground
- Urgency labels: font-medium
- Urgency descriptions: text-sm text-muted-foreground
- Doctor counts: text-sm text-muted-foreground

## Backend Integration

### Route
```php
Route::post('/booking/doctor/concerns', [DoctorBookingController::class, 'storeConcerns']);
```

### Controller Method
```php
public function storeConcerns(Request $request)
{
    $validated = $request->validate([
        'selectedSymptoms' => 'nullable|array',
        'selectedSymptoms.*' => 'string',
        'symptomNotes' => 'nullable|string|max:1000',
        'urgency' => 'required|in:urgent,this_week,specific_date',
    ]);

    // Merge with existing session data
    $bookingData = session('doctor_booking', []);
    session()->put('doctor_booking', array_merge($bookingData, $validated));

    // Redirect to next step
    return redirect()->route('booking.doctor.doctor-time');
}
```

### Data Loading
```php
public function showConcernsStep()
{
    $bookingData = session('doctor_booking');

    // Check if follow-up
    $followUp = null;
    if ($bookingData['consultationType'] === 'followup' && $bookingData['patientId']) {
        $previousConsultation = BookingConversation::with('doctor')
            ->where('patient_id', $bookingData['patientId'])
            ->latest()
            ->first();

        if ($previousConsultation) {
            $followUp = [
                'symptoms' => $previousConsultation->symptoms,
                'doctorName' => $previousConsultation->doctor->name,
                'date' => $previousConsultation->created_at->format('d M'),
            ];
        }
    }

    return inertia('Booking/Doctor/ConcernsStep', [
        'symptoms' => $this->getCommonSymptoms(),
        'urgencyOptions' => $this->getUrgencyOptions(),
        'followUp' => $followUp,
        'savedData' => $bookingData,
    ]);
}

private function getCommonSymptoms()
{
    return [
        ['id' => 'chest_pain', 'name' => 'Chest pain'],
        ['id' => 'shortness_breath', 'name' => 'Shortness of breath'],
        ['id' => 'headache', 'name' => 'Headache'],
        ['id' => 'fever', 'name' => 'Fever'],
        ['id' => 'fatigue', 'name' => 'Fatigue'],
        ['id' => 'cough', 'name' => 'Cough'],
        ['id' => 'back_pain', 'name' => 'Back pain'],
        ['id' => 'stomach_pain', 'name' => 'Stomach pain'],
        ['id' => 'dizziness', 'name' => 'Dizziness'],
        ['id' => 'skin_rash', 'name' => 'Skin rash'],
    ];
}

private function getUrgencyOptions()
{
    $today = now();

    return [
        [
            'value' => 'urgent',
            'label' => 'Urgent - Today',
            'description' => 'Only today\'s slots',
            'doctorCount' => Doctor::hasAvailableSlotsToday()->count(),
        ],
        [
            'value' => 'this_week',
            'label' => 'This Week',
            'description' => 'Next 7 days',
            'doctorCount' => Doctor::hasAvailableSlotsThisWeek()->count(),
        ],
        [
            'value' => 'specific_date',
            'label' => 'Specific date',
            'description' => 'Choose your date',
            // No doctorCount
        ],
    ];
}
```

## Accessibility

- Semantic section elements
- Button elements for urgency options (keyboard navigable)
- Textarea properly labeled
- Error messages associated with form sections
- Color is not the only indicator (text labels provided)
- Disabled state on continue button properly communicated

## Edge Cases

### Follow-up Without Previous Consultation
- Follow-up banner doesn't show
- User proceeds with symptom selection as normal

### No Symptoms Selected
- Valid - user can skip symptom chips entirely
- Can provide freeform text only
- Can even skip both (though not recommended)

### Empty Textarea
- Valid - symptom chips alone are sufficient
- Or both can be empty (urgency is the only required field)

### Changing Urgency
- Updates doctor counts dynamically (if implemented)
- Selected state moves to new option
- Previous selection is cleared

## Related Components

- `GuidedBookingLayout` - Wrapper layout with header/footer
- `FollowUpBanner` - Follow-up consultation context banner
- `SymptomChips` - Multi-select symptom chips
- `Textarea` - Freeform text input from shadcn/ui
- `StepIndicator` - Progress indicator in header

## Next Steps

After this step, user proceeds to:
- **Doctor & Time Selection**: Choose doctor and appointment slot
- Doctor list will be filtered by:
  - Selected urgency (shows only doctors with slots in selected timeframe)
  - Optionally by symptoms/specialization

## Notes

- Second step in the guided doctor booking wizard
- Combines symptom selection and urgency in one page
- Only urgency is required - symptoms are optional
- Follow-up banner provides context from previous consultation
- Urgency selection affects doctor availability in next step
- Color-coded dots help users quickly identify urgency levels
- Doctor counts help users make informed decisions
- State is persisted for back/forward navigation
