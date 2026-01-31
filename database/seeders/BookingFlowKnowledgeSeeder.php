<?php

namespace Database\Seeders;

use App\Models\KnowledgeBaseResource;
use Illuminate\Database\Seeder;

class BookingFlowKnowledgeSeeder extends Seeder
{
    /**
     * Seed booking flow knowledge for AI learning.
     */
    public function run(): void
    {
        $resources = [
            [
                'title' => 'Complete Doctor Appointment Booking Process',
                'slug' => 'doctor-booking-process',
                'category' => 'booking_flow',
                'summary' => 'Step-by-step guide for booking doctor appointments with natural conversation flow',
                'content' => $this->getDoctorBookingFlowContent(),
                'tags' => ['booking', 'doctor', 'appointment', 'flow', 'process'],
                'priority' => 10,
                'is_active' => true,
            ],
            [
                'title' => 'Lab Test Booking Workflow',
                'slug' => 'lab-test-booking-workflow',
                'category' => 'booking_flow',
                'summary' => 'Complete workflow for booking lab tests and packages',
                'content' => $this->getLabTestBookingFlowContent(),
                'tags' => ['booking', 'lab', 'test', 'workflow', 'process'],
                'priority' => 10,
                'is_active' => true,
            ],
            [
                'title' => 'When to Show UI Components vs Natural Chat',
                'slug' => 'ui-vs-chat-decision-guide',
                'category' => 'booking_flow',
                'summary' => 'Guidelines for AI to decide when to show UI components versus using natural conversation',
                'content' => $this->getUIvsChatGuideContent(),
                'tags' => ['ui', 'chat', 'conversation', 'components', 'decision'],
                'priority' => 10,
                'is_active' => true,
            ],
            [
                'title' => 'Extracting Information from Natural Language',
                'slug' => 'natural-language-extraction',
                'category' => 'booking_flow',
                'summary' => 'How to extract booking information from user\'s natural language input',
                'content' => $this->getNaturalLanguageExtractionContent(),
                'tags' => ['natural language', 'extraction', 'entities', 'ai', 'parsing'],
                'priority' => 9,
                'is_active' => true,
            ],
        ];

        foreach ($resources as $resource) {
            KnowledgeBaseResource::updateOrCreate(
                ['slug' => $resource['slug']],
                $resource
            );
        }

        $this->command->info('✅ Booking flow knowledge seeded successfully!');
    }

