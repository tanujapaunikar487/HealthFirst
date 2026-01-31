#!/bin/bash

# Simple test runner for hybrid booking system

echo "🧪 Testing Hybrid Booking System"
echo "================================="
echo ""

# Set testing environment
export APP_ENV=testing

# Enable AI during tests
export AI_ENABLED=true
export AI_PROVIDER=ollama

# Run the tests
/opt/homebrew/bin/php artisan test --filter=HybridBookingConversationTest::test_run_all_scenarios --testdox

echo ""
echo "================================="
echo "Test complete!"
