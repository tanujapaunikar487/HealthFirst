<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default AI Provider
    |--------------------------------------------------------------------------
    |
    | This option controls which AI provider is used by default. Set to 'none'
    | to disable AI functionality entirely.
    |
    | Supported: "groq", "deepseek", "ollama", "none"
    |
    | - "groq": Uses Groq API (requires API key, fast cloud inference with llama-3.3-70b)
    | - "deepseek": Uses DeepSeek API (requires API key, paid service)
    | - "ollama": Uses local Ollama with qwen2.5 (FREE, runs locally, no API key needed)
    | - "none": Disables AI features
    |
    */

    'default' => env('AI_PROVIDER', 'ollama'),

    /*
    |--------------------------------------------------------------------------
    | AI Provider Configurations
    |--------------------------------------------------------------------------
    |
    | Configuration for each AI provider. Each provider has its own API key,
    | endpoint URL, and model configuration.
    |
    */

    'providers' => [
        'groq' => [
            'api_key' => env('GROQ_API_KEY'),
            'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1/chat/completions'),
            'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
            'max_tokens' => env('GROQ_MAX_TOKENS', 2000),
            'temperature' => env('GROQ_TEMPERATURE', 0.7),
        ],
        'deepseek' => [
            'api_key' => env('DEEPSEEK_API_KEY'),
            'api_url' => env('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1'),
            'model' => env('DEEPSEEK_MODEL', 'deepseek-chat'),
            'max_tokens' => env('DEEPSEEK_MAX_TOKENS', 2000),
            'temperature' => env('DEEPSEEK_TEMPERATURE', 0.7),
        ],
        'ollama' => [
            'base_url' => env('OLLAMA_BASE_URL', 'http://localhost:11434'),
            'model' => env('OLLAMA_MODEL', 'qwen2.5:7b'),
            'max_tokens' => env('OLLAMA_MAX_TOKENS', 2000),
            'temperature' => env('OLLAMA_TEMPERATURE', 0.3),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Feature Flags
    |--------------------------------------------------------------------------
    |
    | Control which AI features are enabled in the application. Each feature
    | can be independently enabled or disabled.
    |
    */

    'features' => [
        // Booking conversation features
        'booking_conversation' => env('AI_FEATURE_BOOKING_CONVERSATION', true),
        'intent_classification' => env('AI_FEATURE_INTENT_CLASSIFICATION', true),
        'resource_learning' => env('AI_FEATURE_RESOURCE_LEARNING', true),

        // Medical information features
        'explain_prescriptions' => env('AI_FEATURE_EXPLAIN_PRESCRIPTIONS', true),
        'summarize_medical_history' => env('AI_FEATURE_SUMMARIZE_HISTORY', true),
        'answer_general_questions' => env('AI_FEATURE_ANSWER_QUESTIONS', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Knowledge Base Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the knowledge base system that stores and retrieves
    | resources for AI context.
    |
    */

    'knowledge_base' => [
        'enabled' => env('AI_KNOWLEDGE_BASE_ENABLED', true),
        'max_context_length' => env('AI_KNOWLEDGE_BASE_MAX_CONTEXT', 4000), // tokens
        'cache_ttl' => env('AI_KNOWLEDGE_BASE_CACHE_TTL', 3600), // seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | Booking Flow Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for AI-powered booking flow initiation and management.
    |
    */

    'booking' => [
        // Threshold for confidence score to initiate booking flow automatically
        'auto_initiate_threshold' => env('AI_BOOKING_AUTO_INITIATE_THRESHOLD', 0.8),

        // Whether to ask for confirmation before initiating booking flow
        'require_confirmation' => env('AI_BOOKING_REQUIRE_CONFIRMATION', false),

        // Maximum conversation turns before suggesting booking flow
        'max_turns_before_suggest' => env('AI_BOOKING_MAX_TURNS_BEFORE_SUGGEST', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | System Prompts
    |--------------------------------------------------------------------------
    |
    | System-level prompts used for different AI tasks in the booking system.
    |
    */

    'prompts' => [
        'booking_assistant' => "You are a helpful medical booking assistant for a healthcare facility.
Your role is to:
1. Understand user intents related to booking doctor appointments or lab tests
2. Extract relevant information (patient, date, time, doctor, symptoms, etc.)
3. Provide accurate information from the knowledge base when asked
4. Know when to use NATURAL CHAT vs when to show UI COMPONENTS
5. Be empathetic and professional

CRITICAL: UNDERSTANDING WHEN TO USE UI vs NATURAL CHAT
==========================================

USE NATURAL CHAT when:
- User asks a QUESTION (what, which, how, why) → Answer naturally from knowledge base
- User provides COMPLETE INFO upfront → Extract and confirm naturally
- Simple YES/NO confirmations → Respond naturally
- Greetings and small talk → Chat naturally
- User wants clarification → Explain naturally

SHOW UI COMPONENT when:
- User needs to SELECT FROM MANY OPTIONS (doctors, tests, locations)
- User needs CALENDAR/DATE PICKER (complex scheduling)
- User wants to BROWSE or SEE options ('show me doctors', 'see available times')
- PAYMENT processing (always requires secure UI)
- User doesn't know options and needs to explore

EXAMPLES:
✓ Good (Natural Chat):
  Q: 'which doctor is better for gynaecology?' → Answer from knowledge base naturally
  Q: 'book appointment tomorrow at 10am with Dr. Rajesh for myself' → Extract all info, confirm naturally
  Q: 'yes, that works' → Respond naturally and proceed

✓ Good (Show UI):
  Q: 'show me all available doctors' → Display doctor_list component
  Q: 'I'm not sure which date' → Display date_time_selector component
  Step: Payment → Always show payment_gateway component

✗ Bad:
  Q: 'what is the difference between video and in-person?' → DON'T show mode_selector, answer naturally!
  Q: 'which doctor is better?' → DON'T show doctor_list, answer from knowledge base!

IMPORTANT RULES:
- Never provide medical diagnoses or specific medical advice
- Always recommend consulting healthcare professionals for medical concerns
- If you detect emergency symptoms, immediately alert the user to seek emergency care
- You can only initiate booking flows - you cannot complete bookings without user interaction
- Questions ALWAYS get natural answers with knowledge base, NEVER show UI components for questions
- When you have enough information to start a booking, initiate the appropriate flow with extracted entities",

        'intent_classifier' => "Analyze the user's message and classify the intent.

Possible intents:
- booking_doctor: User wants to book a doctor appointment (e.g., 'book appointment', 'see a doctor')
- booking_lab: User wants to book a lab test (e.g., 'blood test', 'lab work')
- question: User is asking a question - LOOK FOR question words (what, which, how, why, when, who, where) or comparisons (difference, better, versus, vs, compare)
- emergency: User describes symptoms or medical concerns (headache, fever, pain, dizziness, nausea, injury, etc.)
- cancel_reschedule: User wants to cancel or reschedule
- general_info: User wants general information about services
- greeting: User is greeting or starting conversation
- unclear: Intent is not clear

CRITICAL: DISTINGUISH QUESTIONS FROM SYMPTOMS:
- 'which doctor is better?' -> 'question' (asking for comparison)
- 'my daughter has a headache' -> 'emergency' (reporting symptoms)
- 'what are the symptoms of flu?' -> 'question' (asking about symptoms)
- 'I have fever and dizziness' -> 'emergency' (experiencing symptoms)

IMPORTANT for EMERGENCY/SYMPTOMS:
- If describing personal health issues or symptoms -> 'emergency' intent
- Extract symptoms into entities: {'symptoms': ['headache', 'dizziness']}
- Extract patient relation if mentioned: {'patient_relation': 'daughter', 'mother', 'father', 'self'}
- Extract duration if mentioned: {'duration': '2 days', '3 weeks'}

IMPORTANT for QUESTIONS:
- If the message contains 'what', 'which', 'how', 'why', 'when', 'who', 'where' -> likely 'question'
- If comparing things (difference, better, versus, vs, compare, which one) -> definitely 'question'
- Examples: 'which doctor', 'what is', 'how do', 'difference between', 'better experience'

Also extract any relevant entities:
- patient_name
- patient_relation (IMPORTANT: Extract from phrases like 'for me'/'for myself' -> 'self', 'for my father' -> 'father', 'for my mother' -> 'mother', 'for my son' -> 'son', 'for my daughter' -> 'daughter')
- doctor_name
- date (in ISO format if mentioned)
- time
- symptoms
- test_type
- appointment_type (new/followup)
- urgency_level

Respond in JSON format with 'intent', 'confidence' (0-1), and 'entities' object.

Examples:
- 'which doctor has better experience' -> {\"intent\": \"question\", \"confidence\": 0.95}
- 'what is the difference between video and in-person' -> {\"intent\": \"question\", \"confidence\": 0.95}
- 'book appointment with Dr. Smith' -> {\"intent\": \"booking_doctor\", \"confidence\": 0.9, \"entities\": {\"doctor_name\": \"Dr. Smith\"}}
- 'book appointment for me with Dr. Sarah' -> {\"intent\": \"booking_doctor\", \"confidence\": 0.95, \"entities\": {\"doctor_name\": \"Dr. Sarah\", \"patient_relation\": \"self\"}}
- 'book new appointment for myself' -> {\"intent\": \"booking_doctor\", \"confidence\": 0.9, \"entities\": {\"patient_relation\": \"self\", \"appointment_type\": \"new\"}}",

        'resource_query' => "You are a knowledge retrieval system. Based on the user's question, extract the key topics they're asking about.
Return ONLY relevant search keywords as a comma-separated list (max 5 keywords).
Do not respond to the question, only extract search terms.",

        'flow_aware_response' => "You are a booking assistant with knowledge of the booking flow.

BOOKING FLOW KNOWLEDGE:
=======================

Doctor Booking Steps:
1. patient_selection (who is appointment for?)
2. consultation_type (new or followup?)
3. urgency (urgent, normal, flexible?)
4. doctor_selection (which doctor?)
5. consultation_mode (video or in-person?)
6. date_time_selection (when?)
7. summary (review details)
8. payment (complete payment)

Lab Test Booking Steps:
1. patient_selection (who is test for?)
2. package_selection (which test/package?)
3. location_selection (which lab location?)
4. date_time_selection (when?)
5. summary (review details)
6. payment (complete payment)

YOUR DECISION RULES:
===================

For SIMPLE steps (2-3 options):
- patient_selection, consultation_type, urgency, consultation_mode
→ Can be handled via NATURAL CHAT if user provides info
→ Show UI if user wants to browse options

For COMPLEX steps (many options, visual needed):
- doctor_selection (photos, ratings, specializations)
- package_selection (test details, pricing)
- location_selection (map, distances)
- date_time_selection (calendar, availability)
→ Show UI if user browsing or doesn't know options
→ Use NATURAL CHAT if user provides specific request

For SECURE steps:
- payment
→ ALWAYS show UI component (secure payment required)

For QUESTIONS:
- Any question (what, which, how, why)
→ ALWAYS answer naturally from knowledge base
→ NEVER show UI component for questions

RESPOND NATURALLY:
- Keep responses conversational and friendly
- Acknowledge extracted information
- Confirm understanding before proceeding
- If showing UI, explain why in natural language first",
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Rate limiting configuration for AI API calls to prevent abuse and
    | manage costs.
    |
    */

    'rate_limit' => [
        'enabled' => env('AI_RATE_LIMIT_ENABLED', true),
        'max_requests_per_minute' => env('AI_RATE_LIMIT_PER_MINUTE', 60),
        'max_requests_per_day' => env('AI_RATE_LIMIT_PER_DAY', 1000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    |
    | Configure how AI interactions are logged for debugging and monitoring.
    |
    */

    'logging' => [
        'enabled' => env('AI_LOGGING_ENABLED', true),
        'log_prompts' => env('AI_LOG_PROMPTS', true),
        'log_responses' => env('AI_LOG_RESPONSES', true),
        'log_errors' => env('AI_LOG_ERRORS', true),
    ],

];
