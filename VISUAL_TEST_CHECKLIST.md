# 📋 Visual Testing Checklist - Intelligent Booking Flow

**Print this and check boxes as you test! ✅**

---

## 🎯 Quick Validation (5 minutes)

### Happy Path Test
- [ ] Type: "I want to see a doctor"
- [ ] Patient selector appears
- [ ] Select "Yourself" works
- [ ] Appointment type selector appears
- [ ] Select "New Appointment" works
- [ ] Urgency selector appears
- [ ] Select "This Week" works
- [ ] Doctor cards appear with dates
- [ ] Select doctor + time works
- [ ] Mode selector appears
- [ ] Select "Video Appointment" works
- [ ] Summary shows all correct info
- [ ] Confirm button works

**Pass Criteria**: All 13 steps complete without errors ✅

---

## 🔄 Critical Flows (10 minutes)

### Flow Switch Test
- [ ] Start: "book a doctor"
- [ ] Select patient
- [ ] Type: "actually I need a lab test"
- [ ] Patient selection preserved?
- [ ] UI switches to lab test?
- [ ] No errors in console?

### Cancellation Test
- [ ] Start any booking flow
- [ ] Type: "cancel"
- [ ] Shows: "No problem! Booking cancelled..."
- [ ] All UI components hidden?
- [ ] Input disabled?
- [ ] Submit button greyed out?
- [ ] Can still see chat history?

### Patient Change Test
- [ ] Complete patient + type + urgency
- [ ] Type: "this is for my mother"
- [ ] Patient updates?
- [ ] Flow continues (no restart)?
- [ ] Doctor list still visible?

### Date Update Test
- [ ] Select "This Week"
- [ ] See doctor list
- [ ] Type: "show me for February 10"
- [ ] Doctor list updates in place?
- [ ] No duplicate components?
- [ ] Date pills update?

---

## 💬 Natural Language (5 minutes)

### Test These Phrases

**Doctor Booking**:
- [ ] "I'm not feeling well"
- [ ] "Can I see a doctor?"
- [ ] "Need an appointment"

**Cancellation**:
- [ ] "cancel"
- [ ] "never mind"
- [ ] "forget it"

**Dates**:
- [ ] "tomorrow"
- [ ] "next Monday"
- [ ] "February 14"

**All trigger correct actions?** ✅

---

## 🎨 UI/UX Validation

### Visual Elements
- [ ] AI blob visible initially
- [ ] Messages appear smoothly
- [ ] Loading dots show when processing
- [ ] Components don't flicker
- [ ] Scroll works smoothly
- [ ] Mobile responsive (test on phone)

### Interactive Elements
- [ ] All buttons clickable
- [ ] Input field focusable
- [ ] Tab navigation works
- [ ] Hover states visible
- [ ] Selected state clear
- [ ] Disabled state greyed out

### Styling
- [ ] Patient cards look good
- [ ] Doctor cards properly formatted
- [ ] Date pills styled correctly
- [ ] Summary layout clean
- [ ] Messages readable
- [ ] No layout breaks

---

## 🐛 Edge Cases (5 minutes)

### Test These Scenarios

**Multiple Info**:
- [ ] Type: "new appointment for my father next Tuesday"
- [ ] Extracts: type, patient, date?

**Ambiguous Input**:
- [ ] Type: "maybe sometime"
- [ ] Asks for clarification?

**Invalid Date**:
- [ ] Type: "last week"
- [ ] Politely corrects?

**Context Reference**:
- [ ] See doctor list
- [ ] Type: "the first one"
- [ ] Selects first doctor?

---

## 📊 Follow-up Flow (5 minutes)

### Test Each Reason

**Scheduled Follow-up**:
- [ ] Select "Scheduled follow-up"
- [ ] Message: "Got it. Any updates..."
- [ ] "You can also skip this" included?
- [ ] Skip button works?

**New Concern**:
- [ ] Select "New concern"
- [ ] Message: "What new symptoms..."
- [ ] Appropriate tone?

**Ongoing Issue**:
- [ ] Select "Ongoing issue"
- [ ] Message: "I'm sorry to hear that..."
- [ ] Empathetic tone?
- [ ] Text saved correctly?

