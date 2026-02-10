# Pre-Deployment Checklist

> **Critical**: Complete this checklist before deploying to production to ensure functionality, integrations, and UI remain intact

## 🚨 Critical - DO NOT DEPLOY WITHOUT THESE

### 1. Automated Tests
```bash
# Must pass before deployment
composer test          # All backend tests
npm run type-check     # TypeScript validation
npm run lint           # ESLint (design system compliance)
```

- [ ] All backend tests passing (0 failures)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Test coverage ≥ 70% for critical paths

### 2. Database Migrations
```bash
# Verify migrations are safe
php artisan migrate:status
php artisan migrate --pretend
```

- [ ] All migrations tested in staging
- [ ] Rollback plan documented
- [ ] No data loss in migration
- [ ] Indexes added for new queries
- [ ] Foreign key constraints correct

### 3. Environment Configuration
- [ ] `.env` variables documented in `.env.example`
- [ ] All API keys configured (Razorpay, Twilio, etc.)
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` is set and unique
- [ ] Database credentials correct
- [ ] Email/SMS credentials tested

### 4. Security Checks
- [ ] No debug statements (`dd()`, `console.log`)
- [ ] No hardcoded credentials
- [ ] CSRF protection enabled
- [ ] XSS protection verified
- [ ] SQL injection protection verified
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] Security headers configured

---

## ⚙️ Functionality Checks

### Core Features (Test Manually in Staging)

#### Authentication & User Management
- [ ] User registration works
- [ ] Email verification works
- [ ] Login works (email/password)
- [ ] Google login works
- [ ] Apple login works
- [ ] Password reset works
- [ ] Session timeout works
- [ ] Logout works

#### Booking Flow - AI Mode
- [ ] Can start AI booking
- [ ] Can select/add patient
- [ ] Can chat with AI
- [ ] Can upload attachments
- [ ] Receives doctor suggestions
- [ ] Can select time slot
- [ ] Payment processing works
- [ ] Confirmation email sent
- [ ] Appointment appears in dashboard

#### Booking Flow - Guided Mode
- [ ] Can start guided booking
- [ ] Patient selection works
- [ ] New vs Follow-up selection works
- [ ] Symptom selection works
- [ ] Doctor browsing works
- [ ] Time slot selection works
- [ ] Payment processing works
- [ ] Confirmation email sent

#### Appointment Management
- [ ] Can view appointments list
- [ ] Can filter appointments (status, date)
- [ ] Can view appointment details
- [ ] Can download invoice (PDF)
- [ ] Can reschedule appointment
- [ ] Can cancel appointment
- [ ] Refund processing works
- [ ] Can join video consultation
- [ ] Video links work (Google Meet/Zoom)

#### Family Member Management
- [ ] Can add new family member
- [ ] Can link existing patient
- [ ] OTP sending works (SMS)
- [ ] OTP sending works (Email)
- [ ] OTP verification works
- [ ] Can edit family member
- [ ] Can delete family member
- [ ] Can add guest (one-time)

#### Health Records
- [ ] Can upload lab report (PDF/Image)
- [ ] AI summary generation works
- [ ] Can view health record
- [ ] Can download health record
- [ ] Can share health record
- [ ] Shareable links work
- [ ] Can search health records

#### Settings & Preferences
- [ ] Can update profile
- [ ] Can upload avatar
- [ ] Can change password
- [ ] Can configure notifications
- [ ] Can set video platform preference
- [ ] Can connect Google Calendar
- [ ] Can set date/time format

---

## 🔌 Integration Checks

### Payment Integration (Razorpay)
```bash
# Test in Razorpay TEST mode first!
```

- [ ] **Payment Success Flow**:
  - [ ] Payment page loads
  - [ ] Can enter test card details
  - [ ] Payment processes successfully
  - [ ] Webhook received and processed
  - [ ] Appointment status → "confirmed"
  - [ ] Payment status → "paid"
  - [ ] Confirmation email sent

- [ ] **Payment Failure Flow**:
  - [ ] Failed payment handled gracefully
  - [ ] Appointment status → "payment_failed"
  - [ ] User sees error message
  - [ ] Can retry payment

- [ ] **Refund Flow**:
  - [ ] Cancel appointment triggers refund
  - [ ] Refund created in Razorpay
  - [ ] Refund status tracked
  - [ ] Refund notification sent

- [ ] **Webhook Security**:
  - [ ] Signature verification enabled
  - [ ] Invalid webhooks rejected
  - [ ] Duplicate webhooks handled

**Switch to LIVE mode:**
- [ ] `RAZORPAY_KEY_ID=rzp_live_...`
- [ ] `RAZORPAY_KEY_SECRET=...` (live secret)
- [ ] Webhook URL updated in Razorpay Dashboard
- [ ] Test small transaction (₹1-10)

### SMS Integration (Twilio)
- [ ] OTP SMS delivery works
- [ ] SMS from correct sender ID
- [ ] SMS formatting correct
- [ ] Rate limiting works
- [ ] Error handling works
- [ ] Twilio credits sufficient

### Email Integration
- [ ] Booking confirmation email
- [ ] Appointment reminder email (24h before)
- [ ] Cancellation email
- [ ] Refund notification email
- [ ] Password reset email
- [ ] OTP email
- [ ] From address correct
- [ ] Email templates render correctly
- [ ] No spam folder issues

### Calendar Integration
- [ ] Google Calendar OAuth works
- [ ] Appointment creates calendar event
- [ ] Event details correct (title, time, description)
- [ ] Video link included in event
- [ ] Event updates on reschedule
- [ ] Event deletes on cancellation
- [ ] Timezone handling correct

### Video Consultation
- [ ] Google Meet links generate correctly
- [ ] Zoom links generate correctly
- [ ] Links accessible before appointment
- [ ] Settings preference respected
- [ ] Links work (test join)

---

## 🎨 UI/UX Integrity

### Design System Compliance
```bash
# Run automated checks
npm run lint
```

- [ ] No ESLint errors
- [ ] No arbitrary Tailwind values
- [ ] No layout inline styles
- [ ] No ad-hoc alert divs
- [ ] All components use design tokens

### Visual Regression
**Compare screenshots before/after deployment:**

- [ ] Dashboard layout unchanged
- [ ] Booking flow layout unchanged
- [ ] Appointment list layout unchanged
- [ ] Family members page unchanged
- [ ] Settings page unchanged
- [ ] All modals/sheets unchanged

**Key visual elements:**
- [ ] Avatar colors (getAvatarColorByName)
- [ ] Status badges (correct variants)
- [ ] Button variants (correct colors)
- [ ] Card layouts (no broken grids)
- [ ] Typography (correct tokens)
- [ ] Spacing (consistent gaps)

### Responsive Design
**Test on actual devices:**

- [ ] **Mobile (375px)**: iPhone SE
- [ ] **Mobile (390px)**: iPhone 12/13/14
- [ ] **Tablet (768px)**: iPad
- [ ] **Desktop (1280px)**: MacBook
- [ ] **Desktop (1920px)**: Large monitor

**Critical responsive checks:**
- [ ] Navigation works on mobile
- [ ] Forms usable on mobile
- [ ] Tables scroll on mobile
- [ ] Sheets full-width on mobile
- [ ] Images don't overflow
- [ ] Text readable on all sizes

### Accessibility
- [ ] All forms have labels
- [ ] All buttons have accessible names
- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] No flashing content
- [ ] Loading states announced

---

## ⚡ Performance Checks

### Page Load Performance
**Test with Lighthouse (Chrome DevTools):**

- [ ] Dashboard: Performance score ≥ 90
- [ ] Booking pages: Performance score ≥ 90
- [ ] Appointments: Performance score ≥ 85

**Targets:**
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1

### Database Performance
```bash
# Check with Laravel Debugbar
```

- [ ] No N+1 queries
- [ ] Total queries per page < 20
- [ ] Query time < 100ms
- [ ] Eager loading used for relationships
- [ ] Indexes on frequently queried columns

### Asset Optimization
- [ ] Images compressed (WebP/AVIF)
- [ ] JavaScript bundle size < 300KB
- [ ] CSS bundle size < 100KB
- [ ] No unused dependencies
- [ ] Lazy loading for images
- [ ] Code splitting enabled

---

## 📊 Monitoring & Logging

### Error Tracking
- [ ] Error tracking configured (Sentry/Bugsnag)
- [ ] Test error reporting works
- [ ] Error notifications configured
- [ ] Source maps uploaded

### Application Logging
- [ ] Logs writing to correct location
- [ ] Log rotation configured
- [ ] Sensitive data not logged
- [ ] Log level appropriate (ERROR/WARNING)

### Uptime Monitoring
- [ ] Uptime monitor configured
- [ ] Health check endpoint working
- [ ] Alert notifications configured
- [ ] Status page updated

### Performance Monitoring
- [ ] APM tool configured (New Relic/Scout)
- [ ] Database query monitoring active
- [ ] Response time tracking active
- [ ] Memory usage tracking active

---

## 🔧 Infrastructure

### Server Configuration
- [ ] PHP version correct (8.2+)
- [ ] Required PHP extensions installed
- [ ] Composer dependencies installed
- [ ] NPM dependencies installed
- [ ] Assets built (`npm run build`)
- [ ] File permissions correct
- [ ] Storage linked (`php artisan storage:link`)

### Database
- [ ] Backup configured (automated)
- [ ] Recent backup exists
- [ ] Restore procedure tested
- [ ] Connection pool sized appropriately
- [ ] Replication configured (if applicable)

### Cache & Queue
- [ ] Redis/Memcached running
- [ ] Cache cleared before deploy
- [ ] Queue workers running
- [ ] Failed jobs monitored
- [ ] Queue processed timely

### Web Server
- [ ] HTTPS configured
- [ ] SSL certificate valid
- [ ] HTTP → HTTPS redirect
- [ ] www redirect configured
- [ ] CORS configured (if needed)
- [ ] Gzip compression enabled

---

## 🚀 Deployment Process

### Pre-Deployment
- [ ] Create database backup
- [ ] Tag release in Git
- [ ] Document changes in CHANGELOG.md
- [ ] Notify stakeholders of deployment

### Deployment Steps
```bash
# 1. Put application in maintenance mode
php artisan down --message="Upgrading system. Back in 5 minutes."

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
composer install --no-dev --optimize-autoloader
npm ci --production

