# Manual Testing Guide - Booking Flow with State Machine

## Prerequisites

Servers must be running:
- Laravel: `php artisan serve --port=3000`
- Vite: `npm run dev`

Access the app at: **http://localhost:3000/booking**

## Test Scenarios

### ✅ Scenario 1: Booking with Date (Skips Urgency)

**Test**: "book appointment for me on Feb 5"

**Expected Flow**:
1. Shows patient selector → Select "Yourself"
2. Shows appointment type → Select "New Consultation"
3. **SKIPS urgency** (because date provided)
4. Shows doctors with Feb 5 selected
5. Select doctor → Select time → Select mode → Summary

**What to Verify**:
- Urgency selector is NOT shown
- Date "Feb 5" is pre-selected in doctor list
- No JSON visible in messages
- Smooth flow to summary

---

### ✅ Scenario 2: Followup Flow Sequence

**Test**: "book a followup"

**Expected Flow**:
1. Shows patient selector → Select "Yourself"
2. Shows appointment type → Select "Follow-up Visit"
3. Shows followup reason → Select "Scheduled follow-up"
4. Shows text message asking for notes (type "skip" or provide notes)
5. Shows previous doctors list
6. Select doctor → Select time → Select mode → Summary

**What to Verify**:
- Followup reason appears
- Notes prompt allows skip
- Previous doctors shown before full list
- Correct sequence maintained
- No JSON in messages

---

### ✅ Scenario 3: Mid-Flow Changes

**Test**: Start booking, then say "actually make it in-person"

**Steps**:
1. Start: "book appointment for me"
2. Select patient, type, urgency, doctor, time
3. Before selecting mode, type: "actually make it in-person"

**Expected**:
- AI extracts `consultation_mode: in_person`
- Flow continues to summary
- In-person mode is selected
- Price shows 1200 (in-person fee)

**What to Verify**:
- Mode change is understood mid-flow
- Correct fee displayed
- No duplicate components

---

### ✅ Scenario 4: Cancel Command

**Test**: "cancel" at any point

**Steps**:
1. Start booking flow
2. At any step, type: "cancel"

**Expected**:
- Conversation status = 'cancelled'
- Booking UI removed
- Message confirms cancellation
- Can start new booking

**What to Verify**:
- UI clears immediately
- No orphaned components
- Clean state for new booking

---

### ✅ Scenario 5: Complete Flow (No JSON Visible)

**Test**: Complete full booking from start to payment

**Steps**:
1. "book appointment for me"
2. Select all options via UI
3. Confirm booking
4. Check all messages

**Expected**:
- All messages are human-readable
- No `{` or `[{` in message content
- No raw JSON objects displayed
- Summary shows clean data

**What to Verify**:
- Display messages use `display_message` field
- No JSON serialization visible
- All fields have proper labels
- Smooth UX throughout

---

### ✅ Scenario 6: Urgency NOT Shown with Date

**Test**: "book appointment for myself on February 10th"

**Expected Flow**:
1. Patient selector (if not extracted) OR appointment type
2. Select "New Consultation"
3. **SKIPS urgency** (goes straight to doctor selector)
4. February 10 is pre-selected

**What to Verify**:
- Urgency selector never appears
- Date extraction works
- State machine logic correct
- No re-asking of completed fields

---

### ✅ Scenario 7: Fields Not Re-Asked

**Test**: Provide partial info, verify flow doesn't re-ask

**Steps**:
1. "book appointment for me tomorrow at 9am"
2. AI should extract: patient (self), date (tomorrow), time (9am)
3. Flow should ask for: appointment type → doctor → mode

**Expected**:
- Does NOT ask for patient again
- Does NOT ask for date/time again
- Only asks for missing fields
- Deterministic progression

**What to Verify**:
- State machine prevents re-asking
- Collected data persists
- Flow is efficient
- User not annoyed by repetition

---

### ✅ Scenario 8: Context Switching

**Test**: Mid-booking, ask health question

**Steps**:
1. Start booking: "book appointment for me"
2. Mid-flow: "what are symptoms of flu?"
3. Then continue: "continue booking"

**Expected**:
- AI answers question
- Booking flow maintained
- Can return to booking
- No data lost

**What to Verify**:
- Conversation stays active
- Context preserved
- Flexible system
- User can multi-task

---

### ✅ Scenario 9: Booking from Pill

**Test**: Click "Book Doctor" pill below chatbox

**Expected**:
- Immediately shows patient selector
- Pre-filled context (booking_type: doctor)
- Clean start to flow

**What to Verify**:
- Pill trigger works
- Context set correctly
- UI appears instantly

---

### ✅ Scenario 10: Dynamic UI Updates

**Test**: Provide info via chat during UI selection

**Steps**:
1. Flow shows doctor selector
2. Instead of clicking, type: "I want Dr. Sarah Johnson at 9am"

**Expected**:
- AI extracts doctor + time
- UI updates dynamically
- Skips to next step (mode selection)

**What to Verify**:
- Chat and UI work together
- Smart extraction
- Flow doesn't break
- Seamless integration

---

## Common Issues to Check

### 🚫 Issues That Should NOT Occur

1. **JSON in Messages**:
   - ❌ `{"doctor_id": 1, "name": "Dr. Sarah"}`
   - ✅ "Dr. Sarah Johnson"

2. **Re-Asking Completed Fields**:
   - ❌ "Who is this appointment for?" (asked twice)
   - ✅ Asks once, remembers answer

3. **Urgency When Date Provided**:
   - ❌ Shows urgency selector despite date
   - ✅ Skips urgency, goes to doctor

4. **Stuck Flow**:
   - ❌ Same question repeated infinitely
   - ✅ Deterministic progression

5. **Missing Display Messages**:
   - ❌ Raw field values in chat
   - ✅ Human-readable labels

---

## Debug Tools

### Check Laravel Logs

```bash
tail -f storage/logs/laravel.log | grep "🎰 State Machine"
```

**What to Look For**:
- State transitions
- Current state
- Missing fields
- Completeness percentage

### Check Network Tab

1. Open DevTools → Network
2. Look for `/booking/{id}/message` requests
3. Verify response structure:
   ```json
   {
     "status": "success",
     "state": "doctor_selection",
     "message": "Here are doctors available...",
     "component_type": "date_doctor_selector",
     "component_data": {...},
     "ready_to_book": false
   }
   ```

### Check Console for Errors

- No React errors
- No network errors
- No state update warnings

---

## Success Criteria

✅ All 10 scenarios pass
✅ No JSON visible anywhere
✅ Fields not re-asked
✅ Urgency skipped with date
✅ Followup sequence correct
✅ Cancel works
✅ Mid-flow changes work
✅ Context maintained
✅ UI updates dynamically
✅ Smooth UX throughout

---

## Reporting Issues

If any scenario fails:

1. **Note the exact steps** to reproduce
2. **Check Laravel logs** for state machine output
3. **Check browser console** for JS errors
4. **Check network tab** for API responses
5. **Screenshot** the issue
6. **Document** the conversation ID for debugging

---

## Post-Testing Cleanup

After testing:
- Check database for orphaned conversations
- Clear test data if needed
- Review logs for warnings
- Document any edge cases found

---

**Ready to test!** Access http://localhost:3000/booking and follow the scenarios above.
