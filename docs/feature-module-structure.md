# Feature/Module Structure

**Status:** Locked
**Architecture:** Laravel MVC + Services + Inertia.js
**Authority:** This document defines how all features are structured.

---

## Principles

1. **Laravel is the system of record.** All truth lives in the backend.
2. **MVC boundaries are strict.** Models, Controllers, and Views have distinct responsibilities.
3. **Services encapsulate complex business logic.** Controllers orchestrate, services execute.
4. **React is a rendering layer.** It receives data and renders it. Nothing more.
5. **No logic duplication.** Business rules exist once, in Laravel.

---

## Directory Structure

```
app/
├── Models/                    # Eloquent models (business rules, relationships, scopes)
├── Http/
│   ├── Controllers/           # Thin orchestration layer
│   ├── Requests/              # Form request validation
│   └── Middleware/            # Request/response filtering
├── Services/                  # Business logic services
│   ├── AI/                    # AI integration (DeepSeek, etc.)
│   ├── Appointments/          # Appointment business logic
│   ├── Patients/              # Patient business logic
│   ├── Billing/               # Billing business logic
│   └── ...                    # Feature-specific services
├── Actions/                   # Single-purpose action classes
├── Events/                    # Domain events
├── Listeners/                 # Event listeners
├── Jobs/                      # Queued jobs
├── Notifications/             # Email/SMS/push notifications
├── Policies/                  # Authorization policies
└── Providers/                 # Service providers

resources/
├── js/
│   ├── Pages/                 # Inertia.js page components (one per route)
│   ├── Components/            # Reusable shadcn components
│   ├── Layouts/               # Page layout components
│   ├── Lib/                   # Utility functions (client-side only)
│   └── Types/                 # TypeScript types
├── css/                       # Global styles
└── views/                     # Blade views (for emails, PDFs, etc.)

routes/
├── web.php                    # Inertia routes (all app routes)
├── api.php                    # API routes (if needed for mobile app)
└── console.php                # Artisan commands

database/
├── migrations/                # Database schema
├── seeders/                   # Seed data
└── factories/                 # Model factories for testing

tests/
├── Feature/                   # Feature tests (full stack)
└── Unit/                      # Unit tests (services, models)
```

---

## Feature Module Example: Appointments

### 1. Model
**File:** `app/Models/Appointment.php`

**Responsibilities:**
- Define table structure (via migration)
- Define relationships (patient, doctor, etc.)
- Define scopes (e.g., `scopeUpcoming()`)
- Define accessors/mutators
- Contain data integrity rules (e.g., `cannot overlap with existing appointments`)

**Example:**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'scheduled_at',
        'duration_minutes',
        'status',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    // Relationships
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_at', '>', now())
            ->where('status', '!=', 'cancelled');
    }

    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    // Business rules
    public function canBeCancelled(): bool
    {
        return $this->status !== 'completed'
            && $this->scheduled_at->isFuture();
    }
}
```

---

### 2. Migration
**File:** `database/migrations/2024_01_01_000001_create_appointments_table.php`

**Responsibilities:**
- Define database schema
- Define indexes
- Define foreign keys

**Example:**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained()->onDelete('cascade');
            $table->dateTime('scheduled_at');
            $table->integer('duration_minutes')->default(30);
            $table->enum('status', ['scheduled', 'confirmed', 'completed', 'cancelled'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('scheduled_at');
            $table->index('status');
            $table->index(['doctor_id', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
```

---

### 3. Service
**File:** `app/Services/Appointments/AppointmentService.php`

**Responsibilities:**
- Complex business logic
- Multi-model operations
- Third-party integrations (email, SMS, calendar sync)
- Validation beyond simple field rules

