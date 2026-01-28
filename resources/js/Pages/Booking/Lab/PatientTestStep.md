# PatientTestStep Page

The first step in the guided lab test booking wizard where users select the patient and specify what kind of test they're looking for.

## Overview

This page combines two main sections:
1. **Patient Selection**: Choose who the test is for
2. **Test Type Selection**: Multi-select test type chips + freeform text description

## Features

- ✅ Family member selection with avatars
- ✅ Multi-select test type chips
- ✅ Freeform text area for test description
- ✅ Form validation for patient selection
- ✅ State persistence via savedData prop
- ✅ Integrated with GuidedBookingLayout
- ✅ Responsive 2-column grid for patient cards
- ✅ TypeScript support

## Page Structure

### Section 1: Patient Selection
- Heading: "Who is this for?"
- Subtitle: "Select a family member or add a new patient"
- 2-column grid of patient cards
- Avatar with orange fallback (first letter)
- Selected state: blue border + light blue background
- "Add family member or guest" link with arrow

### Section 2: Test Type Selection
- Heading: "What kind of test are you looking for?"
- Subtitle: "Select a common test or describe your needs"
- Test type chips (flex-wrap)
- Textarea for detailed description (4 rows)
- Both inputs are optional

## Props

```typescript
interface Props {
  familyMembers: FamilyMember[];
  savedData?: {
    patientId?: string;
    selectedTestTypes?: string[];
    testNotes?: string;
  };
}

interface FamilyMember {
  id: string;
  name: string;
  avatar: string | null;
  relationship: string;
}
```

## State Management

### Local State
- `patientId: string | null` - Selected patient ID (required)
- `selectedTestTypes: string[]` - Selected test type IDs (optional)
- `testNotes: string` - Freeform text description (optional)
- `errors: Record<string, string>` - Validation errors

### State Initialization
Restores from `savedData` if provided:
```typescript
const [patientId, setPatientId] = useState<string | null>(
  savedData?.patientId || null
);
const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>(
  savedData?.selectedTestTypes || []
);
const [testNotes, setTestNotes] = useState(savedData?.testNotes || '');
```

## Test Types

### Default Test Types
```typescript
const testTypes = [
  { id: 'annual_checkup', name: 'Annual checkup' },
  { id: 'diabetes_screening', name: 'Diabetes screening' },
  { id: 'heart_health', name: 'Heart health check' },
  { id: 'thyroid_profile', name: 'Thyroid profile' },
  { id: 'kidney_function', name: 'Kidney function' },
  { id: 'liver_function', name: 'Liver function' },
  { id: 'lipid_profile', name: 'Lipid profile' },
];
```

### Test Type Chips
- Pill-shaped buttons (rounded-full)
- Multi-select with toggle behavior
- Selected: bg-primary/10, border-primary, text-primary, font-medium
- Unselected: bg-background, border-border, text-foreground
- Hover: border-primary/50, bg-primary/5
- Flex-wrap layout with 8px gap

## Validation

### Required Fields
- **Patient**: Must be selected to continue

### Optional Fields
- **Test Types**: Can be empty
- **Test Notes**: Can be empty

### Continue Button
- Disabled when: `!patientId`
- Error message: "Please select a patient"

## User Interactions

### Patient Selection
```typescript
const handlePatientClick = (id: string) => {
  setPatientId(id);
  // Clear error when selection is made
  setErrors((prev) => {
    const { patient, ...rest } = prev;
    return rest;
  });
};
```

### Test Type Toggle
```typescript
const handleTestTypeToggle = (testId: string) => {
  setSelectedTestTypes((prev) =>
    prev.includes(testId)
      ? prev.filter((id) => id !== testId)
      : [...prev, testId]
  );
};
```

### Text Input
```typescript
<Textarea
  value={testNotes}
  onChange={(e) => setTestNotes(e.target.value)}
  rows={4}
/>
```

### Navigation
```typescript
const handleBack = () => {
  router.get('/booking');
};

const handleContinue = () => {
  // Validate patient
  if (!patientId) {
    setErrors({ patient: 'Please select a patient' });
    return;
  }

  // Submit form
  router.post('/booking/lab/patient-test', {
    patientId,
    selectedTestTypes,
    testNotes,
  });
};
```

## Visual Design

### Layout
- Max-width: 768px (from GuidedBookingLayout)
- Section spacing: 40px (space-y-10)
- Blue gradient background at top (from layout)

