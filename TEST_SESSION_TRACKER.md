# Test Session Tracker - Browser Testing

**Date**: 2026-01-31
**Tester**: [Your Name]
**Groq Status**: ✅ Active (confirmed)

---

## Test 1: New Appointment Flow (Complete)

### Steps
1. [ ] Open http://localhost:3000/booking in browser
2. [ ] Type: "book appointment"
3. [ ] Verify patient selector appears
4. [ ] Select "Yourself"
5. [ ] Verify appointment type selector appears
6. [ ] Select "New Appointment"
7. [ ] Verify urgency selector appears
8. [ ] Select "This Week"
9. [ ] Verify doctor cards with date pills appear
10. [ ] Click a doctor and time slot
11. [ ] Verify mode selector appears
12. [ ] Select "Video Appointment" (₹800)
13. [ ] Verify summary shows all details correctly
14. [ ] Click "Confirm Booking"
15. [ ] Verify redirects to payment/confirmation

### Expected Results
- [ ] All selectors appear in correct order
- [ ] No duplicate components
- [ ] Smooth transitions between steps
- [ ] Summary shows: Patient, Type (New), Doctor, Date, Time, Mode (Video), Fee (₹800)
- [ ] No JavaScript errors in console

### Notes
```
Groq Response Times: ______
Any UI Issues: ______
Console Errors: ______
```

---

## Test 2: Follow-up Flow with Notes

### Steps
1. [ ] Fresh conversation (refresh page)
2. [ ] Type: "book a followup for me"
3. [ ] Verify patient selector appears OR skipped (AI should extract "me")
4. [ ] Verify appointment type selector OR moves to follow-up reason
5. [ ] Select "Ongoing issue"
6. [ ] **CRITICAL**: Verify exact message appears:
   > "I'm sorry to hear that. Can you describe what's still bothering you? This will help the doctor prepare for your visit. You can also skip this."
7. [ ] Type some notes (e.g., "headaches still happening")
8. [ ] Verify acknowledgment: "Thanks for sharing that. The doctor will review this before your appointment."
9. [ ] Verify previous doctors component appears
10. [ ] Complete booking flow

### Expected Results - EXACT TEXT CHECK ✅
- [ ] "I'm sorry to hear that" - present?
- [ ] "Can you describe what's still bothering you?" - exact?
- [ ] "This will help the doctor prepare for your visit" - exact?
- [ ] "You can also skip this" - exact? (NOT "by typing 'skip'")
- [ ] Skip button visible
- [ ] Notes saved correctly

### Notes
```
Message Match: YES / NO
Exact Text: ______
Any Deviations: ______
```

---

## Test 3: Multi-Entity Extraction (Smart Booking)

### Steps
1. [ ] Fresh conversation
2. [ ] Type: "book appointment for me on Feb 10"
3. [ ] Verify AI extracts:
   - patient: "me" / "self"
   - date: "Feb 10" / "2026-02-10"
4. [ ] Verify it skips patient selector (already extracted)
5. [ ] Verify it skips urgency selector (date already known)
6. [ ] Verify shows appointment type selector directly
7. [ ] Complete flow

### Expected Results
- [ ] Patient selector skipped
- [ ] Urgency selector skipped
- [ ] Starts at appointment type or doctor selection
- [ ] Date "Feb 10" / "2026-02-10" pre-filled
- [ ] Doctor list shows availability for Feb 10

### Notes
```
Entities Extracted: ______
Steps Skipped: ______
Flow Started At: ______
```

---

## Test 4: Summary Change (Mode Switch)

### Steps
1. [ ] Complete flow to summary with "Video Appointment" (₹800)
2. [ ] At summary, type: "change to video" or "make it in-person"
3. [ ] Verify mode updates
4. [ ] Verify price updates: ₹800 → ₹1200 (or vice versa)
5. [ ] Verify summary refreshes (NOT duplicates)
6. [ ] Verify all other details preserved

### Expected Results
- [ ] Mode updates immediately
- [ ] Price changes correctly
- [ ] Summary refreshes in place
- [ ] No duplicate summary components
- [ ] Doctor, date, time still correct

### Notes
```
Mode Change: ______
Price Update: ______
Duplicates?: YES / NO
```

---

## Test 5: Cancellation

