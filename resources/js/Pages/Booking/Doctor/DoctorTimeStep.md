# DoctorTimeStep Page

The third step in the guided doctor booking wizard where users select a doctor, time slot, and consultation mode.

## Overview

This page combines four main sections:
1. **Date Selection**: Horizontal scrollable date selector
2. **Doctor List**: Searchable, sortable list of available doctors with time slots
3. **Consultation Mode**: Video or in-person selection (shown after doctor/time selected)
4. **Price Estimate**: Dynamic footer showing price range or final cost

## Features

- ✅ Horizontal date selector with selected state
- ✅ Doctor count and availability message
- ✅ Sort dropdown (Recommended, Price Low/High)
- ✅ Search input for filtering doctors
- ✅ Doctor cards with time slot selection
- ✅ Consultation mode selector
- ✅ Dynamic price estimate in footer
- ✅ Form validation
- ✅ State persistence
- ✅ TypeScript support

## Page Structure

### Section 1: Date Selection
- Heading: "Available {selected date label}"
- Horizontal scrollable date buttons
- Selected date: black background, white text
- Unselected: white background, hover effect

### Section 2: Doctor List Header
- Left: "{count} doctors available" + subtitle
- Right: Sort dropdown + Search input
- Search has magnifying glass icon

### Section 3: Doctor Cards
- Bordered container with dividers
- Each card shows:
  - Doctor avatar, name, specialization, experience
  - Consultation mode badges (Video, In-hospital)
  - Fee range
  - Time slots grid
- Selected card: blue ring border
- Selected time: black background, white text

### Section 4: Consultation Mode (Conditional)
Shows only after doctor and time are selected:
- Heading: "How would you like to consult?"
- Mode options with icon, label, description, price
- Selected mode: blue border, light blue background

## Props

```typescript
interface Props {
  availableDates: DateOption[];
  doctors: Doctor[];
  savedData?: {
    selectedDate?: string;
    selectedDoctorId?: string;
    selectedTime?: string;
    consultationMode?: 'video' | 'in_person';
  };
}

interface DateOption {
  date: string;          // ISO date string
  label: string;         // "Today", "Tomorrow", "Mon", etc.
  sublabel: string;      // "Jan 15", "Jan 16", etc.
}

interface Doctor {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experience_years: number;
  consultation_modes: string[];  // ['video', 'in_person']
  video_fee: number;
  in_person_fee: number;
  slots: TimeSlot[];
}

interface TimeSlot {
  time: string;          // "9:00 AM", "2:00 PM", etc.
  available: boolean;
  preferred: boolean;    // Show star icon
}
```

## State Management

### Local State
- `selectedDate: string` - Selected date (ISO string)
- `selectedDoctorId: string | null` - Selected doctor ID
- `selectedTime: string | null` - Selected time slot
- `consultationMode: 'video' | 'in_person' | null` - Selected mode
- `sortBy: string` - Sort option
- `searchQuery: string` - Search filter text
- `errors: Record<string, string>` - Validation errors

### State Initialization
```typescript
const [selectedDate, setSelectedDate] = useState<string>(
  savedData?.selectedDate || availableDates[0]?.date || ''
);
```

### State Dependencies
- Changing date → Resets doctor, time, mode
- Changing doctor → Resets mode
- Changing time → Keeps mode if same doctor

## User Interactions

### Date Selection
```typescript
const handleDateChange = (date: string) => {
  setSelectedDate(date);
  // Reset selections
  setSelectedDoctorId(null);
  setSelectedTime(null);
  setConsultationMode(null);
  // Reload doctors for new date
  router.reload({ only: ['doctors'], data: { date } });
};
```

### Doctor & Time Selection
```typescript
const handleDoctorTimeSelect = (doctorId: string, time: string) => {
  setSelectedDoctorId(doctorId);
  setSelectedTime(time);
  // Reset mode if changing doctor
  if (selectedDoctorId !== doctorId) {
    setConsultationMode(null);
  }
};
```

### Consultation Mode Selection
```typescript
const handleModeSelect = (mode: string) => {
  setConsultationMode(mode as 'video' | 'in_person');
};
```

### Search & Filter
```typescript
const filteredDoctors = doctors.filter((doctor) => {
  if (!searchQuery) return true;
  return (
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );
});
```

## Validation

### Required Fields
- **Doctor & Time**: Must select both
- **Consultation Mode**: Must select after doctor/time

### Continue Button
Disabled when:
- No doctor selected
- No time slot selected
- No consultation mode selected

### Error Messages
- "Please select a doctor and time slot"
- "Please select how you want to consult"

## Price Estimation

### Price Logic
```typescript
const getPriceEstimate = () => {
  if (selectedDoctor && consultationMode) {
    // Final price
    const fee = consultationMode === 'video'
      ? selectedDoctor.video_fee
      : selectedDoctor.in_person_fee;
    return `Total: ₹${fee.toLocaleString()}`;
  }
  if (selectedDoctor) {
    // Price range
    return `Est: ₹${selectedDoctor.video_fee} - ₹${selectedDoctor.in_person_fee}`;
  }
  return undefined; // No price shown
};
```

### Footer Display
- No doctor selected: No price
- Doctor selected, no mode: "Est: ₹800 - ₹1,200"
- Mode selected: "Total: ₹800"

## DoctorCard Component

### Features
- Doctor avatar with initials fallback
- Name, specialization, experience
- Consultation mode badges
- Fee display (single or range)
- Time slots grid
- Preferred slots marked with star
- Selected state highlighting

