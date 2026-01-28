# ConfirmStep Page

The final step in the guided doctor booking wizard where users review their booking details before proceeding to payment.

## Overview

This page shows a booking summary with all selected details and "Change" links that allow users to navigate back to previous steps to modify their selections.

## Features

- ✅ Booking summary display
- ✅ Doctor with avatar
- ✅ Patient with avatar
- ✅ Formatted date and time
- ✅ Consultation type
- ✅ Consultation fee
- ✅ "Change" links for each editable field
- ✅ Footer with total price
- ✅ Continue button to proceed to payment
- ✅ Integrated with GuidedBookingLayout
- ✅ TypeScript support

## Page Structure

### Booking Summary Section
- Heading: "Booking Summary"
- White background card with border
- Divided rows for each detail
- Each row has:
  - Label (left, muted)
  - Value (right, with avatar if applicable)
  - "Change" link (blue, clickable)

### Summary Rows
1. **Doctor**: Avatar + name, "Change" → doctor-time step
2. **Patient**: Avatar + name, "Change" → patient step
3. **Date & Time**: Formatted datetime, "Change" → doctor-time step
4. **Type**: Consultation type, "Change" → doctor-time step
5. **Consultation Fee**: Price (no "Change" button)

### Footer
- Shows: "Total: ₹800"
- Continue button: Proceeds to payment

## Props

```typescript
interface Props {
  summary: Summary;
}

interface Summary {
  doctor: Doctor;
  patient: Patient;
  datetime: string;       // ISO datetime string
  consultationType: string; // "Video Consultation" or "In-Person Visit"
  fee: number;
}

interface Doctor {
  id: string;
  name: string;
  avatar: string | null;
}

interface Patient {
  id: string;
  name: string;
  avatar: string | null;
}
```

## User Interactions

### Change Links
Each "Change" link navigates to the appropriate step:

```typescript
const handleChange = (step: string) => {
  router.get(`/booking/doctor/${step}`);
};

// Usage:
- Doctor: handleChange('doctor-time')
- Patient: handleChange('patient')
- Date & Time: handleChange('doctor-time')
- Type: handleChange('doctor-time')
```

### Navigation
```typescript
const handleBack = () => {
  router.get('/booking/doctor/doctor-time');
};

const handleContinue = () => {
  // Proceed to payment
  router.post('/booking/doctor/confirm');
};
```

## Date & Time Formatting

```typescript
const formatDateTime = (datetime: string) => {
  try {
    const date = parseISO(datetime);
    return format(date, 'EEE, d MMM • h:mm a');
  } catch {
    return datetime;
  }
};

// Examples:
// Input: "2026-01-25T08:00:00"
// Output: "Sat, 25 Jan • 8:00 AM"
```

## SummaryRow Component

Reusable component for displaying summary rows with "Change" links.

### Props
```typescript
interface SummaryRowProps {
  label: string;            // "Doctor", "Patient", etc.
  value: React.ReactNode;   // Can be text, avatar+text, etc.
  onChangeClick: () => void; // Navigate to edit step
}
```

### Usage
```typescript
<SummaryRow
  label="Doctor"
  value={
    <div className="flex items-center gap-2">
      <Avatar className="w-6 h-6">
        <AvatarImage src={doctor.avatar || undefined} />
        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{doctor.name}</span>
    </div>
  }
  onChangeClick={() => handleChange('doctor-time')}
/>
```

## Visual Design

### Summary Card
- Border: border (gray)
- Border radius: rounded-xl (12px)
- Background: bg-white
- Overflow: hidden
- Divide: divide-y (horizontal dividers)

### Summary Rows
- Padding: 16px (p-4)
- Layout: Flex justify-between
- Label: text-muted-foreground (left)
- Value: flex items-center gap-3 (right)
  - Content: font-medium
  - Change button: text-primary, text-sm, hover:underline

### Avatars
- Size: 24px (w-6 h-6)
- Fallback: orange-400 background, white text
- Text: text-xs, font-medium
- Initial: Uppercase first character

### Consultation Fee Row
- Same layout as other rows
- No "Change" button
- Fee: font-semibold

### Typography
- Page title: text-xl font-semibold, mb-6
- Labels: text-muted-foreground
- Values: font-medium
- Fee: font-semibold
- Change links: text-primary, text-sm

## Backend Integration

### Route
```php
Route::post('/booking/doctor/confirm', [DoctorBookingController::class, 'confirmBooking']);
```

