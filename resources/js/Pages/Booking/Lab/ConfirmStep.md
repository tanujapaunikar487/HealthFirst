# ConfirmStep Page (Lab Booking)

The final step in the guided lab test booking wizard where users review their booking summary and proceed to payment.

## Overview

This page displays:
1. **Booking Summary**: All booking details with "Change" links to navigate back
2. **Preparation Instructions**: Important test preparation guidelines (conditional)
3. **Payment Button**: Footer button to initiate payment

## Features

- ✅ Summary table with 6 rows (Package, Patient, Date & Time, Collection, Address, Fee)
- ✅ "Change" links on first 5 rows to edit selections
- ✅ Patient avatar with orange-400 fallback
- ✅ Formatted date/time display
- ✅ Preparation instructions in amber warning box
- ✅ Payment button in footer showing total amount
- ✅ Processing state during payment
- ✅ TypeScript support

## Page Structure

### Section 1: Booking Summary
- Heading: "Booking Summary"
- Border container with dividers
- 6 rows:
  1. **Package** - Package name + Change link → packages-schedule
  2. **Patient** - Avatar + name + Change link → patient-test
  3. **Date & Time** - Formatted datetime + Change link → packages-schedule
  4. **Collection** - Collection type + Change link → packages-schedule
  5. **Address** - Collection address + Change link → packages-schedule
  6. **Consultation Fee** - Total amount (no Change link)

### Section 2: Preparation Instructions (Conditional)
- Only shown if `prepInstructions.length > 0`
- Amber background (bg-amber-50)
- Amber border (border-amber-200)
- Exclamation icon in amber circle
- Bulleted list of instructions

### Footer
- Back button (left)
- "Pay ₹4,999" button (right) - shows actual fee amount
- Button disabled during processing
- Shows "Processing..." label when payment initiated

## Props

```typescript
interface Props {
  summary: {
    package: { id: string; name: string };
    patient: { id: string; name: string; avatar: string | null };
    datetime: string;          // ISO datetime string
    collection: string;         // "Home Collection" or "Visit Center"
    address: string;            // Collection address
    fee: number;                // Total fee (package + collection)
    prepInstructions: string[]; // Array of instruction strings
  };
}
```

## State Management

### Local State
- `isProcessing: boolean` - Payment processing state

### State Usage
```typescript
const [isProcessing, setIsProcessing] = useState(false);

const handlePay = () => {
  setIsProcessing(true);
  router.post('/booking/lab/confirm');
};
```

## User Interactions

### Change Links Navigation
```typescript
const handleChange = (step: string) => {
  router.get(`/booking/lab/${step}`);
};

// Change links map to:
// - Package → /booking/lab/packages-schedule
// - Patient → /booking/lab/patient-test
// - Date & Time → /booking/lab/packages-schedule
// - Collection → /booking/lab/packages-schedule
// - Address → /booking/lab/packages-schedule
```

### Back Button
```typescript
const handleBack = () => {
  router.get('/booking/lab/packages-schedule');
};
```

### Payment Button
```typescript
const handlePay = () => {
  setIsProcessing(true);
  // Triggers payment gateway (Razorpay, etc.)
  router.post('/booking/lab/confirm');
};
```

## Date Formatting

### DateTime Display
```typescript
const formatDateTime = (datetime: string) => {
  try {
    const date = parseISO(datetime);
    return format(date, 'EEE, d MMM • h:mm a');
    // Example output: "Sat, 25 Jan • 8:00 AM"
  } catch {
    return datetime;
  }
};
```

## Preparation Instructions

### Example Instructions
```typescript
prepInstructions: [
  'Fasting for 10-12 hours required',
  'Water is allowed',
  'Avoid alcohol 24 hours before',
  'Continue regular medications unless advised otherwise',
]
```

### Visual Design
- Amber-50 background with amber-200 border
- Rounded-xl container with padding
- Exclamation icon: 24px amber-500 circle with white "!" text
- Bulleted list with text-sm amber-800 text
- Space-y-1 between list items

## Visual Design

### Summary Table
- Border container, rounded-xl
- Divide-y (horizontal dividers)
- White background
- Row padding: 16px
- Label: text-muted-foreground
- Value: font-medium (rows 1-5), font-semibold (fee row)
- Avatar: 24px (w-6 h-6) with orange-400 fallback
- Change link: text-primary, hover:underline

### Preparation Instructions Box
- Spacing: mt-6 (24px gap from summary)
- Border-radius: rounded-xl (12px)
- Padding: 16px
- Background: bg-amber-50
- Border: border-amber-200
- Icon container: 24px circle (w-6 h-6)
- Icon background: bg-amber-500
- Title: font-semibold, text-amber-900
- Instructions: text-sm, text-amber-800
- Bullet spacing: space-y-1 (4px)

### Footer
- Back button: outline variant
- Payment button: primary variant
- Button label: "Pay ₹{amount}"
- Processing state: "Processing..." with disabled button

## SummaryRow Component

### Props
```typescript
interface SummaryRowProps {
  label: string;
  value: React.ReactNode;
  onChangeClick: () => void;
}
```

