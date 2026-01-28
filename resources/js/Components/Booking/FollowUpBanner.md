# FollowUpBanner Component

An informational banner component that displays previous consultation details when a user is booking a follow-up appointment.

## Features

- ✅ Light blue background banner
- ✅ Blue info icon on the left
- ✅ Previous symptoms displayed
- ✅ Doctor name and visit date
- ✅ Clear call-to-action text
- ✅ Rounded corners with padding
- ✅ Responsive layout
- ✅ TypeScript support
- ✅ Customizable via className prop

## Usage

### Basic Usage

```tsx
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';

export function FollowUpPage() {
  return (
    <FollowUpBanner
      symptoms={['Headache', 'dizziness']}
      doctorName="Dr. Meera Iyer"
      date="15 Jan"
    />
  );
}
```

### With Custom Styling

```tsx
<FollowUpBanner
  symptoms={['Chest pain', 'Shortness of breath']}
  doctorName="Dr. Sarah Johnson"
  date="20 Jan"
  className="mb-6"
/>
```

### In Context with Symptom Selection

```tsx
export function FollowUpSymptomStep() {
  return (
    <div className="space-y-6">
      <FollowUpBanner
        symptoms={['Headache', 'dizziness']}
        doctorName="Dr. Meera Iyer"
        date="15 Jan"
      />

      <div>
        <h2 className="text-xl font-semibold mb-2">
          What symptoms are you experiencing?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select all that apply, or describe in your own words
        </p>
      </div>

      {/* SymptomChips and form here */}
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `symptoms` | `string[]` | Yes | Array of previous symptoms |
| `doctorName` | `string` | Yes | Name of the doctor from previous visit |
| `date` | `string` | Yes | Date of the previous visit |
| `className` | `string` | No | Additional CSS classes for the container |

## Visual Design

### Layout
- Container: Light blue background (`bg-primary/10`)
- Border radius: Extra large (`rounded-xl`)
- Padding: 16px all sides (`p-4`)
- Flex layout with items aligned to start
- 12px gap between icon and text (`gap-3`)

### Icon
- Size: 24px × 24px (`w-6 h-6`)
- Background: Primary blue (`bg-primary` - #0052FF)
- Shape: Circle (`rounded-full`)
- Icon: Info icon from lucide-react
- Icon size: 16px × 16px (`w-4 h-4`)
- Icon color: White (`text-white`)
- Flex-shrink: 0 (prevents icon from shrinking)

### Text
- **Main text** (symptoms):
  - Font weight: Medium (`font-medium`)
  - Color: Foreground (`text-foreground`)
  - Format: "Following up on: {symptom1}, {symptom2}"

- **Subtitle** (doctor and date):
  - Font size: 14px (`text-sm`)
  - Color: Muted foreground (`text-muted-foreground`)
  - Format: "From {doctorName} on {date}. Add any new symptoms below."

## Examples

### Example 1: Single Symptom

```tsx
<FollowUpBanner
  symptoms={['Fever']}
  doctorName="Dr. Sarah Johnson"
  date="20 Jan"
/>
```

Output:
```
Following up on: Fever
From Dr. Sarah Johnson on 20 Jan. Add any new symptoms below.
```

### Example 2: Multiple Symptoms

```tsx
<FollowUpBanner
  symptoms={['Chest pain', 'Shortness of breath', 'Fatigue']}
  doctorName="Dr. Michael Chen"
  date="18 Jan"
/>
```

Output:
```
Following up on: Chest pain, Shortness of breath, Fatigue
From Dr. Michael Chen on 18 Jan. Add any new symptoms below.
```

### Example 3: Full Guided Flow Page

```tsx
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';
import { SymptomChips } from '@/Components/Booking/SymptomChips';
import { StepIndicator } from '@/Components/Booking/StepIndicator';
import { useState } from 'react';

export function FollowUpBookingPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const steps = [
    { id: 'patient', label: 'Patient' },
    { id: 'concerns', label: 'Concerns' },
    { id: 'doctor_time', label: 'Doctor & Time' },
    { id: 'confirm', label: 'Confirm' },
  ];

  const commonSymptoms = [
    { id: 'chest_pain', name: 'Chest pain' },
    { id: 'shortness_breath', name: 'Shortness of breath' },
    { id: 'headache', name: 'Headache' },
    { id: 'fever', name: 'Fever' },
    { id: 'fatigue', name: 'Fatigue' },
    { id: 'cough', name: 'Cough' },
    { id: 'back_pain', name: 'Back pain' },
    { id: 'stomach_pain', name: 'Stomach pain' },
    { id: 'dizziness', name: 'Dizziness' },
    { id: 'skin_rash', name: 'Skin rash' },
  ];

  const handleToggle = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StepIndicator steps={steps} currentStepId="concerns" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Follow-up banner */}
        <FollowUpBanner
          symptoms={['Headache', 'dizziness']}
          doctorName="Dr. Meera Iyer"
          date="15 Jan"
        />

        {/* Symptom selection */}
        <div className="bg-white rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              What symptoms are you experiencing?
            </h2>
            <p className="text-sm text-muted-foreground">
              Select all that apply, or describe in your own words
            </p>
          </div>

          <SymptomChips
            symptoms={commonSymptoms}
            selectedIds={selectedSymptoms}
            onToggle={handleToggle}
          />

          <textarea
            className="w-full px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Describe your symptoms or concerns..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Urgency selection would go here */}

        {/* Navigation */}
        <div className="flex justify-between">
          <button className="px-6 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Example 4: With Dynamic Data

