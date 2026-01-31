# Booking Flow Test Script

## Test Environment Setup

**Prerequisites**:
- Laravel server running on port 3000
- Vite dev server running
- AI service (Groq) configured and accessible
- Database seeded with test data

**Test User**: Sanjana Jaisinghani (sanjana@example.com)

---

## Test Categories

1. **Natural Language Understanding** - AI comprehends user intent without strict commands
2. **Flow Switching** - User can change booking type mid-conversation
3. **Context Preservation** - System remembers previous selections when switching
4. **Dynamic UI Updates** - Components appear/disappear based on conversation
5. **Cancellation Handling** - User can cancel at any point
6. **Flexible Input** - System accepts various phrasings and formats

---

## Test Suite 1: Natural Language Booking Initiation

### Test 1.1: Conversational Doctor Booking
**Scenario**: User naturally expresses need to see a doctor

**Steps**:
1. Navigate to `/booking`
2. Type in chatbox: "I'm not feeling well, can I see a doctor?"
3. Observe AI response

**Expected Behavior**:
- ✅ AI understands this as doctor booking intent
- ✅ Patient selector UI appears
- ✅ Message acknowledges concern empathetically
- ✅ No error or "I don't understand" response

**AI Should Say**:
> "I can help you book an appointment. Who is this appointment for?"

**UI Should Show**: Patient selector with family members

---

### Test 1.2: Pill-Based Booking Initiation
**Scenario**: User clicks "Book Doctor" pill below chatbox

**Steps**:
1. Navigate to `/booking`
2. Click "Book Doctor Appointment" pill
3. Observe flow initiation

**Expected Behavior**:
- ✅ Conversation starts with "I want to book a doctor appointment"
- ✅ Patient selector appears immediately
- ✅ Same flow as natural language initiation

---

### Test 1.3: Implicit Booking Request
**Scenario**: User implies need without explicit "book" keyword

**Steps**:
1. Type: "I need to get my blood pressure checked"
2. Observe AI interpretation

**Expected Behavior**:
- ✅ AI infers doctor booking intent
- ✅ Starts doctor booking flow
- ✅ May acknowledge symptom: "I understand you need to check your blood pressure"
- ✅ Patient selector appears

---

## Test Suite 2: Flow Switching & Context Preservation

### Test 2.1: Switch from Doctor to Lab Test Mid-Flow
**Scenario**: User starts doctor booking but switches to lab test

**Steps**:
1. Start doctor booking: "I want to see a doctor"
2. Select patient: "Yourself"
3. Select type: "New Appointment"
4. **Switch intent**: "Actually, I just need a blood test"
5. Observe system behavior

**Expected Behavior**:
- ✅ AI detects intent change to lab test booking
- ✅ Preserves patient selection ("Yourself")
- ✅ Removes doctor-specific UI (urgency selector)
- ✅ Shows lab test UI
- ✅ Acknowledges switch: "Got it, let's book a lab test instead"

**Critical**: Patient selection should be retained

---

### Test 2.2: Switch Back to Original Flow
**Scenario**: User switches flow, then changes mind back

**Steps**:
1. Start: "Book a doctor"
2. Select patient
3. Switch: "Wait, I need a lab test"
4. Switch back: "No, actually I do want to see the doctor"
5. Observe context handling

**Expected Behavior**:
- ✅ System switches back to doctor flow
- ✅ Patient selection still preserved
- ✅ Resumes from where doctor flow left off (appointment type)
- ✅ No data loss or confusion

---

### Test 2.3: Modify Patient Mid-Flow
**Scenario**: User changes patient selection after progressing

**Steps**:
1. Start doctor booking
2. Select "Yourself"
3. Select "New Appointment"
4. Select "This Week"
5. Say: "Actually this is for my mother"
6. Observe patient update

