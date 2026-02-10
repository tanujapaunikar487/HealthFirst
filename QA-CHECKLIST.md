# Quality Assurance Checklist

Use this checklist before committing code or creating pull requests.

## 🚀 Quick Quality Check

```bash
# Run this before every commit
composer quality && npm run quality
```

---

## ✅ Pre-Commit Checklist

### Code Quality

- [ ] **TypeScript errors**: `npm run type-check` ✅ passes
- [ ] **ESLint**: `npm run lint` ✅ no errors
- [ ] **PHP formatting**: `composer format:check` ✅ passes
- [ ] **Design tokens**: No arbitrary Tailwind values (`text-[14px]`, `p-[13px]`)
- [ ] **No inline styles**: No `style={{}}` for layout (only for HSL colors, animations)

### Testing

- [ ] **Backend tests**: `composer test` ✅ all passing
- [ ] **New features**: Added corresponding tests
- [ ] **Edge cases**: Tested error states and boundary conditions

### Functionality

- [ ] **Manual testing**: Feature works in browser
- [ ] **Responsive**: Tested on mobile/tablet/desktop
- [ ] **Cross-browser**: Tested in Chrome + Safari (minimum)
- [ ] **Loading states**: Spinners/skeletons show during async operations
- [ ] **Error handling**: User-friendly error messages display

### Accessibility

- [ ] **Keyboard navigation**: Can Tab through interactive elements
- [ ] **Focus indicators**: Visible focus states on all controls
- [ ] **Color contrast**: Text readable against backgrounds
- [ ] **Screen reader**: Labels on form inputs and buttons

### Performance

- [ ] **No console errors**: Browser console clean (except dev warnings)
- [ ] **No N+1 queries**: Check Laravel Debugbar
- [ ] **Eager loading**: Used `with()` for relationships
- [ ] **Image optimization**: Images compressed and appropriate format

### Security

- [ ] **XSS protection**: User input escaped/sanitized
- [ ] **CSRF tokens**: Forms include CSRF protection
- [ ] **Authorization**: Routes protected with middleware
- [ ] **SQL injection**: Using Eloquent/Query Builder, not raw SQL

---

## 📋 Feature-Specific Checklists

### Adding a New Page

- [ ] Route defined in `web.php` with proper middleware
- [ ] Controller method created
- [ ] Page component in `resources/js/Pages/`
- [ ] Breadcrumbs included (if applicable)
- [ ] Meta title/description set
- [ ] Mobile responsive
- [ ] Loading states handled
- [ ] Empty states handled

### Adding a New Component

- [ ] Located in correct directory (`Components/ui/` or domain folder)
- [ ] TypeScript interfaces defined for props
- [ ] Uses design tokens (no arbitrary values)
- [ ] Handles loading/error/empty states
- [ ] Accessible (ARIA labels, keyboard nav)
- [ ] Documented in REFERENCE.md (if reusable)

### Adding a Form

- [ ] Server-side validation (FormRequest)
- [ ] Client-side validation (optional, for UX)
- [ ] Error messages display correctly
- [ ] Success feedback (toast/redirect)
- [ ] CSRF token included
- [ ] Loading state on submit button
- [ ] Disabled inputs during submission
- [ ] Handles validation errors from backend

### Adding an API Endpoint

- [ ] Route defined with proper HTTP method
- [ ] Request validation (FormRequest)
- [ ] Authorization check (Policy or Gate)
- [ ] Returns consistent JSON structure
- [ ] Error responses formatted properly
- [ ] Feature test written
- [ ] API documented (if public)

### Database Changes

- [ ] Migration created
- [ ] Migration reversible (down method)
- [ ] Foreign keys with proper constraints
- [ ] Indexes on frequently queried columns
- [ ] Migration tested (up + down)
- [ ] Factory updated (if applicable)
- [ ] Seeder updated (if applicable)

### Booking Flow Changes

- [ ] Both AI and Guided modes tested
- [ ] Progressive disclosure works correctly
- [ ] Form data persists on navigation
- [ ] Payment flow tested (test mode)
- [ ] Confirmation emails sent
- [ ] Notifications triggered
- [ ] Calendar events created

---

## 🔍 PR Review Checklist

Use this when reviewing pull requests:

### Code Review

- [ ] Code follows project conventions (see CLAUDE.md)
- [ ] No commented-out code
- [ ] No debug statements (`console.log`, `dd()`)
- [ ] No hardcoded values (use config/env)
- [ ] Descriptive variable/function names
- [ ] Comments only where logic is complex

### Testing

- [ ] All tests pass in CI
- [ ] New features have tests
- [ ] Tests are meaningful (not just for coverage)
- [ ] No skipped/commented tests

### Documentation

