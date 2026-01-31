# Booking Flow Test Scenarios

## Overview
This document outlines test scenarios to validate the intelligent, flexible booking system that adapts to user intent without rigid rules.

---

## Test Category 1: Natural Conversation Initiation

### Test 1.1: Starting from Entry Page Chatbox
**Steps:**
1. Navigate to `/booking`
2. Type in chatbox: "I have a headache and need to see a doctor"
3. Click submit

**Expected Behavior:**
- AI recognizes doctor booking intent
- Asks "Who is this appointment for?" with patient selector UI
- Shows thinking steps during analysis
- Progress bar shows initial progress (16%)

**Success Criteria:**
- ✅ Conversation starts without clicking "Book a doctor" pill
- ✅ Patient selector component appears
- ✅ AI message is contextual and friendly
- ✅ Progress bar reflects current state

---

### Test 1.2: Starting from "Book a doctor" Pill
**Steps:**
1. Navigate to `/booking`
2. Click "Book a doctor" pill button

**Expected Behavior:**
- Conversation starts immediately
- Shows patient selector
- AI asks "Who is this appointment for?"

**Success Criteria:**
- ✅ No initial message required from user
- ✅ Goes directly to patient selection step
- ✅ Progress bar shows 16%

---

### Test 1.3: Starting from "Book a test" Pill
**Steps:**
1. Navigate to `/booking`
2. Click "Book a test" pill button

**Expected Behavior:**
- Conversation starts for lab test booking
- AI asks about test type or who needs the test
- Different flow than doctor booking

**Success Criteria:**
- ✅ Lab test flow initiated
- ✅ Different questions than doctor flow
- ✅ Progress bar shows appropriate state

---

## Test Category 2: Voice Input Integration

### Test 2.1: Voice Booking Initiation (Entry Page)
**Steps:**
1. Navigate to `/booking`
2. Click microphone button
3. Say: "Book a doctor appointment for tomorrow morning"
4. Click checkmark to submit

**Expected Behavior:**
- Audio waveform shows during recording
- Transcription converts speech to text
- Text appears in input field
- Booking starts with recognized intent (doctor + date)

**Success Criteria:**
- ✅ Waveform animation visible during recording
- ✅ X (cancel) and ✓ (submit) buttons appear
- ✅ Transcription is accurate
- ✅ AI extracts both intent and date entity
- ✅ Progress updates to reflect captured date

---

### Test 2.2: Voice Input Mid-Conversation
**Steps:**
1. Start a booking conversation (any method)
2. When AI asks a question, click microphone
3. Say your response
4. Submit recording

**Expected Behavior:**
- Recording works within conversation
- Response is transcribed and sent automatically
- AI processes the voice response contextually

**Success Criteria:**
- ✅ Voice input works at any conversation step
- ✅ Auto-submits after transcription
- ✅ AI understands context from previous messages

---

## Test Category 3: Context Switching & Flow Changes

### Test 3.1: Switching from Doctor to Lab Test
**Steps:**
1. Start doctor booking: "Book a doctor"
2. Select patient: "Yourself"
3. Change mind: "Actually, I need a blood test instead"

**Expected Behavior:**
- AI recognizes intent change
- Asks for confirmation: "Would you like to switch to booking a lab test?"
- On confirmation, switches flow
- Resets or adapts collected data appropriately

**Success Criteria:**
- ✅ AI detects the switch request
- ✅ Doesn't silently switch without confirmation
- ✅ Patient selection carries over if applicable
- ✅ Progress bar resets to new flow
- ✅ No UI components from old flow remain

---

### Test 3.2: Cancelling Mid-Flow
**Steps:**
1. Start any booking flow
2. Answer 1-2 questions
3. Say: "Never mind, cancel this"

**Expected Behavior:**
- AI recognizes cancellation intent
- Confirms: "Are you sure you want to cancel?"
- On confirmation, cancels booking
- Removes all interactive UI components
- Shows friendly message with option to start over

**Success Criteria:**
- ✅ Cancellation is confirmed before executing
- ✅ All booking UI removed
- ✅ Conversation marked as cancelled
- ✅ Input disabled or shows "Booking cancelled" placeholder
- ✅ User can start fresh from `/booking`

---

### Test 3.3: Modifying Previous Answers
**Steps:**
1. Start doctor booking
2. Select patient: "Yourself"
3. Select specialization: "Cardiologist"
4. Say: "Wait, change the patient to my mother"

