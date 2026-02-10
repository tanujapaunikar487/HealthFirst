<?php

namespace App\Services\Booking;

use Carbon\Carbon;

/**
 * BookingPromptBuilder
 *
 * Builds a dynamic, context-aware system prompt for AI entity extraction.
 * Instead of a generic intent classifier, this prompt includes:
 * - Today's date (so AI can resolve "tomorrow", "this Thursday")
 * - Full doctor list with details
 * - Current booking state
 * - Strict extraction rules with format requirements
 */
class BookingPromptBuilder
{
    public function __construct(
        private DoctorService $doctorService,
        private LabService $labService,
    ) {}

    /**
     * Build the full system prompt for intent classification + entity extraction.
     */
    public function build(array $collectedData = []): string
    {
        $sections = [
            $this->buildRoleSection(),
            $this->buildDateSection(),
            $this->buildDoctorSection(),
            $this->buildLabSection(),
            $this->buildStateSection($collectedData),
            $this->buildIntentSection(),
            $this->buildExtractionRules(),
            $this->buildExamples(),
            $this->buildOutputFormat(),
        ];

        return implode("\n\n", array_filter($sections));
    }

    private function buildRoleSection(): string
    {
        return "You are a healthcare booking assistant AI. Your job is to:
1. Classify the user's intent
2. Extract ALL booking-related entities from their message
3. Return structured JSON

Be precise. Extract everything mentioned. Do not hallucinate entities that aren't in the message.";
    }

    private function buildDateSection(): string
    {
        $today = Carbon::today();
        $dayName = $today->format('l');
        $dateFormatted = $today->format('F j, Y');

        // Build a mini calendar for the next 7 days
        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $d = $today->copy()->addDays($i);
            $label = match ($i) {
                0 => 'today',
                1 => 'tomorrow',
                default => '',
            };
            $days[] = "  {$d->format('l, M j')} = {$d->format('Y-m-d')}".($label ? " ({$label})" : '');
        }

