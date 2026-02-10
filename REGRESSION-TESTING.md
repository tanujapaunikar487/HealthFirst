# Regression Testing Guide

> **Goal**: Ensure existing functionality, integrations, and UI remain intact when making changes

## 🎯 What to Test Before Every Release

### 1. Core User Flows (Manual + Automated)

#### Authentication Flow
```bash
# Test in browser:
1. Register new user → Email verification → Login
2. Login with existing account
3. Google login
4. Apple login
5. Forgot password → Reset email → New password
6. Logout
```

**Automated Test:**
```php
// Already exists: tests/Feature/Auth/AuthenticationTest.php
composer test:feature -- --filter=AuthenticationTest
```

#### Booking Flow - AI Mode
```bash
# Test in browser:
1. Navigate to /booking
2. Click "Book with AI"
3. Enter patient details OR select existing
4. Add family member inline
5. Chat with AI about symptoms
6. Upload attachment (image/PDF)
7. AI suggests doctor
8. Select time slot
9. Complete payment (test mode)
10. Verify confirmation email
11. Check appointment in dashboard
```

**Automated Test:**
```php
// tests/Feature/BookingFlowTest.php
composer test:feature -- --filter=BookingFlowTest
```

#### Booking Flow - Guided Mode
```bash
# Test in browser:
1. Navigate to /booking
2. Click "Guided Booking"
3. Select patient
4. Choose "New Consultation" vs "Follow-up"
5. Select symptoms (if new)
6. Browse doctors
7. Select time slot
8. Complete payment
9. Verify confirmation
```

#### Appointment Management
```bash
# Test in browser:
1. View appointments list
2. Filter by status (upcoming/completed/cancelled)
3. Click appointment → View details
4. Download invoice
5. Reschedule appointment
6. Cancel appointment → Verify refund initiated
7. Join video consultation (check Google Meet/Zoom preference)
```

#### Family Member Management
```bash
# Test in browser:
1. Navigate to /family
2. Add new member (full profile)
3. Link existing patient:
   - Search by phone
   - Receive OTP
   - Verify OTP
   - Confirm link
4. Edit family member
5. Delete family member
6. Add guest (one-time)
```

#### Health Records
```bash
# Test in browser:
1. Navigate to /health-records
2. Upload lab report (PDF/image)
3. Verify AI summary appears (purple gradient)
4. View record details
5. Download record
6. Share record:
   - Generate shareable link
   - Copy link
   - Open in incognito → Verify access
```

#### Payment Flow
```bash
# Test in browser (Razorpay TEST mode):
1. Start booking → Reach payment
2. Complete payment with test card
3. Verify redirect to confirmation
4. Check payment status in appointment
5. Test payment failure:
   - Use failing test card
   - Verify error message
   - Verify status = "payment_failed"
6. Test refund:
   - Cancel appointment
   - Verify refund initiated
   - Check refund in Razorpay dashboard
```

---

## 🔌 Integration Tests

### Razorpay Integration
```php
// Test webhook handling
composer test:feature -- --filter=PaymentWebhookTest

// Manual webhook test:
// 1. Go to Razorpay Dashboard → Settings → Webhooks
// 2. Send test webhook for "payment.captured"
// 3. Verify appointment status updated
```

**Critical scenarios:**
- ✅ Payment success → Appointment confirmed
- ✅ Payment failure → Appointment status = payment_failed
- ✅ Refund initiated → Refund status tracked
- ✅ Webhook signature verification

### Twilio SMS Integration
```php
// Test OTP sending
composer test:feature -- --filter=OTPVerificationTest

// Manual SMS test:
// 1. Link existing patient
// 2. Send OTP to your phone
// 3. Verify SMS received
// 4. Enter OTP → Verify success
```

**Critical scenarios:**
- ✅ OTP sent successfully
- ✅ OTP expires after 5 minutes
- ✅ Wrong OTP rejected
- ✅ Rate limiting (max 3 attempts)

