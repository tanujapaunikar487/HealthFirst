# Guided Booking Backend Implementation

This document describes the backend implementation for the Guided Booking flow (doctor and lab test bookings).

## Overview

The guided booking flow uses **session-based storage** to persist user selections across the multi-step wizard. Each step validates required data, stores selections in session, and redirects to the next step.

## Architecture

### Session Storage
- Session key: `guided_doctor_booking` for doctor flow
- Session key: `guided_lab_booking` for lab flow
- Data persists across steps until payment is processed
- Session cleared after successful booking

### Flow Control
- Each step checks for required data from previous steps
- Redirects back if prerequisites missing
- Validates input before storing in session
- Merges new data with existing session data

## Routes

All routes are under `/booking` prefix and use the `booking.` name prefix.

### Doctor Booking Routes

```php
// Step 1: Patient Selection
GET  /booking/doctor/patient → patient()
POST /booking/doctor/patient → storePatient()

// Step 2: Concerns/Symptoms
GET  /booking/doctor/concerns → concerns()
POST /booking/doctor/concerns → storeConcerns()

// Step 3: Doctor & Time
GET  /booking/doctor/doctor-time → doctorTime()
POST /booking/doctor/doctor-time → storeDoctorTime()

// Step 4: Confirmation
GET  /booking/doctor/confirm → confirm()
POST /booking/doctor/confirm → processPayment()
```

### Lab Booking Routes

```php
// Step 1: Patient & Test
GET  /booking/lab/patient-test → patientTest()
POST /booking/lab/patient-test → storePatientTest()

// Step 2: Packages & Schedule
GET  /booking/lab/packages-schedule → packagesSchedule()
POST /booking/lab/packages-schedule → storePackagesSchedule()

// Step 3: Confirmation
GET  /booking/lab/confirm → confirm()
POST /booking/lab/confirm → processPayment()
```

## Controller: GuidedDoctorController

Location: `app/Http/Controllers/GuidedDoctorController.php`

### Methods

#### `patient()` - GET /booking/doctor/patient
**Purpose**: Display patient selection step

**Returns**:
- `familyMembers`: Array of family member objects
- `previousConsultations`: Array of recent doctor consultations
- `savedData`: Existing session data for restoration

**Session Data**: None required

**Example Response**:
```php
[
    'familyMembers' => [
        ['id' => '1', 'name' => 'Sanjana', 'relationship' => 'Self', 'age' => 28],
        ['id' => '2', 'name' => 'Kriti', 'relationship' => 'Mother', 'age' => 54],
    ],
    'previousConsultations' => [
        [
            'doctor' => ['id' => 'd1', 'name' => 'Dr. Sarah Johnson'],
            'date' => '2026-01-15',
            'symptoms' => ['Fever', 'Headache'],
            'nextAvailable' => [
                ['time' => '9:00 AM', 'available' => true],
            ],
        ],
    ],
    'savedData' => [],
]
```

---

#### `storePatient()` - POST /booking/doctor/patient
**Purpose**: Store patient and consultation type selection

**Validation**:
```php
[
    'patientId' => 'required|string',
    'consultationType' => 'required|in:new,followup',
    'quickBookDoctorId' => 'nullable|string',
    'quickBookTime' => 'nullable|string',
]
```

**Session Storage**:
```php
guided_doctor_booking: [
    'patientId' => '1',
    'consultationType' => 'new',
    'quickBookDoctorId' => null,
    'quickBookTime' => null,
]
```

**Redirect Logic**:
- If quick booking (doctor + time provided) → Skip to confirm step
- Otherwise → Proceed to concerns step

---

#### `concerns()` - GET /booking/doctor/concerns
**Purpose**: Display symptoms and urgency selection

**Prerequisites**: Must have `patientId` in session

**Returns**:
- `symptoms`: Array of available symptoms
- `urgencyOptions`: Array of urgency options with doctor counts
- `followUp`: Follow-up data if consultation type is 'followup'
- `savedData`: Existing session data

**Example Response**:
```php
[
    'symptoms' => [
        ['id' => 's1', 'name' => 'Fever'],
        ['id' => 's2', 'name' => 'Cough'],
    ],
    'urgencyOptions' => [
        [
            'value' => 'urgent',
            'label' => 'Urgent - Today',
            'description' => "Only today's slots",
            'doctorCount' => 3,
        ],
    ],
    'followUp' => [
        'symptoms' => ['Fever', 'Headache'],
        'doctorName' => 'Dr. Sarah Johnson',
        'date' => 'Jan 15, 2026',
    ],
]
```