    private function getDoctorBookingFlowContent(): string
    {
        return <<<'CONTENT'
# Doctor Appointment Booking Flow

## Overview
Our doctor appointment booking follows a conversational flow that can adapt to both natural language and structured UI interactions.

## Booking Steps

### 1. Patient Selection
**Question**: "Who is this appointment for?"

**Natural Language Options**:
- "for myself" / "for me" → Books for the user
- "for my son John" → Books for family member named John
- "for my daughter" → Books for daughter

**UI Component**: Shows list of family members when:
- User doesn't specify patient
- User wants to see all family members
- User says "show me options"

---

### 2. Appointment Type
**Question**: "Is this a new appointment or a follow-up?"

**Natural Language Options**:
- "new" / "new appointment" / "first visit" → New appointment
- "followup" / "follow-up" / "follow up visit" → Follow-up appointment

**UI Component**: Two-button selector shown when:
- User doesn't specify type
- User is unclear

---

### 3. Urgency Level
**Question**: "How urgent is this appointment?"

**Natural Language Options**:
- "urgent" / "asap" / "as soon as possible" / "emergency" → Urgent
- "normal" / "regular" → Normal priority
- "flexible" / "anytime" / "whenever" → Flexible timing

**UI Component**: Three-button selector shown when:
- User doesn't specify urgency
- Follow-up appointments (urgency needed for scheduling)

---

### 4. Doctor Selection
**Question**: "Which doctor would you like to see?"

**Natural Language Options**:
- "Dr. Rajesh" / "Doctor Rajesh" → Books with specific doctor
- "with Dr. Sarah" → Books with Dr. Sarah

**UI Component**: Doctor list with photos, ratings, specializations shown when:
- User asks "who is available?"
- User says "show me doctors"
- User wants to browse and compare doctors
- User doesn't know which doctor to choose

**Important**: If user asks a question like "which doctor is better for X?", answer the question naturally from knowledge base, DON'T show the doctor list component.

---

### 5. Appointment Mode
**Question**: "Would you like a video or in-person appointment?"

**Natural Language Options**:
- "video" / "online" / "virtual" / "video call" → Video appointment (₹800)
- "in-person" / "in person" / "clinic" / "visit" / "physical" → In-person appointment (₹1200)

**UI Component**: Two-option selector with pricing shown when:
- User doesn't specify mode
- User asks "what are my options?"

**Important**: If user asks "what is the difference between video and in-person?", answer the question naturally, DON'T show the mode selector.

---

### 6. Date & Time Selection
**Question**: "When would you like your appointment?"

**Natural Language Options**:
- "tomorrow" → Next day
- "today" → Same day
- "Jan 19" / "19th January" → Specific date
- "at 10am" / "10 o'clock" → Specific time
- "tomorrow at 10am" → Date and time
- "next Monday" → Next occurrence of Monday

**UI Component**: Calendar with time slots shown when:
- User says "I'm not sure"
- User asks "when is the doctor available?"
- User wants to see all available time slots
- Specified date/time not available (show alternatives)

---

### 7. Booking Summary
**Always shows UI component**: Editable summary with all booking details

**Cannot be skipped**: User must review before payment

---

### 8. Payment
**Always shows UI component**: Secure payment gateway

**Cannot be bypassed**: Required for booking confirmation

---

## Natural Conversation Examples

### Example 1: Complete Information Upfront
**User**: "book appointment with Dr. Rajesh tomorrow at 10am for myself"

**AI Response**: "Perfect! I'll book an appointment with Dr. Rajesh for tomorrow at 10:00 AM for you. Is this a new appointment or a follow-up visit?"

→ Extracted: patient (myself), doctor (Dr. Rajesh), date (tomorrow), time (10am)
→ Next step: Ask about appointment type

### Example 2: Step-by-Step Natural Flow
**User**: "I want to see a doctor"
**AI**: "I can help you book a doctor's appointment! Who is this appointment for?"
**User**: "for my son"
**AI**: "Got it, for your son. Is this a new appointment or a follow-up visit?"
**User**: "new appointment"
**AI**: "Great! How urgent is this? Would you say it's urgent, normal priority, or flexible timing?"
**User**: "normal"
**AI**: "Which doctor would you like to see? I can show you our available doctors with their specializations and ratings."

### Example 3: Browsing Doctors
**User**: "who are the available doctors?"
**AI**: "Here are our available doctors:" [Shows doctor_list UI component]

### Example 4: Question About Doctors
**User**: "which doctor has better experience with gynaecology?"
**AI**: "For gynaecology expertise, you'll want to look at our doctors' specializations. Dr. Rajesh specializes in General Medicine with 12 years of experience, while Dr. Sarah specializes in Pediatrics with 8 years. For specific gynaecology concerns, I recommend checking if we have specialists in that field. Would you like me to help you book with one of our general practitioners?"

→ IMPORTANT: This is a QUESTION, so we answer naturally. We DON'T show the doctor list UI component.

---

## Key Principles

1. **Extract First, Ask Later**: Try to extract information from natural language before asking questions

2. **Skip Unnecessary Steps**: If user provides information, don't ask for it again

3. **Natural Confirmations**: Confirm extracted information naturally:
   - ✓ "Got it, booking for tomorrow at 10am"
   - ✗ "Please confirm: Date: 2026-01-19, Time: 10:00"

4. **Context Awareness**: Remember what user has already told you

5. **Flexible Flow**: Allow users to provide information in any order

6. **Questions vs Selections**:
   - Questions (what, which, how) → Answer naturally
   - Selections (show me, I want) → Show UI component

7. **Natural Language First**: Always prefer natural conversation when possible

8. **UI for Complexity**: Only show UI for complex selections or when user explicitly asks
CONTENT;
    }