### Email Integration
```bash
# Test in local environment:
php artisan tinker
> Mail::raw('Test email', function($msg) {
    $msg->to('your-email@example.com')->subject('Test');
  });

# Check Laravel logs: storage/logs/laravel.log
# Or use Mailtrap/MailHog for testing
```

**Critical scenarios:**
- ✅ Booking confirmation email
- ✅ Appointment reminder (24h before)
- ✅ Cancellation email
- ✅ Password reset email
- ✅ OTP email

### Google Calendar / Apple Calendar
```bash
# Test calendar sync:
1. Settings → Connections → Calendar
2. Connect Google Calendar (OAuth)
3. Book appointment
4. Verify event created in Google Calendar
5. Cancel appointment
6. Verify event removed/updated
```

### Video Consultation Links
```bash
# Test video links:
1. Settings → Video Consultation → Select platform
2. Book appointment with video mode
3. Verify correct link generated:
   - Google Meet: meet.google.com/...
   - Zoom: zoom.us/j/...
4. Join consultation → Verify link works
```

---

## 🎨 UI/UX Regression Checks

### Design System Compliance

**Run automated checks:**
```bash
npm run lint
# Should catch:
# - Arbitrary Tailwind values (text-[14px])
# - Inline styles for layout
# - Ad-hoc alert divs
```

**Manual visual checks:**

#### Typography Tokens
```bash
✅ All text uses design tokens:
   - text-page-title
   - text-section-title
   - text-card-title
   - text-label
   - text-body
   - text-caption

❌ NO: text-[14px], text-sm, text-lg
```

#### Color Tokens
```bash
✅ text-foreground, text-muted-foreground, text-placeholder
✅ bg-background, bg-muted, bg-accent
✅ Status colors: bg-success-subtle, text-destructive

❌ NO: text-gray-600, bg-[#hex]
```

#### Spacing & Layout
```bash
✅ VStack/HStack with gap={N}
✅ max-w-page, max-w-content
✅ w-sidebar, w-detail-label

❌ NO: p-[13px], w-[200px], style={{padding: '10px'}}
```

#### Component Usage
```bash
✅ Badge component (not ad-hoc spans)
✅ Alert component (not ad-hoc divs)
✅ Button variants (not custom button styles)
✅ Card + divide-y for lists
✅ DetailRow for detail views

❌ NO: Custom styled divs that duplicate components
```

### Visual Regression Test Checklist

**Key pages to screenshot compare:**

1. **Dashboard** (`/dashboard`)
   - Check card layout
   - Verify avatar colors (doctors)
   - Check icon colors (lab tests)

2. **Booking Entry** (`/booking`)
   - AI/Guided mode toggle
   - Gradient background
   - Progress bar

3. **Patient Selection** (`/booking/doctor/patient`)
   - Patient chips (2-column grid)
   - Avatar fallback colors
   - Add member button

4. **Appointments List** (`/appointments`)
   - Status badges (success/warning/destructive)
   - Date formatting
   - Filter chips

5. **Appointment Details** (`/appointments/{id}`)
   - Header layout
   - DetailRow alignment
   - Action buttons
   - Video link display

6. **Family Members** (`/family`)
   - Avatar group (max 3 + counter)
   - Member cards
   - Relationship badges

7. **Health Records** (`/health-records`)
   - AI summary (purple gradient on labs only)
   - Record type icons
   - Share dialog layout

8. **Settings** (`/settings`)
   - Tab navigation
   - Form layouts
   - Toggle switches
   - Video platform selection

### Responsive Testing

**Test on these breakpoints:**
```bash
Mobile:   375px (iPhone SE)
Mobile:   390px (iPhone 12/13/14)
Tablet:   768px (iPad)
Desktop: 1280px (MacBook)
Desktop: 1920px (Large monitor)
```

