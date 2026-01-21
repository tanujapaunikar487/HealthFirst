# Project Structure

**Status:** Locked
**Framework:** Laravel 11.x + React + Inertia.js + shadcn/ui
**Authority:** This document defines the canonical project structure.

---

## Complete Directory Structure

```
health-care/
├── app/
│   ├── Actions/                      # Single-purpose action classes
│   │   └── Fortify/                  # Laravel Fortify actions
│   ├── Console/
│   │   ├── Commands/                 # Custom Artisan commands
│   │   └── Kernel.php
│   ├── Events/                       # Domain events
│   │   ├── Appointments/
│   │   │   ├── AppointmentBooked.php
│   │   │   ├── AppointmentCancelled.php
│   │   │   └── AppointmentCompleted.php
│   │   └── Patients/
│   │       └── PatientRegistered.php
│   ├── Exceptions/
│   │   └── Handler.php
│   ├── Http/
│   │   ├── Controllers/              # Thin orchestration layer
│   │   │   ├── AppointmentController.php
│   │   │   ├── PatientController.php
│   │   │   ├── DoctorController.php
│   │   │   ├── BillingController.php
│   │   │   └── DashboardController.php
│   │   ├── Middleware/               # HTTP middleware
│   │   │   ├── HandleInertiaRequests.php
│   │   │   └── EnsureHospitalConfigured.php
│   │   └── Requests/                 # Form request validation
│   │       ├── Appointments/
│   │       │   ├── StoreAppointmentRequest.php
│   │       │   └── UpdateAppointmentRequest.php
│   │       └── Patients/
│   │           ├── StorePatientRequest.php
│   │           └── UpdatePatientRequest.php
│   ├── Jobs/                         # Queued jobs
│   │   ├── SendAppointmentReminder.php
│   │   └── ProcessBillingReport.php
│   ├── Listeners/                    # Event listeners
│   │   ├── SendAppointmentConfirmation.php
│   │   └── LogPatientActivity.php
│   ├── Models/                       # Eloquent models
│   │   ├── Appointment.php
│   │   ├── Patient.php
│   │   ├── Doctor.php
│   │   ├── MedicalRecord.php
│   │   ├── Prescription.php
│   │   ├── Billing.php
│   │   ├── User.php
│   │   └── HospitalConfig.php
│   ├── Notifications/                # Notifications (email, SMS, push)
│   │   ├── AppointmentConfirmed.php
│   │   └── AppointmentReminder.php
│   ├── Policies/                     # Authorization policies
│   │   ├── AppointmentPolicy.php
│   │   ├── PatientPolicy.php
│   │   └── MedicalRecordPolicy.php
│   ├── Providers/
│   │   ├── AppServiceProvider.php
│   │   ├── AuthServiceProvider.php
│   │   ├── EventServiceProvider.php
│   │   └── RouteServiceProvider.php
│   └── Services/                     # Business logic services
│       ├── AI/
│       │   ├── AIService.php         # Base AI service
│       │   ├── DeepSeekProvider.php  # DeepSeek implementation
│       │   └── Contracts/
│       │       └── AIProviderInterface.php
│       ├── Appointments/
│       │   ├── AppointmentService.php
│       │   └── AvailabilityService.php
│       ├── Patients/
│       │   └── PatientService.php
│       ├── Billing/
│       │   └── BillingService.php
│       └── MedicalRecords/
│           └── MedicalRecordService.php
│
├── bootstrap/
│   ├── app.php
│   └── cache/
│
├── config/                           # Application configuration
│   ├── ai.php                        # AI provider configuration
│   ├── app.php
│   ├── database.php
│   ├── inertia.php
│   └── services.php
│
├── database/
│   ├── factories/                    # Model factories for testing
│   │   ├── AppointmentFactory.php
│   │   └── PatientFactory.php
│   ├── migrations/                   # Database migrations
│   │   ├── 2024_01_01_000001_create_patients_table.php
│   │   ├── 2024_01_01_000002_create_doctors_table.php
│   │   ├── 2024_01_01_000003_create_appointments_table.php
│   │   └── ...
│   └── seeders/                      # Database seeders
│       ├── DatabaseSeeder.php
│       └── DemoDataSeeder.php
│
├── docs/                             # Project documentation
│   ├── design-tokens.md
│   ├── component-library.md
│   ├── feature-module-structure.md
│   ├── project-structure.md          # This file
│   ├── ai-service-layer.md
│   └── deployment.md
│
├── public/
│   ├── build/                        # Compiled assets (Vite output)
│   └── index.php
│
├── resources/
│   ├── css/
│   │   └── app.css                   # Global styles + design tokens
│   ├── js/
│   │   ├── app.tsx                   # Inertia.js entry point
│   │   ├── Components/               # Reusable UI components
│   │   │   ├── ui/                   # shadcn components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── ...               # All 30 locked components
│   │   │   ├── AppointmentCard.tsx   # Feature-specific components
│   │   │   ├── PatientList.tsx
│   │   │   └── DoctorSchedule.tsx
│   │   ├── Layouts/                  # Page layouts
│   │   │   ├── AppLayout.tsx         # Main authenticated layout
│   │   │   ├── GuestLayout.tsx       # Unauthenticated layout
│   │   │   └── PrintLayout.tsx       # Print-friendly layout
│   │   ├── Lib/                      # Client-side utilities
│   │   │   ├── utils.ts              # General utilities
│   │   │   └── formatters.ts         # Date, number, text formatters
│   │   ├── Pages/                    # Inertia.js pages
│   │   │   ├── Appointments/
│   │   │   │   ├── Index.tsx
│   │   │   │   ├── Create.tsx
│   │   │   │   ├── Show.tsx
│   │   │   │   └── Edit.tsx
│   │   │   ├── Patients/
│   │   │   │   ├── Index.tsx
│   │   │   │   ├── Create.tsx
│   │   │   │   ├── Show.tsx
│   │   │   │   └── Edit.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Register.tsx
│   │   │   └── Settings/
│   │   │       ├── Profile.tsx
│   │   │       └── HospitalConfig.tsx
│   │   └── Types/                    # TypeScript types
│   │       ├── design-tokens.ts      # Design token types
│   │       ├── models.ts             # Laravel model types
│   │       └── inertia.d.ts          # Inertia.js type augmentation
│   └── views/                        # Blade views (for emails, PDFs)
│       ├── app.blade.php             # Inertia root template
│       ├── emails/
│       │   ├── appointment-confirmed.blade.php
│       │   └── appointment-reminder.blade.php
│       └── pdf/
│           ├── prescription.blade.php
│           └── invoice.blade.php
│
├── routes/
│   ├── api.php                       # API routes (optional, for mobile app)
│   ├── console.php                   # Artisan commands
│   └── web.php                       # Inertia.js routes (main app routes)
│
├── storage/
│   ├── app/
│   │   ├── private/                  # Private files (medical records, etc.)
│   │   └── public/                   # Public files (avatars, logos, etc.)
│   ├── framework/
│   ├── logs/
│   └── uploads/                      # Temporary uploads
│
├── tests/
│   ├── Feature/                      # Feature tests (full stack)
│   │   ├── Appointments/
│   │   │   ├── BookAppointmentTest.php
│   │   │   └── CancelAppointmentTest.php
│   │   └── Auth/
│   │       └── LoginTest.php
│   ├── Unit/                         # Unit tests (services, models)
│   │   ├── Services/
│   │   │   ├── AppointmentServiceTest.php
│   │   │   └── AIServiceTest.php
│   │   └── Models/
│   │       └── AppointmentTest.php
│   └── TestCase.php
│
├── .editorconfig
├── .env.example                      # Environment variables template
├── .gitignore
├── artisan                           # Laravel CLI
├── composer.json                     # PHP dependencies
├── composer.lock
├── package.json                      # NPM dependencies
├── package-lock.json
├── phpunit.xml                       # PHPUnit configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── vite.config.js                    # Vite build configuration
└── README.md
```

