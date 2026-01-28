# StepIndicator Component

A reusable horizontal step indicator component for guided booking wizards.

## Features

- ✅ Horizontal progress stepper
- ✅ Visual progress line connecting steps
- ✅ Current step highlighted with bold text and indicator dot
- ✅ Completed steps show filled progress line
- ✅ Smooth transitions between steps
- ✅ Responsive design
- ✅ TypeScript support
- ✅ Customizable via className prop

## Usage

### Basic Usage

```tsx
import { StepIndicator } from '@/Components/Booking/StepIndicator';

const steps = [
  { id: 'patient', label: 'Patient' },
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

export function BookingWizard() {
  return (
    <div>
      <StepIndicator
        steps={steps}
        currentStepId="concerns"
      />
      {/* Your step content here */}
    </div>
  );
}
```

### With Custom Styling

```tsx
<StepIndicator
  steps={steps}
  currentStepId="patient"
  className="shadow-lg border-b-2"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `steps` | `Step[]` | Yes | Array of step objects with `id` and `label` |
| `currentStepId` | `string` | Yes | ID of the currently active step |
| `className` | `string` | No | Additional CSS classes for the container |

### Step Object

```typescript
interface Step {
  id: string;      // Unique identifier for the step
  label: string;   // Display label for the step
}
```

## Visual States

### 1. Completed Steps
Steps before the current step show:
- Gray text color (`text-muted-foreground`)
- Fully filled blue progress line
- No indicator dot

### 2. Current Step
The active step shows:
- Bold black text (`font-semibold text-foreground`)
- Filled blue progress line up to the step
- Blue indicator dot at the end of the line

### 3. Upcoming Steps
Steps after the current step show:
- Gray text color (`text-muted-foreground`)
- Gray background line (unfilled)
- No indicator dot

## Examples

### Doctor Appointment Flow

```tsx
const doctorSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

// Step 1: Patient selection
<StepIndicator steps={doctorSteps} currentStepId="patient" />

// Step 2: Concerns/symptoms
<StepIndicator steps={doctorSteps} currentStepId="concerns" />

// Step 3: Doctor and time selection
<StepIndicator steps={doctorSteps} currentStepId="doctor_time" />

// Step 4: Confirmation
<StepIndicator steps={doctorSteps} currentStepId="confirm" />
```

### Lab Test Booking Flow

```tsx
const labSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'test_type', label: 'Test Type' },
  { id: 'location_time', label: 'Location & Time' },
  { id: 'confirm', label: 'Confirm' },
];

<StepIndicator steps={labSteps} currentStepId="test_type" />
```

### Dynamic Flow Selection

```tsx
function BookingWizard({ bookingType, currentStep }) {
  const steps = bookingType === 'doctor'
    ? doctorBookingSteps
    : labTestBookingSteps;

  return (
    <div>
      <StepIndicator steps={steps} currentStepId={currentStep} />
      {/* Step content */}
    </div>
  );
}
```

## Styling

The component uses Tailwind CSS for styling with the following color scheme:

- **Primary color**: `#0052FF` (blue) - for active/completed progress
- **Background line**: `bg-gray-200` - for incomplete progress
- **Current step text**: `font-semibold text-foreground` (black, bold)
- **Other steps text**: `text-muted-foreground` (gray)
- **Indicator dot**: 12px circle with primary blue color and shadow

## Accessibility

- Uses semantic HTML structure
- Text labels are readable and descriptive
- Visual progress is supplemented with text labels
- Smooth transitions provide visual feedback

## Browser Support

Works on all modern browsers that support:
- CSS Flexbox
- CSS Transforms
- CSS Transitions

## Integration with Booking Flow

### Example Integration

```tsx
import { useState } from 'react';
import { StepIndicator } from '@/Components/Booking/StepIndicator';

export default function GuidedBooking() {
  const [currentStep, setCurrentStep] = useState('patient');

  const steps = [
    { id: 'patient', label: 'Patient' },
    { id: 'concerns', label: 'Concerns' },
    { id: 'doctor_time', label: 'Doctor & Time' },
    { id: 'confirm', label: 'Confirm' },
  ];

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StepIndicator steps={steps} currentStepId={currentStep} />

      <div className="max-w-4xl mx-auto p-6">
        {/* Step content based on currentStep */}
        {currentStep === 'patient' && <PatientSelection />}
        {currentStep === 'concerns' && <ConcernsForm />}
        {currentStep === 'doctor_time' && <DoctorTimeSelection />}
        {currentStep === 'confirm' && <ConfirmationPage />}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button onClick={handleBack} disabled={currentStep === 'patient'}>
            Back
          </button>
          <button onClick={handleNext} disabled={currentStep === 'confirm'}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Notes

- The component automatically calculates which steps are completed based on the current step index
- Progress line fills from left to right as user advances through steps
- The indicator dot appears only on the current step
- All transitions are smooth (300ms) for better UX
- Component is fully responsive and works on all screen sizes
- Maximum width is constrained to 3xl (48rem) for optimal readability

## Related Components

- `PatientSelector` - Step 1 content
- `ConsultationType` - Step 2 content
- `DoctorList` - Step 3 content
- `BookingSummary` - Step 4 content