**Example:**
```php
<?php

namespace App\Services\Appointments;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Notifications\AppointmentConfirmed;
use Carbon\Carbon;

class AppointmentService
{
    /**
     * Book a new appointment.
     * Validates availability, creates appointment, sends notifications.
     */
    public function bookAppointment(
        int $patientId,
        int $doctorId,
        Carbon $scheduledAt,
        int $durationMinutes,
        ?string $notes = null
    ): Appointment {
        // Business logic: Check doctor availability
        $this->ensureDoctorAvailable($doctorId, $scheduledAt, $durationMinutes);

        // Create appointment
        $appointment = Appointment::create([
            'patient_id' => $patientId,
            'doctor_id' => $doctorId,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => $durationMinutes,
            'status' => 'scheduled',
            'notes' => $notes,
        ]);

        // Send notifications
        $appointment->patient->notify(new AppointmentConfirmed($appointment));

        return $appointment;
    }

    /**
     * Check if a doctor is available at a specific time.
     */
    public function isDoctorAvailable(
        int $doctorId,
        Carbon $scheduledAt,
        int $durationMinutes
    ): bool {
        $endTime = $scheduledAt->copy()->addMinutes($durationMinutes);

        // Check for overlapping appointments
        $overlapping = Appointment::forDoctor($doctorId)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($scheduledAt, $endTime) {
                $query->whereBetween('scheduled_at', [$scheduledAt, $endTime])
                    ->orWhere(function ($q) use ($scheduledAt) {
                        $q->where('scheduled_at', '<=', $scheduledAt)
                          ->whereRaw('DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?', [$scheduledAt]);
                    });
            })
            ->exists();

        return !$overlapping;
    }

    /**
     * Get available time slots for a doctor on a given date.
     */
    public function getAvailableSlots(int $doctorId, Carbon $date): array
    {
        $doctor = Doctor::findOrFail($doctorId);

        // Business logic: Generate slots based on doctor's schedule
        // This is complex logic that belongs in a service, not a controller
        $slots = [];
        $startTime = $date->copy()->setTime(9, 0); // 9 AM
        $endTime = $date->copy()->setTime(17, 0);  // 5 PM

        while ($startTime->lessThan($endTime)) {
            if ($this->isDoctorAvailable($doctorId, $startTime, 30)) {
                $slots[] = [
                    'time' => $startTime->format('H:i'),
                    'available' => true,
                ];
            } else {
                $slots[] = [
                    'time' => $startTime->format('H:i'),
                    'available' => false,
                ];
            }

            $startTime->addMinutes(30);
        }

        return $slots;
    }

    /**
     * Ensure doctor is available (throws exception if not).
     */
    private function ensureDoctorAvailable(
        int $doctorId,
        Carbon $scheduledAt,
        int $durationMinutes
    ): void {
        if (!$this->isDoctorAvailable($doctorId, $scheduledAt, $durationMinutes)) {
            throw new \Exception('Doctor is not available at this time.');
        }
    }
}
```

---

### 4. Controller
**File:** `app/Http/Controllers/AppointmentController.php`

**Responsibilities:**
- Handle HTTP requests
- Orchestrate service calls
- Return Inertia responses
- **Thin layer only - no business logic**

**Example:**
```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAppointmentRequest;
use App\Models\Appointment;
use App\Services\Appointments\AppointmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function __construct(
        private AppointmentService $appointmentService
    ) {}

    /**
     * Display a listing of appointments.
     */
    public function index(Request $request): Response
    {
        $appointments = Appointment::query()
            ->with(['patient', 'doctor'])
            ->upcoming()
            ->paginate(20);

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
        ]);
    }

    /**
     * Show the form for creating a new appointment.
     */
    public function create(Request $request): Response
    {
        $doctorId = $request->integer('doctor_id');
        $date = $request->date('date') ?? now();

        $availableSlots = $this->appointmentService->getAvailableSlots($doctorId, $date);

        return Inertia::render('Appointments/Create', [
            'doctors' => Doctor::all(),
            'availableSlots' => $availableSlots,
        ]);
    }

    /**
     * Store a newly created appointment.
     */
    public function store(StoreAppointmentRequest $request)
    {
        $validated = $request->validated();

        $appointment = $this->appointmentService->bookAppointment(
            patientId: $validated['patient_id'],
            doctorId: $validated['doctor_id'],
            scheduledAt: $validated['scheduled_at'],
            durationMinutes: $validated['duration_minutes'],
            notes: $validated['notes'] ?? null,
        );

        return redirect()->route('appointments.show', $appointment)
            ->with('success', 'Appointment booked successfully.');
    }

    /**
     * Display the specified appointment.
     */
    public function show(Appointment $appointment): Response
    {
        return Inertia::render('Appointments/Show', [
            'appointment' => $appointment->load(['patient', 'doctor']),
        ]);
    }

    /**
     * Cancel an appointment.
     */
    public function cancel(Appointment $appointment)
    {
        // Authorization check (via policy)
        $this->authorize('cancel', $appointment);

        // Business logic in model
        if (!$appointment->canBeCancelled()) {
            return back()->withErrors(['error' => 'This appointment cannot be cancelled.']);
        }

        $appointment->update(['status' => 'cancelled']);

        return redirect()->route('appointments.index')
            ->with('success', 'Appointment cancelled.');
    }
}
```

