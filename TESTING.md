# Testing & Quality Assurance Guide

## Quick Start

```bash
# Run all quality checks
composer quality

# Run all tests
composer test:all

# Run specific test suites
composer test:unit
composer test:feature
npm run test
npm run test:e2e
```

## 1. Backend Testing (Laravel + Pest)

### Test Categories

#### A. Unit Tests (`tests/Unit/`)
**What to test:**
- Models: relationships, accessors, mutators, scopes
- Services: business logic, data transformations
- Helpers: utility functions
- Value objects

**Example areas:**
```php
tests/Unit/
├── Models/
│   ├── UserTest.php          # User relationships, getters
│   ├── AppointmentTest.php   # Status calculations, scope queries
│   └── FamilyMemberTest.php  # Relationship logic
├── Services/
│   ├── BookingServiceTest.php      # Appointment creation logic
│   ├── NotificationServiceTest.php # Notification routing
│   └── PaymentServiceTest.php      # Payment calculations
└── Helpers/
    └── DateHelperTest.php    # Date formatting, timezone logic
```

#### B. Feature Tests (`tests/Feature/`)
**What to test:**
- ✅ Authentication flows (already exists)
- ✅ Booking flows (already exists)
- API endpoints
- Database transactions
- File uploads
- Email sending
- Queue jobs

**Priority test areas:**
```php
tests/Feature/
├── Appointments/
│   ├── CreateAppointmentTest.php    # Full booking flow
│   ├── CancelAppointmentTest.php    # Cancellation + refunds
│   └── RescheduleAppointmentTest.php
├── FamilyMembers/
│   ├── LinkExistingPatientTest.php  # OTP verification flow
│   └── CreateNewMemberTest.php      # Member creation + detection
├── HealthRecords/
│   ├── UploadLabReportTest.php      # File upload + AI processing
│   └── ShareRecordTest.php          # Sharing permissions
├── Payments/
│   ├── RazorpayWebhookTest.php      # Payment callbacks
│   └── RefundTest.php               # Refund processing
└── Notifications/
    ├── AppointmentReminderTest.php  # Scheduled notifications
    └── OTPTest.php                  # Twilio integration
```

### Running Backend Tests

```bash
# All tests
./vendor/bin/pest

# Specific suite
./vendor/bin/pest --testsuite=Unit
./vendor/bin/pest --testsuite=Feature

# Specific file
./vendor/bin/pest tests/Feature/Appointments/CreateAppointmentTest.php

# With coverage
./vendor/bin/pest --coverage --min=70

# Parallel execution (faster)
./vendor/bin/pest --parallel
```

## 2. Frontend Testing (React + TypeScript)

### Test Categories

#### A. Component Tests (Vitest + React Testing Library)
**What to test:**
- User interactions
- Conditional rendering
- Props handling
- Component integration

**Priority components:**
```
resources/js/__tests__/
├── Components/
│   ├── Booking/
│   │   ├── PatientSelector.test.tsx
│   │   ├── DoctorCard.test.tsx
│   │   └── AIPromptInput.test.tsx
│   ├── ui/
│   │   ├── Alert.test.tsx
│   │   ├── Badge.test.tsx
│   │   └── Toast.test.tsx
│   └── Forms/
│       ├── DatePicker.test.tsx
│       └── PhoneInput.test.tsx
├── Pages/
│   ├── Booking/
│   │   └── PatientStep.test.tsx
│   └── Appointments/
│       └── Index.test.tsx
└── Features/
    └── booking-chat/
        └── InlineMemberTypeSelector.test.tsx
```

#### B. End-to-End Tests (Playwright)
**Critical user journeys:**
1. Complete booking flow (AI + Guided)
2. Family member management
3. Appointment cancellation/reschedule
4. Payment processing
5. Health records upload

```
e2e/
├── booking-flow.spec.ts          # Full appointment booking
├── family-management.spec.ts     # Add/link family members
├── payment-flow.spec.ts          # Razorpay integration
└── accessibility.spec.ts         # a11y checks
```

### Setting Up Frontend Tests

1. **Install dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @playwright/test
```

2. **Create vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './resources/js/tests/setup.ts',
    include: ['resources/js/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
    },
  },
})
```

3. **Create test setup:**
```typescript
// resources/js/tests/setup.ts
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

## 3. Quality Checks

### A. Code Formatting

**PHP (Laravel Pint):**
```bash
# Check formatting
./vendor/bin/pint --test

# Auto-fix
./vendor/bin/pint
```

**TypeScript (Prettier - recommended):**
```bash
npm install -D prettier
npx prettier --check "resources/js/**/*.{ts,tsx}"
npx prettier --write "resources/js/**/*.{ts,tsx}"
```

### B. Static Analysis

**PHP (PHPStan - recommended):**
```bash
composer require --dev phpstan/phpstan
./vendor/bin/phpstan analyse app
```

**TypeScript:**
```bash
# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