**Expected Behavior:**
- AI recognizes modification request
- Updates patient selection to "Mother"
- Asks if user wants to continue with cardiologist or restart
- Progress bar stays same or adjusts

**Success Criteria:**
- ✅ AI understands "change" intent
- ✅ Identifies which field to modify
- ✅ Updates collected_data correctly
- ✅ Offers to continue or restart flow
- ✅ Shows updated patient in UI if component re-renders

---

## Test Category 4: Dynamic UI Behavior

### Test 4.1: UI Appears When Relevant
**Steps:**
1. Start conversation: "I need help"
2. AI asks: "What can I help you with?"
3. Say: "Book an appointment"
4. AI shows patient selector

**Expected Behavior:**
- No UI shown initially (open-ended question)
- Patient selector appears only after intent is clear
- Component_type and component_data sent correctly

**Success Criteria:**
- ✅ UI doesn't appear prematurely
- ✅ Appears exactly when AI determines it's needed
- ✅ Correct component type rendered
- ✅ Component is interactive

---

### Test 4.2: UI Removed When No Longer Relevant
**Steps:**
1. Start booking, patient selector appears
2. Select patient
3. Next step (specialization) appears
4. Say: "Actually, cancel this"

**Expected Behavior:**
- After cancellation, all UI components disappear
- Only text messages remain
- Input field shows cancelled state or is disabled

**Success Criteria:**
- ✅ All interactive components removed
- ✅ Clean conversation history (text only)
- ✅ No orphaned UI elements

---

### Test 4.3: UI Updates Based on User Corrections
**Steps:**
1. Doctor booking flow
2. AI shows date/time picker
3. User types: "No wait, I need a lab test"

**Expected Behavior:**
- Date picker disappears
- Flow switches to lab test
- New appropriate UI appears (test selector)

**Success Criteria:**
- ✅ Old UI components hidden/removed
- ✅ New flow UI appears
- ✅ No visual glitches during transition

---

## Test Category 5: Multi-Entity Extraction

### Test 5.1: Multiple Entities in One Message
**Steps:**
1. Entry page chatbox
2. Type: "Book cardiologist appointment for my mother on Feb 15th at 3pm"

**Expected Behavior:**
- AI extracts: patient (mother), specialization (cardiologist), date (Feb 15), time (3pm)
- Skips already-answered questions
- Shows thinking: "Extracted 4 entities: patient, specialization, date, time"
- Asks next unanswered question or shows summary

**Success Criteria:**
- ✅ All 4 entities extracted correctly
- ✅ collected_data contains all values
- ✅ Progress bar jumps ahead appropriately
- ✅ AI asks only remaining questions
- ✅ Thinking steps show entity extraction

---

### Test 5.2: Partial Entity Extraction
**Steps:**
1. Type: "I need a doctor for my headache tomorrow"

**Expected Behavior:**
- Extracts: booking_type (doctor), symptom (headache), date (tomorrow)
- Still asks: patient selection, specialization, time
- Shows thinking: "Extracted 3 entities"

**Success Criteria:**
- ✅ Partial data captured
- ✅ AI asks for missing information
- ✅ Progress reflects completed steps

---

## Test Category 6: Ambiguity Handling

### Test 6.1: Ambiguous Patient Reference
**Steps:**
1. Type: "Book a doctor for him"

**Expected Behavior:**
- AI recognizes ambiguous pronoun
- Asks: "Who would you like to book this for?"
- Shows patient selector for clarity

**Success Criteria:**
- ✅ AI doesn't assume
- ✅ Asks for clarification
- ✅ Shows UI to resolve ambiguity

---

### Test 6.2: Ambiguous Date/Time
**Steps:**
1. Type: "Book appointment for next week"

**Expected Behavior:**
- AI accepts "next week" as valid date range
- Asks for specific day preference or shows calendar
- Stores approximate timeframe

**Success Criteria:**
- ✅ Doesn't reject vague input
- ✅ Asks for refinement
- ✅ Or shows calendar to pick specific day

---

### Test 6.3: Conflicting Information
**Steps:**
1. Select patient: "Yourself"
2. Later say: "This is for my father"

**Expected Behavior:**
- AI detects conflict
- Asks: "You previously selected 'Yourself'. Would you like to change to 'Father'?"
- Updates only after confirmation

**Success Criteria:**
- ✅ Conflict detected
- ✅ Confirmation requested
- ✅ Original value preserved until confirmed

---