---

#### `storeConcerns()` - POST /booking/doctor/concerns
**Purpose**: Store symptoms and urgency selection

**Validation**:
```php
[
    'selectedSymptoms' => 'array',
    'selectedSymptoms.*' => 'string',
    'symptomNotes' => 'nullable|string|max:1000',
    'urgency' => 'required|in:urgent,this_week,specific_date',
]
```

**Session Storage**:
```php
guided_doctor_booking: [
    // ... previous data
    'selectedSymptoms' => ['s1', 's2'],
    'symptomNotes' => 'Started 3 days ago',
    'urgency' => 'urgent',
]
```

**Redirect**: doctor-time step

---

#### `doctorTime()` - GET /booking/doctor/doctor-time
**Purpose**: Display doctor list, time slots, and consultation mode

**Prerequisites**: Must have `urgency` in session

**Query Parameters**:
- `date` (optional): Selected date for availability (default: today)

**Returns**:
- `availableDates`: Array of next 5 dates with labels
- `doctors`: Array of available doctors with slots
- `savedData`: Existing session data

**Example Response**:
```php
[
    'availableDates' => [
        ['date' => '2026-01-25', 'label' => 'Today', 'sublabel' => 'Jan 25'],
        ['date' => '2026-01-26', 'label' => 'Tomorrow', 'sublabel' => 'Jan 26'],
    ],
    'doctors' => [
        [
            'id' => 'd1',
            'name' => 'Dr. Sarah Johnson',
            'specialization' => 'General Physician',
            'experience_years' => 12,
            'consultation_modes' => ['video', 'in_person'],
            'video_fee' => 800,
            'in_person_fee' => 1200,
            'slots' => [
                ['time' => '9:00 AM', 'available' => true, 'preferred' => true],
                ['time' => '10:00 AM', 'available' => false, 'preferred' => false],
            ],
        ],
    ],
]
```

---

#### `storeDoctorTime()` - POST /booking/doctor/doctor-time
**Purpose**: Store doctor, time, and consultation mode selection

**Validation**:
```php
[
    'selectedDate' => 'required|date',
    'selectedDoctorId' => 'required|string',
    'selectedTime' => 'required|string',
    'consultationMode' => 'required|in:video,in_person',
]
```

**Session Storage**:
```php
guided_doctor_booking: [
    // ... previous data
    'selectedDate' => '2026-01-25',
    'selectedDoctorId' => 'd1',
    'selectedTime' => '9:00 AM',
    'consultationMode' => 'video',
]
```

**Redirect**: confirm step

---

#### `confirm()` - GET /booking/doctor/confirm
**Purpose**: Display booking summary

**Prerequisites**: Must have `selectedDoctorId` in session

**Returns**:
- `summary`: Object with all booking details

**Example Response**:
```php
[
    'summary' => [
        'doctor' => ['id' => 'd1', 'name' => 'Dr. Sarah Johnson', 'avatar' => null],
        'patient' => ['id' => '1', 'name' => 'Kriti Jaisinghani', 'avatar' => null],
        'datetime' => '2026-01-25T09:00AM',
        'consultationType' => 'Video Consultation',
        'fee' => 800,
    ],
]
```

---

#### `processPayment()` - POST /booking/doctor/confirm
**Purpose**: Create booking and initiate payment

**Actions**:
1. Retrieve session data
2. Create booking record in database
3. Initiate payment gateway (Razorpay/Stripe)
4. Clear session data
5. Redirect to confirmation page

**Session**: Cleared after successful processing

**Redirect**: booking.confirmation with booking ID

---

## Controller: GuidedLabController

Location: `app/Http/Controllers/GuidedLabController.php`

### Methods

#### `patientTest()` - GET /booking/lab/patient-test
**Purpose**: Display patient and test type selection

**Returns**:
- `familyMembers`: Array of family member objects
- `savedData`: Existing session data

**Session Data**: None required

---

#### `storePatientTest()` - POST /booking/lab/patient-test
**Purpose**: Store patient and test type selection

