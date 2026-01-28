# GuidedBookingLayout Component

A shared layout component for guided booking wizard pages with header, step indicator, scrollable content area, and sticky footer with navigation controls.

## Features

- ✅ Header with title and mode toggle icons
- ✅ Integrated step indicator/progress bar
- ✅ Scrollable content area with gradient background
- ✅ Sticky footer with Back and Continue buttons
- ✅ Price estimate display in footer
- ✅ Processing state support
- ✅ Customizable continue button label
- ✅ Disable continue button when validation fails
- ✅ Responsive max-width content container
- ✅ TypeScript support
- ✅ Accessible navigation

## Usage

### Basic Usage

```tsx
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';

const steps = [
  { id: 'patient', label: 'Patient' },
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

export default function PatientSelection() {
  const handleBack = () => {
    // Navigate to previous step
  };

  const handleContinue = () => {
    // Navigate to next step
  };

  return (
    <GuidedBookingLayout
      steps={steps}
      currentStepId="patient"
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Who is this appointment for?</h1>
        {/* Your page content */}
      </div>
    </GuidedBookingLayout>
  );
}
```

### With Price Estimate

```tsx
<GuidedBookingLayout
  steps={steps}
  currentStepId="doctor_time"
  onBack={handleBack}
  onContinue={handleContinue}
  priceEstimate="Estimated: ₹500"
>
  {/* Content */}
</GuidedBookingLayout>
```

### With Disabled Continue Button

```tsx
const [selectedPatient, setSelectedPatient] = useState('');

<GuidedBookingLayout
  steps={steps}
  currentStepId="patient"
  onBack={handleBack}
  onContinue={handleContinue}
  continueDisabled={!selectedPatient}
>
  {/* Content */}
</GuidedBookingLayout>
```

### With Custom Continue Label

```tsx
<GuidedBookingLayout
  steps={steps}
  currentStepId="confirm"
  onBack={handleBack}
  onContinue={handleContinue}
  continueLabel="Confirm Booking"
  priceEstimate="Total: ₹500"
>
  {/* Content */}
</GuidedBookingLayout>
```

### With Processing State

```tsx
const [isProcessing, setIsProcessing] = useState(false);

const handleConfirm = async () => {
  setIsProcessing(true);
  try {
    await confirmBooking();
  } finally {
    setIsProcessing(false);
  }
};

<GuidedBookingLayout
  steps={steps}
  currentStepId="confirm"
  onBack={handleBack}
  onContinue={handleConfirm}
  isProcessing={isProcessing}
  continueLabel="Confirm Booking"
>
  {/* Content */}
</GuidedBookingLayout>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Page content to display in the main area |
| `steps` | `Step[]` | Yes | - | Array of step objects for the step indicator |
| `currentStepId` | `string` | Yes | - | ID of the currently active step |
| `onBack` | `() => void` | Yes | - | Callback when Back button is clicked |
| `onContinue` | `() => void` | Yes | - | Callback when Continue button is clicked |
| `continueLabel` | `string` | No | `'Continue'` | Custom label for the Continue button |
| `continueDisabled` | `boolean` | No | `false` | Whether the Continue button should be disabled |
| `priceEstimate` | `string` | No | - | Price estimate text to show in footer (e.g., "Estimated: ₹500") |
| `isProcessing` | `boolean` | No | `false` | Shows processing state and disables buttons |
| `className` | `string` | No | - | Additional CSS classes for the content container |

### Step Object

```typescript
interface Step {
  id: string;      // Unique identifier for the step
  label: string;   // Display label for the step
}
```

## Layout Structure

### Header Section
- **Title**: "Booking an appointment" with Calendar icon
- **Mode Toggle Icons**:
  - Sparkles icon (link to AI mode)
  - BarChart3 icon (current guided mode, highlighted)
- **Step Indicator**: Shows progress through booking steps

### Main Content Area
- **Scrollable**: Allows long content to scroll while header/footer stay fixed
- **Gradient Background**: Blue gradient (`from-blue-50 to-white`) at the top
- **Max Width**: Content constrained to 768px (3xl) for optimal readability
- **Padding**: 24px horizontal, 32px vertical

### Footer Section
- **Sticky**: Remains at bottom of viewport
- **Back Button**: Outlined style, rounded-full, on the left
- **Right Section**:
  - Price estimate (optional, muted text)
  - Continue button (primary style, rounded-full, minimum 120px width)

## Visual Design

### Header
- Background: White (`bg-white`)
- Border: Bottom border (`border-b`)
- Padding: 24px horizontal, 16px vertical
- Icons: 20px × 20px for Calendar, 16px × 16px for mode toggles
- Mode toggle container: Border, rounded-full, padding 4px
- Active mode: Gray background (`bg-gray-100`)
- Hover state: Light gray background on AI mode icon

### Content Area
- Background: Gradient from blue-50 to white
- Container: Max-width 768px, centered with auto margins
- Padding: 24px horizontal, 32px vertical (customizable via className)
- Overflow: Scrollable in Y direction

### Footer
- Background: White (`bg-white`)
- Border: Top border (`border-t`)
- Padding: 24px horizontal, 16px vertical
- Container: Max-width 768px, centered
- Buttons: Rounded-full style
- Back button: Outline variant, 24px horizontal padding
- Continue button: Primary blue, minimum 120px width, 24px horizontal padding
- Price estimate: Small text (14px), muted foreground color
- Gap: 16px between price and continue button

## Examples

### Example 1: Patient Selection Step

```tsx
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { useState } from 'react';