## Test Category 7: Chain of Thought Visibility

### Test 7.1: Thinking Steps During Classification
**Steps:**
1. Type complex message: "My mother has chest pain and needs urgent cardiology consultation tomorrow morning"

**Expected Behavior:**
- Thinking indicator appears
- Shows steps:
  - "Processing your request..."
  - "Analyzing user intent: book_doctor"
  - "Extracted 4 entities: patient, symptom, specialization, urgency, date"
  - "Detected emergency situation ⚠️"
- Final response reflects urgency

**Success Criteria:**
- ✅ Thinking steps visible before response
- ✅ Steps appear sequentially with 300ms delay
- ✅ Emergency flag detected and shown
- ✅ Spinner → checkmark transition

---

### Test 7.2: No Thinking Steps for Simple Messages
**Steps:**
1. AI asks: "What time works best?"
2. Reply: "3pm"

**Expected Behavior:**
- Simple entity extraction
- Minimal or no thinking steps (implementation dependent)
- Fast response

**Success Criteria:**
- ✅ Response is quick
- ✅ Appropriate for simple input

---

## Test Category 8: Error Recovery

### Test 8.1: Invalid Date Input
**Steps:**
1. AI asks for date
2. Type: "Febuary 30th" (invalid date)

**Expected Behavior:**
- AI recognizes invalid date
- Politely asks for correction: "February 30th doesn't exist. Could you provide a valid date?"
- Doesn't crash or store invalid data

**Success Criteria:**
- ✅ Graceful error handling
- ✅ Helpful error message
- ✅ User can try again

---

### Test 8.2: Transcription Failure
**Steps:**
1. Click microphone
2. Record very unclear audio
3. Submit

**Expected Behavior:**
- Transcription returns empty or gibberish
- AI asks: "I didn't catch that. Could you try again or type your message?"
- Doesn't proceed with bad data

**Success Criteria:**
- ✅ Fails gracefully
- ✅ Offers alternative (typing)
- ✅ Doesn't break conversation

---

### Test 8.3: API Timeout/Failure
**Steps:**
1. Simulate network issue (DevTools throttling)
2. Send message

**Expected Behavior:**
- Shows loading state
- After timeout: "Something went wrong. Please try again."
- User can retry

**Success Criteria:**
- ✅ Error message displayed
- ✅ Conversation state preserved
- ✅ Retry works

---

## Test Category 9: Progress Tracking

### Test 9.1: Progress Bar Updates
**Steps:**
1. Start doctor booking (16%)
2. Select patient (33%)
3. Select specialization (50%)
4. Select date (66%)
5. Select time (83%)
6. Confirm (100%)

**Expected Behavior:**
- Progress bar smoothly animates between states
- Percentage accurate to state machine
- Color/style consistent

**Success Criteria:**
- ✅ Percentages match expected values
- ✅ Smooth animations
- ✅ Visible at all times

---

### Test 9.2: Progress with Skipped Steps
**Steps:**
1. Type: "Book cardiologist for mother tomorrow at 2pm"
2. Check progress

**Expected Behavior:**
- Progress jumps to ~66-83% (most fields filled)
- Reflects actual completion accurately

**Success Criteria:**
- ✅ Progress calculation considers pre-filled data
- ✅ Doesn't show 16% when 80% complete

---

## Test Category 10: Guided vs AI Mode

### Test 10.1: Switch from AI to Guided
**Steps:**
1. Start booking in AI mode
2. Toggle to "Guided Booking" mode in header

**Expected Behavior:**
- System redirects to guided flow
- Traditional step-by-step form appears
- Different UX (forms instead of chat)

**Success Criteria:**
- ✅ Mode switch works
- ✅ Separate guided flow loads
- ✅ No conversation interference

---

### Test 10.2: Guided Mode Behavior
**Steps:**
1. Click "Book a doctor" in guided mode
2. Go through form steps

**Expected Behavior:**
- Linear form progression
- No AI chat
- Validation on each step
- Different from conversational flow

**Success Criteria:**
- ✅ Forms work correctly
- ✅ Completely separate from AI mode
- ✅ Results in same booking outcome

---

## Test Category 11: Edge Cases

### Test 11.1: Empty Input Submission
**Steps:**
1. Start conversation
2. Submit empty message

**Expected Behavior:**
- Submit button disabled when input empty
- Or shows validation: "Please enter a message"

**Success Criteria:**
- ✅ Prevents empty submission
- ✅ Clear feedback