### Steps
1. [ ] Start any booking flow
2. [ ] Progress to urgency selection
3. [ ] Type: "cancel"
4. [ ] Verify cancellation message: "No problem! Booking cancelled. Let me know if you need anything else."
5. [ ] Verify all UI components disappear
6. [ ] Verify input field disabled with "Booking cancelled" placeholder
7. [ ] Verify submit button greyed out
8. [ ] Verify chat history still visible

### Expected Results
- [ ] Cancellation message shows
- [ ] Patient selector hidden
- [ ] Urgency selector hidden
- [ ] Input disabled
- [ ] Submit button grey (#E5E7EB)
- [ ] Previous messages still visible

### Notes
```
UI Hidden?: YES / NO
Input Disabled?: YES / NO
History Preserved?: YES / NO
```

---

## Test 6: Follow-up Reason Variations

### Test Each Reason for EXACT Text

#### 6a. Scheduled Follow-up
1. [ ] Start follow-up flow
2. [ ] Select "Scheduled follow-up"
3. [ ] Verify message: "Got it. Any updates you'd like to share with the doctor? This will help the doctor prepare for your visit. You can also skip this."
4. [ ] Click "Skip"
5. [ ] Verify: "No problem. Would you like to book with [Doctor] again?"

**Exact Text Match**: [ ] YES / [ ] NO

#### 6b. New Concern
1. [ ] Start follow-up flow
2. [ ] Select "New concern"
3. [ ] Verify message: "What new symptoms or changes have you noticed? This will help the doctor prepare for your visit. You can also skip this."

**Exact Text Match**: [ ] YES / [ ] NO

#### 6c. Ongoing Issue (already tested in Test 2)
- [x] Tested in Test 2

---

## Test 7: Date Update (Dynamic UI)

### Steps
1. [ ] Progress to doctor selection with "This Week"
2. [ ] See doctor list for current week
3. [ ] Type: "show me doctors for February 15"
4. [ ] Verify doctor list updates in place (no duplicate)
5. [ ] Verify date pills update
6. [ ] Verify "Feb 15" is selected/highlighted

### Expected Results
- [ ] Doctor list updates (doesn't duplicate)
- [ ] Date pills refresh
- [ ] Feb 15 highlighted
- [ ] Log shows: "Component Deduplication: Updating existing component"

### Check Logs
```bash
tail -f storage/logs/laravel.log | grep "Component Deduplication"
```

**Log Found**: [ ] YES / [ ] NO

---

## Browser Console Checks

### During ALL Tests - Keep Console Open

**React/TypeScript Errors**:
- [ ] No red errors
- [ ] No yellow warnings
- [ ] Component renders clean

**Network Tab**:
- [ ] All API calls succeed (200 status)
- [ ] No 500 errors
- [ ] Groq API responses < 2 seconds

**Performance**:
- [ ] Page loads < 2 seconds
- [ ] AI responses < 3 seconds
- [ ] Smooth scrolling
- [ ] No lag when typing

---

## Issues Found

### Critical Issues (Blocking)
1. ________________________________
2. ________________________________

### Major Issues (Should Fix)
1. ________________________________
2. ________________________________

### Minor Issues (Nice to Have)
1. ________________________________
2. ________________________________

---

## AI Performance Metrics

**From Laravel Logs**:
```bash
tail -100 storage/logs/laravel.log | grep "Groq API Response"
```

| Test | Response Time | Confidence | Entities Extracted |
|------|---------------|------------|-------------------|
| Test 1 | ____ sec | ____ | ____ |
| Test 2 | ____ sec | ____ | ____ |
| Test 3 | ____ sec | ____ | ____ |
| Test 4 | ____ sec | ____ | ____ |
| Test 5 | ____ sec | ____ | ____ |

**Average Response Time**: ______
**Average Confidence**: ______

---

## Final Summary

**Tests Passed**: ____ / 7
**Critical Issues**: ____
**AI Performance**: ⚡ Fast / 🐌 Slow / ❌ Failed
**Overall Status**: ✅ PASS / ⚠️ ISSUES / ❌ FAIL

**Ready for Production**: [ ] YES / [ ] NO

---

## Next Steps

1. [ ] Fix critical issues
2. [ ] Re-test failed scenarios
3. [ ] Document AI misunderstandings
4. [ ] Update test scripts if needed
5. [ ] Sign off if passing

**Tester Signature**: ________________
**Date**: ________________