### Visual States
- **Normal**: White background
- **Selected**: Light blue background + blue ring
- **Time Slot Normal**: White with border
- **Time Slot Preferred**: Star icon (12px) in top-right corner
- **Time Slot Selected**: Black background, white text
- **Time Slot Unavailable**: 40% opacity, disabled

### Fee Display Logic
- Both modes: "₹800 / 1,200"
- Single mode: "₹800"
- Uses minimum and maximum fees

## Visual Design

### Date Selector
- Horizontal flex with gap-2
- Overflow-x-auto with pb-2 (scrollbar padding)
- Min-width: 100px per button
- Padding: 16px horizontal, 12px vertical
- Border radius: 12px (rounded-xl)
- Selected: bg-foreground (black), text-background (white)
- Unselected: bg-background, hover border-primary/50

### Doctor List Section
- Header: Flex justify-between
- Left: Title + subtitle
- Right: Flex gap-2 with select and search
- Select: w-36 (144px)
- Search: w-64 (256px) with left-9 padding for icon

### Doctor Cards
- Border container, rounded-xl
- Divide-y (horizontal dividers)
- Card padding: 16px
- Selected: ring-2 ring-primary ring-inset, bg-primary/5
- Avatar: 48px (h-12 w-12)
- Time slots: flex-wrap, gap-2

### Consultation Mode Section
- Shows only when doctor+time selected
- Uses ConsultationModeSelector component
- Border container, rounded-xl, divided options
- Option padding: 16px
- Icon: 40px container (w-10 h-10)
- Selected: bg-primary/5, border-2 border-primary

## Backend Integration

### Route
```php
Route::post('/booking/doctor/doctor-time', [DoctorBookingController::class, 'storeDoctorTime']);
```

### Controller Method
```php
public function storeDoctorTime(Request $request)
{
    $validated = $request->validate([
        'selectedDate' => 'required|date',
        'selectedDoctorId' => 'required|string',
        'selectedTime' => 'required|string',
        'consultationMode' => 'required|in:video,in_person',
    ]);

    // Merge with session data
    $bookingData = session('doctor_booking', []);
    session()->put('doctor_booking', array_merge($bookingData, $validated));

    // Redirect to confirmation
    return redirect()->route('booking.doctor.confirm');
}
```

### Data Loading
```php
public function showDoctorTimeStep()
{
    $bookingData = session('doctor_booking');
    $selectedDate = request('date', now()->format('Y-m-d'));

    return inertia('Booking/Doctor/DoctorTimeStep', [
        'availableDates' => $this->getAvailableDates(),
        'doctors' => $this->getAvailableDoctors($selectedDate, $bookingData),
        'savedData' => $bookingData,
    ]);
}

private function getAvailableDates()
{
    $dates = [];
    for ($i = 0; $i < 5; $i++) {
        $date = now()->addDays($i);
        $dates[] = [
            'date' => $date->format('Y-m-d'),
            'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D')),
            'sublabel' => $date->format('M d'),
        ];
    }
    return $dates;
}

private function getAvailableDoctors($date, $bookingData)
{
    return Doctor::with('availability')
        ->when($bookingData['urgency'] === 'urgent', function ($q) {
            return $q->hasAvailableSlotsToday();
        })
        ->when($bookingData['urgency'] === 'this_week', function ($q) {
            return $q->hasAvailableSlotsThisWeek();
        })
        ->get()
        ->map(function ($doctor) use ($date) {
            return [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'avatar' => $doctor->avatar,
                'specialization' => $doctor->specialization,
                'experience_years' => $doctor->experience_years,
                'consultation_modes' => $doctor->consultation_modes,
                'video_fee' => $doctor->video_fee,
                'in_person_fee' => $doctor->in_person_fee,
                'slots' => $this->getAvailableSlots($doctor, $date),
            ];
        });
}
```

## Consultation Mode Options

### Mode Configuration
```typescript
const modes = [
  {
    type: 'video',
    label: 'Video Consultation',
    description: 'Connect from home via video call',
    price: 800,
  },
  {
    type: 'in_person',
    label: 'In-Person Visit',
    description: 'Visit the doctor at the clinic',
    price: 1200,
  },
];
```

### Icons
- Video: Video icon from lucide-react
- In-person: User icon from lucide-react

## Accessibility

- Semantic button elements for all interactive cards
- Disabled states properly communicated
- Search input with icon and placeholder
- Keyboard navigation supported
- Error messages associated with form sections
- Avatar fallbacks for missing images

## Edge Cases

### No Doctors Available
- Shows "0 doctors available"
- Empty doctor list container
- User can change date to find availability

### Single Consultation Mode
- If doctor only offers video, mode selector shows only video option
- Price estimate shows single price, not range

### All Slots Unavailable
- Slots shown but disabled (40% opacity)
- User can select different doctor or date

### Date Reload
- Changing date triggers partial reload
- Only doctors data is refreshed
- Preserves scroll position if possible

## Related Components

- `GuidedBookingLayout` - Wrapper layout
- `ConsultationModeSelector` - Mode selection component
- `Avatar` - Doctor avatar
- `Select` - Sort dropdown
- `Input` - Search input

## Next Steps

After this step, user proceeds to:
- **Confirmation**: Review and confirm all booking details

## Notes

- Third step in guided doctor booking wizard
- Combines doctor selection, time slot, and consultation mode
- Dynamic price estimate helps user make informed decision
- Date selector allows flexible scheduling
- Search and sort improve doctor discovery
- Preferred slots guide users to optimal times
- State management ensures no data loss on navigation