    private function getLabTestBookingFlowContent(): string
    {
        return <<<'CONTENT'
# Lab Test Booking Workflow

## Overview
Lab test booking follows a similar conversational approach as doctor appointments, with focus on test packages and location selection.

## Booking Steps

### 1. Patient Selection
Same as doctor booking - who is the test for?

### 2. Package Selection
**Question**: "Which test or package would you like?"

**Natural Language Options**:
- "CBC test" / "CBC" → Complete Blood Count
- "Diabetes package" → Diabetes screening package
- "Basic health checkup" → Comprehensive health checkup

**UI Component**: Package cards with test details shown when:
- User asks "what tests do you offer?"
- User says "show me packages"
- User wants to browse available tests
- User doesn't know which test they need

**Important**: If user asks "what is included in a CBC test?", answer naturally, DON'T show package list.

---

### 3. Location Selection
**Question**: "Where would you like the test done?"

**Natural Language Options**:
- "Koramangala" → Specific area/location
- "nearest location" → Closest lab
- "HSR Layout" → Specific location

**UI Component**: Map with lab locations shown when:
- User asks "where are your labs?"
- User wants to see all locations
- User doesn't specify location

---

### 4. Date & Time Selection
Same as doctor booking - when should the test be done?

### 5. Summary
Review all test booking details

### 6. Payment
Secure payment processing

---

## Natural Conversation Example

**User**: "I need a CBC test"
**AI**: "I can help you schedule a CBC (Complete Blood Count) test. Who is this test for?"
**User**: "for myself"
**AI**: "Got it. Where would you like to have the test done? I can show you our lab locations on a map, or you can tell me your preferred area."
**User**: "Koramangala"
**AI**: "Perfect! We have a lab in Koramangala. When would you like to schedule the test?"
**User**: "tomorrow morning"
**AI**: "Great! Tomorrow morning works. Let me show you available time slots:" [Shows date_time_selector]

---

## Question Handling Examples

**User**: "what tests are included in the diabetes package?"
**AI**: "The Diabetes Package includes: Fasting Blood Sugar (FBS), HbA1c, Post-Prandial Blood Sugar, Lipid Profile, and Kidney Function Test. This comprehensive package helps monitor and diagnose diabetes. The package costs ₹1,500. Would you like to book this package?"

→ Answered naturally from knowledge base, didn't show package list UI

**User**: "show me all available packages"
**AI**: "Here are all our test packages:" [Shows package_list UI component]

→ User wants to browse, so show UI
CONTENT;
    }

