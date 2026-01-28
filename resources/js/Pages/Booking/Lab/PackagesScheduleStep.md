# PackagesScheduleStep Page

The second step in the guided lab test booking wizard where users select a package, collection location, date, and time.

## Overview

This page combines three main sections:
1. **Recommended Packages**: List of available test packages with Book button
2. **Collection Location**: Home collection vs visit center selection
3. **Date & Time**: Date selector, fasting alert (conditional), and time slot grid

## Features

- ✅ Package cards with metadata (duration, tests, age range)
- ✅ Recommended badge for suggested packages
- ✅ Location selection with icons, addresses, distances, and fees
- ✅ Conditional fasting alert based on selected package
- ✅ Horizontal date selector with selected state
- ✅ Time slot grid with preferred indicators
- ✅ Dynamic price estimate in footer (package + location fee)
- ✅ Form validation
- ✅ State persistence
- ✅ TypeScript support

## Page Structure

### Section 1: Recommended Packages
- Heading: "Recommended packages"
- Border container with dividers
- Each package shows:
  - Name + "Recommended" badge (if applicable)
  - Price with strikethrough original price
  - Description
  - Metadata: duration, test count, age range
  - Book button + info chevron
- Selected package: blue ring border, light blue background

### Section 2: Collection Location
- Heading: "Where should we collect the sample?"
- Border container with dividers
- Location options show:
  - Icon (Home or Building2)
  - Label, description, address, distance
  - Fee
- Selected location: blue border, light blue background

### Section 3: Date & Time
- Heading: "Select Date"
- Conditional fasting alert (amber box with warning icon)
- Horizontal scrollable date buttons
- Time slot grid with preferred stars
- Selected date: black background, white text
- Selected time: black background, white text

## Props

```typescript
interface Props {
  packages: Package[];
  locations: LocationOption[];
  availableDates: DateOption[];
  timeSlots: TimeSlot[];
  savedData?: {
    selectedPackageId?: string;
    selectedLocation?: string;
    selectedDate?: string;
    selectedTime?: string;
  };
}

interface Package {
  id: string;
  name: string;
  description: string;
  duration_hours: string;
  tests_count: number;
  age_range: string;
  price: number;
  original_price: number;
  is_recommended: boolean;
  requires_fasting: boolean;
  fasting_hours?: number;
}

interface LocationOption {
  type: 'home' | 'center';
  label: string;
  description: string;
  address?: string;
  distance?: string;
  fee: number;
}

interface DateOption {
  date: string;          // ISO date string
  label: string;         // "Today", "Tomorrow", "Mon", etc.
  sublabel: string;      // "Jan 15", "Jan 16", etc.
}

interface TimeSlot {
  time: string;          // "9:00 AM", "2:00 PM", etc.
  available: boolean;
  preferred: boolean;    // Show star icon
}
```

## State Management

### Local State
- `selectedPackageId: string | null` - Selected package ID
- `selectedLocation: string | null` - Selected location type ('home' or 'center')
- `selectedDate: string` - Selected date (ISO string)
- `selectedTime: string | null` - Selected time slot
- `errors: Record<string, string>` - Validation errors

### State Initialization
```typescript
const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
  savedData?.selectedPackageId || null
);
const [selectedLocation, setSelectedLocation] = useState<string | null>(
  savedData?.selectedLocation || null
);
const [selectedDate, setSelectedDate] = useState<string>(
  savedData?.selectedDate || availableDates[0]?.date || ''
);
const [selectedTime, setSelectedTime] = useState<string | null>(
  savedData?.selectedTime || null
);
```

### State Dependencies
- Changing date → Resets time selection
- Changing package → Shows/hides fasting alert
- Changing location → Updates price estimate

## User Interactions

### Package Selection
```typescript
const handlePackageSelect = (packageId: string) => {
  setSelectedPackageId(packageId);
  // Fasting alert automatically shows/hides based on package.requires_fasting
};
```

### Location Selection
```typescript
const handleLocationSelect = (type: string) => {
  setSelectedLocation(type);
  // Price estimate updates to include location fee
};
```

### Date Selection
```typescript
const handleDateChange = (date: string) => {
  setSelectedDate(date);
  setSelectedTime(null);
  // Reload time slots for new date
  router.reload({ only: ['timeSlots'], data: { date } });
};
```

### Time Selection
```typescript
const handleTimeSelect = (time: string) => {
  setSelectedTime(time);
};
```

## Validation

### Required Fields
- **Package**: Must select a package
- **Location**: Must select collection location
- **Time**: Must select time slot (date has default)

### Continue Button
Disabled when:
- No package selected
- No location selected
- No time slot selected

### Error Messages
- "Please select a package"
- "Please select a collection location"
- "Please select a time slot"

## Price Estimation