**Validation**:
```php
[
    'patientId' => 'required|string',
    'selectedTestTypes' => 'array',
    'selectedTestTypes.*' => 'string',
    'testNotes' => 'nullable|string|max:1000',
]
```

**Session Storage**:
```php
guided_lab_booking: [
    'patientId' => '1',
    'selectedTestTypes' => ['annual_checkup', 'diabetes_screening'],
    'testNotes' => 'Annual health checkup',
]
```

**Redirect**: packages-schedule step

---

#### `packagesSchedule()` - GET /booking/lab/packages-schedule
**Purpose**: Display packages, location, date, and time selection

**Prerequisites**: Must have `patientId` in session

**Query Parameters**:
- `date` (optional): Selected date for time slots (default: today)

**Returns**:
- `packages`: Array of recommended test packages
- `locations`: Array of collection location options
- `availableDates`: Array of next 5 dates
- `timeSlots`: Array of available time slots
- `savedData`: Existing session data

**Example Response**:
```php
[
    'packages' => [
        [
            'id' => 'p1',
            'name' => 'Complete Health Checkup',
            'description' => 'Comprehensive tests for overall health',
            'duration_hours' => '2-3',
            'tests_count' => 72,
            'age_range' => '18-60',
            'price' => 4999,
            'original_price' => 5999,
            'is_recommended' => true,
            'requires_fasting' => true,
            'fasting_hours' => 10,
        ],
    ],
    'locations' => [
        [
            'type' => 'home',
            'label' => 'Home Collection',
            'description' => 'Sample collected at your home',
            'address' => '123, Palm Grove, Koregaon Park',
            'distance' => '2.5 km away',
            'fee' => 250,
        ],
        [
            'type' => 'center',
            'label' => 'Visit Center',
            'description' => 'Visit our diagnostic center',
            'address' => '456 Health Street, Mumbai',
            'distance' => '1.2 km away',
            'fee' => 0,
        ],
    ],
    'timeSlots' => [
        ['time' => '6:00 AM', 'available' => true, 'preferred' => true],
        ['time' => '7:00 AM', 'available' => true, 'preferred' => true],
    ],
]
```

---

#### `storePackagesSchedule()` - POST /booking/lab/packages-schedule
**Purpose**: Store package, location, date, and time selection

**Validation**:
```php
[
    'selectedPackageId' => 'required|string',
    'selectedLocation' => 'required|in:home,center',
    'selectedDate' => 'required|date',
    'selectedTime' => 'required|string',
]
```

**Session Storage**:
```php
guided_lab_booking: [
    // ... previous data
    'selectedPackageId' => 'p1',
    'selectedLocation' => 'home',
    'selectedDate' => '2026-01-25',
    'selectedTime' => '8:00 AM',
]
```

**Redirect**: confirm step

---

#### `confirm()` - GET /booking/lab/confirm
**Purpose**: Display booking summary with preparation instructions

**Prerequisites**: Must have `selectedPackageId` in session

**Returns**:
- `summary`: Object with all booking details including prep instructions

**Example Response**:
```php
[
    'summary' => [
        'package' => ['id' => 'p1', 'name' => 'Complete Health Checkup'],
        'patient' => ['id' => '1', 'name' => 'Kriti Jaisinghani', 'avatar' => null],
        'datetime' => '2026-01-25T08:00AM',
        'collection' => 'Home Collection',
        'address' => '123, Palm Grove, Koregaon Park',
        'fee' => 5249, // package price + location fee
        'prepInstructions' => [
            'Fasting for 10-12 hours required',
            'Water is allowed',
            'Avoid alcohol 24 hours before',
            'Continue regular medications unless advised otherwise',
        ],
    ],
]
```

---

#### `processPayment()` - POST /booking/lab/confirm
**Purpose**: Create booking and initiate payment

**Actions**:
1. Retrieve session data
2. Create booking record in database
3. Initiate payment gateway
4. Clear session data
5. Redirect to confirmation page

**Session**: Cleared after successful processing

**Redirect**: booking.confirmation with booking ID

---

## Session Data Structure