**Critical responsive checks:**
- ✅ Navigation menu (mobile hamburger)
- ✅ Patient selector (stacks on mobile)
- ✅ Doctor cards (responsive grid)
- ✅ Sheets (full-width on mobile)
- ✅ Tables (horizontal scroll on mobile)
- ✅ Forms (full-width inputs on mobile)

### Accessibility Checks

**Keyboard Navigation:**
```bash
1. Tab through all interactive elements
2. Enter/Space activates buttons
3. Escape closes dialogs/sheets
4. Arrow keys navigate select dropdowns
```

**Screen Reader:**
```bash
# macOS VoiceOver:
Cmd + F5 → Enable VoiceOver
Test:
- Form labels announced
- Button purposes clear
- Error messages read
- Loading states announced
```

**Color Contrast:**
```bash
# Use browser DevTools:
1. Inspect element
2. Check contrast ratio
3. Minimum: 4.5:1 for normal text
4. Minimum: 3:1 for large text (18px+)
```

---

## 🔍 Database Integrity Checks

### Before Migration
```bash
# Backup production database
php artisan backup:run --only-db

# Test migration on copy
php artisan migrate --pretend
```

### After Migration
```bash
# Verify data integrity:
php artisan tinker

# Check appointments
> App\Models\Appointment::count()
> App\Models\Appointment::whereNull('user_id')->count() // Should be 0

# Check family members
> App\Models\FamilyMember::count()
> App\Models\FamilyMember::whereNull('name')->count() // Should be 0

# Check health records
> App\Models\HealthRecord::count()
> App\Models\HealthRecord::whereNull('file_path')->count() // Should be 0
```

---

## ⚡ Performance Regression Checks

### Page Load Times
```bash
# Use browser DevTools:
1. Open Network tab
2. Clear cache
3. Reload page
4. Check "Load" time

Target:
- Dashboard: < 2s
- Booking pages: < 1.5s
- Appointment list: < 2s
- Details pages: < 1s
```

### API Response Times
```bash
# Check Laravel Debugbar:
1. Enable debugbar in .env: DEBUGBAR_ENABLED=true
2. Reload page
3. Click debugbar icon
4. Check "Database" tab

Target:
- Total queries: < 20 per page
- Query time: < 100ms total
- No N+1 queries
```

### Database Query Optimization
```bash
# Identify slow queries:
php artisan telescope:install # If not installed
php artisan migrate

# Or check logs:
tail -f storage/logs/laravel.log | grep "ms"
```

**Common performance issues:**
```php
// ❌ BAD: N+1 query
$appointments = Appointment::all();
foreach ($appointments as $apt) {
    echo $apt->doctor->name; // Queries doctor for each appointment
}

// ✅ GOOD: Eager loading
$appointments = Appointment::with('doctor')->get();
foreach ($appointments as $apt) {
    echo $apt->doctor->name; // No additional queries
}
```

---

## 🛡️ Security Regression Checks

### Authentication & Authorization
```bash
# Test protected routes:
1. Logout
2. Try accessing /dashboard → Should redirect to login
3. Try accessing /appointments → Should redirect to login
4. Try accessing /family → Should redirect to login

# Test API endpoints:
curl http://localhost:3000/api/appointments
# Should return 401 Unauthorized
```

### CSRF Protection
```bash
# Test form submission without CSRF token:
1. Remove CSRF token from form HTML
2. Submit form
3. Should receive 419 error
```

### XSS Protection
```bash
# Test script injection:
1. Create family member with name: <script>alert('XSS')</script>
2. View family member list
3. Script should be escaped, not executed
```

### SQL Injection Protection
```bash
# Test malicious input:
1. Search appointments with: ' OR '1'='1
2. Should return safe results, not all records
```

---

## 📊 Regression Test Checklist

Use this checklist before every release:

