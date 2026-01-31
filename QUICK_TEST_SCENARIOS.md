# Quick Test Scenarios - Intelligent Booking Flow

**Quick Reference for Manual Testing**

---

## 🚀 Quick Start Test (2 minutes)

### Happy Path - Complete Booking
```
1. "I want to see a doctor"
2. Select "Yourself"
3. Select "New Appointment"
4. Select "This Week"
5. Click doctor + time slot
6. Select "Video Appointment"
7. Verify summary
8. Click "Confirm Booking"
```

**Expected**: Smooth flow, no errors, booking created ✅

---

## 🔄 Critical Flow Tests (10 minutes)

### 1. Flow Switch Test
```
Start: "book a doctor"
Patient: "Yourself"
Type: "New Appointment"
Switch: "actually I need a lab test"
```
**Verify**: Patient selection preserved, shows lab test UI ✅

---

### 2. Cancellation Test
```
Start booking → Select patient → Type: "cancel"
```
**Verify**:
- Message: "No problem! Booking cancelled..."
- All UI components hidden
- Input disabled with "Booking cancelled"
- Submit button greyed out ✅

---

### 3. Patient Change Mid-Flow
```
Start booking → Select "Yourself" → Select type → Select urgency
Then type: "actually this is for my mother"
```
**Verify**: Patient updates, flow continues, no restart ✅

---

### 4. Date Update (Dynamic UI)
```
Complete patient → type → urgency "This Week"
See doctor list
Type: "show me doctors for February 10"
```
**Verify**: Doctor list updates in place, no duplicate components ✅

---

### 5. Follow-up with Notes
```
Start: "follow-up appointment"
Select patient
Select: "Ongoing issue"
Check message: "I'm sorry to hear that. Can you describe..."
Type: "still having headaches"
```
**Verify**: Empathetic message, notes saved, moves to previous doctors ✅

---

### 6. Summary Change
```
Complete entire flow to summary
At summary, type: "change to in-person"
```
**Verify**: Mode updates, price changes ₹800→₹1200, summary refreshes ✅

---

## 💬 Natural Language Tests (5 minutes)

### Test Various Phrasings

**Doctor Booking**:
- "I'm not feeling well"
- "Can I book a doctor?"
- "Need to see a physician"
- "Doctor appointment please"

**All should** → Start doctor booking flow ✅

---

**Cancellation**:
- "cancel"
- "never mind"
- "forget it"
- "I don't want to book"

**All should** → Cancel booking ✅

---

**Date Input**:
- "tomorrow"
- "next Monday"
- "February 14"
- "25 Dec evening"

**All should** → Parse date correctly ✅

---

## 🐛 Edge Case Tests (5 minutes)

### 1. Multiple Info in One Message
```
Type: "Book a new appointment for my father next Tuesday morning"
```
**Verify**: Extracts patient, type, date, time preference ✅

---

### 2. Ambiguous Input
```
At urgency step, type: "maybe sometime"
```
**Verify**: Asks for clarification, re-shows options ✅

---

### 3. Invalid Date
```
Type: "I want appointment for last week"
```
**Verify**: Polite correction, asks for valid future date ✅

---

### 4. Context Reference
```
At doctor list, type: "I'll take the first one"
```
**Verify**: Selects first doctor in list ✅

---

## 📊 Quick Verification Checklist

### After Each Test, Check:

**Browser Console**:
- [ ] No JavaScript errors
- [ ] No React warnings

**Network Tab**:
- [ ] No 500 errors
- [ ] API responses <3 seconds

**UI Behavior**:
- [ ] Smooth transitions (no flicker)
- [ ] Components update (not duplicate)
- [ ] Loading states show when appropriate

**Laravel Logs**:
```bash
tail -f storage/logs/laravel.log | grep -E "INFO|ERROR"
```
- [ ] Intent classification succeeds
- [ ] Entity extraction accurate
- [ ] State machine transitions logged
- [ ] No PHP errors

---

## 🎯 Pass/Fail Criteria

### ✅ PASS if:
- AI understands natural language (>90% accuracy)
- Flow switches preserve context (100%)
- UI updates dynamically without refresh
- Cancellation works at any stage
- No data loss on refresh
- Response time <3 seconds

### ❌ FAIL if:
- AI misunderstands simple requests
- Data lost when switching flows
- Components duplicate instead of update
- Cancellation doesn't remove UI
- Errors in browser console
- Page requires refresh to update

---

## 🚨 Common Issues & Quick Fixes

### Issue: "AI not detecting intent"
**Check**: Groq API key in `.env`
**Fix**: `AI_PROVIDER=groq` and valid `GROQ_API_KEY`

---

### Issue: "Components not showing"
**Check**: Browser console for React errors
**Fix**: Clear cache, restart Vite: `npm run dev`

---

### Issue: "Data not persisting"
**Check**: Database connection
**Fix**: `php artisan migrate:fresh --seed`

---

### Issue: "Slow AI responses"
**Check**: Network tab, Groq API response time
**Expected**: <2 seconds per request

---

## 📝 Test Report Template

```
Date: _______
Tester: _______
Environment: Local / Staging / Production

Test Results:
[ ] Happy Path - Complete Booking
[ ] Flow Switch Test
[ ] Cancellation Test
[ ] Patient Change Mid-Flow
[ ] Date Update (Dynamic UI)
[ ] Follow-up with Notes
[ ] Summary Change
[ ] Natural Language Tests
[ ] Edge Case Tests

Pass Rate: ____ / 9 tests

Critical Issues Found:
1. _______________________
2. _______________________

AI Accuracy: ____%
Average Response Time: ___ seconds

Notes:
_______________________
_______________________
```

---

## 🎬 Video Test Recording Checklist

When recording test sessions:

1. **Start with**: Browser window, DevTools Console open
2. **Show**: Each user input clearly
3. **Highlight**: AI responses and UI changes
4. **Capture**: Any errors or unexpected behavior
5. **End with**: Summary view or cancellation confirmation

---

## ⚡ Speed Test (30 seconds each)

### Test A: Fastest Complete Booking
```
"book doctor" → Click Yourself → Click New → Click This Week → Click first doctor + time → Click Video → Confirm
```
**Goal**: <30 seconds total

---

### Test B: Fastest Cancellation
```
"book doctor" → Click Yourself → "cancel"
```
**Goal**: <5 seconds, UI cleared immediately

---

### Test C: Fastest Flow Switch
```
"book doctor" → Click Yourself → "I need a lab test instead"
```
**Goal**: <3 seconds, UI switches smoothly

---

## 🔍 Deep Dive Tests (When Issues Found)

### If AI Misunderstands:
1. Check `INTENT_CLASSIFICATION_PROMPT_FINAL.txt`
2. Review AI response in logs: `"Intent classification raw response"`
3. Test with explicit phrases
4. Document edge cases

### If UI Doesn't Update:
1. Check React DevTools component tree
2. Verify `conversation.collected_data` in browser
3. Check for duplicate keys in message list
4. Review component deduplication logs

### If Data Lost:
1. Check database: `SELECT * FROM booking_conversations WHERE id='...'`
2. Review `collected_data` JSON column
3. Check for state machine issues in logs
4. Verify merge logic in `mergeEntities()`

---

**Pro Tip**: Run Quick Start Test before and after any code changes to catch regressions early! 🎯
