<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Configuration
    |--------------------------------------------------------------------------
    |
    | General AI configuration for the booking system.
    |
    */

    'ai' => [
        'enabled' => env('BOOKING_AI_ENABLED', true),
        'parser_confidence_threshold' => env('BOOKING_PARSER_CONFIDENCE_THRESHOLD', 0.7),
        'use_ai_fallback' => env('BOOKING_USE_AI_FALLBACK', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Smart Parser Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the local SmartBookingParser that handles 90% of
    | booking queries instantly without any API calls.
    |
    */

    'smart_parser' => [
        'enabled' => env('BOOKING_SMART_PARSER_ENABLED', true),
        'confidence_threshold' => env('BOOKING_PARSER_CONFIDENCE_THRESHOLD', 0.7),
    ],

    /*
    |--------------------------------------------------------------------------
    | Groq AI Fallback Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Groq AI (Llama 3.3 70B) used as a fallback when
    | SmartBookingParser confidence is below the threshold.
    |
    */

    'groq_fallback' => [
        'enabled' => env('BOOKING_GROQ_FALLBACK_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Auto-Resolution Configuration
    |--------------------------------------------------------------------------
    |
    | Enable automatic resolution of entities like patient relations and
    | doctor names to their corresponding IDs.
    |
    | Examples:
    | - "for me" → selectedPatientId: 1 (Yourself)
    | - "dr sarah" → selectedDoctorId: 5 (Dr. Sarah Khan)
    |
    */

    'auto_resolution' => [
        'enabled' => env('BOOKING_AUTO_RESOLUTION_ENABLED', true),
        'fuzzy_matching_threshold' => 60.0, // Similarity threshold for doctor name matching (0-100)
    ],

    /*
    |--------------------------------------------------------------------------
    | Smart Step Skipping Configuration
    |--------------------------------------------------------------------------
    |
    | Enable automatic skipping of booking steps that already have data
    | collected from the user's initial message.
    |
    */

    'smart_skipping' => [
        'enabled' => env('BOOKING_SMART_SKIPPING_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    |
    | Configure logging level for booking orchestrator.
    | Options: debug, info, warning, error
    |
    */

    'logging' => [
        'level' => env('BOOKING_LOG_LEVEL', 'info'),
        'enabled' => env('APP_DEBUG', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Booking Flow Steps
    |--------------------------------------------------------------------------
    |
    | Define the steps for each booking type.
    |
    */

    'steps' => [
        'doctor' => [
            'patient_selection',
            'consultation_type',
            'symptoms',
            'urgency_selection',
            'doctor_selection',
            'time_slot_selection',
            'mode_selection',
            'booking_summary',
            'payment',
        ],
        'test' => [
            'patient_selection',
            'test_type_selection',
            'package_selection',
            'collection_selection',
            'date_time_selection',
            'booking_summary',
            'payment',
        ],
    ],

];