---

## File Naming Conventions

### PHP/Laravel
- **Models:** Singular, PascalCase (`Patient.php`, `Appointment.php`)
- **Controllers:** Singular + `Controller.php` (`PatientController.php`)
- **Services:** Feature/Domain + `Service.php` (`AppointmentService.php`)
- **Requests:** Action + Resource + `Request.php` (`StorePatientRequest.php`)
- **Policies:** Resource + `Policy.php` (`AppointmentPolicy.php`)
- **Jobs:** Action + Resource (`SendAppointmentReminder.php`)
- **Events:** Past tense, PascalCase (`AppointmentBooked.php`)
- **Listeners:** Action + Event (`SendAppointmentConfirmation.php`)
- **Migrations:** `YYYY_MM_DD_HHMMSS_create_table_name_table.php`
- **Factories:** Model + `Factory.php` (`PatientFactory.php`)
- **Seeders:** Purpose + `Seeder.php` (`DemoDataSeeder.php`)

### TypeScript/React
- **Components:** PascalCase (`Button.tsx`, `AppointmentCard.tsx`)
- **Pages:** PascalCase, match route (`Index.tsx`, `Create.tsx`, `Show.tsx`)
- **Layouts:** PascalCase + `Layout.tsx` (`AppLayout.tsx`)
- **Types:** PascalCase for interfaces/types, camelCase for files (`models.ts`)
- **Utilities:** camelCase (`formatDate.ts`, `calculateAge.ts`)
- **Hooks:** `use` prefix, camelCase (`useAppointments.ts`)

### Configuration
- **All lowercase with hyphens for multi-word files** (`tailwind.config.js`, `vite.config.js`)

---

## Module Organization

Each feature/module follows the same pattern:

