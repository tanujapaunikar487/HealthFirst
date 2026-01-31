# Browser Testing Checklist - Quick Reference

## System Status: ✅ ALL READY

- ✅ Laravel server running (port 3000)
- ✅ Vite dev server running (port 5173)
- ✅ Ollama running (port 11434)

---

## Test URL
**http://localhost:3000/booking/**

Click "Book Doctor Appointment" to start

---

## Quick Test Sequence

### 1️⃣ Test: Simple Greeting
**Type**: `hi`

**Expected**:
- ✅ Friendly greeting response
- ✅ Offers to help
- ✅ **NO UI component**

**Example**: "Hello! How can I help you today?"

---

### 2️⃣ Test: Symptom-Based Booking
**Type**: `My daughter has had a headache for 2 days and some dizziness`

**Expected**:
- ✅ Empathetic response
- ✅ Mentions "daughter"
- ✅ References symptoms
- ✅ References "2 days"
- ✅ **Shows patient selector**

**Example**: "I'm sorry to hear about your daughter's symptoms. Headaches and dizziness lasting 2 days should be checked..."

---

### 3️⃣ Test: Direct Booking
**Type**: `I want to book an appointment`

**Expected**:
- ✅ Natural acknowledgment
- ✅ **Shows patient selector**

---

### 4️⃣ Test: Question
**Type**: `What doctors do you have?`

**Expected**:
- ✅ Natural response
- ✅ **NO forced UI** (unless contextually appropriate)

---

### 5️⃣ Test: Date/Time
**Type**: `Can I see a doctor tomorrow at 2pm?`

**Expected**:
- ✅ Natural response
- ✅ Date parsed correctly
- ✅ Time parsed correctly

---

## What Success Looks Like

### ✅ Good Signs:
- Natural, conversational responses
- No UI after greetings/questions
- UI appears for booking decisions
- AI references specific details (symptoms, relations)
- Smooth conversation flow

### ❌ Bad Signs:
- UI after every message
- Generic "Who is this appointment for?" without context
- Ignoring symptoms or patient relations
- Error messages
- Slow responses (>15 seconds)

---

## If Something's Wrong

### Check Logs:
```bash
tail -f storage/logs/laravel.log | grep "Hybrid\|Intent"
```

### Restart Servers:
```bash
# Kill servers
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

# Restart
php artisan serve --port=3000
npm run dev
```

### Clear Cache:
```bash
php artisan cache:clear
php artisan config:clear
```

---

## Conversation Flow Example

```
You: "hi"
AI: "Hello! How can I help you today?"
[NO UI]

You: "My daughter has a headache for 2 days"
AI: "I'm sorry to hear about your daughter. Let me help you book..."
[SHOWS patient selector]

You: [Clicks "daughter"]
AI: "Got it. How urgent is this?"
[SHOWS urgency selector]
```

---

## Expected Behavior Summary

| User Input | AI Response Type | UI Component |
|------------|------------------|--------------|
| "hi" | Friendly greeting | None |
| "My daughter has headache" | Empathetic + symptom acknowledgment | patient_selector |
| "I want to book" | Acknowledgment | patient_selector |
| "What doctors available?" | Informational | None/Contextual |
| "Tomorrow at 2pm" | Acknowledgment + date/time | Contextual |

---

## Key Points

1. **NO UI after greetings** - This is correct behavior
2. **NO UI after simple questions** - This is correct behavior
3. **UI appears for booking decisions** - patient selector, doctor list, etc.
4. **AI should reference specific details** - symptoms, relations, durations
5. **Responses should be natural** - not template-like

---

## Documentation Reference

For more details:
- `FINAL_IMPLEMENTATION_STATUS.md` - Complete system overview
- `TEST_IN_BROWSER.md` - Detailed testing instructions
- `TESTING_GUIDE.md` - Comprehensive testing guide
- `AI_CONTEXT_IMPROVEMENT.md` - How context-aware AI works

---

**Ready to Test!** 🚀

Open http://localhost:3000/booking/ and start with "hi"