---

### Test 11.2: Very Long Message
**Steps:**
1. Type 500+ word message

**Expected Behavior:**
- AI processes entire message
- Extracts all relevant entities
- Summarizes if needed

**Success Criteria:**
- ✅ No truncation errors
- ✅ All entities extracted
- ✅ Response is coherent

---

### Test 11.3: Special Characters
**Steps:**
1. Type: "Book @#$% appointment!!!"

**Expected Behavior:**
- AI ignores special characters
- Extracts intent: "Book appointment"
- Asks for details

**Success Criteria:**
- ✅ Handles gracefully
- ✅ No XSS or injection issues
- ✅ Valid response

---

### Test 11.4: Multiple Concurrent Bookings
**Steps:**
1. Start doctor booking in one tab
2. Start lab test in another tab

**Expected Behavior:**
- Each conversation is independent
- Separate conversation IDs
- No data leakage between tabs

**Success Criteria:**
- ✅ Isolated conversations
- ✅ Correct data in each
- ✅ No conflicts

---

## Test Category 12: Payment Flow Integration

### Test 12.1: Completing Full Flow to Payment
**Steps:**
1. Complete all booking steps
2. AI shows summary with amount
3. Click "Proceed to Payment"

**Expected Behavior:**
- Razorpay modal opens
- Correct amount shown
- Payment processing works

**Success Criteria:**
- ✅ Smooth transition to payment
- ✅ Amount matches booking
- ✅ Success redirects to confirmation

---

### Test 12.2: Payment Cancellation
**Steps:**
1. Reach payment step
2. Close Razorpay modal

**Expected Behavior:**
- Returns to conversation
- Booking not confirmed
- Can retry payment

**Success Criteria:**
- ✅ No orphaned booking
- ✅ User can go back
- ✅ State preserved

---

## Success Metrics Summary

### Core Intelligence Requirements
- ✅ AI understands natural language intent without rigid keywords
- ✅ Context switching works seamlessly (doctor ↔ lab test)
- ✅ Modifications and cancellations handled intelligently
- ✅ UI appears/disappears based on conversation relevance
- ✅ Multi-entity extraction works in single message
- ✅ Ambiguity is clarified, not assumed
- ✅ Thinking process is transparent to user
- ✅ Voice input works equivalently to text
- ✅ Progress tracking is accurate
- ✅ Error recovery is graceful

### Flexibility Goals
- ❌ **AVOID**: "You must say 'book doctor' exactly"
- ✅ **ACHIEVE**: "I need medical help" → AI figures it out
- ❌ **AVOID**: Rigid step-by-step wizard
- ✅ **ACHIEVE**: Jump ahead if user provides multiple details
- ❌ **AVOID**: "Cannot cancel, please complete flow"
- ✅ **ACHIEVE**: User can cancel/modify anytime

---

## Testing Checklist

### Automated Tests (Future)
- [ ] Unit tests for intent classification
- [ ] Unit tests for entity extraction
- [ ] Integration tests for state machine
- [ ] E2E tests for complete flows

### Manual Testing (Current)
- [ ] Run through each test scenario
- [ ] Document any failures
- [ ] Verify thinking steps appear correctly
- [ ] Check UI updates dynamically
- [ ] Test voice input thoroughly
- [ ] Validate progress calculations
- [ ] Test error conditions
- [ ] Verify cancellation/modification flows

### Performance Testing
- [ ] AI response time < 3 seconds
- [ ] Audio transcription < 5 seconds
- [ ] UI updates are smooth (60fps)
- [ ] No memory leaks in long conversations

---

## Notes for Developers

1. **State Machine Flexibility**: The BookingStateMachine should allow jumping to any state if entities are pre-filled.

2. **AI Prompt Engineering**: The AI prompts should emphasize:
   - Detecting intent changes
   - Asking for confirmation before major changes
   - Extracting multiple entities
   - Handling ambiguity gracefully

3. **UI Component Logic**: Components should:
   - Render only when `component_type` is set
   - Auto-hide when conversation is cancelled
   - Update if data changes mid-flow

4. **Thinking Extraction**: Continue refining the 3 methods in `GroqProvider::extractThinkingSteps()`:
   - `<think>` tag parsing
   - Numbered reasoning detection
   - JSON analysis simulation

5. **Conversation Context**: Always pass last 5-10 messages to AI for context awareness.

---

## Version History
- v1.0 (2026-01-31): Initial test scenario documentation