        return "TODAY: {$dayName}, {$dateFormatted}

UPCOMING DATES:
".implode("\n", $days);
    }

    private function buildDoctorSection(): string
    {
        $doctorList = $this->doctorService->formatForPrompt();

        return "AVAILABLE DOCTORS:
{$doctorList}

IMPORTANT: Only return doctor_name and doctor_id that EXACTLY match our doctor list above.
If user mentions a doctor not in this list, set doctor_name to what they said and doctor_id to null.";
    }

    private function buildLabSection(): string
    {
        $packageList = $this->labService->formatForPrompt();

        return "AVAILABLE LAB PACKAGES:
{$packageList}

IMPORTANT: Only return package_name and package_id that EXACTLY match our package list above.
If user mentions a test not in this list, set package_name to what they said and package_id to null.
Collection types: 'home' (home collection) or 'center' (visit lab center).";
    }

    private function buildStateSection(array $data): string
    {
        if (empty($data)) {
            return 'CURRENT BOOKING STATE: No booking in progress.';
        }

        $bookingType = $data['booking_type'] ?? 'doctor';
        $state = [];
        $state['booking_type'] = $bookingType;
        $state['patient'] = ! empty($data['selectedPatientId'])
            ? ($data['selectedPatientName'] ?? 'Selected')
            : 'not selected';

        if ($bookingType === 'lab_test') {
            $state['package'] = ! empty($data['selectedPackageId'])
                ? ($data['selectedPackageName'] ?? "ID:{$data['selectedPackageId']}")
                : 'not selected';
            $state['collection'] = $data['collectionType'] ?? 'not selected';
        } else {
            $state['type'] = $data['appointmentType'] ?? 'not selected';
            $state['doctor'] = ! empty($data['selectedDoctorId'])
                ? ($data['selectedDoctorName'] ?? "ID:{$data['selectedDoctorId']}")
                : 'not selected';
            $state['mode'] = $data['consultationMode'] ?? 'not selected';
        }

        $state['date'] = $data['selectedDate'] ?? 'not selected';
        $state['time'] = $data['selectedTime'] ?? 'not selected';

        $stateStr = json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return "CURRENT BOOKING STATE:
{$stateStr}

Use this to understand context. For example, if date is already selected and user says 'change to 3 PM', that's a time change, not a new booking.";
    }

    private function buildIntentSection(): string
    {
        return "INTENT CLASSIFICATION:
Classify into one of these intents:
- booking_doctor: User wants to book/schedule a doctor appointment
- booking_lab: User wants to book a lab test
- question: User is asking a question (what, which, how, why, when, who, where, difference, better, compare)
- emergency: User describes personal symptoms or medical concerns
- cancel_reschedule: User wants to cancel or reschedule an existing appointment
- correction: User wants to change a specific field (e.g., 'change doctor', 'different time', 'actually in-person')
- general_info: User wants general information about services
- greeting: User is greeting or starting conversation
- off_topic: User input is unrelated to healthcare/booking (e.g., random text, jokes, gibberish, casual chat, weather, news, opinions about non-medical topics)
- unclear: Intent is not clear or ambiguous, but seems to be an attempt at booking-related communication

CRITICAL DISTINCTIONS:
- 'which doctor is better?' → question (asking for info)
- 'my daughter has a headache' → emergency (reporting symptoms)
- 'change to in-person' → correction (modifying existing selection)
- 'book with Dr. Sarah tomorrow' → booking_doctor (new booking with entities)
- 'slknklad' or 'random text' or 'pizza is great' → off_topic (not related to healthcare)
- 'I want something' (vague but seems booking-related) → unclear";
    }

    private function buildExtractionRules(): string
    {
        return "ENTITY EXTRACTION RULES:

Extract these entities when present in the message:

| Entity            | Format                  | Notes                                              |
|-------------------|-------------------------|-----------------------------------------------------|
| patient_relation  | self/father/mother/son/daughter/spouse | 'for me'/'myself'/'I need'/'I want' → 'self', 'for my mother' → 'mother' |
| appointment_type  | new/followup            | 'follow up'/'revisit'/'check back' → 'followup'    |
| doctor_name       | Exact name from our list | Partial match OK: 'Dr. Sarah' → 'Dr. Sarah Johnson'|
| doctor_id         | Integer 1-5             | Must match our doctor list above                    |
| date              | YYYY-MM-DD              | Resolve relative dates using TODAY above. Only within next 14 days. |
| time              | HH:MM (24-hour)         | '3 PM' → '15:00', '10 AM' → '10:00', '3:30' → '15:30' |
| urgency_level     | urgent/this_week/flexible | 'ASAP'/'today'/'emergency' → 'urgent'             |
| consultation_mode | video/in_person         | 'online'/'virtual' → 'video', 'physical'/'clinic' → 'in_person' |
| symptoms          | Array of strings        | Only for emergency intent                           |
| duration          | String                  | '2 days', '1 week', etc.                            |
| package_name      | Exact name from list    | 'blood test'/'full body' → match from package list  |
| package_id        | Integer                 | Must match our package list above                   |
| collection_type   | home/center             | 'at home'/'doorstep' → 'home', 'lab'/'visit' → 'center' |

RULES:
- Only extract entities that are EXPLICITLY mentioned or clearly implied
- For dates: ALWAYS resolve to YYYY-MM-DD using the date reference above
- For times: ALWAYS convert to 24-hour HH:MM format
- For doctors: Match against our doctor list. Return both doctor_name (full) and doctor_id
- For 'tomorrow', 'next Monday', etc: compute the actual date
- Do NOT guess or fill in entities that weren't mentioned
- If user says just a time like '3 PM' with no date context, extract only time";
    }

    private function buildExamples(): string
    {
        $today = Carbon::today();
        $tomorrow = $today->copy()->addDay();
        $tomorrowFormatted = $tomorrow->format('Y-m-d');

        return "EXAMPLES:

User: 'Book with Dr. Sarah tomorrow at 3 PM'
→ {\"intent\": \"booking_doctor\", \"confidence\": 0.95, \"entities\": {\"doctor_name\": \"Dr. Sarah Johnson\", \"doctor_id\": 1, \"date\": \"{$tomorrowFormatted}\", \"time\": \"15:00\"}}

User: 'I need to see a cardiologist ASAP'
→ {\"intent\": \"booking_doctor\", \"confidence\": 0.9, \"entities\": {\"urgency_level\": \"urgent\"}}

User: 'Change to in-person'
→ {\"intent\": \"correction\", \"confidence\": 0.9, \"entities\": {\"consultation_mode\": \"in_person\"}}

User: 'Dr. Vikram on Feb 5 at 10'
→ {\"intent\": \"booking_doctor\", \"confidence\": 0.95, \"entities\": {\"doctor_name\": \"Dr. Vikram Patel\", \"doctor_id\": 5, \"date\": \"2026-02-05\", \"time\": \"10:00\"}}

User: 'book new appointment for myself'
→ {\"intent\": \"booking_doctor\", \"confidence\": 0.9, \"entities\": {\"patient_relation\": \"self\", \"appointment_type\": \"new\"}}

User: 'Book an appointment for me on 5th Feb'
→ {\"intent\": \"booking_doctor\", \"confidence\": 0.95, \"entities\": {\"patient_relation\": \"self\", \"date\": \"2026-02-05\"}}

User: 'I want to see a doctor for my mother'
→ {\"intent\": \"booking_doctor\", \"confidence\": 0.9, \"entities\": {\"patient_relation\": \"mother\"}}

User: 'which doctor has better experience?'
→ {\"intent\": \"question\", \"confidence\": 0.95, \"entities\": {}}

User: 'hi'
→ {\"intent\": \"greeting\", \"confidence\": 0.95, \"entities\": {}}

User: 'my daughter has a headache since 2 days'
→ {\"intent\": \"emergency\", \"confidence\": 0.9, \"entities\": {\"patient_relation\": \"daughter\", \"symptoms\": [\"headache\"], \"duration\": \"2 days\"}}

User: 'I want a blood test'
→ {\"intent\": \"booking_lab\", \"confidence\": 0.9, \"entities\": {}}

User: 'book full body checkup at home tomorrow'
→ {\"intent\": \"booking_lab\", \"confidence\": 0.95, \"entities\": {\"package_name\": \"Full Body Checkup\", \"collection_type\": \"home\", \"date\": \"{$tomorrowFormatted}\"}}

User: 'I need a lab test for my father'
→ {\"intent\": \"booking_lab\", \"confidence\": 0.9, \"entities\": {\"patient_relation\": \"father\"}}

User: 'slknklad'
→ {\"intent\": \"off_topic\", \"confidence\": 0.95, \"entities\": {}}

User: 'what's the weather like today?'
→ {\"intent\": \"off_topic\", \"confidence\": 0.95, \"entities\": {}}

User: 'I love pizza'
→ {\"intent\": \"off_topic\", \"confidence\": 0.95, \"entities\": {}}

User: 'asdfghjkl'
→ {\"intent\": \"off_topic\", \"confidence\": 0.95, \"entities\": {}}";
    }

    private function buildOutputFormat(): string
    {
        return 'OUTPUT FORMAT:
Respond with ONLY valid JSON. No markdown, no explanation, no wrapping.

{
  "intent": "<intent>",
  "confidence": <0.0-1.0>,
  "entities": { ... }
}

If no entities are detected, return an empty entities object: "entities": {}';
    }
}