const steps = [
  { id: 'patient', label: 'Patient' },
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

export default function PatientSelection() {
  const [selectedPatient, setSelectedPatient] = useState('');

  return (
    <GuidedBookingLayout
      steps={steps}
      currentStepId="patient"
      onBack={() => router.visit('/booking')}
      onContinue={() => router.visit('/booking/concerns')}
      continueDisabled={!selectedPatient}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            Who is this appointment for?
          </h1>
          <p className="text-sm text-muted-foreground">
            Select a family member or add a new patient
          </p>
        </div>

        {/* Patient selection grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Patient cards */}
        </div>
      </div>
    </GuidedBookingLayout>
  );
}
```

### Example 2: Symptoms Step with Validation

```tsx
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { SymptomChips } from '@/Components/Booking/SymptomChips';
import { useState } from 'react';

export default function ConcernsStep() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const symptoms = [
    { id: 'chest_pain', name: 'Chest pain' },
    { id: 'headache', name: 'Headache' },
    { id: 'fever', name: 'Fever' },
    // ... more symptoms
  ];

  const isValid = selectedSymptoms.length > 0 || description.trim().length > 0;

  return (
    <GuidedBookingLayout
      steps={steps}
      currentStepId="concerns"
      onBack={() => router.visit('/booking/patient')}
      onContinue={() => router.visit('/booking/doctor')}
      continueDisabled={!isValid}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            What symptoms are you experiencing?
          </h1>
          <p className="text-sm text-muted-foreground">
            Select all that apply, or describe in your own words
          </p>
        </div>

        <SymptomChips
          symptoms={symptoms}
          selectedIds={selectedSymptoms}
          onToggle={(id) => {
            setSelectedSymptoms((prev) =>
              prev.includes(id)
                ? prev.filter((s) => s !== id)
                : [...prev, id]
            );
          }}
        />

        <textarea
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Describe your symptoms..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </GuidedBookingLayout>
  );
}
```

### Example 3: Follow-up Consultation

```tsx
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';
import { SymptomChips } from '@/Components/Booking/SymptomChips';

export default function FollowUpConcerns({ previousVisit }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  return (
    <GuidedBookingLayout
      steps={steps}
      currentStepId="concerns"
      onBack={() => router.visit('/booking/patient')}
      onContinue={() => router.visit('/booking/doctor')}
    >
      <div className="space-y-6">
        <FollowUpBanner
          symptoms={previousVisit.symptoms}
          doctorName={previousVisit.doctor.name}
          date={previousVisit.date}
        />

        <div>
          <h1 className="text-2xl font-semibold mb-2">
            What symptoms are you experiencing?
          </h1>
          <p className="text-sm text-muted-foreground">
            Select all that apply, or describe in your own words
          </p>
        </div>

        <SymptomChips
          symptoms={commonSymptoms}
          selectedIds={selectedSymptoms}
          onToggle={handleToggle}
        />
      </div>
    </GuidedBookingLayout>
  );
}
```

### Example 4: Doctor Selection with Price

```tsx
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';