# 4. Build assets
npm run build

# 5. Run migrations
php artisan migrate --force

# 6. Clear caches
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Restart queue workers
php artisan queue:restart

# 8. Bring application back up
php artisan up
```

- [ ] Maintenance mode enabled
- [ ] Code deployed
- [ ] Dependencies installed
- [ ] Migrations run successfully
- [ ] Caches cleared
- [ ] Queue workers restarted
- [ ] Application accessible

### Post-Deployment Verification
**Immediately after deployment:**

- [ ] Homepage loads without errors
- [ ] Login works
- [ ] Dashboard loads
- [ ] Critical features work (booking, payments)
- [ ] No 500 errors in logs
- [ ] Error tracking shows no new errors
- [ ] Performance metrics normal

**Within 1 hour:**
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify email delivery
- [ ] Check queue processing
- [ ] Monitor database performance

**Within 24 hours:**
- [ ] Complete user journey test
- [ ] Check payment webhooks
- [ ] Verify scheduled tasks ran
- [ ] Review error rate
- [ ] Check user feedback

---

## 🔄 Rollback Plan

**If deployment fails:**

```bash
# 1. Put in maintenance mode
php artisan down

# 2. Rollback code
git checkout [previous-tag]

# 3. Rollback migrations (if needed)
php artisan migrate:rollback