    private function getUIvsChatGuideContent(): string
    {
        return <<<'CONTENT'
# UI Components vs Natural Chat: Decision Guide

## Core Principle
**Balance natural conversation with useful UI when needed.**

## Decision Matrix

### ✅ Use Natural Chat When:

1. **User Asks a Question**
   - Questions with: what, which, how, why, when, who, where
   - Comparison questions: difference, better, versus, vs
   - Examples:
     - "which doctor is better?"
     - "what is the difference between video and in-person?"
     - "how much does it cost?"
   - **Action**: Answer from knowledge base naturally

2. **User Provides Complete Information**
   - "book appointment with Dr. Rajesh tomorrow at 10am for myself"
   - **Action**: Extract all entities, confirm naturally

3. **Simple Confirmations**
   - "yes", "no", "ok", "correct", "that works"
   - **Action**: Respond naturally and proceed

4. **Greetings and Small Talk**
   - "hello", "thank you", "great"
   - **Action**: Respond naturally

5. **User Provides Specific Request**
   - "Dr. Rajesh" (specific doctor)
   - "tomorrow at 10am" (specific date/time)
   - "video appointment" (specific mode)
   - **Action**: Use the provided information

---

### 🖥️ Show UI Component When:

1. **User Wants to Browse**
   - "show me", "see", "list", "available", "options"
   - "who are the doctors?"
   - "what time slots are available?"
   - **Action**: Display relevant UI component

2. **Complex Visual Selection Needed**
   - Doctor selection (photos, ratings, specializations)
   - Test packages (details, pricing, included tests)
   - Lab locations (map, distances)
   - **Action**: Show UI for better visual comparison

3. **Calendar/Date Selection**
   - When user doesn't provide specific date
   - When user wants to see availability
   - When specified date is not available
   - **Action**: Show date_time_selector

4. **User Doesn't Know Options**
   - "I'm not sure"
   - "I don't know"
   - "help me choose"
   - **Action**: Show relevant UI to help them explore

5. **Payment (Always)**
   - Secure payment processing required
   - **Action**: Always show payment_gateway UI

---

## Common Mistakes to Avoid

### ❌ BAD: Showing UI for Questions

**Wrong**:
- Q: "which doctor is better for gynaecology?"
- A: [Shows doctor_list UI]

**Correct**:
- Q: "which doctor is better for gynaecology?"
- A: "For gynaecology expertise, you'll want to look at our doctors' specializations. Dr. Rajesh specializes in General Medicine with 12 years of experience..." [Natural answer from knowledge base]

---

### ❌ BAD: Showing UI for Information Requests

**Wrong**:
- Q: "what is the difference between video and in-person?"
- A: [Shows mode_selector UI]

**Correct**:
- Q: "what is the difference between video and in-person?"
- A: "Video appointments (₹800) allow you to connect with doctors from home via video call, while in-person appointments (₹1200) are face-to-face appointments at our clinic. Video is great for follow-ups and non-emergency appointments, while in-person is better for physical examinations."

---

### ✅ GOOD: Showing UI for Browsing

**Correct**:
- Q: "show me all available doctors"
- A: "Here are our available doctors:" [Shows doctor_list UI with photos, ratings, specializations]

---

### ✅ GOOD: Natural Chat for Specific Requests

**Correct**:
- Q: "book with Dr. Rajesh"
- A: "Great! I'll book your appointment with Dr. Rajesh. When would you like to schedule it?"
- (No need to show doctor list since user specified Dr. Rajesh)

---

## Component Reference

### Simple Components (Can bypass with chat):
- `patient_selector` - Can extract from "for myself", "for John"
- `consultation_type_selector` - Can extract from "new", "followup"
- `urgency_selector` - Can extract from "urgent", "flexible"
- `mode_selector` - Can extract from "video", "in-person"

### Complex Components (Show UI when browsing):
- `doctor_list` - Rich cards with photos, ratings, experience
- `package_list` - Test packages with details and pricing
- `location_selector` - Map interface with lab locations
- `date_time_selector` - Calendar with availability

### Secure Components (Always show UI):
- `payment_gateway` - Always requires secure UI
- `booking_summary` - Always show editable summary

---

## Response Templates

### For Questions:
"[Natural answer from knowledge base]. Would you like me to help you book?"

### For Browsing Requests:
"[Acknowledge request]. Here are [the options]:" [Show UI component]

### For Specific Requests:
"Great! I'll [acknowledge request]. [Next natural question]"

### For Confirmations:
"Perfect! [Confirm understanding]. [Next step]"

---

## Key Rules to Remember

1. **Questions → Natural Answers** (NEVER show UI for questions)
2. **Browsing → Show UI** (User wants to see options)
3. **Specific Requests → Use Natural Chat** (User already knows what they want)
4. **Payment → Always UI** (Security required)
5. **When in doubt → Try natural chat first**
CONTENT;
    }