- [ ] REFERENCE.md updated for new patterns
- [ ] README updated if setup changed
- [ ] Inline comments for complex logic
- [ ] API endpoints documented

### Database

- [ ] No breaking schema changes without migration plan
- [ ] Indexes added for new query patterns
- [ ] No direct DB changes in production

---

## 🎯 Testing Scenarios by Feature

### Authentication
- [ ] Registration with valid data
- [ ] Registration with duplicate email
- [ ] Login with correct credentials
- [ ] Login with wrong password
- [ ] Password reset flow
- [ ] Social login (Google, Apple)
- [ ] Session timeout handling

### Booking (AI Mode)
- [ ] Complete booking with new patient
- [ ] Complete booking with existing patient
- [ ] Add family member inline
- [ ] Link existing patient (OTP flow)
- [ ] Upload attachments
- [ ] Voice recording
- [ ] Payment completion
- [ ] Booking confirmation email

### Booking (Guided Mode)
- [ ] New consultation flow
- [ ] Follow-up consultation flow
- [ ] Select symptoms
- [ ] Choose doctor
- [ ] Select time slot
- [ ] Payment and confirmation

### Appointments
- [ ] View appointment details
- [ ] Cancel appointment
- [ ] Reschedule appointment
- [ ] Download invoice
- [ ] Join video consultation
- [ ] Add to calendar

### Family Members
- [ ] Add new family member
- [ ] Link existing patient
- [ ] OTP verification via SMS
- [ ] OTP verification via email
- [ ] View family member details
- [ ] Edit family member
- [ ] Delete family member

### Health Records
- [ ] Upload lab report
- [ ] View health record
- [ ] Download health record
- [ ] Share health record
- [ ] AI summary generation (for labs)
- [ ] Search health records

### Payments
- [ ] Razorpay payment success
- [ ] Razorpay payment failure
- [ ] Refund processing
- [ ] Invoice generation
- [ ] Payment history

### Notifications
- [ ] Appointment reminder (24h before)
- [ ] Booking confirmation
- [ ] Cancellation notification
- [ ] Refund notification
- [ ] OTP delivery

---

## 🐛 Bug Fix Checklist

When fixing a bug:

- [ ] Root cause identified (not just symptom)
- [ ] Test case added to prevent regression
- [ ] Similar issues checked in codebase
- [ ] Fix verified in multiple scenarios
- [ ] No new bugs introduced

---

## 🚢 Pre-Deployment Checklist

Before deploying to production:

### Code
- [ ] All tests passing
- [ ] No merge conflicts
- [ ] Main branch up to date
- [ ] Version number updated (if applicable)

### Database
- [ ] Migrations tested
- [ ] Seeders ready (if needed)
- [ ] Backup plan in place

### Configuration
- [ ] Environment variables documented
- [ ] `.env.example` updated
- [ ] API keys secured (not in code)
- [ ] Feature flags configured

### Testing
- [ ] Tested in staging environment
- [ ] Payment flow tested (production mode)
- [ ] Email/SMS notifications tested
- [ ] Third-party integrations tested

### Performance
- [ ] No slow queries (< 100ms)
- [ ] Images optimized
- [ ] Caching enabled
- [ ] Queue workers running

### Monitoring
- [ ] Error tracking configured (Sentry/Bugsnag)
- [ ] Logs being captured
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured

---

## 📊 Quality Metrics

Track these metrics over time:

| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage (Backend) | 70%+ | ___ |
| Test Coverage (Frontend) | 60%+ | ___ |
| Page Load Time | < 2s | ___ |
| API Response Time | < 200ms | ___ |
| Build Time | < 2min | ___ |
| Zero ESLint Errors | ✅ | ___ |
| Zero TS Errors | ✅ | ___ |
| Lighthouse Score (Performance) | 90+ | ___ |
| Lighthouse Score (Accessibility) | 95+ | ___ |

---

## 🛠 Quick Fix Commands

```bash
# Auto-fix formatting
composer format
npm run lint:fix

# Clear all caches
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Reset test database
php artisan migrate:fresh --env=testing

# Run specific test
./vendor/bin/pest tests/Feature/BookingFlowTest.php

# Type check only changed files
git diff --name-only | grep '\.tsx\?$' | xargs npx tsc --noEmit
```

---

## 💡 Tips

1. **Run quality checks frequently** - Don't wait until PR time
2. **Fix warnings early** - They become errors later
3. **Test edge cases** - Empty states, max values, special characters
4. **Mobile-first** - Design/test mobile view first
5. **Accessibility matters** - 15% of users have disabilities
6. **Performance is UX** - Slow = bad user experience
7. **Document as you go** - Future you will thank present you

---

**Remember**: Quality is not a one-time activity, it's a habit! 🎯