### Patient Cards
- 2-column grid (grid-cols-2)
- 12px gap between cards (gap-3)
- Padding: 12px (p-3)
- Border radius: 12px (rounded-xl)
- Avatar: 40px circle (w-10 h-10)
- Selected: Blue border (border-primary) + light blue bg (bg-primary/5)
- Hover: Blue border at 50% opacity + light blue bg

### Test Type Chips
- Padding: 16px horizontal, 8px vertical (px-4 py-2)
- Border radius: Full (rounded-full)
- Font size: 14px (text-sm)
- Gap: 8px (gap-2)
- Flex-wrap layout
- Selected: bg-primary/10, border-primary, text-primary, font-medium
- Unselected: bg-background, border-border
- Hover: border-primary/50, bg-primary/5

### Textarea
- Rows: 4
- Border: border-border
- Border radius: rounded-lg
- Placeholder: "Describe your symptoms, concerns, or tests you're looking for.."
- 16px spacing above (from space-y-4)

### Typography
- Page titles (h2): text-xl font-semibold, mb-2
- Subtitles: text-sm text-muted-foreground, mb-4
- Patient names: text-sm font-medium
- Test type labels: text-sm
- Link text: text-sm

## Backend Integration

### Route
```php
Route::post('/booking/lab/patient-test', [LabBookingController::class, 'storePatientTest']);
```

### Controller Method
```php
public function storePatientTest(Request $request)
{
    $validated = $request->validate([
        'patientId' => 'required|string',
        'selectedTestTypes' => 'nullable|array',
        'selectedTestTypes.*' => 'string',
        'testNotes' => 'nullable|string|max:1000',
    ]);

    // Save to session
    session()->put('lab_booking', $validated);

    // Redirect to next step
    return redirect()->route('booking.lab.packages-schedule');
}
```

### Data Loading
```php
public function showPatientTestStep()
{
    $user = auth()->user();

    return inertia('Booking/Lab/PatientTestStep', [
        'familyMembers' => $user->familyMembers()->get(),
        'savedData' => session('lab_booking'),
    ]);
}
```

## Lab Booking Steps

The lab test booking flow has 3 steps:
1. **Patient & Test** (this page) - Select patient and test type
2. **Packages & Schedule** - Choose package and schedule
3. **Confirm** - Review and confirm booking

Step indicator shows:
```typescript
const labSteps = [
  { id: 'patient_test', label: 'Patient & Test' },
  { id: 'packages_schedule', label: 'Packages & Schedule' },
  { id: 'confirm', label: 'Confirm' },
];
```

## Accessibility

- Semantic button elements for all interactive cards
- Disabled state on continue button properly communicated
- Error messages associated with form sections
- Keyboard navigation supported
- Avatar fallbacks for missing images
- Clear visual feedback for selected states

## Edge Cases

### No Family Members
- Grid still renders with empty array
- User can only add new family member
- Continue button remains disabled

### All Test Types Selected
- All chips show selected state
- User can deselect by clicking again
- No maximum limit on selections

### Empty Text Description
- Valid - test types alone are sufficient
- Or both can be empty (patient is the only required field)

## Related Components

- `GuidedBookingLayout` - Wrapper layout with header/footer
- `Avatar` - Avatar component from shadcn/ui
- `Textarea` - Textarea component from shadcn/ui
- `StepIndicator` - Progress indicator in header

## Next Steps

After this step, user proceeds to:
- **Packages & Schedule**: Choose test package and schedule appointment

## Notes

- First step in guided lab test booking wizard
- Simpler than doctor booking (no consultation type selection)
- Test type chips are similar to symptom chips but with different options
- Only patient is required - test types and notes are optional
- State is persisted for back/forward navigation
- Test types help filter package recommendations in next step
- Lab booking is a 3-step flow (vs 4 steps for doctor booking)

## Comparison with Doctor Booking

### Similarities
- Patient selection UI is identical
- Multi-select chips pattern (test types vs symptoms)
- Optional textarea for detailed description
- Same validation pattern
- Same GuidedBookingLayout wrapper

### Differences
- No consultation type selection (new vs follow-up)
- No urgency selection
- Different test type options (vs symptoms)
- Fewer steps (3 vs 4)
- No follow-up banner needed
- Different placeholder text for textarea
