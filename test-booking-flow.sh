#!/bin/bash

# Booking Flow Automated Test Script
# This script tests the core booking functionality

echo "🧪 Starting Booking Flow Tests..."
echo ""

BASE_URL="http://localhost:3000"
LOG_FILE="storage/logs/laravel.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name: PASS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $test_name: FAIL - $message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test 1: Check if booking page is accessible
echo "Test 1: Checking if booking page is accessible..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/booking")
if [ "$HTTP_CODE" = "200" ]; then
    print_result "Booking Page Accessibility" "PASS"
else
    print_result "Booking Page Accessibility" "FAIL" "Got HTTP $HTTP_CODE"
fi

# Test 2: Check if dashboard is accessible
echo ""
echo "Test 2: Checking if dashboard is accessible..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
if [ "$HTTP_CODE" = "200" ]; then
    print_result "Dashboard Accessibility" "PASS"
else
    print_result "Dashboard Accessibility" "FAIL" "Got HTTP $HTTP_CODE"
fi

# Test 3: Check if Laravel server is responding
echo ""
echo "Test 3: Checking Laravel server response..."
RESPONSE=$(curl -s "$BASE_URL" -o /dev/null -w "%{http_code}")
if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "200" ]; then
    print_result "Laravel Server" "PASS"
else
    print_result "Laravel Server" "FAIL" "Server not responding correctly"
fi

# Test 4: Check if Vite is running
echo ""
echo "Test 4: Checking if Vite dev server is running..."
if pgrep -f "vite" > /dev/null; then
    print_result "Vite Dev Server" "PASS"
else
    print_result "Vite Dev Server" "FAIL" "Vite process not found"
fi

# Test 5: Check if PHP artisan serve is running
echo ""
echo "Test 5: Checking if PHP artisan serve is running..."
if pgrep -f "php artisan serve" > /dev/null; then
    print_result "PHP Artisan Serve" "PASS"
else
    print_result "PHP Artisan Serve" "FAIL" "PHP artisan serve not running"
fi

# Test 6: Check for recent errors in logs
echo ""
echo "Test 6: Checking Laravel logs for recent errors..."
if [ -f "$LOG_FILE" ]; then
    RECENT_ERRORS=$(tail -100 "$LOG_FILE" | grep -c "ERROR\|CRITICAL\|Exception")
    if [ "$RECENT_ERRORS" -eq "0" ]; then
        print_result "No Recent Errors in Logs" "PASS"
    else
        print_result "No Recent Errors in Logs" "FAIL" "Found $RECENT_ERRORS error(s)"
    fi
else
    print_result "No Recent Errors in Logs" "FAIL" "Log file not found"
fi

# Test 7: Check if database migrations are up to date
echo ""
echo "Test 7: Checking if required database tables exist..."
/opt/homebrew/bin/php artisan migrate:status > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_result "Database Tables" "PASS"
else
    print_result "Database Tables" "FAIL" "Migration status check failed"
fi

# Test 8: Check if .env file exists
echo ""
echo "Test 8: Checking if .env file exists..."
if [ -f ".env" ]; then
    print_result ".env File" "PASS"
else
    print_result ".env File" "FAIL" ".env file not found"
fi

# Print summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Tests Run:    $TESTS_RUN"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -eq "0" ]; then
    echo -e "${GREEN}✓ All tests passed! System is ready for manual testing.${NC}"
    echo ""
    echo "🚀 Open your browser to: $BASE_URL/booking"
    echo ""
    echo "Next steps:"
    echo "1. Open browser to $BASE_URL/booking"
    echo "2. Follow test scenarios in QUICK_TEST_GUIDE.md"
    echo "3. Report any issues found"
else
    echo -e "${RED}✗ Some tests failed. Please fix the issues above.${NC}"
    echo ""
    echo "Check the output above for details."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