export default function DoctorSelection({ selectedDoctor }) {
  return (
    <GuidedBookingLayout
      steps={steps}
      currentStepId="doctor_time"
      onBack={() => router.visit('/booking/concerns')}
      onContinue={() => router.visit('/booking/confirm')}
      priceEstimate="Estimated: ₹500"
      continueDisabled={!selectedDoctor}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Choose your doctor</h1>
          <p className="text-sm text-muted-foreground">
            12 doctors available for your consultation
          </p>
        </div>

        {/* Doctor list */}
      </div>
    </GuidedBookingLayout>
  );
}
```

### Example 5: Confirmation Step with Processing

```tsx
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function Confirmation({ booking }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await router.post('/booking/confirm', booking);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <GuidedBookingLayout
      steps={steps}
      currentStepId="confirm"
      onBack={() => router.visit('/booking/doctor')}
      onContinue={handleConfirm}
      continueLabel="Confirm Booking"
      isProcessing={isProcessing}
      priceEstimate="Total: ₹500"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Confirm your booking</h1>
          <p className="text-sm text-muted-foreground">
            Review your appointment details before confirming
          </p>
        </div>

        {/* Booking summary */}
      </div>
    </GuidedBookingLayout>
  );
}
```

### Example 6: Multi-step Wizard with State

```tsx
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { useState } from 'react';

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState('patient');
  const [formData, setFormData] = useState({
    patientId: '',
    symptoms: [],
    doctorId: '',
  });

  const handleBack = () => {
    const order = ['patient', 'concerns', 'doctor_time', 'confirm'];
    const idx = order.indexOf(currentStep);
    if (idx > 0) setCurrentStep(order[idx - 1]);
  };

  const handleContinue = () => {
    const order = ['patient', 'concerns', 'doctor_time', 'confirm'];
    const idx = order.indexOf(currentStep);
    if (idx < order.length - 1) setCurrentStep(order[idx + 1]);
  };

  const isValid = () => {
    switch (currentStep) {
      case 'patient': return !!formData.patientId;
      case 'concerns': return formData.symptoms.length > 0;
      case 'doctor_time': return !!formData.doctorId;
      default: return true;
    }
  };

  return (
    <GuidedBookingLayout
      steps={steps}
      currentStepId={currentStep}
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!isValid()}
      priceEstimate={formData.doctorId ? 'Estimated: ₹500' : undefined}
    >
      {/* Render content based on currentStep */}
    </GuidedBookingLayout>
  );
}
```

## Styling

### Container
- `min-h-screen`: Full viewport height
- `flex flex-col`: Vertical flex layout
- `bg-white`: White background

### Header
- `flex-none`: No flex grow/shrink
- `border-b`: Bottom border
- `bg-white`: White background

### Main Content
- `flex-1`: Grows to fill available space
- `overflow-y-auto`: Vertical scrolling
- `bg-gradient-to-b from-blue-50 to-white`: Blue gradient background
- Content container: `max-w-3xl mx-auto px-6 py-8`

### Footer
- `flex-none`: No flex grow/shrink
- `border-t`: Top border
- `bg-white`: White background
- `px-6 py-4`: Padding

## Accessibility

- Semantic HTML structure (`header`, `main`, `footer`)
- Keyboard navigation supported on all interactive elements
- Focus states on buttons
- Disabled states properly communicated
- Processing state updates button text
- Icons have proper sizing for visibility

## Browser Support

Works on all modern browsers that support:
- CSS Flexbox
- CSS Gradients
- CSS Custom Properties (Tailwind)
- SVG (for lucide-react icons)

## Integration Notes

### With Inertia.js

```tsx
import { router } from '@inertiajs/react';

<GuidedBookingLayout
  steps={steps}
  currentStepId="patient"
  onBack={() => router.visit('/booking')}
  onContinue={() => router.visit('/booking/concerns')}
>
  {/* Content */}
</GuidedBookingLayout>
```

### With React Router

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

<GuidedBookingLayout
  steps={steps}
  currentStepId="patient"
  onBack={() => navigate(-1)}
  onContinue={() => navigate('/booking/concerns')}
>
  {/* Content */}
</GuidedBookingLayout>
```

### With State-based Navigation

```tsx
const [currentStep, setCurrentStep] = useState('patient');

<GuidedBookingLayout
  steps={steps}
  currentStepId={currentStep}
  onBack={() => {
    // Navigate to previous step in state
  }}
  onContinue={() => {
    // Navigate to next step in state
  }}
>
  {/* Content */}
</GuidedBookingLayout>
```

## Related Components

- `StepIndicator` - Progress indicator used in header
- `SymptomChips` - Symptom selection component
- `FollowUpBanner` - Follow-up info banner
- `AppLayout` - Main application layout (for sidebar/dashboard)

## Common Use Cases

1. **Patient Selection**: Choose who the appointment is for
2. **Symptoms/Concerns**: Select symptoms or describe concerns
3. **Doctor Selection**: Choose doctor and time slot
4. **Confirmation**: Review and confirm booking details
5. **Lab Test Selection**: Choose test type and location
6. **Follow-up Booking**: Book follow-up with previous context

## Notes

- The layout automatically handles scroll behavior - header and footer remain fixed
- Blue gradient background provides visual hierarchy
- Max-width constraint ensures optimal reading experience
- Processing state prevents double-submission
- Continue button can be disabled for validation
- Price estimate appears only when provided
- Mode toggle icons allow switching between AI and guided flows