### Controller Method
```php
public function showConfirmStep()
{
    $bookingData = session('doctor_booking');

    // Fetch full details
    $doctor = Doctor::find($bookingData['selectedDoctorId']);
    $patient = Patient::find($bookingData['patientId']);

    // Build datetime
    $datetime = Carbon::parse($bookingData['selectedDate'])
        ->setTimeFromTimeString($bookingData['selectedTime']);

    // Get consultation type label
    $consultationType = $bookingData['consultationMode'] === 'video'
        ? 'Video Consultation'
        : 'In-Person Visit';

    // Get fee
    $fee = $bookingData['consultationMode'] === 'video'
        ? $doctor->video_fee
        : $doctor->in_person_fee;

    return inertia('Booking/Doctor/ConfirmStep', [
        'summary' => [
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'avatar' => $doctor->avatar,
            ],
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'avatar' => $patient->avatar,
            ],
            'datetime' => $datetime->toIso8601String(),
            'consultationType' => $consultationType,
            'fee' => $fee,
        ],
    ]);
}

public function confirmBooking(Request $request)
{
    $bookingData = session('doctor_booking');

    // Create booking record
    $booking = Booking::create([
        'user_id' => auth()->id(),
        'doctor_id' => $bookingData['selectedDoctorId'],
        'patient_id' => $bookingData['patientId'],
        'datetime' => Carbon::parse($bookingData['selectedDate'])
            ->setTimeFromTimeString($bookingData['selectedTime']),
        'consultation_mode' => $bookingData['consultationMode'],
        'symptoms' => $bookingData['selectedSymptoms'],
        'notes' => $bookingData['symptomNotes'],
        'urgency' => $bookingData['urgency'],
        'status' => 'pending_payment',
    ]);

    // Clear session
    session()->forget('doctor_booking');

    // Redirect to payment
    return redirect()->route('payment.show', ['booking' => $booking->id]);
}
```

## Data Flow

### Session Data Structure
Throughout the wizard, data is accumulated in session:
```php
'doctor_booking' => [
    // From PatientStep
    'patientId' => 'uuid',
    'consultationType' => 'new' | 'followup',
    'quickBookDoctorId' => 'uuid' | null,
    'quickBookTime' => 'time' | null,

    // From ConcernsStep
    'selectedSymptoms' => ['symptom1', 'symptom2'],
    'symptomNotes' => 'text',
    'urgency' => 'urgent' | 'this_week' | 'specific_date',

    // From DoctorTimeStep
    'selectedDate' => '2026-01-25',
    'selectedDoctorId' => 'uuid',
    'selectedTime' => '8:00 AM',
    'consultationMode' => 'video' | 'in_person',
]
```

### Summary Assembly
Controller assembles summary from:
1. Session data (IDs, selections)
2. Database (full doctor/patient records)
3. Formatted strings (consultation type)
4. Calculated values (fee based on mode)

## Accessibility

- Semantic button elements for "Change" links
- Clear labels for all fields
- Avatar fallbacks for missing images
- Proper contrast for all text
- Keyboard navigation supported

## Edge Cases

### Missing Avatar
- Shows initials in orange circle
- Uppercase first character of name

### Invalid Datetime
- Falls back to raw datetime string
- Try-catch prevents page crash

### Navigation Flow
- "Change" links preserve other selections
- User can modify any field without starting over
- Session data ensures state persistence

## Related Components

- `GuidedBookingLayout` - Wrapper layout with header/footer
- `Avatar` - Avatar component from shadcn/ui
- `SummaryRow` - Internal reusable row component
- `StepIndicator` - Progress indicator in header

## Next Steps

After clicking "Continue":
1. **Create Booking Record**: Save to database with status "pending_payment"
2. **Clear Session**: Remove 'doctor_booking' session data
3. **Redirect to Payment**: Navigate to payment gateway
4. **Payment Flow**: Handle payment success/failure
5. **Confirmation**: Show final confirmation page or receipt

## Notes

- Final step in guided doctor booking wizard
- All selections made in previous steps are summarized here
- "Change" links allow quick edits without restarting
- No form validation needed (all validated in previous steps)
- Clicking "Continue" creates booking and initiates payment
- Session data cleared after successful booking creation
- Price matches selected consultation mode (video vs in-person)
- DateTime formatted for readability (e.g., "Sat, 25 Jan • 8:00 AM")

## Example Backend Data

```php
// Example summary data sent to frontend
[
    'summary' => [
        'doctor' => [
            'id' => 'uuid-123',
            'name' => 'Dr. Meera Iyer',
            'avatar' => '/storage/avatars/doctor-123.jpg',
        ],
        'patient' => [
            'id' => 'uuid-456',
            'name' => 'Kriti Jaisinghani',
            'avatar' => '/storage/avatars/patient-456.jpg',
        ],
        'datetime' => '2026-01-25T08:00:00+05:30',
        'consultationType' => 'Video Consultation',
        'fee' => 800,
    ],
]
```

## Consultation Type Labels

```php
// Map mode to display label
$consultationTypeLabels = [
    'video' => 'Video Consultation',
    'in_person' => 'In-Person Visit',
];
```

## Price Display

- Consultation Fee row: "₹800"
- Footer: "Total: ₹800"
- Both use `toLocaleString()` for proper formatting
- Indian number format with comma separator
