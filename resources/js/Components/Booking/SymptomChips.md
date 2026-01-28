# SymptomChips Component

A multi-select chip component for symptom selection in the guided booking flow.

## Features

- ✅ Multi-select pill buttons
- ✅ Toggle selection on click
- ✅ Visual states: selected (filled) vs unselected (outlined)
- ✅ Hover effects for better UX
- ✅ Flex-wrap layout for responsive design
- ✅ TypeScript support
- ✅ Customizable via className prop
- ✅ Accessible button elements

## Usage

### Basic Usage

```tsx
import { useState } from 'react';
import { SymptomChips } from '@/Components/Booking/SymptomChips';

const symptoms = [
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

export function SymptomSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <div>
      <h3>What symptoms are you experiencing?</h3>
      <SymptomChips
        symptoms={symptoms}
        selectedIds={selectedIds}
        onToggle={handleToggle}
      />
    </div>
  );
}
```

### With Custom Styling

```tsx
<SymptomChips
  symptoms={symptoms}
  selectedIds={selectedIds}
  onToggle={handleToggle}
  className="gap-3"
/>
```

### With Pre-selected Symptoms

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>(['headache', 'fever']);
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `symptoms` | `Symptom[]` | Yes | Array of symptom objects with `id` and `name` |
| `selectedIds` | `string[]` | Yes | Array of currently selected symptom IDs |
| `onToggle` | `(id: string) => void` | Yes | Callback when a symptom is clicked/toggled |
| `className` | `string` | No | Additional CSS classes for the container |

### Symptom Object

```typescript
interface Symptom {
  id: string;      // Unique identifier for the symptom
  name: string;    // Display name for the symptom
}
```

## Visual States

### 1. Unselected State
Symptoms not in the `selectedIds` array show:
- White background (`bg-background`)
- Gray border (`border-border`)
- Default text color (`text-foreground`)
- Hover: Light blue background and border

### 2. Selected State
Symptoms in the `selectedIds` array show:
- Light blue background (`bg-primary/10`)
- Blue border (`border-primary`)
- Blue text (`text-primary`)
- Medium font weight (`font-medium`)
- Hover: Slightly darker blue tint

## Examples

### Example 1: Guided Booking Flow

```tsx
import { useState } from 'react';
import { SymptomChips } from '@/Components/Booking/SymptomChips';

export function GuidedSymptomStep() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState('');

  const symptoms = [
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
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    console.log('Selected symptoms:', selectedIds);
    console.log('Custom description:', customDescription);
    // Navigate to next step
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          What symptoms are you experiencing?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select all that apply, or describe in your own words
        </p>
      </div>

      <SymptomChips
        symptoms={symptoms}
        selectedIds={selectedIds}
        onToggle={handleToggle}
      />

      <textarea
        className="w-full px-3 py-2 border border-border rounded-lg resize-none"
        placeholder="Describe your symptoms or concerns..."
        rows={4}
        value={customDescription}
        onChange={(e) => setCustomDescription(e.target.value)}
      />

      <button
        onClick={handleContinue}
        className="w-full bg-primary text-white py-3 rounded-lg font-medium"
      >
        Continue
      </button>
    </div>
  );
}
```

### Example 2: Follow-up Consultation

```tsx
export function FollowUpSymptomSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      {/* Previous visit info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm">
          <span className="font-semibold">Following up on:</span> Headache, dizziness
          <br />
          <span className="text-muted-foreground">
            From Dr. Meera Iyer on 15 Jan. Add any new symptoms below.
          </span>
        </p>
      </div>

      {/* Symptom selection */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          What symptoms are you experiencing?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select all that apply, or describe in your own words
        </p>
      </div>

      <SymptomChips
        symptoms={commonSymptoms}
        selectedIds={selectedIds}
        onToggle={handleToggle}
      />
    </div>
  );
}
```

### Example 3: Categorized Symptoms

```tsx
export function CategorizedSymptomSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const categories = {
    respiratory: [
      { id: 'cough', name: 'Cough' },
      { id: 'shortness_breath', name: 'Shortness of breath' },
    ],
    pain: [
      { id: 'chest_pain', name: 'Chest pain' },
      { id: 'back_pain', name: 'Back pain' },
      { id: 'stomach_pain', name: 'Stomach pain' },
      { id: 'headache', name: 'Headache' },
    ],
    general: [
      { id: 'fever', name: 'Fever' },
      { id: 'fatigue', name: 'Fatigue' },
      { id: 'dizziness', name: 'Dizziness' },
      { id: 'skin_rash', name: 'Skin rash' },
    ],
  };

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
          Respiratory
        </h4>
        <SymptomChips
          symptoms={categories.respiratory}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
          Pain
        </h4>
        <SymptomChips
          symptoms={categories.pain}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
          General
        </h4>
        <SymptomChips
          symptoms={categories.general}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
```

## Styling

The component uses Tailwind CSS for styling with the following design:

- **Container**: Flex with wrap and 8px gap (`gap-2`)
- **Chip size**: 16px horizontal padding, 8px vertical padding
- **Border radius**: Full rounded (`rounded-full`)
- **Font size**: 14px (`text-sm`)
- **Transitions**: 150ms all properties
- **Hover state**: Light primary color background and border
- **Selected state**: Primary/10 background, primary border and text, medium font weight

## Accessibility

- Uses semantic `<button>` elements for proper keyboard navigation
- Each button has a unique `key` prop
- Click and keyboard events work properly
- Visual feedback on hover and selection states
- Text labels are clear and descriptive

## Browser Support

Works on all modern browsers that support:
- CSS Flexbox
- CSS Transitions
- CSS Custom Properties (for Tailwind CSS colors)

## Integration with Booking Flow

### State Management

```tsx
// Store selected symptoms in component state
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// Or in form state
const [formData, setFormData] = useState({
  symptoms: [] as string[],
  customDescription: '',
});

// Toggle handler
const handleToggle = (id: string) => {
  setFormData((prev) => ({
    ...prev,
    symptoms: prev.symptoms.includes(id)
      ? prev.symptoms.filter((symptomId) => symptomId !== id)
      : [...prev.symptoms, id],
  }));
};
```

### Validation

```tsx
const isValid = selectedIds.length > 0 || customDescription.trim().length > 0;
```

### Submission

```tsx
const handleSubmit = async () => {
  const data = {
    symptom_ids: selectedIds,
    custom_description: customDescription,
  };

  // Submit to backend
  await fetch('/api/booking/symptoms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
```

## Notes

- Component is specific to **Guided Flow** (AI flow uses freeform text input)
- Supports both chip selection and custom text description
- Selected symptoms can be combined with typed description
- Flex-wrap ensures chips wrap to new lines on smaller screens
- Gap of 8px between chips provides comfortable spacing
- Hover effects provide clear interaction feedback
- Selected state uses primary color from theme (blue #0052FF)

## Related Components

- `StepIndicator` - Progress indicator for guided flow
- `PatientSelector` - Step 1 patient selection
- `DoctorList` - Doctor selection with filters
- `UrgencySelector` - Urgency/timing selection

## Common Symptom List

```tsx
export const commonSymptoms = [
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
```