### Price Logic
```typescript
const getPriceEstimate = () => {
  if (selectedPackage && selectedLocationOption) {
    // Final price = package price + location fee
    const total = selectedPackage.price + selectedLocationOption.fee;
    return `Total: ₹${total.toLocaleString()}`;
  }
  if (selectedPackage) {
    // Price range with min/max location fees
    const minFee = Math.min(...locations.map((l) => l.fee));
    const maxFee = Math.max(...locations.map((l) => l.fee));
    const minTotal = selectedPackage.price + minFee;
    const maxTotal = selectedPackage.price + maxFee;
    return `Est: ₹${minTotal.toLocaleString()} - ₹${maxTotal.toLocaleString()}`;
  }
  return undefined; // No price shown
};
```

### Footer Display
- No package selected: No price
- Package selected, no location: "Est: ₹4,999 - ₹5,799"
- Location selected: "Total: ₹5,249"

## Fasting Alert Logic

### Conditional Rendering
```typescript
const showFastingAlert =
  selectedPackage?.requires_fasting && selectedPackage?.fasting_hours;

{showFastingAlert && (
  <FastingAlert hours={selectedPackage.fasting_hours!} className="mb-4" />
)}
```

### Alert Display
- Only shown when package requires fasting
- Displays fasting hours requirement
- Amber background with warning icon
- Positioned above date selector

## Components Used

### PackageCard Component
- Displays package metadata and pricing
- Shows "Recommended" badge
- Book button triggers selection
- Selected state: blue ring + light blue background

```typescript
<PackageCard
  package={pkg}
  isSelected={selectedPackageId === pkg.id}
  onSelect={() => handlePackageSelect(pkg.id)}
/>
```

### LocationSelector Component
- Home vs center options
- Shows icons, addresses, distances
- Displays location fee
- Selected state: blue border + background

```typescript
<LocationSelector
  locations={locations}
  selectedLocation={selectedLocation}
  onSelect={(type) => setSelectedLocation(type)}
/>
```

### FastingAlert Component
- Conditional rendering based on package
- Amber warning box
- Shows fasting hours requirement
- "Morning recommended" message

```typescript
<FastingAlert hours={selectedPackage.fasting_hours!} className="mb-4" />
```

### TimeSlotGrid Component
- Displays available time slots
- Preferred slots have star icon
- Unavailable slots are disabled
- Selected state: black background, white text

```typescript
<TimeSlotGrid
  slots={timeSlots}
  selectedTime={selectedTime}
  onSelect={(time) => setSelectedTime(time)}
/>
```

## Visual Design

### Package Cards
- Border container, rounded-xl, divided rows
- Card padding: 16px
- Selected: ring-2 ring-primary ring-inset, bg-primary/5
- Metadata icons: Clock, FlaskConical, User (16px)
- Book button: rounded-full, h-8
- Info chevron: ghost button, 32px square

### Location Selector
- Border container, rounded-xl, divided options
- Option padding: 16px
- Icon container: 40px (w-10 h-10), rounded-lg
- Selected: bg-primary/5, border-2 border-primary
- Home icon for home collection
- Building2 icon for center visit

### Date Selector
- Horizontal flex with gap-2
- Overflow-x-auto with pb-2
- Min-width: 100px per button
- Padding: 16px horizontal, 12px vertical
- Border radius: 12px (rounded-xl)
- Selected: bg-foreground (black), text-background (white)
- Unselected: bg-background, hover border-primary/50

### Time Slots
- Flex-wrap grid with gap-2
- Button padding: 12px horizontal, 6px vertical
- Border radius: 8px (rounded-lg)
- Selected: bg-foreground, text-background, border-foreground
- Unavailable: opacity-50, disabled
- Preferred: Star icon (12px) at top-right corner

### Fasting Alert
- Amber background (bg-amber-50)
- Amber border (border-amber-200)
- Warning icon: 24px amber circle with white AlertCircle
- Padding: 16px
- Margin-bottom: 16px (above date selector)

## Backend Integration

### Route
```php
Route::post('/booking/lab/packages-schedule', [LabBookingController::class, 'storePackagesSchedule']);
```

### Controller Method
```php
public function storePackagesSchedule(Request $request)
{
    $validated = $request->validate([
        'selectedPackageId' => 'required|string',
        'selectedLocation' => 'required|in:home,center',
        'selectedDate' => 'required|date',
        'selectedTime' => 'required|string',
    ]);

    // Merge with session data
    $bookingData = session('lab_booking', []);
    session()->put('lab_booking', array_merge($bookingData, $validated));

    // Redirect to confirmation
    return redirect()->route('booking.lab.confirm');
}
```