**Expected Behavior**:
- ✅ AI extracts patient change: "mother"
- ✅ Updates selectedPatientName to mother's name
- ✅ Updates selectedPatientId
- ✅ Doctor list remains (doesn't restart flow)
- ✅ Acknowledges: "Got it, booking for your mother"

**UI Behavior**: Doctor cards remain visible, patient updated in background

---

## Test Suite 3: Dynamic UI Updates

### Test 3.1: Date Selection Updates Doctor List
**Scenario**: User specifies date, doctor list updates dynamically

**Steps**:
1. Complete: Patient → New Appointment → This Week
2. See doctor list for "this week"
3. Type: "Show me doctors for February 5th"
4. Observe doctor list update

**Expected Behavior**:
- ✅ Doctor list component updates (not replaced)
- ✅ Selected date changes to "2026-02-05"
- ✅ Doctor availability updates for that date
- ✅ No full page refresh
- ✅ Smooth transition

**Log Check**: Should see "Component Deduplication: Updating existing component"

---

### Test 3.2: Component Appears Only When Relevant
**Scenario**: Booking UI only shows during active booking

**Steps**:
1. Start booking flow
2. Complete patient and type selection
3. Cancel: "Never mind, cancel this"
4. Observe UI removal

**Expected Behavior**:
- ✅ All booking components disappear
- ✅ Conversation history remains visible
- ✅ Input disabled with "Booking cancelled" placeholder
- ✅ Submit button greyed out
- ✅ No patient selector, no doctor cards visible

---

### Test 3.3: Follow-up Flow Shows Previous Doctors
**Scenario**: Follow-up appointment shows doctor from previous visit

**Steps**:
1. Start: "Book a follow-up appointment"
2. Select patient who has visit history
3. Select follow-up reason: "Scheduled follow-up"
4. Observe UI

**Expected Behavior**:
- ✅ `previous_doctors` component appears
- ✅ Shows doctor from last visit at top
- ✅ Shows last visit date
- ✅ Shows next available slots for that doctor
- ✅ Option to "See all doctors" at bottom

---

## Test Suite 4: Cancellation Handling

### Test 4.1: Early Stage Cancellation
**Scenario**: Cancel right after patient selection

**Steps**:
1. Start booking
2. Select "Yourself"
3. Type: "cancel"
4. Observe cancellation

**Expected Behavior**:
- ✅ Confirmation: "No problem! Booking cancelled. Let me know if you need anything else."
- ✅ Patient selector disappears
- ✅ Input disabled
- ✅ conversation.status = 'cancelled' in DB
- ✅ Can view message history

---

### Test 4.2: Late Stage Cancellation (Summary)
**Scenario**: Cancel at summary before final confirmation

**Steps**:
1. Complete entire flow to summary
2. At summary, type: "forget it, I don't want to book"
3. Observe cancellation

**Expected Behavior**:
- ✅ Summary component disappears
- ✅ Cancellation message shown
- ✅ All collected data preserved in DB (audit trail)
- ✅ Status changed to 'cancelled'

---

### Test 4.3: Natural Cancellation Phrases
**Scenario**: Various ways to cancel

**Test Phrases**:
- "never mind"
- "I changed my mind"
- "stop"
- "don't book this"
- "cancel the appointment"

**Expected Behavior**:
- ✅ All phrases trigger cancellation
- ✅ AI correctly identifies intent
- ✅ Same cancellation flow for all
- ✅ No need for exact keyword match

---

## Test Suite 5: Flexible Date & Time Input

### Test 5.1: Natural Date Formats
**Scenario**: User provides dates in various formats

**Test Inputs**:
- "tomorrow"
- "next Monday"
- "February 14"
- "2nd of March"
- "25 Dec evening"

**Expected Behavior**:
- ✅ AI parses all formats correctly
- ✅ Converts to standard date format (YYYY-MM-DD)
- ✅ Updates selectedDate in conversation
- ✅ Doctor list updates for that date

**Verification**: Check `collected_data.selectedDate` in DB

---

### Test 5.2: Time Preferences
**Scenario**: User specifies time preferences naturally

**Test Inputs**:
- "morning appointment"
- "after 3pm"
- "evening slot"
- "around lunchtime"

**Expected Behavior**:
- ✅ AI extracts time preference
- ✅ Filters time slots accordingly
- ✅ Shows relevant slots in doctor list
- ✅ Or acknowledges and asks for specific time

---

## Test Suite 6: Follow-up Flow with Notes

### Test 6.1: Scheduled Follow-up with Notes
**Scenario**: Follow-up with doctor's instructions, user provides notes

**Steps**:
1. Start: "I need a follow-up appointment"
2. Select patient
3. Select: "Scheduled follow-up"
4. See prompt: "Got it. Any updates you'd like to share with the doctor? This will help the doctor prepare for your visit. You can also skip this."
5. Type: "Blood pressure has been stable"
6. Observe acknowledgment

**Expected Behavior**:
- ✅ Exact message shown as specified
- ✅ Text input field appears
- ✅ "Skip" button visible
- ✅ Notes saved to `followup_notes`
- ✅ Response: "Thanks for sharing that. The doctor will review this before your appointment."
- ✅ Previous doctors component appears next

---

### Test 6.2: Ongoing Issue with Empathy
**Scenario**: Follow-up for persisting problem

**Steps**:
1. Start follow-up flow
2. Select: "Ongoing issue"
3. See empathetic prompt: "I'm sorry to hear that. Can you describe what's still bothering you? This will help the doctor prepare for your visit. You can also skip this."
4. Type: "Headaches are still happening"
5. Observe response

**Expected Behavior**:
- ✅ Empathetic tone in message
- ✅ "I'm sorry to hear that" included
- ✅ Notes saved with context
- ✅ Moves to previous doctors

---

### Test 6.3: Skip Follow-up Notes
**Scenario**: User skips providing notes

**Steps**:
1. Start follow-up flow
2. Select reason
3. Click "Skip" button or type "skip"
4. Observe behavior

**Expected Behavior**:
- ✅ No error or insistence
- ✅ Graceful acceptance: "No problem. Would you like to book with [Doctor] again?"
- ✅ `followup_notes` = null or empty string
- ✅ `followup_notes_asked` = true
- ✅ Moves to previous doctors

---

## Test Suite 7: Mode Selection Intelligence

### Test 7.1: Video Appointment Request
**Scenario**: User explicitly wants video appointment

**Steps**:
1. Progress to mode selection step
2. Type: "I want a video call appointment"
3. Observe mode detection

**Expected Behavior**:
- ✅ AI extracts mode = "video"
- ✅ Mode selector appears with video pre-selected OR skips selector
- ✅ Price shows ₹800 (video price)
- ✅ Moves to summary or next step

**Alternative**: If user says this early, mode is saved for later

---

### Test 7.2: In-Person Visit Request
**Scenario**: User wants physical visit

**Test Phrases**:
- "I want to visit the clinic"
- "in-person appointment"
- "I'll come to the office"

**Expected Behavior**:
- ✅ AI extracts mode = "in_person"
- ✅ Price updates to ₹1200
- ✅ consultationMode saved

---

## Test Suite 8: Summary Changes

### Test 8.1: Change Doctor from Summary
**Scenario**: User wants different doctor at summary

**Steps**:
1. Complete flow to summary
2. Click "Change Doctor" or type "I want a different doctor"
3. Observe flow

**Expected Behavior**:
- ✅ Doctor selection cleared
- ✅ Date and time preserved
- ✅ Returns to doctor selection state
- ✅ Doctor list shown with previously selected date/time
- ✅ Time slot validated for new doctor

**Critical**: If selected time not available for new doctor, system should prompt for new time

---

### Test 8.2: Change Appointment Mode from Summary
**Scenario**: User switches video to in-person at summary

**Steps**:
1. Complete flow with video mode
2. At summary, click "Change" on mode or say "make it in-person"
3. Observe update

**Expected Behavior**:
- ✅ Mode updated to "in_person"
- ✅ Price updated from ₹800 to ₹1200
- ✅ Summary refreshes with new data
- ✅ No need to re-select doctor/time

---

### Test 8.3: Change Patient from Summary
**Scenario**: User realizes wrong patient at end

**Steps**:
1. Complete flow for "Yourself"
2. At summary, say "This should be for my father"
3. Observe patient update

**Expected Behavior**:
- ✅ Patient cleared from collected_data
- ✅ Returns to patient selection
- ✅ Rest of booking preserved (doctor, time, mode)
- ✅ After re-selecting patient, returns to summary

---

## Test Suite 9: Error Recovery & Edge Cases

### Test 9.1: Invalid Date Input
**Scenario**: User provides past date

**Steps**:
1. Progress to date input
2. Type: "I want an appointment for last week"
3. Observe AI handling

**Expected Behavior**:
- ✅ AI detects invalid/past date
- ✅ Polite correction: "I can only book future appointments. When would you like to see the doctor?"
- ✅ Does not crash or store invalid date
- ✅ Asks for valid date

---

### Test 9.2: Ambiguous Input
**Scenario**: User message unclear

**Steps**:
1. At urgency selection, type: "maybe sometime"
2. Observe AI response

**Expected Behavior**:
- ✅ AI asks for clarification
- ✅ Re-presents urgency options
- ✅ Helpful prompt: "Would you like to see a doctor urgently, this week, or do you have a specific date in mind?"

---

### Test 9.3: Multiple Intents in One Message
**Scenario**: User provides multiple pieces of info

**Steps**:
1. Start booking
2. Type: "I want to book a new appointment for my mother for next Tuesday morning"
3. Observe AI extraction

**Expected Behavior**:
- ✅ AI extracts all entities:
  - patient: mother
  - appointment_type: new
  - date: next Tuesday
  - time_preference: morning
- ✅ Updates all fields at once
- ✅ Skips already-answered steps
- ✅ Moves to next missing field (likely doctor selection)

**Log Check**: Should see multiple entities in `🔀 Entity Merge` logs

---

## Test Suite 10: Conversation Context Awareness

### Test 10.1: Reference to Previous Message
**Scenario**: User refers to earlier conversation

**Steps**:
1. At doctor selection, see list of doctors
2. Type: "I'll take the first one"
3. Observe AI understanding

**Expected Behavior**:
- ✅ AI understands "first one" refers to first doctor in list
- ✅ Selects Dr. Sarah Johnson (or whoever is first)
- ✅ Moves to time selection

---

### Test 10.2: Pronoun Resolution
**Scenario**: User uses pronouns like "him", "her", "them"

**Steps**:
1. See doctor list
2. Type: "I want to book with her" (referring to female doctor shown)
3. Observe selection

**Expected Behavior**:
- ✅ AI resolves pronoun to specific doctor
- ✅ Correct doctor selected
- ✅ If ambiguous (multiple female doctors), asks for clarification

---

## Test Suite 11: Accessibility & UX

### Test 11.1: Keyboard Navigation
**Scenario**: User navigates without mouse

**Steps**:
1. Start booking
2. Use Tab to navigate through patient options
3. Press Enter to select
4. Continue with keyboard only

**Expected Behavior**:
- ✅ All interactive elements focusable
- ✅ Clear focus indicators
- ✅ Enter key selects options
- ✅ Can complete entire flow via keyboard

---

### Test 11.2: Screen Reader Compatibility
**Scenario**: Visually impaired user

**Requirements**:
- ✅ All components have proper ARIA labels
- ✅ Screen reader announces new messages
- ✅ Button states announced (disabled, enabled)
- ✅ Component changes announced

---

## Test Suite 12: Performance & Optimization

### Test 12.1: AI Response Time
**Scenario**: Measure AI parsing speed

**Metrics**:
- ✅ Intent classification < 2 seconds
- ✅ Entity extraction < 2 seconds
- ✅ Total response time < 3 seconds

**Check Logs**: Look for Groq API timing in logs

---

### Test 12.2: Component Deduplication
**Scenario**: Verify components update instead of duplicate

**Steps**:
1. At doctor selection, type "show me doctors for tomorrow"
2. Then type "actually show me for day after"
3. Check logs and UI

**Expected Behavior**:
- ✅ Log shows: "Component Deduplication: Updating existing component"
- ✅ Only ONE doctor list visible (not two)
- ✅ Doctor list updates in place
- ✅ No flickering or re-mounting

---

## Test Suite 13: Data Persistence

### Test 13.1: Refresh During Booking
**Scenario**: Page refresh mid-flow

**Steps**:
1. Complete patient, type, urgency
2. Refresh page (F5)
3. Observe state

**Expected Behavior**:
- ✅ All selections preserved
- ✅ Returns to last step
- ✅ Can continue from where left off
- ✅ No data loss

**DB Check**: `conversation.collected_data` unchanged

---

### Test 13.2: Multiple Tabs
**Scenario**: User opens booking in two tabs

**Steps**:
1. Open booking in Tab 1
2. Start flow, select patient
3. Open same conversation in Tab 2
4. Continue in Tab 2
5. Refresh Tab 1

**Expected Behavior**:
- ✅ Both tabs show same state after refresh
- ✅ Updates in one tab reflect after refresh in other
- ✅ No conflicts or data corruption

---

## Success Criteria Summary

### Core Functionality (Must Pass All)
- ✅ Natural language booking initiation
- ✅ Flow switching with context preservation
- ✅ Dynamic UI updates based on conversation
- ✅ Cancellation at any stage
- ✅ Flexible date/time input
- ✅ Follow-up flow with empathetic messaging
- ✅ Summary changes with validation
- ✅ Data persistence across refreshes

### AI Intelligence (Must Pass 80%+)
- ✅ Intent classification accuracy
- ✅ Entity extraction accuracy
- ✅ Context awareness (pronouns, references)
- ✅ Multi-intent handling
- ✅ Ambiguity resolution

### UX Quality (Must Pass All)
- ✅ Smooth UI transitions
- ✅ No unnecessary component re-renders
- ✅ Clear, empathetic messaging
- ✅ Graceful error handling
- ✅ Responsive design

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Servers running (Laravel + Vite)
- [ ] Database seeded with test data
- [ ] AI service configured (Groq API key)
- [ ] Browser DevTools open (Console + Network tabs)
- [ ] Laravel logs tailing: `tail -f storage/logs/laravel.log`

### During Testing
- [ ] Record each test result (Pass/Fail)
- [ ] Screenshot any failures
- [ ] Copy relevant log sections for failures
- [ ] Note AI response variations
- [ ] Check network requests (should be minimal)

### Post-Test
- [ ] Calculate pass rate per test suite
- [ ] Document edge cases discovered
- [ ] List AI misinterpretations
- [ ] Identify UX friction points
- [ ] Create bug tickets for failures

---

## Automated Test Script (Optional)

```javascript
// Cypress test example for Test 2.1
describe('Flow Switching', () => {
  it('should switch from doctor to lab test mid-flow', () => {
    cy.visit('/booking');

    // Start doctor booking
    cy.get('textarea').type('I want to see a doctor{enter}');
    cy.contains('Who is this appointment for?').should('be.visible');

    // Select patient
    cy.contains('Yourself').click();
    cy.contains('Is this a new appointment').should('be.visible');

    // Select type
    cy.contains('New Appointment').click();

    // Switch to lab test
    cy.get('textarea').type('Actually, I just need a blood test{enter}');

    // Verify switch
    cy.contains('lab test').should('be.visible');
    cy.get('[data-component="urgency_selector"]').should('not.exist');

    // Verify patient preserved
    cy.get('[data-patient-name]').should('contain', 'Yourself');
  });
});
```

---

## Final Notes

**Testing Philosophy**:
- Test as a **user**, not as a developer
- Expect the system to **understand context**, not just match keywords
- Verify **flexibility**, not just strict flows
- Check **recovery** from errors, not just happy paths

**Key Metrics**:
- **AI Accuracy**: >90% correct intent classification
- **Context Preservation**: 100% when switching flows
- **Response Time**: <3 seconds per interaction
- **Zero Data Loss**: Across refreshes, switches, cancellations

**Priority**: Focus on Test Suites 1-6 first (core booking flows), then 7-10 (intelligence), then 11-13 (polish).