```
Feature: Appointments
├── Model:           app/Models/Appointment.php
├── Migration:       database/migrations/..._create_appointments_table.php
├── Factory:         database/factories/AppointmentFactory.php
├── Service:         app/Services/Appointments/AppointmentService.php
├── Controller:      app/Http/Controllers/AppointmentController.php
├── Requests:        app/Http/Requests/Appointments/
├── Policy:          app/Policies/AppointmentPolicy.php
├── Events:          app/Events/Appointments/
├── Listeners:       app/Listeners/Appointments/
├── Pages:           resources/js/Pages/Appointments/
├── Components:      resources/js/Components/Appointment*.tsx
└── Tests:           tests/Feature/Appointments/
```

---

## Service Layer Pattern

### Location
`app/Services/`

### Structure
Services are organized by domain/feature:

```
app/Services/
├── AI/                               # AI integration
│   ├── AIService.php                 # Main AI orchestrator
│   ├── DeepSeekProvider.php          # DeepSeek implementation
│   ├── Contracts/
│   │   └── AIProviderInterface.php   # Provider contract
│   └── Prompts/
│       ├── ExplainPrescription.php   # Prompt templates
│       └── SummarizeMedicalHistory.php
│
├── Appointments/                     # Appointment business logic
│   ├── AppointmentService.php        # Booking, cancellation, etc.
│   └── AvailabilityService.php       # Availability calculation
│
├── Patients/                         # Patient business logic
│   └── PatientService.php
│
├── Billing/                          # Billing business logic
│   └── BillingService.php
│
├── MedicalRecords/                   # Medical records business logic
│   └── MedicalRecordService.php
│
└── Notifications/                    # Notification orchestration
    └── NotificationService.php
```

### Service Class Template

```php
<?php

namespace App\Services\FeatureName;

/**
 * FeatureService
 *
 * Encapsulates complex business logic for [Feature].
 * This service is framework-agnostic and returns domain objects/data.
 */
class FeatureService
{
    /**
     * Constructor dependency injection.
     */
    public function __construct(
        // Inject dependencies here
    ) {}

    /**
     * Public method: describe what this does.
     *
     * @param  type  $param  Description
     * @return type Description
     */
    public function doSomething($param)
    {
        // Business logic here
    }

    /**
     * Private helper methods.
     */
    private function helperMethod()
    {
        // Internal logic
    }
}
```

---

## TypeScript Type Organization

### Location
`resources/js/Types/`

### Files

#### `resources/js/Types/design-tokens.ts`
Design token type definitions (already created).

#### `resources/js/Types/models.ts`
Laravel model type definitions.

**Example:**
```typescript
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  patient?: Patient;
  doctor?: Doctor;
  created_at: string;
  updated_at: string;
}
```

#### `resources/js/Types/inertia.d.ts`
Inertia.js shared props and type augmentation.

**Example:**
```typescript
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { User } from './models';

export interface SharedProps {
  auth: {
    user: User;
  };
  flash: {
    success?: string;
    error?: string;
  };
  errors: Record<string, string>;
}

export interface PageProps extends InertiaPageProps, SharedProps {}

declare module '@inertiajs/core' {
  interface PageProps extends SharedProps {}
}
```

---

## Configuration Files

### `config/ai.php`
AI provider configuration.

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default AI Provider
    |--------------------------------------------------------------------------
    |
    | The default AI provider to use for AI-assisted features.
    | Supported: "deepseek", "none"
    |
    */
    'default' => env('AI_PROVIDER', 'deepseek'),

    /*
    |--------------------------------------------------------------------------
    | AI Providers
    |--------------------------------------------------------------------------
    */
    'providers' => [
        'deepseek' => [
            'api_key' => env('DEEPSEEK_API_KEY'),
            'api_url' => env('DEEPSEEK_API_URL', 'https://api.deepseek.com'),
            'model' => env('DEEPSEEK_MODEL', 'deepseek-chat'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Features
    |--------------------------------------------------------------------------
    |
    | Enable/disable AI features.
    |
    */
    'features' => [
        'explain_prescriptions' => env('AI_FEATURE_EXPLAIN_PRESCRIPTIONS', true),
        'summarize_medical_history' => env('AI_FEATURE_SUMMARIZE_HISTORY', true),
        'suggest_diagnoses' => env('AI_FEATURE_SUGGEST_DIAGNOSES', false), // Read-only, never writes
    ],
];
```

---

## Environment Variables

### `.env.example`
Template for environment configuration.

```env
APP_NAME="Hospital Management System"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hospital_db
DB_USERNAME=root
DB_PASSWORD=

# AI Provider Configuration
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat

# Hospital Configuration
HOSPITAL_NAME="General Hospital"
HOSPITAL_LOGO_PATH=

# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@hospital.local"
MAIL_FROM_NAME="${APP_NAME}"

# Queue Configuration
QUEUE_CONNECTION=database
```

---

## Summary

**Complete project structure is locked.**
**All naming conventions are defined.**
**Service layer pattern is established.**
**TypeScript types are organized.**
**Configuration files are structured.**
**No deviations allowed.**