### C. Design System Compliance

Your custom ESLint rules already check:
- ✅ No arbitrary Tailwind values
- ✅ No inline styles for layout
- ✅ No ad-hoc alert divs

Run: `npm run lint`

### D. Accessibility Testing

**Manual checks:**
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatibility (VoiceOver/NVDA)
- Color contrast (WCAG AA)
- Focus indicators

**Automated:**
```bash
npm install -D @axe-core/playwright
```

Add to Playwright tests:
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/')
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  expect(accessibilityScanResults.violations).toEqual([])
})
```

## 4. Comprehensive Test Script

Add to `composer.json`:
```json
{
  "scripts": {
    "test": ["@php artisan config:clear --ansi", "@php artisan test"],
    "test:unit": "./vendor/bin/pest --testsuite=Unit",
    "test:feature": "./vendor/bin/pest --testsuite=Feature",
    "test:coverage": "./vendor/bin/pest --coverage --min=70",
    "test:parallel": "./vendor/bin/pest --parallel",
    "test:all": [
      "@test",
      "@php artisan config:clear --ansi"
    ],
    "format": "./vendor/bin/pint",
    "format:check": "./vendor/bin/pint --test",
    "quality": [
      "@format:check",
      "@test"
    ]
  }
}
```

Add to `package.json`:
```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "lint": "eslint resources/js",
    "lint:fix": "eslint resources/js --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "quality": "npm run type-check && npm run lint && npm run test"
  }
}
```

## 5. CI/CD Integration (GitHub Actions)

Create `.github/workflows/tests.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2
      - name: Install Dependencies
        run: composer install
      - name: Run Tests
        run: composer test
      - name: Check Formatting
        run: ./vendor/bin/pint --test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Dependencies
        run: npm ci
      - name: Type Check
        run: npm run type-check
      - name: Lint
        run: npm run lint
      - name: Run Tests
        run: npm run test
```

## 6. Testing Priority Matrix

### High Priority (Week 1-2)
1. ✅ Authentication tests (done)
2. ✅ Booking flow tests (done)
3. **Payment processing tests** - Razorpay webhooks, refunds
4. **Family member tests** - OTP flow, linking, detection
5. **Critical UI components** - PatientSelector, DoctorCard, AIPromptInput

### Medium Priority (Week 3-4)
6. **Health records tests** - Upload, sharing, AI processing
7. **Notification tests** - Email, SMS, push
8. **E2E tests** - Complete user journeys
9. **Accessibility tests** - WCAG compliance

### Low Priority (Ongoing)
10. **Performance tests** - Load testing, query optimization
11. **Visual regression** - Screenshot comparisons
12. **Security tests** - OWASP top 10

## 7. Test Data Management

**Use Factories:**
```php
// database/factories/AppointmentFactory.php
class AppointmentFactory extends Factory
{
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'doctor_id' => Doctor::factory(),
            'date' => now()->addDays(3),
            'time' => '10:00',
            'status' => 'scheduled',
        ];
    }

    public function cancelled()
    {
        return $this->state(['status' => 'cancelled']);
    }
}
```

**Use Seeders for E2E:**
```php
php artisan db:seed --class=TestDataSeeder
```

## 8. Quality Metrics

**Target Coverage:**
- Backend: 70%+ overall, 90%+ for critical paths
- Frontend: 60%+ overall, 80%+ for critical components

**Key Metrics:**
- No failing tests on main branch
- All PRs must pass quality checks
- Design system violations = warnings (fix before merge)
- Type errors = blocking
- Accessibility violations = blocking

## 9. Pre-Commit Hooks (Optional)

Install Husky:
```bash
npm install -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```bash
#!/bin/sh
npm run type-check
npm run lint
./vendor/bin/pint --test
```

## 10. Testing Best Practices

### DO:
✅ Test behavior, not implementation
✅ Use factories for test data
✅ Mock external services (Razorpay, Twilio)
✅ Test edge cases and error states
✅ Keep tests fast (< 1s per test)
✅ Use descriptive test names

### DON'T:
❌ Test framework code (Laravel/React internals)
❌ Test third-party libraries
❌ Over-mock (use real DB for feature tests)
❌ Skip flaky tests (fix them)
❌ Commit commented-out tests

---

## Quick Reference Commands

```bash
# Backend
composer test              # Run all backend tests
composer test:unit        # Unit tests only
composer test:feature     # Feature tests only
composer format           # Auto-format PHP
composer quality          # Run all quality checks

# Frontend
npm run type-check        # TypeScript check
npm run lint              # ESLint
npm run test              # Component tests
npm run test:e2e          # End-to-end tests
npm run quality           # All frontend checks

# Full suite
composer quality && npm run quality && npm run test:e2e
```