    private function getNaturalLanguageExtractionContent(): string
    {
        return <<<'CONTENT'
# Extracting Information from Natural Language

## Overview
Our AI system can extract booking information directly from user's natural language input, reducing friction and creating a more conversational experience.

## Extractable Entities

### 1. Patient Information
**Patterns**:
- "for me" / "for myself" → User is the patient
- "for my son" / "for my daughter" → Family member relationship
- "for John" / "for Sarah" → Specific name

**Examples**:
- "book appointment for myself" → patient: self
- "my daughter needs a checkup" → patient: daughter
- "booking for John" → patient: John

---

### 2. Doctor Names
**Patterns**:
- "Dr. [Name]" / "Doctor [Name]"
- "with Dr. [Name]"
- "[Doctor Name]" (if context is clear)

**Examples**:
- "book with Dr. Rajesh" → doctor: Dr. Rajesh
- "I want to see Doctor Sarah" → doctor: Dr. Sarah
- "appointment with Rajesh Kumar" → doctor: Rajesh Kumar

---

### 3. Consultation Type
**Patterns**:
- New: "new", "first time", "first visit", "new appointment"
- Followup: "followup", "follow-up", "follow up", "return visit"

**Examples**:
- "new appointment" → type: new
- "followup visit" → type: followup
- "this is my first time" → type: new

---

### 4. Dates
**Patterns**:
- Relative: "today", "tomorrow", "next Monday"
- Specific: "Jan 19", "19th January", "January 19, 2026"
- Day references: "Monday", "this weekend"

**Examples**:
- "tomorrow" → date: [tomorrow's date]
- "Jan 19" → date: 2026-01-19
- "next Monday" → date: [next Monday's date]

---

### 5. Times
**Patterns**:
- "10am", "10:00 AM", "10 o'clock"
- "morning", "afternoon", "evening"
- "at 3pm", "around 2"

**Examples**:
- "at 10am" → time: 10:00
- "tomorrow morning" → time preference: morning
- "3 o'clock" → time: 15:00

---

### 6. Appointment Mode
**Patterns**:
- Video: "video", "online", "virtual", "video call", "teleappointment"
- In-person: "in-person", "in person", "clinic", "visit", "physical", "face to face"

**Examples**:
- "video appointment" → mode: video
- "I'll come to the clinic" → mode: in-person
- "online appointment" → mode: video

---

### 7. Urgency
**Patterns**:
- Urgent: "urgent", "asap", "as soon as possible", "emergency", "immediately"
- Normal: "normal", "regular", "standard"
- Flexible: "flexible", "anytime", "whenever", "no rush"

**Examples**:
- "as soon as possible" → urgency: urgent
- "flexible timing" → urgency: flexible
- "urgent appointment" → urgency: urgent

---

### 8. Test Names (for lab bookings)
**Patterns**:
- "[Test Name] test"
- "[Test Name]" (when context is lab booking)
- "[Package Name] package"

**Examples**:
- "CBC test" → test: CBC
- "Diabetes package" → package: Diabetes
- "blood test" → general: blood test

---

## Extraction Examples

### Example 1: Simple Booking
**Input**: "book appointment for myself tomorrow"

**Extracted**:
```json
{
  "patient": "myself",
  "date": "2026-01-20",
  "appointment_type": null,
  "doctor": null,
  "mode": null,
  "time": null
}
```

**Next Steps**: Ask about appointment type, doctor, mode, and time

---

### Example 2: Complete Information
**Input**: "book a new appointment with Dr. Rajesh tomorrow at 10am for myself video appointment"

**Extracted**:
```json
{
  "patient": "myself",
  "date": "2026-01-20",
  "time": "10:00",
  "appointment_type": "new",
  "doctor": "Dr. Rajesh",
  "mode": "video"
}
```

**Next Steps**: Confirm all details and show summary (minimal steps needed!)

---

### Example 3: Partial Information
**Input**: "I need to see Dr. Sarah urgently"

**Extracted**:
```json
{
  "doctor": "Dr. Sarah",
  "urgency": "urgent",
  "patient": null,
  "date": null,
  "time": null,
  "mode": null
}
```

**Next Steps**: Ask about patient, offer earliest available times

---

## Context-Aware Extraction

### Using Conversation History
The AI should remember what was discussed:

**Turn 1**:
- User: "I want to book an appointment"
- AI: "Who is this appointment for?"

**Turn 2**:
- User: "for my son"
- Context: patient = "son"

**Turn 3**:
- User: "tomorrow at 10am"
- Context: patient = "son", date = "tomorrow", time = "10am"

---

## Handling Ambiguity

### When Information is Unclear:
1. Make best guess with low confidence
2. Ask clarifying question
3. Don't assume - confirm with user

**Example**:
- User: "book for John tomorrow"
- Unclear: Is John a family member or the user's name?
- AI Response: "I'll book an appointment for John tomorrow. Is John your son, or is that you?"

---

## Best Practices

1. **Extract Greedily**: Try to extract as much as possible from each message

2. **Don't Re-ask**: If user already provided information, don't ask again

3. **Confirm Naturally**: Acknowledge extracted information:
   - ✓ "Got it, booking for tomorrow at 10am"
   - ✗ "Date: 2026-01-20, Time: 10:00 - correct?"

4. **Handle Variations**: Recognize different ways of saying the same thing:
   - "tomorrow" = "next day" = "the following day"
   - "video" = "online" = "virtual" = "video call"

5. **Context Matters**: Use conversation history to fill in gaps

6. **Graceful Degradation**: If extraction fails, fall back to asking questions

---

## Integration with Booking Flow

The extraction system works together with the booking flow:

1. **User provides input** → Extract entities
2. **Check what's missing** → Identify next step
3. **Decide UI vs Chat** → Based on user intent and available info
4. **Proceed naturally** → Skip unnecessary questions

This creates a fluid, intelligent booking experience that adapts to how the user communicates.
CONTENT;
    }
}
