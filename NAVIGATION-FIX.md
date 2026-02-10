# Navigation Back Button Fix

## Problem
Back buttons use hardcoded URLs instead of browser history, so they don't go to the actual previous page.

## Files with Hardcoded Back Navigation

1. `resources/js/Pages/Booking/Doctor/PatientStep.tsx` - Line 256
2. `resources/js/Pages/Booking/Doctor/ConcernsStep.tsx` - Line 110
3. `resources/js/Pages/Booking/Doctor/DoctorTimeStep.tsx` - Line 118
4. `resources/js/Pages/Booking/Doctor/ConfirmStep.tsx` - Line 39
5. `resources/js/Pages/Booking/Lab/PatientStep.tsx` - Line 40
6. `resources/js/Pages/Booking/Lab/TestSearchStep.tsx` - Line 171
7. `resources/js/Pages/Booking/Lab/ScheduleStep.tsx` - Line 217
8. `resources/js/Pages/Booking/Lab/ConfirmStep.tsx` - Line 32

## Solution Options

### Option 1: Use Browser History (Recommended)
```tsx
const handleBack = () => {
  window.history.back();
};
```

**Pros:**
- Simple
- Works with browser back button
- Respects actual navigation history

**Cons:**
- If user navigates directly to page (no history), nothing happens

### Option 2: Smart Back with Fallback
```tsx
const handleBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    router.get('/booking'); // Fallback if no history
  }
};
```

**Pros:**
- Falls back to safe default
- Handles direct navigation

### Option 3: Track Referrer (Best for Complex Flows)
```tsx
import { usePrevious } from '@/Hooks/usePrevious'; // Create this hook

const handleBack = () => {
  const previousUrl = usePrevious(window.location.pathname);
  router.get(previousUrl || '/booking');
};
```

## Recommended Implementation

### Step 1: Create a useNavigation Hook

Create `resources/js/Hooks/useNavigation.ts`:

```typescript
import { router } from '@inertiajs/react';

export function useNavigation() {
  const goBack = (fallbackUrl: string = '/') => {
    if (window.history.length > 1 && document.referrer) {
      window.history.back();
    } else {
      router.get(fallbackUrl);
    }
  };

  return { goBack };
}
```

### Step 2: Update All Back Handlers

Replace:
```tsx
const handleBack = () => {
  router.get('/booking');
};
```

With:
```tsx
import { useNavigation } from '@/Hooks/useNavigation';

const { goBack } = useNavigation();

const handleBack = () => {
  goBack('/booking'); // Fallback URL
};
```

### Step 3: For Multi-Step Flows (Optional)

If you want to enforce step order in booking flows:

```tsx
const handleBack = () => {
  // For booking flows, you might want to go to previous step in flow
  // rather than browser history
  const previousStep = {
    'doctor-time': '/booking/doctor/patient',
    'confirm': '/booking/doctor/doctor-time',
  }[currentStep];

  router.get(previousStep || '/booking');
};
```

## Testing Checklist

After implementing the fix:

- [ ] Navigate: Home → Appointments → Booking → Press Back
  - Should go to: Appointments (not always Home)

- [ ] Navigate: Dashboard → Family → Booking → Press Back
  - Should go to: Family (not Dashboard)

- [ ] Direct URL: Type `/booking/doctor/patient` → Press Back
  - Should go to: /booking (fallback)

- [ ] Multi-step: Booking Step 1 → Step 2 → Step 3 → Press Back
  - Should go to: Step 2 (previous step)

- [ ] Browser Back Button: Should work same as UI back button

## Which Approach for Your App?

**Recommended**: **Option 2 (Smart Back with Fallback)**

Why:
- Respects user's actual navigation
- Handles direct URL navigation
- Works with browser back button
- Maintains booking flow integrity