### Doctor Booking Session
```php
guided_doctor_booking: [
    // Step 1: Patient
    'patientId' => '1',
    'consultationType' => 'new', // or 'followup'
    'quickBookDoctorId' => null,
    'quickBookTime' => null,

    // Step 2: Concerns
    'selectedSymptoms' => ['s1', 's2'],
    'symptomNotes' => 'Started 3 days ago',
    'urgency' => 'urgent', // or 'this_week', 'specific_date'

    // Step 3: Doctor & Time
    'selectedDate' => '2026-01-25',
    'selectedDoctorId' => 'd1',
    'selectedTime' => '9:00 AM',
    'consultationMode' => 'video', // or 'in_person'
]
```

### Lab Booking Session
```php
guided_lab_booking: [
    // Step 1: Patient & Test
    'patientId' => '1',
    'selectedTestTypes' => ['annual_checkup', 'diabetes_screening'],
    'testNotes' => 'Annual health checkup',

    // Step 2: Packages & Schedule
    'selectedPackageId' => 'p1',
    'selectedLocation' => 'home', // or 'center'
    'selectedDate' => '2026-01-25',
    'selectedTime' => '8:00 AM',
]
```

## Error Handling

### Missing Prerequisites
Each step checks for required session data from previous steps:

```php
if (!isset($savedData['patientId'])) {
    return redirect()->route('booking.doctor.patient');
}
```

### Validation Errors
Laravel validation automatically handles:
- Required fields
- Type validation (date, string, array)
- Enum validation (in:video,in_person)
- Max length constraints

### Session Clearing
Sessions are cleared after:
- Successful payment processing
- User manually starts new booking

## Production Considerations

### Database Integration
Replace mock data with actual queries:

```php
// Instead of mock data
$familyMembers = auth()->user()->familyMembers()->get();

// Instead of hardcoded doctors
$doctors = Doctor::available($selectedDate)
    ->matchingSymptoms($savedData['selectedSymptoms'])
    ->with('availability')
    ->get();
```

### Payment Integration
Implement actual payment gateway:

```php
public function processPayment(Request $request)
{
    $savedData = session('guided_doctor_booking');

    // Create booking record
    $booking = Booking::create([
        'user_id' => auth()->id(),
        'type' => 'doctor',
        'patient_id' => $savedData['patientId'],
        'doctor_id' => $savedData['selectedDoctorId'],
        'datetime' => $savedData['selectedDate'] . ' ' . $savedData['selectedTime'],
        'mode' => $savedData['consultationMode'],
        'fee' => $this->calculateFee($savedData),
        'status' => 'pending_payment',
    ]);

    // Initialize Razorpay
    $payment = RazorpayService::createOrder([
        'amount' => $booking->fee * 100, // paisa
        'currency' => 'INR',
        'receipt' => $booking->id,
    ]);

    return inertia('Booking/Payment', [
        'booking' => $booking,
        'razorpay_order_id' => $payment['id'],
        'razorpay_key' => config('services.razorpay.key'),
    ]);
}
```

### Authentication
Add authentication middleware once auth is enabled:

```php
Route::middleware(['auth', 'verified'])->prefix('booking')->group(function () {
    // ... routes
});
```

## Testing

### Manual Testing Steps

**Doctor Flow**:
1. Visit `/booking/doctor/patient`
2. Select patient, choose "New consultation"
3. Click Continue → `/booking/doctor/concerns`
4. Select symptoms, choose urgency
5. Click Continue → `/booking/doctor/doctor-time`
6. Select date, doctor, time, consultation mode
7. Click Continue → `/booking/doctor/confirm`
8. Review summary
9. Click Pay → Creates booking and redirects to confirmation

**Lab Flow**:
1. Visit `/booking/lab/patient-test`
2. Select patient, optionally select test types
3. Click Continue → `/booking/lab/packages-schedule`
4. Select package, location, date, time
5. Click Continue → `/booking/lab/confirm`
6. Review summary and preparation instructions
7. Click Pay → Creates booking and redirects to confirmation

### Session Testing
Check session persistence:
```php
// In tinker or test
session(['guided_doctor_booking' => ['patientId' => '1']]);
dd(session('guided_doctor_booking'));
```

## Files Created

- `routes/web.php` - Updated with guided booking routes
- `app/Http/Controllers/GuidedDoctorController.php` - Doctor booking controller
- `app/Http/Controllers/GuidedLabController.php` - Lab booking controller
- `docs/guided-booking-backend.md` - This documentation