---

### 5. Form Request
**File:** `app/Http/Requests/StoreAppointmentRequest.php`

**Responsibilities:**
- Validate incoming data
- Authorize the request (if needed)

**Example:**
```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Or use policy-based authorization
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'exists:patients,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
```

---

### 6. Policy
**File:** `app/Policies/AppointmentPolicy.php`

**Responsibilities:**
- Authorization logic
- Determine who can view/edit/delete appointments

**Example:**
```php
<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function view(User $user, Appointment $appointment): bool
    {
        // Patients can view their own appointments
        // Doctors can view their appointments
        // Admins can view all appointments
        return $user->id === $appointment->patient->user_id
            || $user->id === $appointment->doctor->user_id
            || $user->isAdmin();
    }

    public function cancel(User $user, Appointment $appointment): bool
    {
        // Only the patient or admin can cancel
        return $user->id === $appointment->patient->user_id
            || $user->isAdmin();
    }
}
```

---

### 7. Inertia Page Component
**File:** `resources/js/Pages/Appointments/Index.tsx`

**Responsibilities:**
- Receive data from controller
- Render data using shadcn components
- Handle local UI state (modals, tabs, etc.)
- **No business logic, no data fetching**

**Example:**
```tsx
import { Head } from '@inertiajs/react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';

interface Appointment {
  id: number;
  patient: { name: string };
  doctor: { name: string };
  scheduled_at: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface Props {
  appointments: {
    data: Appointment[];
  };
}

export default function Index({ appointments }: Props) {
  return (
    <>
      <Head title="Appointments" />

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Appointments</h1>
          <Button href="/appointments/create">Book Appointment</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.data.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.patient.name}</TableCell>
                    <TableCell>{appointment.doctor.name}</TableCell>
                    <TableCell>{appointment.scheduled_at}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Helper function (presentation logic only)
function getBadgeVariant(status: string) {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
}
```

---

## Naming Conventions

### Laravel (Backend)
- **Models:** Singular, PascalCase (`Appointment`, `Patient`, `Doctor`)
- **Controllers:** Singular + `Controller` (`AppointmentController`)
- **Services:** Feature + `Service` (`AppointmentService`)
- **Requests:** Action + Resource + `Request` (`StoreAppointmentRequest`)
- **Policies:** Resource + `Policy` (`AppointmentPolicy`)
- **Jobs:** Action + Resource (`SendAppointmentReminder`)
- **Events:** Past tense (`AppointmentBooked`, `AppointmentCancelled`)
- **Listeners:** Action + Event (`SendConfirmationEmail`)

### React (Frontend)
- **Pages:** PascalCase, match route structure (`Appointments/Index.tsx`, `Appointments/Create.tsx`)
- **Components:** PascalCase (`Button.tsx`, `AppointmentCard.tsx`)
- **Types:** PascalCase (`Appointment`, `Patient`)
- **Utilities:** camelCase (`formatDate.ts`, `calculateAge.ts`)

---

## Architectural Rules

### ✅ Controllers MUST:
- Be thin orchestration layers
- Call services for business logic
- Return Inertia responses
- Handle HTTP concerns only

### ❌ Controllers MUST NOT:
- Contain business logic
- Query the database directly (except simple queries)
- Make complex decisions
- Duplicate logic from services

### ✅ Services MUST:
- Contain complex business logic
- Be framework-agnostic (no HTTP, no Inertia)
- Return domain objects or data
- Be testable in isolation

### ❌ Services MUST NOT:
- Return HTTP responses
- Depend on request/session directly
- Contain view logic

### ✅ Models MUST:
- Define relationships
- Define scopes
- Contain data integrity rules
- Be Eloquent models

### ❌ Models MUST NOT:
- Contain complex business workflows
- Make HTTP requests
- Send emails directly (use events/jobs)

### ✅ React Pages MUST:
- Receive data from Inertia props
- Render using shadcn components
- Handle local UI state only
- Be purely presentational

### ❌ React Pages MUST NOT:
- Fetch data directly
- Contain business logic
- Make authorization decisions
- Duplicate backend logic

---

## Summary

**Feature structure is locked.**
**MVC + Services pattern is mandatory.**
**Controllers are thin.**
**Services contain business logic.**
**React is presentation only.**
**No logic duplication between frontend and backend.**
