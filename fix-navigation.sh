#!/bin/bash

# Fix navigation in remaining booking files

files=(
  "resources/js/Pages/Booking/Doctor/ConfirmStep.tsx"
  "resources/js/Pages/Booking/Lab/PatientStep.tsx"
  "resources/js/Pages/Booking/Lab/TestSearchStep.tsx"
  "resources/js/Pages/Booking/Lab/ScheduleStep.tsx"
  "resources/js/Pages/Booking/Lab/ConfirmStep.tsx"
)

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "  File not found, skipping"
    continue
  fi
  
  # Add useNavigation import if not present
  if ! grep -q "useNavigation" "$file"; then
    # Add after the last import from @inertiajs/react
    sed -i '' "/from '@inertiajs\/react';/a\\
import { useNavigation } from '@/Hooks/useNavigation';
" "$file"
    echo "  Added useNavigation import"
  fi
  
done

echo "Done! Please manually update handleBack functions."
