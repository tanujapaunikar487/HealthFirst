# Testing & Quality Assurance - Quick Start

> **Goal**: Ensure functionality, integrations, and UI remain intact across all changes

## 📚 Documentation

1. **[TESTING.md](TESTING.md)** - Complete testing guide (setup, strategies, best practices)
2. **[QA-CHECKLIST.md](QA-CHECKLIST.md)** - Daily quality checklists
3. **[REGRESSION-TESTING.md](REGRESSION-TESTING.md)** - Ensure nothing breaks
4. **[PRE-DEPLOYMENT.md](PRE-DEPLOYMENT.md)** - Final deployment checklist

---

## ⚡ Quick Commands

### Run Quality Checks (Before Every Commit)
```bash
# Backend: Format + Tests
composer quality

# Frontend: Types + Lint
npm run quality

# Everything
composer quality && npm run quality
```

### Run Functionality Check
```bash
# Automated system health check
./scripts/check-functionality.sh
```

This checks:
- ✅ Environment configuration
- ✅ Dependencies installed
- ✅ Database connectivity
- ✅ Code quality (formatting, types, linting)
- ✅ All tests passing
- ✅ Routes registered
- ✅ File permissions
- ✅ External service configuration

### Run Specific Tests
```bash
# Backend
composer test              # All tests
composer test:unit         # Unit tests only
composer test:feature      # Feature tests only
composer test:coverage     # With coverage report

# Frontend (after setup)
npm run test               # Component tests
npm run test:e2e           # End-to-end tests
```

---

## 🎯 What Gets Checked

### Automated Checks

#### Backend (composer quality)
- ✅ PHP code formatting (Laravel Pint)
- ✅ All backend tests (Pest)
- ✅ Database integrity
- ✅ Route configuration

#### Frontend (npm run quality)
- ✅ TypeScript type checking
- ✅ ESLint (design system enforcement)
  - No arbitrary Tailwind values
  - No inline styles for layout
  - No ad-hoc alert divs
- ✅ Component tests (when set up)

### Critical User Flows (Manual Testing)

**Always test these before deployment:**

1. **Authentication**
   - Register → Email verification → Login
   - Login with existing account
   - Password reset

2. **Booking Flow**
   - Complete AI booking with payment
   - Complete guided booking with payment
   - Add family member inline
   - Link existing patient (OTP)

3. **Appointment Management**
   - View appointments
   - Cancel appointment → Verify refund
   - Reschedule appointment
   - Join video consultation

4. **Family Members**
   - Add new family member
   - Link existing patient (OTP verification)
   - Edit/delete family member

5. **Health Records**
   - Upload lab report
   - Verify AI summary
   - Share health record

### Integrations (Must Work)

- ✅ **Razorpay**: Payment processing, webhooks, refunds
- ✅ **Twilio**: OTP SMS delivery
- ✅ **Email**: Booking confirmations, reminders, OTP
- ✅ **Google Calendar**: Event sync (if enabled)
- ✅ **Video Links**: Google Meet / Zoom generation

---

## 🚀 Daily Workflow

### Before Starting Work
```bash
# Pull latest changes
git pull origin main

# Check system health
./scripts/check-functionality.sh

# If failures, fix before proceeding
```

### During Development
```bash
# Check types frequently
npm run type-check

# Run related tests
./vendor/bin/pest tests/Feature/YourTest.php
```

### Before Committing
```bash
# Run quality checks
composer quality && npm run quality

# Fix any issues:
composer format              # Auto-fix PHP formatting
npm run lint:fix            # Auto-fix ESLint issues

# Commit only when all pass ✅
git add .
git commit -m "Your message"
```

### Before Creating PR
```bash
# Full test suite
composer test:all
npm run quality

# Manual testing
# - Test your feature in browser
# - Test on mobile (Chrome DevTools)
# - Check for console errors
# - Verify no UI regressions
```

### Before Deployment
```bash
# Run pre-deployment checklist
# See: PRE-DEPLOYMENT.md

# Critical checks:
./scripts/check-functionality.sh
composer quality && npm run quality
# + Manual testing of critical flows
```

---

