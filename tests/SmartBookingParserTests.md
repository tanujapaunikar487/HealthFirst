# SmartBookingParser Enhanced Compound Input Tests

This document contains test cases for the enhanced SmartBookingParser that handles compound inputs.

## Test Case 1: Complete Follow-up Booking in One Input

**Input:**
```
Book follow-up with Dr. Meera for my father tomorrow at 2pm, ongoing headache issue
```

**Expected Extraction:**
```php
[
    'intent' => 'provide_info',
    'entities' => [
        'appointment_type' => 'followup',
        'doctor_id' => 2,  // Dr. Meera Iyer
        'doctor_name' => 'Dr. Meera',
        'patient_relation' => 'father',
        'date' => '2026-01-31',  // tomorrow
        'time' => '14:00',  // 2pm
        'followup_reason' => 'ongoing_issue',  // from "ongoing headache issue"
        'symptoms' => ['headache'],  // extracted from compound phrase
    ]
]
```

**How it works:**
- `extractAppointmentType()` detects "follow-up"
- `matchDoctorId()` finds "Dr. Meera" → matches to ID 2
- `extractPatientRelation()` detects "for my father"
- `extractDate()` converts "tomorrow" to actual date
- `extractTime()` converts "2pm" to "14:00"
- `extractFollowupReason()` detects "ongoing ... issue" pattern → 'ongoing_issue'
- `extractSymptoms()` finds "headache" in compound phrase "ongoing headache issue"

---

## Test Case 2: Correction with Doctor Change

**Input:**
```
Actually change to Dr. Rajesh, video appointment
```

**Expected Extraction:**
```php
[
    'intent' => 'modify',  // detected from "change"
    'entities' => [
        'doctor_name' => 'Dr. Rajesh',
        'doctor_id' => 3,  // Dr. Rajesh Kumar
        'consultation_mode' => 'video',
    ]
]
```

**Backend Handling:**
In IntelligentBookingOrchestrator.php:
- Intent = 'modify' triggers field clearing logic
- `detectFieldsToChange()` identifies 'doctor' field
- Clears: `selectedDoctorId`, `selectedDoctorName`, `selectedTime` (dependent field)
- Merges new doctor and consultation mode

**How it works:**
- `detectIntent()` finds "change" → returns 'modify'
- `matchDoctorId()` finds "Dr. Rajesh" → matches to ID 3
- `extractConsultationMode()` detects "video"
- Orchestrator clears time since doctor changed (see IntelligentBookingOrchestrator.php lines 288-298)

---

## Test Case 3: Urgent Appointment with Symptom

**Input:**
```
Book urgent appointment for headache
```

**Expected Extraction:**
```php
[
    'intent' => 'provide_info',
    'entities' => [
        'urgency' => 'urgent',
        'symptoms' => ['headache'],
    ]
]
```

**Backend Auto-fill:**
In IntelligentBookingOrchestrator.php (lines 132-143):
- When `urgency === 'urgent'` is detected
- System clears old `selectedDate` if any
- Date selection happens in UI with locked "Today" pill

**How it works:**
- `extractUrgency()` detects "urgent" keyword
- `extractSymptoms()` finds "headache"
- Orchestrator handles urgency by showing date_doctor_selector with locked Today pill

---

## Additional Compound Input Examples

### Example 4: Multi-entity First Message
**Input:** "I need to see Dr. Priya tomorrow morning for chest pain, video call"

**Expected:**
- doctor_id: 1 (Dr. Priya Menon)
- date: tomorrow
- time_preference: 'morning'
- symptoms: ['chest pain']
- consultation_mode: 'video'

### Example 5: Correction with Multiple Changes
**Input:** "Change doctor to Dr. Sarah and make it in-person instead"

**Expected:**
- intent: 'modify'
- doctor_id: 5 (Dr. Sarah Khan)
- consultation_mode: 'in_person'
- Fields to clear: doctor, time

### Example 6: Follow-up with Context
**Input:** "Follow-up for my mother, still experiencing back pain"

**Expected:**
- appointment_type: 'followup'
- patient_relation: 'mother'
- followup_reason: 'ongoing_issue' (from "still experiencing")
- symptoms: ['back pain']

---

## Enhancement Details

### extractFollowupReason() Enhancements
- Added regex pattern: `/\b(ongoing|persistent|continuing|still\s+having)\s+\w+\s+(issue|problem)/i`
- Detects compound phrases like "ongoing headache issue", "persistent fever problem"
- Additional keywords: 'continuing', 'persistent', 'hasn\'t improved', 'won\'t go away'

### extractSymptoms() Enhancements
- Detects symptoms in compound phrases with modifiers: "ongoing <symptom>", "persistent <symptom>"
- Detects symptoms followed by issue/problem: "<symptom> issue", "<symptom> problem"
- Regex patterns ensure word boundaries to avoid false positives

### Intent Detection Priority (maintained)
1. Emergency (highest)
2. Reset/Start Over
3. Cancel
4. Help
5. Modify/Correction ← Triggers field clearing
6. Confirm
7. Provide Info (default)

---

## Integration Points

### IntelligentBookingOrchestrator.php
- **intelligentMerge()** (lines 208-320): Handles entity merging with correction detection
- **detectFieldsToChange()** (SmartBookingParser.php lines 212-231): Identifies which fields to clear
- **Field dependency clearing** (lines 288-298): Clears time when doctor/date changes

### Test Execution
To test these cases:

```php
// In tinker or test file
$parser = new SmartBookingParser();

// Test Case 1
$result = $parser->parse("Book follow-up with Dr. Meera for my father tomorrow at 2pm, ongoing headache issue");
dd($result['entities']);

// Test Case 2
$result = $parser->parse("Actually change to Dr. Rajesh, video appointment");
dd($result['intent'], $result['entities']);

// Test Case 3
$result = $parser->parse("Book urgent appointment for headache");
dd($result['entities']);
```

---

## Expected Behavior Summary

✅ **Parser extracts ALL entities in parallel** - no need for multiple back-and-forth
✅ **Intent detection drives merging strategy** - modify intent triggers field clearing
✅ **Compound phrases are decomposed** - "ongoing headache issue" extracts both followup_reason and symptom
✅ **Corrections are detected and handled** - "change to X" clears dependent fields
✅ **Context-aware extraction** - followup_notes only extracted when appropriate context exists

This ensures the AI booking flow can handle natural, conversational inputs where users provide multiple pieces of information at once.