---

## 🔧 Summary Changes (3 minutes)

### Test Change Buttons

- [ ] Click "Change Doctor"
- [ ] Returns to doctor selection?
- [ ] Date/time preserved?

- [ ] Click "Change Mode"
- [ ] Mode selector appears?
- [ ] Price updates after selection?

- [ ] Type: "change to in-person"
- [ ] Mode updates?
- [ ] Price: ₹800 → ₹1200?

---

## ⚡ Performance Check (2 minutes)

### Measure Response Times

- [ ] AI response < 3 seconds
- [ ] UI updates instantly
- [ ] No lag when typing
- [ ] Smooth scrolling
- [ ] Quick component renders

### Check Network Tab
- [ ] No failed requests
- [ ] API calls < 2 seconds
- [ ] No unnecessary requests

---

## 🔍 Browser Console Check (Ongoing)

### During ALL Tests

**Console Tab**:
- [ ] No red errors
- [ ] No yellow warnings (React)
- [ ] Intent logs visible
- [ ] State machine logs visible

**Network Tab**:
- [ ] No 500 errors
- [ ] No 404 errors
- [ ] Groq API succeeds

---

## 📱 Device Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Devices
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Tablet (iPad/Android)

### Responsive Breakpoints
- [ ] 320px (mobile)
- [ ] 768px (tablet)
- [ ] 1024px (desktop)
- [ ] 1440px+ (large desktop)

---

## 🎯 Pass/Fail Summary

### Automated Tests
- [ ] Run: `php artisan test --filter BookingFlowIntelligenceTest`
- [ ] Result: ____ / 13 tests passing
- [ ] Minimum: 13/13 required ✅

### Manual Tests
- [ ] Happy Path: PASS / FAIL
- [ ] Flow Switch: PASS / FAIL
- [ ] Cancellation: PASS / FAIL
- [ ] Patient Change: PASS / FAIL
- [ ] Date Update: PASS / FAIL
- [ ] Natural Language: PASS / FAIL
- [ ] Follow-up Flow: PASS / FAIL
- [ ] Summary Changes: PASS / FAIL
- [ ] Edge Cases: PASS / FAIL

**Pass Rate**: ____ / 9 tests

**Minimum Required**: 8/9 (89%) ✅

---

## 🚨 Critical Blockers (Must Fix Before Deploy)

- [ ] No data loss on refresh
- [ ] Cancellation works at all stages
- [ ] Flow switching preserves context
- [ ] No JavaScript errors
- [ ] AI responds < 3 seconds
- [ ] Summary changes work
- [ ] Mobile responsive

**All checked?** → Ready to deploy ✅

---

## 📝 Notes Section

**Issues Found**:
1. ________________________________
2. ________________________________
3. ________________________________

**AI Misunderstandings**:
1. ________________________________
2. ________________________________

**UX Friction Points**:
1. ________________________________
2. ________________________________

**Performance Concerns**:
1. ________________________________
2. ________________________________

---

## ✅ Final Sign-Off

**Tested By**: _______________________

**Date**: _______________________

**Environment**: Local / Staging / Production

**Overall Status**: PASS / FAIL

**Ready for Deployment**: YES / NO

**Notes**:
________________________________
________________________________
________________________________

---

**Signature**: _______________________

---

## 🎯 Quick Reference

### Start Testing
```bash
# Terminal 1: Laravel
php artisan serve --port=3000

# Terminal 2: Vite
npm run dev

# Terminal 3: Logs
tail -f storage/logs/laravel.log

# Browser
http://localhost:3000/booking
```

### Run Automated Tests
```bash
php artisan test --filter BookingFlowIntelligenceTest
```

### Check Database
```sql
SELECT * FROM booking_conversations
ORDER BY created_at DESC LIMIT 1;
```

### Common Test Phrases
- "I want to see a doctor"
- "cancel"
- "show me for February 10"
- "actually this is for my mother"
- "change to in-person"

---

**Print this checklist and keep it at your desk for quick testing!** 📋✨