# 4. Reinstall dependencies
composer install --no-dev --optimize-autoloader
npm ci --production

# 5. Rebuild assets
npm run build

# 6. Clear caches
php artisan optimize:clear

# 7. Bring back up
php artisan up
```

- [ ] Rollback procedure documented
- [ ] Previous version tagged in Git
- [ ] Database backup available
- [ ] Team notified of rollback

---

## 📝 Deployment Sign-Off

### Completed By
- **Developer**: ___________________
- **QA Tester**: ___________________
- **Date**: ___________________

### Checklist Summary
- [ ] All critical checks passed ✓
- [ ] All integrations tested ✓
- [ ] UI/UX verified ✓
- [ ] Performance acceptable ✓
- [ ] Monitoring configured ✓
- [ ] Deployment successful ✓
- [ ] Post-deployment verification passed ✓

### Approval
- [ ] **Tech Lead**: ___________________
- [ ] **Product Owner**: ___________________

### Notes
```
[Any issues encountered, workarounds applied, or follow-up items]
```

---

## 🛠 Quick Commands Reference

```bash
# Run functionality check
./scripts/check-functionality.sh

# Full quality check
composer quality && npm run quality

# Run all tests
composer test:all && npm run test

# Deploy (production)
php artisan down && git pull && composer install --no-dev && npm run build && php artisan migrate --force && php artisan optimize:clear && php artisan up

# Rollback (emergency)
git checkout [previous-tag] && composer install && npm run build && php artisan migrate:rollback && php artisan optimize:clear
```

---

**🎯 Remember**: This checklist protects your users and your business. Never skip critical checks! 🚀