```tsx
interface PreviousVisit {
  symptoms: string[];
  doctor: {
    name: string;
  };
  date: string;
}

export function DynamicFollowUpBanner({ visit }: { visit: PreviousVisit }) {
  return (
    <FollowUpBanner
      symptoms={visit.symptoms}
      doctorName={visit.doctor.name}
      date={visit.date}
    />
  );
}
```

### Example 5: Date Formatting

```tsx
import { format, parseISO } from 'date-fns';

export function FormattedDateBanner({ visit }: {
  visit: {
    symptoms: string[];
    doctorName: string;
    visitDate: string; // ISO date string
  };
}) {
  const formattedDate = format(parseISO(visit.visitDate), 'd MMM');

  return (
    <FollowUpBanner
      symptoms={visit.symptoms}
      doctorName={visit.doctorName}
      date={formattedDate}
    />
  );
}
```

## Styling

The component uses Tailwind CSS for styling with the following specifications:

### Container
- Background: `bg-primary/10` (10% opacity primary blue - #0052FF)
- Border radius: `rounded-xl` (0.75rem)
- Padding: `p-4` (16px)
- Display: `flex`
- Align items: `items-start`
- Gap: `gap-3` (12px)

### Icon Container
- Width: `w-6` (24px)
- Height: `h-6` (24px)
- Border radius: `rounded-full` (50%)
- Background: `bg-primary` (#0052FF)
- Display: `flex`
- Align items: `items-center`
- Justify content: `justify-center`
- Flex shrink: `flex-shrink-0`

### Icon
- Width: `w-4` (16px)
- Height: `h-4` (16px)
- Color: `text-white`

### Text Container
- Flexible: Takes remaining space

### Main Text
- Font weight: `font-medium`
- Color: `text-foreground` (default black #0A0B0D)

### Subtitle
- Font size: `text-sm` (14px)
- Color: `text-muted-foreground` (gray)

## Accessibility

- Uses semantic HTML structure
- Info icon provides visual indicator
- Text is clearly readable with proper contrast
- Flex layout maintains proper alignment on different screen sizes
- Icon has `flex-shrink-0` to prevent distortion

## Browser Support

Works on all modern browsers that support:
- CSS Flexbox
- CSS Custom Properties (for Tailwind CSS colors)
- SVG (for lucide-react icons)

## Integration with Booking Flow

### When to Show

Display this banner when:
1. User selects "Follow-up" as consultation type
2. System has previous visit data for the patient
3. User is on the concerns/symptoms step

### Data Source

The banner data typically comes from:
- Previous `BookingConversation` record
- Doctor profile from previous visit
- Formatted visit date

### Example Backend Integration

```tsx
import { router } from '@inertiajs/react';

interface FollowUpPageProps {
  previousVisit: {
    symptoms: string[];
    doctor: {
      name: string;
    };
    visitDate: string;
  };
}

export default function FollowUp({ previousVisit }: FollowUpPageProps) {
  const formattedDate = format(parseISO(previousVisit.visitDate), 'd MMM');

  return (
    <div>
      <FollowUpBanner
        symptoms={previousVisit.symptoms}
        doctorName={previousVisit.doctor.name}
        date={formattedDate}
      />
      {/* Rest of the page */}
    </div>
  );
}
```

## Notes

- The component joins symptoms with commas automatically
- Icon is from lucide-react (Info icon)
- Background uses 10% opacity of primary color for subtle visual
- Text clearly indicates this is a follow-up consultation
- Encourages user to "Add any new symptoms below"
- Flex layout ensures icon and text are properly aligned
- Works seamlessly with other guided booking components

## Related Components

- `SymptomChips` - Multi-select symptom chips below the banner
- `StepIndicator` - Progress indicator for guided flow
- `EmbeddedPreviousVisit` - Similar component for AI chat flow
- `EmbeddedFollowUpReason` - Reason selection in AI flow

## Common Symptom Formatting

```tsx
// Single symptom
symptoms: ['Fever']
// Output: "Following up on: Fever"

// Two symptoms
symptoms: ['Headache', 'dizziness']
// Output: "Following up on: Headache, dizziness"

// Multiple symptoms
symptoms: ['Chest pain', 'Shortness of breath', 'Fatigue']
// Output: "Following up on: Chest pain, Shortness of breath, Fatigue"
```

## Common Date Formats

```tsx
// Short format
date: "15 Jan"

// Long format
date: "15 January 2026"

// With year
date: "15 Jan 2026"

// Using date-fns
format(parseISO('2026-01-15'), 'd MMM')      // "15 Jan"
format(parseISO('2026-01-15'), 'd MMMM')     // "15 January"
format(parseISO('2026-01-15'), 'd MMM yyyy') // "15 Jan 2026"
```