## 🛠 Setup Additional Testing

### Install Frontend Testing (Recommended)
```bash
# Install Vitest for component testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Install Playwright for E2E testing
npm install -D @playwright/test
npx playwright install
```

After installation, update `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Install PHPStan (Recommended)
```bash
composer require --dev phpstan/phpstan
./vendor/bin/phpstan analyse app
```

---

## 📊 Testing Coverage Goals

| Category | Current | Target | Priority |
|----------|---------|--------|----------|
| Backend Tests | ✅ Basic | 70%+ | High |
| Frontend Tests | ⚠️ None | 60%+ | Medium |
| E2E Tests | ⚠️ None | Critical flows | High |
| Integration Tests | ✅ Some | All integrations | High |

---

## 🎓 Example Tests

See `tests/Feature/Examples/` for:
- **PaymentWebhookTest.php** - Razorpay webhook handling
- **OTPVerificationTest.php** - OTP verification flow

Use these as templates for writing new tests.

---

## 🔍 Troubleshooting

### Tests Failing

```bash
# Clear caches
php artisan config:clear
php artisan cache:clear

# Reset test database
php artisan migrate:fresh --env=testing

# Dump autoload
composer dump-autoload

# Run single test for debugging
./vendor/bin/pest tests/Feature/YourTest.php --stop-on-failure
```

### Type Errors

```bash
# Get detailed errors
npx tsc --noEmit

# Common fixes:
# - Add missing type definitions
# - Fix prop interfaces
# - Add null checks
```

### ESLint Issues

```bash
# Auto-fix
npm run lint:fix

# If can't auto-fix, manually update:
# - Replace text-[14px] with text-body
# - Remove inline styles
# - Use Alert component instead of divs
```

### Integration Failures

**Razorpay:**
- Check TEST mode is enabled
- Verify webhook URL in dashboard
- Test with test cards only

**Twilio:**
- Verify SID and Auth Token
- Check account has credits
- Use test phone number format

**Email:**
- Check SMTP configuration
- Verify sender email
- Check spam folder

---

## 📋 Quick Checklists

### Pre-Commit Checklist
- [ ] `composer quality` passes
- [ ] `npm run quality` passes
- [ ] Feature tested in browser
- [ ] No console errors

### Pre-PR Checklist
- [ ] All tests passing
- [ ] Code formatted
- [ ] Types checked
- [ ] Lint passed
- [ ] Feature works on mobile
- [ ] No UI regressions

### Pre-Deployment Checklist
- [ ] Functionality check passes
- [ ] All quality checks pass
- [ ] Critical flows tested manually
- [ ] Integrations tested
- [ ] Database migration safe
- [ ] Rollback plan ready

---

## 🆘 Getting Help

### Resources
- **Testing Guide**: [TESTING.md](TESTING.md)
- **QA Checklist**: [QA-CHECKLIST.md](QA-CHECKLIST.md)
- **Regression Guide**: [REGRESSION-TESTING.md](REGRESSION-TESTING.md)
- **Deployment Guide**: [PRE-DEPLOYMENT.md](PRE-DEPLOYMENT.md)

### Common Issues
- Test database issues → `php artisan migrate:fresh --env=testing`
- Type errors → Check prop interfaces and null handling
- ESLint violations → Use design tokens, no arbitrary values
- Integration failures → Check .env configuration

---

## 🎯 Success Criteria

Your code is ready when:
- ✅ All automated tests pass
- ✅ Code follows design system rules
- ✅ No TypeScript errors
- ✅ Feature works in browser
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Integrations work
- ✅ Performance acceptable

---

## 📞 Quick Reference

```bash
# Health check
./scripts/check-functionality.sh

# Quality check
composer quality && npm run quality

# Run tests
composer test                    # Backend
npm run test                     # Frontend (when set up)

# Format code
composer format                  # PHP
npm run lint:fix                # JavaScript/TypeScript

# Type check
npm run type-check              # TypeScript

# Deploy
# See PRE-DEPLOYMENT.md for full checklist
```

---

**Remember**: Testing is not a burden, it's your safety net! 🎯

Test early, test often, deploy confidently. 🚀