### Critical Path Testing (Must Pass)
- [ ] User can register and login
- [ ] User can complete booking (AI mode)
- [ ] User can complete booking (Guided mode)
- [ ] Payment processing works (test mode)
- [ ] Appointment confirmation email sent
- [ ] User can cancel appointment
- [ ] Refund initiated on cancellation
- [ ] User can add family member
- [ ] User can link existing patient (OTP)
- [ ] User can upload health record
- [ ] User can view appointment details

### Integration Testing (Must Pass)
- [ ] Razorpay payment webhook works
- [ ] Razorpay refund processing works
- [ ] Twilio SMS sending works
- [ ] Email notifications sent
- [ ] Google Calendar sync works (if enabled)
- [ ] Video consultation links generated

### UI/UX Testing (Should Pass)
- [ ] No arbitrary Tailwind values (`npm run lint`)
- [ ] All design tokens used correctly
- [ ] Mobile responsive (375px, 768px, 1280px)
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Loading states show for async operations
- [ ] Error messages user-friendly

### Performance Testing (Should Pass)
- [ ] Page load times < 2s
- [ ] API responses < 200ms
- [ ] No N+1 queries
- [ ] Images optimized
- [ ] No console errors

### Security Testing (Must Pass)
- [ ] Protected routes require auth
- [ ] CSRF protection active
- [ ] XSS protection working
- [ ] SQL injection prevented
- [ ] Sensitive data not exposed in logs

---

## 🚨 When Tests Fail

### 1. Backend Test Failure
```bash
# Get detailed output:
./vendor/bin/pest --filter=FailingTest --stop-on-failure

# Check logs:
tail -f storage/logs/laravel.log

# Common fixes:
php artisan config:clear
php artisan cache:clear
php artisan migrate:fresh --env=testing
composer dump-autoload
```

### 2. Frontend Type Error
```bash
# Get specific errors:
npx tsc --noEmit | grep "error TS"

# Common fixes:
- Add missing type definitions
- Fix prop interfaces
- Add null checks
```

### 3. ESLint Violation
```bash
# Auto-fix if possible:
npm run lint:fix

# Manual review:
npm run lint
# Fix reported issues in files
```

### 4. Integration Test Failure
```bash
# Check external service status:
- Razorpay Dashboard → Test mode active?
- Twilio Dashboard → Credits available?
- Email service → SMTP configured?

# Check .env variables:
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
TWILIO_SID=...
TWILIO_AUTH_TOKEN=...
```

---

## 📝 Regression Testing Log Template

Keep a log of regression tests run:

```markdown
## Release: v1.2.0
Date: 2026-02-10
Tester: [Name]

### Backend Tests
- [ ] All unit tests passed (X/X)
- [ ] All feature tests passed (X/X)
- [ ] Coverage: X%

### Frontend Tests
- [ ] Type check passed
- [ ] ESLint passed (0 errors)
- [ ] Manual UI checks passed

### Integration Tests
- [ ] Payment flow: ✅ Pass
- [ ] SMS sending: ✅ Pass
- [ ] Email sending: ✅ Pass
- [ ] Calendar sync: ✅ Pass

### Critical User Flows
- [ ] Complete booking: ✅ Pass
- [ ] Cancel appointment: ✅ Pass
- [ ] Add family member: ✅ Pass
- [ ] Upload health record: ✅ Pass

### Issues Found
1. [Description] - Status: Fixed/Pending
2. [Description] - Status: Fixed/Pending

### Sign-off
- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Ready for deployment

Approved by: [Name]
Date: [Date]
```

---

## 🎯 Quick Regression Test (15 minutes)

If you're short on time, run this minimal regression test:

```bash
# 1. Run automated tests (5 min)
composer test && npm run quality

# 2. Test critical path (10 min)
# In browser:
1. Login ✅
2. Start booking → Complete payment ✅
3. View appointment ✅
4. Cancel appointment ✅
5. Add family member ✅

# 3. Check for errors
# - No console errors ✅
# - No 500 errors ✅
# - No broken UI ✅
```

---

**Remember**: Regression testing ensures changes don't break existing functionality. Run it before every release! 🚀
