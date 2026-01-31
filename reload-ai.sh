#!/bin/bash

echo "🔄 Reloading AI Configuration..."
echo ""

cd "/Users/tanujapaunikar/Desktop/Health Care"

# Clear caches
echo "Clearing cache..."
php artisan config:clear
php artisan cache:clear

# Seed additional knowledge
echo ""
echo "Adding knowledge base resources..."
php artisan db:seed --class=AdditionalKnowledgeSeeder

echo ""
echo "✅ Done! AI configuration reloaded."
echo ""
echo "Now try these questions in the chat:"
echo "  - 'which doctor has better experience with gynaecology?'"
echo "  - 'what is the difference between video and in-person?'"
echo "  - 'how do I choose a doctor?'"
echo ""
echo "The AI should answer naturally instead of showing options!"
