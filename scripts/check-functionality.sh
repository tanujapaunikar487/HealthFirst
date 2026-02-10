#!/bin/bash

# Functionality & Integration Check Script
# Ensures all critical systems are working before deployment

set -e  # Exit on any error

echo "🔍 Healthcare Platform - Functionality Check"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    FAILURES=$((FAILURES + 1))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 1. Environment Check
section "1. Environment Configuration"

if [ -f .env ]; then
    pass ".env file exists"
else
    fail ".env file missing"
fi

# Check critical env variables
check_env() {
    if grep -q "^$1=" .env; then
        pass "$1 is set"
    else
        fail "$1 is missing in .env"
    fi
}

check_env "APP_KEY"
check_env "DB_CONNECTION"
check_env "RAZORPAY_KEY_ID"
check_env "TWILIO_SID"

# 2. Dependencies Check
section "2. Dependencies"

if [ -d "vendor" ]; then
    pass "Composer dependencies installed"
else
    fail "Composer dependencies missing - run: composer install"
fi

if [ -d "node_modules" ]; then
    pass "NPM dependencies installed"
else
    fail "NPM dependencies missing - run: npm install"
fi

# 3. Database Check
section "3. Database Connectivity"

if php artisan migrate:status > /dev/null 2>&1; then
    pass "Database connection successful"
    php artisan migrate:status | tail -5
else
    fail "Database connection failed"
fi

# 4. Code Quality Check
section "4. Code Quality"

echo "Checking PHP formatting..."
if ./vendor/bin/pint --test > /dev/null 2>&1; then
    pass "PHP code formatting ✓"
else
    warn "PHP code needs formatting - run: composer format"
fi

echo "Checking TypeScript types..."
if npm run type-check > /dev/null 2>&1; then
    pass "TypeScript types ✓"
else
    fail "TypeScript errors found - run: npm run type-check"
fi

echo "Checking ESLint..."
if npm run lint > /dev/null 2>&1; then
    pass "ESLint checks ✓"
else
    warn "ESLint issues found - run: npm run lint"
fi

# 5. Backend Tests
section "5. Backend Tests"

echo "Running backend tests..."
if composer test > /dev/null 2>&1; then
    pass "All backend tests passing"
    ./vendor/bin/pest --compact
else
    fail "Backend tests failing - run: composer test"
fi

# 6. Asset Build Check
section "6. Asset Build"

if [ -f "public/build/manifest.json" ]; then
    pass "Frontend assets built"
else
    warn "Frontend assets not built - run: npm run build"
fi

# 7. Critical Model Checks
section "7. Database Integrity"

echo "Checking critical data..."

# Use artisan tinker to run checks
php artisan tinker --execute="
echo 'Users: ' . App\Models\User::count() . PHP_EOL;
echo 'Appointments: ' . App\Models\Appointment::count() . PHP_EOL;
echo 'Family Members: ' . (class_exists('App\Models\FamilyMember') ? App\Models\FamilyMember::count() : 'N/A') . PHP_EOL;
" 2>/dev/null || warn "Could not verify data counts"

# 8. Route Check
section "8. Route Configuration"

echo "Checking critical routes..."
if php artisan route:list | grep -q "dashboard"; then
    pass "Dashboard route registered"
else
    fail "Dashboard route missing"
fi

if php artisan route:list | grep -q "booking"; then
    pass "Booking routes registered"
else
    fail "Booking routes missing"
fi

if php artisan route:list | grep -q "appointments"; then
    pass "Appointment routes registered"
else
    fail "Appointment routes missing"
fi

# 9. Permission Check
section "9. File Permissions"

if [ -w "storage" ]; then
    pass "Storage directory writable"
else
    fail "Storage directory not writable - run: chmod -R 775 storage"
fi

if [ -w "bootstrap/cache" ]; then
    pass "Cache directory writable"
else
    fail "Cache directory not writable - run: chmod -R 775 bootstrap/cache"
fi

# 10. Integration Service Check
section "10. External Service Configuration"

echo "Checking Razorpay configuration..."
if grep -q "RAZORPAY_KEY_ID=rzp_test_" .env; then
    pass "Razorpay TEST mode configured"
elif grep -q "RAZORPAY_KEY_ID=rzp_live_" .env; then
    warn "Razorpay LIVE mode configured (use TEST for development)"
else
    warn "Razorpay key not configured"
fi

echo "Checking Twilio configuration..."
if grep -q "^TWILIO_SID=" .env && grep -q "^TWILIO_AUTH_TOKEN=" .env; then
    pass "Twilio configured"
else
    warn "Twilio not fully configured"
fi

# 11. Cache & Config Status
section "11. Laravel Cache Status"

echo "Application cache status:"
if php artisan config:show app.env 2>/dev/null | grep -q "local\|development"; then
    pass "Running in development mode"
elif php artisan config:show app.env 2>/dev/null | grep -q "production"; then
    warn "Running in PRODUCTION mode"
fi

# 12. Queue Check
section "12. Queue Configuration"

echo "Checking queue connection..."
if php artisan queue:failed 2>/dev/null; then
    pass "Queue system accessible"
    FAILED_JOBS=$(php artisan queue:failed --json 2>/dev/null | grep -c '"id"' || echo "0")
    if [ "$FAILED_JOBS" -gt 0 ]; then
        warn "$FAILED_JOBS failed jobs in queue"
    fi
else
    warn "Queue system check failed"
fi

# Summary
section "Summary"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "✨ System ready for development/testing"
    echo ""
    echo "Next steps:"
    echo "  • Start dev server: composer dev"
    echo "  • Run quality check: composer quality && npm run quality"
    echo "  • View app: http://localhost:3000"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ $FAILURES checks failed${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "⚠️  Please fix the failing checks before proceeding"
    echo ""
    echo "Common fixes:"
    echo "  • composer install"
    echo "  • npm install"
    echo "  • php artisan migrate"
    echo "  • composer format"
    echo "  • npm run lint:fix"
    exit 1
fi