### Usage
```tsx
<SummaryRow
  label="Package"
  value={<span className="font-medium">{summary.package.name}</span>}
  onChangeClick={() => handleChange('packages-schedule')}
/>

<SummaryRow
  label="Patient"
  value={
    <div className="flex items-center gap-2">
      <Avatar className="w-6 h-6">
        <AvatarImage src={summary.patient.avatar || undefined} />
        <AvatarFallback className="bg-orange-400 text-white text-xs font-medium">
          {getInitial(summary.patient.name)}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium">{summary.patient.name}</span>
    </div>
  }
  onChangeClick={() => handleChange('patient-test')}
/>
```

## Backend Integration

### Route
```php
Route::post('/booking/lab/confirm', [LabBookingController::class, 'confirmBooking']);
```

### Controller Method
```php
public function confirmBooking(Request $request)
{
    $bookingData = session('lab_booking');

    // Create booking record
    $booking = Booking::create([
        'user_id' => auth()->id(),
        'type' => 'lab',
        'patient_id' => $bookingData['patientId'],
        'package_id' => $bookingData['selectedPackageId'],
        'datetime' => $bookingData['selectedDate'] . ' ' . $bookingData['selectedTime'],
        'collection_type' => $bookingData['selectedLocation'],
        'address' => $bookingData['address'],
        'total_fee' => $bookingData['totalFee'],
        'status' => 'pending_payment',
    ]);

    // Initialize payment gateway (Razorpay, etc.)
    $payment = $this->initiatePayment($booking);

    return inertia('Booking/Payment', [
        'booking' => $booking,
        'payment' => $payment,
    ]);
}
```

### Data Loading
```php
public function showConfirmStep()
{
    $bookingData = session('lab_booking');

    // Fetch all related data
    $package = Package::findOrFail($bookingData['selectedPackageId']);
    $patient = Patient::findOrFail($bookingData['patientId']);
    $location = $this->getLocationDetails($bookingData['selectedLocation']);

    $summary = [
        'package' => [
            'id' => $package->id,
            'name' => $package->name,
        ],
        'patient' => [
            'id' => $patient->id,
            'name' => $patient->name,
            'avatar' => $patient->avatar,
        ],
        'datetime' => $bookingData['selectedDate'] . 'T' . $bookingData['selectedTime'],
        'collection' => $bookingData['selectedLocation'] === 'home' ? 'Home Collection' : 'Visit Center',
        'address' => $bookingData['address'] ?? $location['address'],
        'fee' => $package->price + $location['fee'],
        'prepInstructions' => $package->requires_fasting
            ? $this->getFastingInstructions($package)
            : [],
    ];

    return inertia('Booking/Lab/ConfirmStep', [
        'summary' => $summary,
    ]);
}

private function getFastingInstructions($package)
{
    return [
        "Fasting for {$package->fasting_hours} hours required",
        'Water is allowed',
        'Avoid alcohol 24 hours before',
        'Continue regular medications unless advised otherwise',
    ];
}
```

## Example Data

### Summary Object
```typescript
const summary = {
  package: {
    id: '1',
    name: 'Basic Health Checkup',
  },
  patient: {
    id: '1',
    name: 'Kriti Jaisinghani',
    avatar: '/avatars/kriti.jpg',
  },
  datetime: '2026-01-25T08:00:00',
  collection: 'Home Collection',
  address: '123, Palm Grove, Koregaon Park',
  fee: 4999,
  prepInstructions: [
    'Fasting for 10-12 hours required',
    'Water is allowed',
    'Avoid alcohol 24 hours before',
    'Continue regular medications unless advised otherwise',
  ],
};
```

## Accessibility

- Semantic table-like structure for summary
- Clear visual hierarchy
- Avatar fallbacks for missing images
- Disabled states properly communicated
- Processing state feedback
- Warning icon for preparation instructions
- Keyboard navigation supported

## Edge Cases

### No Preparation Instructions
- Preparation box not shown
- Only summary table displayed
- More space between summary and footer

### Missing Patient Avatar
- Orange-400 fallback with initials
- Consistent with other booking flows

### Payment Processing
- Button disabled during processing
- Label changes to "Processing..."
- Prevents double submission

### Navigation from Change Links
- Preserves all session data
- User can navigate back to any step
- Selections remain intact

## Related Components

- `GuidedBookingLayout` - Wrapper layout
- `Avatar` - Patient avatar display
- `AvatarImage` - Avatar image
- `AvatarFallback` - Avatar fallback with initials

## Payment Flow

After this step, user proceeds to:
- **Payment Gateway**: Razorpay/Stripe integration
- **Payment Success**: Confirmation screen with booking details
- **Payment Failed**: Error screen with retry option

## Notes

- Final step in guided lab booking wizard (3 steps total)
- Similar structure to doctor booking confirm step
- Key difference: Preparation instructions instead of consultation fee breakdown
- Payment button label includes amount: "Pay ₹4,999"
- Address can be either home address or center address based on collection type
- Preparation instructions are conditional based on package requirements
- All navigation preserves session state for seamless editing
- Processing state prevents accidental duplicate bookings