### Data Loading
```php
public function showPackagesScheduleStep()
{
    $bookingData = session('lab_booking');
    $selectedDate = request('date', now()->format('Y-m-d'));

    return inertia('Booking/Lab/PackagesScheduleStep', [
        'packages' => $this->getRecommendedPackages($bookingData),
        'locations' => $this->getLocationOptions(),
        'availableDates' => $this->getAvailableDates(),
        'timeSlots' => $this->getAvailableTimeSlots($selectedDate),
        'savedData' => $bookingData,
    ]);
}

private function getRecommendedPackages($bookingData)
{
    return Package::query()
        ->when($bookingData['selectedTestTypes'] ?? [], function ($q, $testTypes) {
            // Filter packages based on selected test types
            return $q->whereHas('testTypes', fn($q) => $q->whereIn('id', $testTypes));
        })
        ->orderBy('is_recommended', 'desc')
        ->orderBy('price')
        ->get()
        ->map(function ($package) {
            return [
                'id' => $package->id,
                'name' => $package->name,
                'description' => $package->description,
                'duration_hours' => $package->duration_hours,
                'tests_count' => $package->tests_count,
                'age_range' => $package->age_range,
                'price' => $package->price,
                'original_price' => $package->original_price,
                'is_recommended' => $package->is_recommended,
                'requires_fasting' => $package->requires_fasting,
                'fasting_hours' => $package->fasting_hours,
            ];
        });
}

private function getLocationOptions()
{
    return [
        [
            'type' => 'home',
            'label' => 'Home Collection',
            'description' => 'Sample collected at your home',
            'address' => 'Your saved address',
            'distance' => '2.5 km away',
            'fee' => 250,
        ],
        [
            'type' => 'center',
            'label' => 'Visit Center',
            'description' => 'Visit our diagnostic center',
            'address' => '123 Health Street, Mumbai',
            'distance' => '1.2 km away',
            'fee' => 0,
        ],
    ];
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

private function getAvailableTimeSlots($date)
{
    // Morning slots are preferred for fasting tests
    return [
        ['time' => '6:00 AM', 'available' => true, 'preferred' => true],
        ['time' => '7:00 AM', 'available' => true, 'preferred' => true],
        ['time' => '8:00 AM', 'available' => true, 'preferred' => true],
        ['time' => '9:00 AM', 'available' => true, 'preferred' => false],
        ['time' => '10:00 AM', 'available' => false, 'preferred' => false],
        ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
        ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
        ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
        ['time' => '4:00 PM', 'available' => false, 'preferred' => false],
    ];
}
```

## Package Data Structure

### Example Packages
```typescript
const packages = [
  {
    id: '1',
    name: 'Complete Health Checkup',
    description: 'Comprehensive tests for overall health assessment',
    duration_hours: '2-3',
    tests_count: 72,
    age_range: '18-60',
    price: 4999,
    original_price: 5999,
    is_recommended: true,
    requires_fasting: true,
    fasting_hours: 10,
  },
  {
    id: '2',
    name: 'Diabetes Screening Package',
    description: 'Blood sugar, HbA1c, and related tests',
    duration_hours: '1-2',
    tests_count: 24,
    age_range: '25+',
    price: 1499,
    original_price: 1999,
    is_recommended: false,
    requires_fasting: true,
    fasting_hours: 8,
  },
  {
    id: '3',
    name: 'Basic Health Panel',
    description: 'Essential tests for routine health monitoring',
    duration_hours: '1',
    tests_count: 40,
    age_range: '18+',
    price: 2499,
    original_price: 2999,
    is_recommended: false,
    requires_fasting: false,
    fasting_hours: null,
  },
];
```

## Accessibility

- Semantic button elements for all interactive elements
- Disabled states for unavailable time slots
- Selected states clearly communicated with color and border
- Keyboard navigation supported
- Error messages associated with form sections
- Icons have appropriate sizing for visibility

## Edge Cases

### No Packages Available
- Show empty state message
- Disable continue button
- User can go back to previous step

### Single Location Option
- Location selector still shown
- Auto-select if only one option (optional UX improvement)
- Price estimate includes location fee

### All Time Slots Unavailable
- Slots shown but all disabled
- User can select different date
- Error message shown if trying to continue

### Package Without Fasting
- Fasting alert not shown
- All time slots available (not just morning)
- No preferred time indicators

### Date Reload
- Changing date triggers partial reload
- Only timeSlots data is refreshed
- Preserves package and location selection

## Related Components

- `GuidedBookingLayout` - Wrapper layout
- `PackageCard` - Package display component
- `LocationSelector` - Location selection component
- `FastingAlert` - Fasting warning component
- `TimeSlotGrid` - Time slot selection component
- `Badge` - Recommended badge
- `Button` - Action buttons

## Next Steps

After this step, user proceeds to:
- **Confirmation**: Review and confirm all lab booking details (package, location, date, time)

## Notes

- Second step in guided lab booking wizard (3 steps total)
- Combines package, location, and schedule selection
- Dynamic price estimate = package price + location fee
- Fasting alert conditionally shown based on package requirements
- Morning slots marked as preferred for fasting tests
- Date selector allows flexible scheduling
- Location selection impacts total price
- State management ensures no data loss on navigation
