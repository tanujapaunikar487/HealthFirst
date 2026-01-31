<?php

namespace App\Services\Booking;

use App\BookingConversation;
use App\ConversationMessage;
use App\Services\AI\AIService;
use App\Services\Booking\BookingStateMachine;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Intelligent Booking Orchestrator
 *
 * Uses AI to extract entities from user messages and dynamically determine
 * the next step based on what information is missing, rather than following
 * a fixed linear flow.
 */
class IntelligentBookingOrchestrator
{
    public function __construct(
        private AIService $aiService
    ) {}

    /**
     * Process user input using AI-driven entity extraction
     */
    public function process(BookingConversation $conversation, ?string $userInput = null, ?array $componentSelection = null): array
    {
        Log::info('=== BOOKING FLOW DEBUG START ===', [
            'conversation_id' => $conversation->id,
            'input_message' => $userInput,
            'display_message' => $componentSelection['display_message'] ?? null,
            'current_state' => $conversation->collected_data,
        ]);

        // Add user message if there's input
        if ($userInput || $componentSelection) {
            $this->addUserMessage($conversation, $userInput, $componentSelection);
        }

        // If we have a component selection, handle it directly (even if there's formatted text)
        // Component selections should bypass AI parsing
        if ($componentSelection) {
            Log::info('🔒 Process: Component selection detected, calling handleComponentSelection', [
                'has_userInput' => !empty($userInput),
                'selection_keys' => array_keys($componentSelection),
            ]);
            return $this->handleComponentSelection($conversation, $componentSelection);
        }

        // Check if we're waiting for followup_notes
        $currentData = $conversation->collected_data;
        $appointmentType = $currentData['appointmentType'] ?? null;
        $hasFollowupReason = !empty($currentData['followup_reason']);
        $followupNotesAsked = $currentData['followup_notes_asked'] ?? false;

        // Special handling: If we're waiting for followup_notes, capture the raw message
        if ($appointmentType === 'followup' && $hasFollowupReason && !$followupNotesAsked) {
            $trimmedInput = trim($userInput ?? '');
            $isSkip = in_array(strtolower($trimmedInput), ['skip', 'no updates', 'no', 'none', 'nothing']);

            Log::info('🔒 Detected followup_notes response', [
                'input' => $trimmedInput,
                'is_skip' => $isSkip,
            ]);

            // Store the notes and mark as asked
            $currentData['followup_notes'] = $isSkip ? '' : $trimmedInput;
            $currentData['followup_notes_asked'] = true;
            $conversation->collected_data = $currentData;
            $conversation->save();

            // Use state machine to determine next step
            $stateMachine = new BookingStateMachine($currentData);
            return $this->buildResponseFromStateMachine($conversation, $stateMachine, ['entities' => []]);
        }

        // Use AI to parse the user's message and extract entities
        $parsed = $this->parseUserMessage($conversation, $userInput ?? '');

        Log::info('IntelligentOrchestrator: Parsed result', [
            'intent' => $parsed['intent'] ?? 'unknown',
            'confidence' => $parsed['confidence'] ?? 0,
            'entities_count' => count($parsed['entities'] ?? []),
        ]);

        // Handle cancellation intent
        if (($parsed['intent'] ?? '') === 'cancel') {
            Log::info('🚫 Cancellation Detected', [
                'conversation_id' => $conversation->id,
                'current_state' => $conversation->collected_data,
            ]);

            $conversation->status = 'cancelled';
            $conversation->current_step = 'cancelled';
            $conversation->save();

            $this->addAssistantMessage(
                $conversation,
                "No problem! Booking cancelled. Let me know if you need anything else.",
                null,
                null
            );

            return [
                'status' => 'cancelled',
                'message' => "No problem! Booking cancelled. Let me know if you need anything else.",
                'component_type' => null,
                'component_data' => null,
                'ready_to_book' => false,
                'conversation_cancelled' => true,
                'progress' => [
                    'percentage' => 0,
                    'current_state' => 'cancelled',
                    'missing_fields' => [],
                ],
            ];
        }

        // MODE DEBUG LOGGING
        Log::info('🔍 MODE DEBUG', [
            'user_input' => $userInput,
            'extracted_mode' => $parsed['entities']['mode'] ?? $parsed['entities']['consultation_mode'] ?? 'not extracted',
            'extracted_entities_keys' => array_keys($parsed['entities'] ?? []),
            'current_consultationMode' => $conversation->collected_data['consultationMode'] ?? 'not set',
        ]);

        // FALLBACK: If mode is missing but we need it, check for keywords
        $currentData = $conversation->collected_data;
        $needsMode = !empty($currentData['selectedDoctorId']) &&
                     !empty($currentData['selectedDate']) &&
                     !empty($currentData['selectedTime']) &&
                     empty($currentData['consultationMode']);

        if ($needsMode && $userInput && empty($parsed['entities']['mode']) && empty($parsed['entities']['consultation_mode'])) {
            $inputLower = strtolower($userInput);
            $detectedMode = null;

            // Check for video keywords
            if (preg_match('/\b(video|online|virtual|video call|video appointment)\b/', $inputLower)) {
                $detectedMode = 'video';
            }
            // Check for in-person keywords
            elseif (preg_match('/\b(in person|in-person|visit|clinic|office|physical)\b/', $inputLower)) {
                $detectedMode = 'in_person';
            }

            // Validate detected mode against doctor's supported modes
            if ($detectedMode) {
                $doctorId = $currentData['selectedDoctorId'] ?? null;
                $doctor = $doctorId ? $this->getDoctorDetailsById($doctorId) : null;
                $supportedModes = $doctor['consultation_modes'] ?? ['video', 'in_person'];

                if (in_array($detectedMode, $supportedModes)) {
                    $parsed['entities']['consultation_mode'] = $detectedMode;
                    Log::info('🔧 MODE FALLBACK: Detected and validated mode keyword', [
                        'user_input' => $userInput,
                        'detected_mode' => $detectedMode,
                    ]);
                } else {
                    Log::warning('⚠️ MODE FALLBACK: Detected mode not supported by doctor', [
                        'user_input' => $userInput,
                        'detected_mode' => $detectedMode,
                        'doctor_supported_modes' => $supportedModes,
                    ]);
                }
            }
        }

        // Check for emergency
        if ($parsed['is_emergency'] ?? false) {
            return $this->handleEmergency($conversation, $parsed);
        }

        // Detect date/time change intent from text when booking is at or near summary
        // If user sends urgency or date entities while date/time are already set,
        // clear them so the date picker is shown instead of looping back to summary
        $currentData = $conversation->collected_data;
        $hasExistingDate = !empty($currentData['selectedDate']);
        $hasExistingTime = !empty($currentData['selectedTime']);
        $entities = $parsed['entities'] ?? [];
        $hasDateIntent = isset($entities['urgency']) || isset($entities['specific_date']) || isset($entities['date']);

        if ($hasExistingDate && $hasDateIntent) {
            Log::info('🔄 Date/time change detected via text at summary stage', [
                'has_urgency_entity' => isset($entities['urgency']),
                'has_date_entity' => isset($entities['specific_date']) || isset($entities['date']),
                'current_date' => $currentData['selectedDate'] ?? null,
                'current_time' => $currentData['selectedTime'] ?? null,
            ]);
            // Pre-clear date/time so the merge + state machine will show the date picker
            $currentData['selectedDate'] = null;
            $currentData['selectedTime'] = null;
            unset($currentData['consultationMode']);
            $currentData['completedSteps'] = array_values(array_diff(
                $currentData['completedSteps'] ?? [],
                ['date', 'time', 'mode']
            ));
            $conversation->collected_data = $currentData;
        }

        // Merge extracted entities with existing data (smart merge)
        $updatedData = $this->mergeEntities($conversation->collected_data, $parsed['entities'] ?? [], $parsed);

        Log::info('IntelligentOrchestrator: Merging entities', [
            'intent' => $parsed['intent'] ?? 'unknown',
            'is_correction' => $parsed['is_correction'] ?? false,
            'fields_to_change' => $parsed['changes_requested'] ?? [],
            'new_entities_count' => count($parsed['entities'] ?? []),
            'new_entities' => $parsed['entities'] ?? [],
            'existing_keys' => array_keys($conversation->collected_data),
        ]);

        // Update conversation data
        $conversation->collected_data = $updatedData;
        $conversation->save();

        // Use state machine to determine next step
        $stateMachine = new BookingStateMachine($updatedData);

        Log::info('IntelligentOrchestrator: State machine initialized', $stateMachine->getDebugInfo());

        // Build response
        $response = $this->buildResponseFromStateMachine($conversation, $stateMachine, $parsed);

        Log::info('=== BOOKING FLOW DEBUG END ===', [
            'state' => $stateMachine->getCurrentState(),
            'response_message' => $response['message'] ?? '',
            'component_type' => $response['component_type'] ?? 'none',
            'has_component_data' => isset($response['component_data']),
            'completeness' => $stateMachine->getCompletenessPercentage(),
        ]);

        return $response;
    }

    /**
     * Parse user message using AI to extract all entities
     */
    protected function parseUserMessage(BookingConversation $conversation, string $message): array
    {
        // Build conversation history for context
        $history = $conversation->messages()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->reverse()
            ->map(function ($msg) {
                return [
                    'role' => $msg->role,
                    'content' => $msg->content,
                ];
            })
            ->toArray();

        try {
            Log::info('🤖 AI Classification: Calling classifyIntent', [
                'message' => $message,
                'history_count' => count($history),
            ]);

            $result = $this->aiService->classifyIntent($message, $history);

            Log::info('🤖 AI Classification: Result received', [
                'full_result' => $result,
                'intent' => $result['intent'] ?? 'null',
                'confidence' => $result['confidence'] ?? 'null',
                'entities' => $result['entities'] ?? [],
                'is_emergency' => $result['is_emergency'] ?? 'null',
            ]);

            // Determine if this is a correction based on changes_requested
            $isCorrection = !empty($result['changes_requested']);

            return [
                'intent' => $result['intent'] ?? 'unclear',
                'confidence' => $result['confidence'] ?? 0.5,
                'entities' => $result['entities'] ?? [],
                'is_emergency' => $result['is_emergency'] ?? false,
                'emergency_keywords' => $result['emergency_indicators'] ?? [],
                'is_correction' => $isCorrection,
                'is_skip' => $result['is_skip'] ?? false,
                'is_confirmation' => $result['is_confirmation'] ?? false,
                'changes_requested' => $result['changes_requested'] ?? null,
                'requires_clarification' => $result['requires_clarification'] ?? false,
                'clarification_needed' => $result['clarification_needed'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('AI parsing failed', [
                'error' => $e->getMessage(),
                'message' => $message,
            ]);

            // Fallback to basic parsing
            return [
                'intent' => 'unclear',
                'confidence' => 0.3,
                'entities' => [],
                'is_emergency' => false,
            ];
        }
    }

    /**
     * Intelligently merge AI-extracted entities with existing data
     *
     * Key principle: Don't blindly overwrite. Only update if:
     * 1. Field is currently empty
     * 2. User is explicitly correcting/changing
     * 3. New value is more specific than existing value
     */
    protected function mergeEntities(array $currentData, array $newEntities, array $parsed): array
    {
        $updated = $currentData;

        // Map AI entities to our data structure
        $entityMap = [
            'patient_relation' => 'patientRelation',
            'appointment_type' => 'appointmentType',
            'symptoms' => 'symptoms',
            'urgency' => 'urgency',
            'specific_date' => 'selectedDate',
            'date' => 'selectedDate',
            'time' => 'selectedTime',
            'doctor_id' => 'selectedDoctorId',
            'doctor_name' => 'selectedDoctorName',
            'followup_reason' => 'followup_reason',
            'followup_notes' => 'followup_notes',
            'mode' => 'consultationMode',
            'consultation_mode' => 'consultationMode', // Alternative key
        ];

        Log::info('🔀 Entity Merge: Starting', [
            'new_entities_received' => $newEntities,
            'current_data_keys' => array_keys($currentData),
            'entity_map' => $entityMap,
        ]);

        $isCorrection = $parsed['is_correction'] ?? false;
        $appointmentType = $currentData['appointmentType'] ?? null;
        $hasFollowupReason = !empty($currentData['followup_reason']);

        foreach ($newEntities as $entityKey => $entityValue) {
            if (empty($entityValue)) {
                Log::debug('🔀 Entity Merge: Skipping empty entity', ['entity_key' => $entityKey]);
                continue;
            }

            // CRITICAL: For follow-up appointments, don't accept symptoms if followup_reason is missing
            // User must first select a followup_reason from the component
            if ($appointmentType === 'followup' && !$hasFollowupReason && $entityKey === 'symptoms') {
                Log::info('⛔ Entity Merge: BLOCKING symptoms for follow-up until followup_reason is selected', [
                    'entity_key' => $entityKey,
                    'value' => $entityValue,
                    'reason' => 'followup_reason must be selected first',
                ]);
                continue; // Skip this entity
            }

            $dataKey = $entityMap[$entityKey] ?? $entityKey;
            $currentValue = $updated[$dataKey] ?? null;

            Log::info('🔀 Entity Merge: Processing entity', [
                'ai_entity_key' => $entityKey,
                'mapped_data_key' => $dataKey,
                'new_value' => $entityValue,
                'current_value' => $currentValue,
                'is_correction' => $isCorrection,
            ]);

            // Decide if we should update this field
            if ($this->shouldUpdateField($dataKey, $entityValue, $currentValue, $isCorrection)) {
                Log::info('✅ Entity Merge: UPDATING field', [
                    'field' => $dataKey,
                    'old_value' => $currentValue,
                    'new_value' => $entityValue,
                    'reason' => $isCorrection ? 'correction' : 'new_data',
                ]);

                $updated[$dataKey] = $entityValue;

                // Handle patient relation special case
                if ($dataKey === 'patientRelation') {
                    if ($entityValue === 'self') {
                        $updated['selectedPatientId'] = 1;
                        $updated['selectedPatientName'] = 'Yourself';
                        $updated['selectedPatientAvatar'] = '/assets/avatars/self.png';
                    } else {
                        // Non-self patient (e.g., "my mother", "my son") — clear existing
                        // patient data so the patient selector is shown for confirmation
                        unset($updated['selectedPatientId']);
                        $updated['selectedPatientName'] = $entityValue;
                        unset($updated['selectedPatientAvatar']);
                        $updated['completedSteps'] = array_values(array_diff(
                            $updated['completedSteps'] ?? [],
                            ['patient']
                        ));
                    }
                }

                // Handle appointment type change — clear downstream fields
                if ($dataKey === 'appointmentType' && !empty($currentValue) && $entityValue !== $currentValue) {
                    Log::info('🔄 Appointment type changed via text', [
                        'old_type' => $currentValue,
                        'new_type' => $entityValue,
                    ]);
                    // Clear all downstream fields since a type change resets the flow
                    unset($updated['urgency']);
                    unset($updated['selectedDoctorId']);
                    unset($updated['selectedDoctorName']);
                    unset($updated['selectedDoctorAvatar']);
                    unset($updated['selectedDoctorSpecialization']);
                    unset($updated['doctorSearchQuery']);
                    unset($updated['selectedDate']);
                    unset($updated['selectedTime']);
                    unset($updated['consultationMode']);
                    // Clear followup-specific fields if leaving followup mode
                    if ($currentValue === 'followup') {
                        unset($updated['followup_reason']);
                        unset($updated['followup_notes']);
                        unset($updated['followup_notes_asked']);
                        unset($updated['previous_doctors_shown']);
                    }
                    $updated['completedSteps'] = array_values(array_diff(
                        $updated['completedSteps'] ?? [],
                        ['urgency', 'doctor', 'date', 'time', 'mode', 'followup_reason', 'followup_notes']
                    ));
                }

                // Handle urgency change — clear downstream date/time so the date picker is shown
                if ($dataKey === 'urgency' && !empty($currentValue) && $entityValue !== $currentValue) {
                    Log::info('🔄 Urgency changed via text', [
                        'old_urgency' => $currentValue,
                        'new_urgency' => $entityValue,
                    ]);
                    // Different urgency means different date window — clear date, time, and mode
                    // so the user sees a fresh date picker for the new urgency window
                    unset($updated['selectedDate']);
                    unset($updated['selectedTime']);
                    unset($updated['consultationMode']);
                    $updated['completedSteps'] = array_values(array_diff(
                        $updated['completedSteps'] ?? [],
                        ['date', 'time', 'mode']
                    ));
                }

                // Handle date formatting and doctor availability check
                if ($dataKey === 'selectedDate' && is_string($entityValue)) {
                    try {
                        $parsedDate = Carbon::parse($entityValue);

                        // If the parsed date is in the past, adjust to the current/next year
                        // This handles cases where AI returns "3 feb" as 2024-02-03 instead of 2026-02-03
                        if ($parsedDate->isPast() && $parsedDate->diffInDays(Carbon::today()) > 1) {
                            $parsedDate = $parsedDate->year(Carbon::today()->year);
                            // If still in the past (e.g., Jan date when it's already Feb), use next year
                            if ($parsedDate->isPast() && $parsedDate->diffInDays(Carbon::today()) > 1) {
                                $parsedDate = $parsedDate->addYear();
                            }
                        }

                        $formattedDate = $parsedDate->format('Y-m-d');
                        $updated[$dataKey] = $formattedDate;

                        // If a doctor is already selected, check availability on the new date
                        $existingDoctorId = $updated['selectedDoctorId'] ?? null;
                        if ($existingDoctorId) {
                            $availability = $this->checkDoctorAvailabilityForDate($existingDoctorId, $formattedDate);
                            if (!$availability['available']) {
                                $doctorName = $updated['selectedDoctorName'] ?? 'your doctor';
                                Log::info('⚠️ Date change: doctor not available on new date', [
                                    'doctor_id' => $existingDoctorId,
                                    'doctor_name' => $doctorName,
                                    'new_date' => $formattedDate,
                                ]);

                                $updated['doctor_unavailable_on_date'] = true;
                                $updated['doctor_unavailable_context'] = [
                                    'doctor_name' => $doctorName,
                                    'requested_date' => $formattedDate,
                                    'next_available_date' => $availability['next_available_date'] ?? null,
                                    'alternative_doctors' => $availability['alternative_doctors'] ?? [],
                                ];

                                unset($updated['selectedDoctorId']);
                                unset($updated['selectedDoctorName']);
                                unset($updated['selectedDoctorAvatar']);
                                unset($updated['selectedDoctorSpecialization']);
                                unset($updated['selectedTime']);
                                unset($updated['consultationMode']);
                                // Clean up completedSteps for cleared fields
                                $updated['completedSteps'] = array_values(array_diff(
                                    $updated['completedSteps'] ?? [],
                                    ['doctor', 'time', 'mode']
                                ));
                            } else if (!empty($updated['selectedTime'])) {
                                // Doctor available but check if the specific time is still valid
                                $timeAvailable = $this->validateTimeSlotForDoctor(
                                    $existingDoctorId, $formattedDate, $updated['selectedTime']
                                );
                                if (!$timeAvailable) {
                                    unset($updated['selectedTime']);
                                    unset($updated['consultationMode']);
                                    $updated['completedSteps'] = array_values(array_diff(
                                        $updated['completedSteps'] ?? [],
                                        ['time', 'mode']
                                    ));
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Date parsing failed', ['date' => $entityValue]);
                    }
                }

                // Handle doctor name - store as search query for filtered doctor list
                if ($dataKey === 'selectedDoctorName' && !empty($entityValue)) {
                    $doctorId = $this->getDoctorIdByName($entityValue);
                    $existingDoctorId = $updated['selectedDoctorId'] ?? null;
                    $isDifferentDoctor = $doctorId && $existingDoctorId && $doctorId != $existingDoctorId;

                    // Store the search query so the doctor list can be filtered
                    $updated['doctorSearchQuery'] = $entityValue;

                    if ($doctorId && $existingDoctorId && $isDifferentDoctor) {
                        // User is changing to a different doctor (already had one selected)
                        // Clear the old doctor so the filtered list is shown
                        Log::info('🔄 Doctor change detected via free text', [
                            'old_doctor_id' => $existingDoctorId,
                            'new_doctor_id' => $doctorId,
                        ]);
                        unset($updated['selectedDoctorId']);
                        unset($updated['selectedDoctorName']);
                        unset($updated['selectedDoctorAvatar']);
                        unset($updated['selectedDoctorSpecialization']);
                        unset($updated['selectedTime']);
                        unset($updated['consultationMode']);
                        $updated['completedSteps'] = array_values(array_diff(
                            $updated['completedSteps'] ?? [],
                            ['doctor', 'time', 'mode']
                        ));
                    } elseif ($doctorId && empty($existingDoctorId)) {
                        // No doctor selected yet - store the name but don't auto-select
                        // so the user sees the filtered list and can confirm
                        $updated['selectedDoctorName'] = $entityValue;

                        Log::info('🔍 Doctor name extracted, showing filtered list', [
                            'extracted_name' => $entityValue,
                            'matched_doctor_id' => $doctorId,
                        ]);
                    }
                }

                // Handle time change via text — normalize format and validate against doctor
                if ($dataKey === 'selectedTime' && !empty($entityValue)) {
                    // Normalize 12-hour format to 24-hour (e.g., "3:00 PM" -> "15:00")
                    $normalizedTime = $entityValue;
                    if (preg_match('/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i', trim($entityValue), $matches)) {
                        $hours = (int) $matches[1];
                        $minutes = $matches[2];
                        $period = strtoupper($matches[3]);
                        if ($period === 'PM' && $hours !== 12) $hours += 12;
                        if ($period === 'AM' && $hours === 12) $hours = 0;
                        $normalizedTime = sprintf('%02d:%s', $hours, $minutes);
                    }
                    $updated['selectedTime'] = $normalizedTime;

                    // Validate against doctor's available slots
                    $doctorId = $updated['selectedDoctorId'] ?? null;
                    if ($doctorId) {
                        $isValid = $this->validateTimeSlotForDoctor(
                            $doctorId, $updated['selectedDate'] ?? null, $normalizedTime
                        );
                        if (!$isValid) {
                            Log::warning('⚠️ Time from text not available for doctor', [
                                'original' => $entityValue,
                                'normalized' => $normalizedTime,
                                'doctor_id' => $doctorId,
                            ]);
                            // Keep the time anyway — the state machine will show time_selection
                            // with the correct available slots for the user to pick from
                            unset($updated['selectedTime']);
                            $updated['completedSteps'] = array_values(array_diff(
                                $updated['completedSteps'] ?? [],
                                ['time']
                            ));
                        }
                    }
                }

                // Handle consultation mode change — validate against doctor's supported modes
                if ($dataKey === 'consultationMode' && !empty($entityValue)) {
                    $doctorId = $updated['selectedDoctorId'] ?? null;
                    if ($doctorId) {
                        $doctor = $this->getDoctorDetailsById($doctorId);
                        if ($doctor) {
                            $supportedModes = $doctor['consultation_modes'] ?? [];
                            $doctorName = $doctor['name'] ?? 'this doctor';
                            if (!in_array($entityValue, $supportedModes)) {
                                $modeLabel = $entityValue === 'video' ? 'video consultations' : 'in-person visits';
                                if (count($supportedModes) === 1) {
                                    $onlyModeLabel = $supportedModes[0] === 'video' ? 'video appointments' : 'in-person visits';
                                    $updated['consultationMode'] = $supportedModes[0];
                                    $updated['mode_conflict'] = [
                                        'doctor_name' => $doctorName,
                                        'requested_mode' => $entityValue,
                                        'available_mode' => $supportedModes[0],
                                        'message' => "{$doctorName} only offers {$onlyModeLabel}. I've updated the consultation mode. If you'd prefer {$modeLabel}, you can change the doctor.",
                                    ];
                                    Log::info('🔧 Mode auto-corrected with notification', [
                                        'requested' => $entityValue,
                                        'corrected_to' => $supportedModes[0],
                                        'doctor_id' => $doctorId,
                                    ]);
                                } else {
                                    Log::warning('⚠️ Mode not supported by doctor', [
                                        'requested' => $entityValue,
                                        'supported' => $supportedModes,
                                        'doctor_id' => $doctorId,
                                    ]);
                                }
                            }
                        }
                    }
                }
            }
        }

        return $updated;
    }

    /**
     * Determine if a field should be updated with new value
     */
    protected function shouldUpdateField(string $field, $newValue, $currentValue, bool $isCorrection): bool
    {
        // No existing value - always update
        if (empty($currentValue)) {
            return true;
        }

        // User is explicitly correcting - always update
        if ($isCorrection) {
            return true;
        }

        // Allow overwriting when the new value is explicitly different (user wants to change)
        // This handles text input like "book with dr vikram", "book for my mother",
        // "make it a follow-up", "change to 2 feb", etc.
        $changeableFields = [
            'selectedDoctorName', 'selectedDoctorId', 'consultationMode',
            'selectedDate', 'selectedTime', 'urgency',
            'patientRelation', 'appointmentType',
        ];
        if (in_array($field, $changeableFields) && $newValue !== $currentValue) {
            return true;
        }

        // For some fields, new specific data should override vague existing data
        // But be careful not to overwrite good data with vague references
        return false; // Default: don't overwrite existing data
    }

    /**
     * Analyze booking state to determine what we have and what's missing
     */
    protected function analyzeBookingState(array $data): array
    {
        $bookingType = $data['booking_type'] ?? 'doctor';
        $appointmentType = $data['appointmentType'] ?? null;

        // Define required fields based on appointment type
        $requiredFields = [
            'patient' => !empty($data['selectedPatientId']) || !empty($data['patientRelation']),
            'appointment_type' => !empty($data['appointmentType']),
            'doctor' => !empty($data['selectedDoctorId']),
            'date' => !empty($data['selectedDate']),
            'time' => !empty($data['selectedTime']),
            'mode' => !empty($data['consultationMode']),
        ];

        Log::info('📊 State Analysis: Checking fields', [
            'selectedPatientId' => $data['selectedPatientId'] ?? 'null',
            'patientRelation' => $data['patientRelation'] ?? 'null',
            'patient_field_satisfied' => $requiredFields['patient'],
            'appointmentType' => $data['appointmentType'] ?? 'null',
            'selectedDoctorId' => $data['selectedDoctorId'] ?? 'null',
            'selectedDate' => $data['selectedDate'] ?? 'null',
            'selectedTime' => $data['selectedTime'] ?? 'null',
            'consultationMode' => $data['consultationMode'] ?? 'null',
            'doctor_satisfied' => $requiredFields['doctor'],
            'date_satisfied' => $requiredFields['date'],
            'time_satisfied' => $requiredFields['time'],
            'mode_satisfied' => $requiredFields['mode'],
            'all_data_keys' => array_keys($data),
        ]);

        // Add appointment-type-specific requirements
        if (in_array($appointmentType, ['new', 'followup'])) {
            // Urgency is required if no specific date is provided
            $hasSpecificDate = !empty($data['selectedDate']);
            $requiredFields['urgency'] = !$hasSpecificDate && !empty($data['urgency']);

            Log::info('📊 State Analysis: Checking urgency for appointment', [
                'appointmentType' => $appointmentType,
                'hasSpecificDate' => $hasSpecificDate,
                'selectedDate' => $data['selectedDate'] ?? 'null',
                'urgency' => $data['urgency'] ?? 'null',
                'urgency_required' => $requiredFields['urgency'],
            ]);
        }

        if ($appointmentType === 'followup') {
            $followupReasonValue = $data['followup_reason'] ?? null;
            $followupReasonSatisfied = !empty($followupReasonValue);
            $requiredFields['followup_reason'] = $followupReasonSatisfied;

            Log::info('📊 State Analysis: Checking followup_reason', [
                'raw_value' => $followupReasonValue,
                'is_empty' => empty($followupReasonValue),
                'satisfied' => $followupReasonSatisfied,
                'all_data_keys' => array_keys($data),
            ]);
        }

        // Determine what we have and what's missing
        $have = [];
        $missing = [];

        foreach ($requiredFields as $field => $hasValue) {
            if ($hasValue) {
                $have[] = $field;
            } else {
                $missing[] = $field;
            }
        }

        // Calculate completeness
        $totalFields = count($requiredFields);
        $completedFields = count($have);
        $completeness = $totalFields > 0 ? round(($completedFields / $totalFields) * 100) . '%' : '0%';

        // Determine next field with priority logic
        $nextField = $this->determineNextField($missing, $data);

        // Check if ready to book
        $readyToBook = count($missing) === 0;

        Log::info('📊 State Analysis: Completeness check', [
            'required_fields_count' => count($requiredFields),
            'have_count' => count($have),
            'missing_count' => count($missing),
            'missing_fields' => $missing,
            'ready_to_book' => $readyToBook,
            'completeness' => $completeness,
        ]);

        return [
            'booking_type' => $bookingType,
            'have' => $have,
            'missing' => $missing,
            'next_field' => $nextField,
            'ready_to_book' => $readyToBook,
            'completeness' => $completeness,
        ];
    }

    /**
     * Determine the next most important field to ask for
     *
     * Uses context-aware prioritization instead of fixed order
     */
    protected function determineNextField(array $missing, array $data): ?string
    {
        if (empty($missing)) {
            Log::info('🎯 Next Field: No missing fields, ready for summary');
            return null; // Ready for summary
        }

        // CRITICAL: Check completedSteps and remove completed fields from missing array
        $completedSteps = $data['completedSteps'] ?? [];

        // Map completed step names to field names
        $stepToFieldMap = [
            'patient' => 'patient',
            'appointmentType' => 'appointment_type',
            'urgency' => 'urgency',
            'followup_reason' => 'followup_reason',
            'followup_notes' => 'followup_notes',
            'doctor' => 'doctor',
            'date' => 'date',
            'time' => 'time',
            'mode' => 'mode',
        ];

        // Remove completed fields from missing
        foreach ($completedSteps as $completedStep) {
            if (isset($stepToFieldMap[$completedStep])) {
                $fieldName = $stepToFieldMap[$completedStep];
                $missing = array_values(array_diff($missing, [$fieldName]));
            }
        }

        Log::info('🎯 Next Field: After completedSteps filtering', [
            'completedSteps' => $completedSteps,
            'remaining_missing' => $missing,
        ]);

        if (empty($missing)) {
            Log::info('🎯 Next Field: All fields completed, ready for summary');
            return null;
        }

        Log::info('🎯 Next Field: Calculating priorities', [
            'missing_fields' => $missing,
            'current_data' => $data,
        ]);

        // 🚨 CRITICAL: For follow-up appointments, enforce MANDATORY sequence
        $appointmentType = $data['appointmentType'] ?? null;
        if ($appointmentType === 'followup') {
            Log::info('🔒 Next Field: Follow-up appointment detected - enforcing mandatory sequence', [
                'missing_array' => $missing,
                'followup_reason' => $data['followup_reason'] ?? 'null',
                'followup_notes_asked' => $data['followup_notes_asked'] ?? false,
                'previous_doctors_shown' => $data['previous_doctors_shown'] ?? false,
                'selectedDoctorId' => $data['selectedDoctorId'] ?? 'null',
            ]);

            // 1. followup_reason is REQUIRED (must be selected)
            if (in_array('followup_reason', $missing)) {
                Log::info('🔒 Next Field: MANDATORY followup_reason is missing - RETURNING followup_reason');
                return 'followup_reason';
            }

            // 2. followup_notes must be ASKED (user can skip, but we must ask)
            $followupNotesAsked = $data['followup_notes_asked'] ?? false;
            if (!$followupNotesAsked) {
                Log::info('🔒 Next Field: MANDATORY followup_notes needs to be asked - RETURNING followup_notes');
                return 'followup_notes';
            }

            // 3. previous_doctors should be shown BEFORE generic doctor list
            if (in_array('doctor', $missing)) {
                // Check if we should show previous doctors first
                $previousDoctorsShown = $data['previous_doctors_shown'] ?? false;
                if (!$previousDoctorsShown) {
                    Log::info('🔒 Next Field: Showing previous_doctors before generic doctor list - RETURNING previous_doctors');
                    return 'previous_doctors';
                }
            }

            Log::info('🔒 Next Field: Follow-up mandatory fields satisfied, continuing with normal priority');
        }

        // Priority scoring
        $scores = [];

        foreach ($missing as $field) {
            $score = 50; // Base score

            switch ($field) {
                case 'patient':
                    $score += 100; // Always highest priority
                    Log::debug('🎯 Next Field: patient score = ' . ($score + 100));
                    break;

                case 'appointment_type':
                    $score += 90; // Need this early to determine flow
                    break;

                case 'followup_reason':
                    // Only relevant if appointment_type is followup
                    if (($data['appointmentType'] ?? null) === 'followup') {
                        $score += 85;
                    }
                    break;

                case 'urgency':
                    // NEVER ask urgency if date, doctor, or time is already selected
                    if (!empty($data['selectedDate']) || !empty($data['selectedDoctorId']) || !empty($data['selectedTime'])) {
                        $score = 0; // Skip urgency - user has already made specific selections
                    } elseif (in_array($data['appointmentType'] ?? null, ['new', 'followup'])) {
                        $score += 80;
                    } else {
                        $score = 0; // Skip urgency for unknown appointment types
                    }
                    break;

                case 'doctor':
                    // Higher priority if we have symptoms (can suggest relevant doctor)
                    if (!empty($data['symptoms'])) {
                        $score += 25;
                    }
                    // Higher priority if we have date (can show availability)
                    if (!empty($data['selectedDate'])) {
                        $score += 20;
                    }
                    $score += 70;
                    break;

                case 'date':
                    // Higher priority if doctor is selected (can show available dates)
                    if (!empty($data['selectedDoctorId'])) {
                        $score += 30;
                    }
                    $score += 60;
                    break;

                case 'time':
                    // ONLY meaningful if we have both doctor and date
                    if (!empty($data['selectedDoctorId']) && !empty($data['selectedDate'])) {
                        $score += 50;
                    } else {
                        $score = 0; // Can't ask for time without doctor+date
                    }
                    break;

                case 'mode':
                    $score += 40; // Lower priority, ask near the end
                    break;
            }

            $scores[$field] = $score;
        }

        // Sort by score descending and return highest
        arsort($scores);
        $nextField = array_key_first($scores);

        Log::info('🎯 Next Field: Priority scores calculated', [
            'all_scores' => $scores,
            'highest_priority' => $nextField,
            'highest_score' => $scores[$nextField] ?? 0,
        ]);

        // Skip any field with score 0 (not applicable in current context)
        while ($nextField && ($scores[$nextField] ?? 0) === 0) {
            Log::info('🎯 Next Field: Skipping ' . $nextField . ' (score 0), finding next field');
            unset($scores[$nextField]);

            if (empty($scores)) {
                Log::info('🎯 Next Field: No more fields with score > 0');
                return null;
            }

            arsort($scores);
            $nextField = array_key_first($scores);
        }

        Log::info('🎯 Next Field: Final selection', [
            'selected_field' => $nextField,
            'score' => $scores[$nextField] ?? 0,
        ]);

        return $nextField;
    }

    /**
     * Build natural language response with appropriate component
     */
    protected function buildResponse(BookingConversation $conversation, array $analysis, array $parsed): array
    {
        $nextField = $analysis['next_field'];
        $data = $conversation->collected_data;

        Log::info('IntelligentOrchestrator: Building response', [
            'ready_to_book' => $analysis['ready_to_book'],
            'next_field' => $nextField,
            'missing_fields' => $analysis['missing'],
            'collected_data_keys' => array_keys($data),
        ]);

        // If ready to book, show summary
        if ($analysis['ready_to_book']) {
            return $this->buildBookingSummary($conversation, $data);
        }

        // Check if time validation failed (user changed doctor and time is not available)
        $timeValidationFailed = !empty($data['time_validation_failed']);
        $requestedTime = $data['requested_time'] ?? null;

        // Build acknowledgment of what was understood
        $acknowledgment = $this->buildAcknowledgment($parsed['entities'] ?? [], $data);

        // Add time validation message if needed
        if ($timeValidationFailed && $requestedTime && $nextField === 'time') {
            $acknowledgment .= " Unfortunately, {$requestedTime} is not available with this doctor. Please select an available time.";

            // Clear validation flags after showing message
            $data['time_validation_failed'] = false;
            unset($data['requested_time']);
            $conversation->collected_data = $data;
            $conversation->save();
        }

        // Build component for next field
        $component = $this->buildComponentForField($nextField, $data, $analysis);

        // Construct message
        $message = trim($acknowledgment);
        if (!empty($component['intro_message'])) {
            $message = trim($message . ' ' . $component['intro_message']);
        }

        // Remove duplicate sentences
        $message = $this->removeDuplicateSentences($message);

        // Log flow completion check
        Log::info('FLOW COMPLETION CHECK', [
            'has_message' => !empty($message),
            'component_type' => $component['type'] ?? 'none',
            'has_component_data' => !empty($component['data']),
            'next_field' => $nextField,
            'missing_fields' => $analysis['missing'],
            'ready_to_book' => $analysis['ready_to_book'],
        ]);

        // Store the assistant's message
        $this->addAssistantMessage($conversation, $message, $component['type'] ?? null, $component['data'] ?? null);

        return [
            'status' => 'success',
            'message' => $message,
            'component_type' => $component['type'] ?? null,
            'component_data' => $component['data'] ?? null,
        ];
    }

    /**
     * Build response using state machine instead of analysis
     */
    protected function buildResponseFromStateMachine(BookingConversation $conversation, BookingStateMachine $stateMachine, array $parsed): array
    {
        $component = $stateMachine->getComponentForCurrentState();
        $data = $stateMachine->getData();

        // Check if there's a doctor unavailability context to prepend to the message
        $message = $component['message'];
        if (!empty($data['doctor_unavailable_on_date']) && !empty($data['doctor_unavailable_context'])) {
            $ctx = $data['doctor_unavailable_context'];
            $doctorName = $ctx['doctor_name'];
            $requestedDate = Carbon::parse($ctx['requested_date'])->format('M j');

            $unavailMsg = "{$doctorName} isn't available on {$requestedDate}.";

            if (!empty($ctx['next_available_date'])) {
                $nextDate = Carbon::parse($ctx['next_available_date'])->format('M j');
                $unavailMsg .= " Their next available date is {$nextDate}.";
            }

            if (!empty($ctx['alternative_doctors'])) {
                $altNames = array_map(fn($d) => $d['name'], array_slice($ctx['alternative_doctors'], 0, 2));
                $unavailMsg .= ' ' . implode(' and ', $altNames) . ' available on ' . $requestedDate . '.';
            }

            $message = $unavailMsg . ' ' . $message;

            // Clear the flag so it doesn't repeat
            unset($data['doctor_unavailable_on_date']);
            unset($data['doctor_unavailable_context']);
        }

        // Check if there's a mode conflict to notify the user about
        if (!empty($data['mode_conflict'])) {
            $conflictMsg = $data['mode_conflict']['message'];
            $message = $conflictMsg . "\n\n" . $message;

            // Clear the flag so it doesn't repeat
            unset($data['mode_conflict']);
        }

        // Save data
        $conversation->collected_data = $data;
        $conversation->save();

        // Build component data
        $componentData = null;
        if ($component['type']) {
            $componentData = $this->buildComponentDataForType($component['type'], $data);
        }

        // Debug: Log selected_date for date_doctor_selector
        if ($component['type'] === 'date_doctor_selector') {
            Log::info('📅 DATE_DOCTOR_SELECTOR component_data', [
                'selected_date_in_component_data' => $componentData['selected_date'] ?? 'NULL',
                'selectedDate_in_data' => $data['selectedDate'] ?? 'NULL',
                'dates_count' => count($componentData['dates'] ?? []),
            ]);
        }

        // Extract thinking steps from parsed AI response
        $thinkingSteps = $parsed['thinking'] ?? [];

        // Add assistant message with thinking steps
        $this->addAssistantMessage($conversation, $message, $component['type'], $componentData, $thinkingSteps);

        Log::info('🎰 State Machine Response', $stateMachine->getDebugInfo());

        return [
            'status' => 'success',
            'state' => $stateMachine->getCurrentState(),
            'message' => $message,
            'component_type' => $component['type'],
            'component_data' => $componentData,
            'ready_to_book' => $stateMachine->isReadyToBook(),
            'progress' => [
                'percentage' => $stateMachine->getCompletenessPercentage(),
                'current_state' => $stateMachine->getCurrentState(),
                'missing_fields' => $stateMachine->getMissingFields(),
            ],
        ];
    }

    /**
     * Build component data for a given component type
     */
    protected function buildComponentDataForType(?string $type, array $data): ?array
    {
        if (!$type) {
            return null;
        }

        return match($type) {
            'patient_selector' => $this->getPatientSelectorData(),
            'appointment_type_selector' => [
                'options' => [
                    ['id' => 'new', 'label' => 'New Appointment'],
                    ['id' => 'followup', 'label' => 'Follow-up Visit'],
                ],
            ],
            'urgency_selector' => [
                'options' => [
                    ['id' => 'urgent', 'label' => 'Urgent (Today)'],
                    ['id' => 'this_week', 'label' => 'This Week'],
                    ['id' => 'specific_date', 'label' => 'Specific Date'],
                ],
            ],
            'followup_reason' => [
                'options' => [
                    [
                        'id' => 'scheduled',
                        'value' => 'scheduled',
                        'label' => 'Scheduled follow-up',
                        'description' => 'Doctor asked me to come back',
                    ],
                    [
                        'id' => 'new_concern',
                        'value' => 'new_concern',
                        'label' => 'New concern',
                        'description' => 'Something changed since last visit',
                    ],
                    [
                        'id' => 'ongoing_issue',
                        'value' => 'ongoing_issue',
                        'label' => 'Ongoing issue',
                        'description' => "Symptoms haven't improved",
                    ],
                ],
            ],
            'followup_reason_selector' => [
                'options' => [
                    [
                        'id' => 'scheduled',
                        'value' => 'scheduled',
                        'label' => 'Scheduled follow-up',
                        'description' => 'Doctor asked me to come back',
                    ],
                    [
                        'id' => 'new_concern',
                        'value' => 'new_concern',
                        'label' => 'New concern',
                        'description' => 'Something changed since last visit',
                    ],
                    [
                        'id' => 'ongoing_issue',
                        'value' => 'ongoing_issue',
                        'label' => 'Ongoing issue',
                        'description' => "Symptoms haven't improved",
                    ],
                ],
            ],
            'previous_doctors' => [
                'options' => $this->getPreviousDoctors($data),
                'show_all_doctors_option' => true,
            ],
            'date_doctor_selector' => $this->getDoctorListData($data),
            'time_slot_selector' => $this->getDateTimeSelectorData($data),
            'mode_selector' => $this->getModeSelectorData($data),
            'booking_summary' => $this->buildSummaryData($data),
            default => null,
        };
    }

    /**
     * Build acknowledgment of what AI understood from user message
     */
    protected function buildAcknowledgment(array $entities, array $data): string
    {
        $parts = [];

        // Acknowledge symptoms with empathy
        if (!empty($entities['symptoms'])) {
            $parts[] = "I'm sorry you're not feeling well.";
        }

        // Acknowledge patient selection
        if (!empty($entities['patient_relation']) && empty($data['selectedPatientName'])) {
            $relation = $entities['patient_relation'];
            if ($relation === 'self') {
                $parts[] = "Got it, booking for yourself.";
            } else {
                $parts[] = "Got it, booking for your {$relation}.";
            }
        }

        // Acknowledge doctor selection
        if (!empty($entities['doctor_name']) && !str_contains(strtolower($entities['doctor_name']), 'id')) {
            $parts[] = "I'll book with Dr. {$entities['doctor_name']}.";
        }

        // Acknowledge date/time (check both 'date' and 'specific_date')
        $dateEntity = $entities['specific_date'] ?? $entities['date'] ?? null;
        if (!empty($dateEntity)) {
            try {
                $date = Carbon::parse($dateEntity);
                $formatted = $date->format('M j');
                $parts[] = "Looking for {$formatted}.";
            } catch (\Exception $e) {
                // Skip if date parsing fails
            }
        }

        // Acknowledge appointment type
        if (!empty($entities['appointment_type'])) {
            $type = $entities['appointment_type'];
            if ($type === 'new') {
                $parts[] = "New appointment.";
            } elseif ($type === 'followup') {
                $parts[] = "Follow-up appointment.";
            }
        }

        // Remove duplicates and limit to first 3 acknowledgments
        $parts = array_unique($parts);
        $parts = array_slice($parts, 0, 3);

        Log::info('BUILD ACKNOWLEDGMENT', [
            'original_parts' => $parts,
            'after_unique' => array_values($parts),
            'result' => implode(' ', $parts),
        ]);

        return implode(' ', $parts);
    }

    /**
     * Build UI component for the next required field
     */
    protected function buildComponentForField(?string $field, array $data, array $analysis): array
    {
        if (!$field) {
            Log::info('🧩 Component Builder: No field needed');
            return ['type' => null, 'data' => null, 'intro_message' => ''];
        }

        Log::info('🧩 Component Builder: Building component', [
            'field' => $field,
            'reason' => 'This is the highest priority missing field',
        ]);

        switch ($field) {
            case 'patient':
                Log::info('🧩 Component Builder: Showing patient_selector', [
                    'reason' => 'Patient field is missing',
                    'current_selectedPatientId' => $data['selectedPatientId'] ?? 'null',
                    'current_patientRelation' => $data['patientRelation'] ?? 'null',
                ]);
                return [
                    'type' => 'patient_selector',
                    'data' => $this->getPatientSelectorData(),
                    'intro_message' => 'Who is this appointment for?',
                ];

            case 'appointment_type':
                return [
                    'type' => 'appointment_type_selector',
                    'data' => [
                        'options' => [
                            ['id' => 'new', 'label' => 'New Appointment'],
                            ['id' => 'followup', 'label' => 'Follow-up Visit'],
                        ],
                    ],
                    'intro_message' => 'Is this a new appointment or a follow-up?',
                ];

            case 'urgency':
                return [
                    'type' => 'urgency_selector',
                    'data' => [
                        'options' => [
                            ['id' => 'urgent', 'label' => 'Urgent (Today)'],
                            ['id' => 'this_week', 'label' => 'This Week'],
                            ['id' => 'specific_date', 'label' => 'Specific Date'],
                        ],
                    ],
                    'intro_message' => 'When do you need to see a doctor?',
                ];

            case 'followup_reason':
                Log::info('🧩 Component Builder: Showing followup_reason component', [
                    'component_type' => 'followup_reason',
                    'has_options' => true,
                    'options_count' => 3,
                ]);

                return [
                    'type' => 'followup_reason',
                    'data' => [
                        'options' => [
                            [
                                'id' => 'scheduled',
                                'value' => 'scheduled',
                                'label' => 'Scheduled follow-up',
                                'description' => 'Doctor asked me to come back',
                            ],
                            [
                                'id' => 'new_concern',
                                'value' => 'new_concern',
                                'label' => 'New concern',
                                'description' => 'Something changed since last visit',
                            ],
                            [
                                'id' => 'ongoing_issue',
                                'value' => 'ongoing_issue',
                                'label' => 'Ongoing issue',
                                'description' => "Symptoms haven't improved",
                            ],
                        ],
                    ],
                    'intro_message' => 'What brings you back?',
                ];

            case 'followup_notes':
                Log::info('🧩 Component Builder: Showing followup_notes prompt', [
                    'component_type' => 'message_only',
                    'waiting_for_chat_input' => true,
                ]);

                // Context-aware message based on followup_reason
                $followupReason = $data['followup_reason'] ?? null;
                $message = match($followupReason) {
                    'scheduled' => "Got it. Any updates you'd like to share with the doctor? This will help them prepare for your visit. You can skip this.",
                    'new_concern' => "What new symptoms or changes have you noticed? This will help the doctor prepare for your visit. You can skip this.",
                    'ongoing_issue' => "I'm sorry to hear that. Can you describe what's still bothering you? This will help the doctor prepare for your visit. You can skip this.",
                    default => "Can you describe what's bothering you? This will help the doctor prepare. You can skip this by typing 'skip' or 'no updates'.",
                };

                return [
                    'type' => null, // No component, just a message
                    'data' => null,
                    'intro_message' => $message,
                ];

            case 'previous_doctors':
                Log::info('🧩 Component Builder: Showing previous_doctors component', [
                    'component_type' => 'previous_doctors',
                    'has_previous_appointments' => true,
                ]);

                return [
                    'type' => 'previous_doctors',
                    'data' => [
                        'options' => $this->getPreviousDoctors($data),
                        'show_all_doctors_option' => true,
                    ],
                    'intro_message' => 'Would you like to book with one of these doctors you\'ve seen before?',
                ];

            case 'doctor':
                return $this->buildDoctorComponent($data, $analysis);

            case 'date':
            case 'time':
                return $this->buildDateTimeComponent($data, $analysis);

            case 'mode':
                // Use default prices - all doctors have standard pricing
                Log::info('🧩 Component Builder: Showing mode selector', [
                    'component_type' => 'mode_selector',
                    'video_price' => 800,
                    'in_person_price' => 1200,
                ]);

                return [
                    'type' => 'mode_selector',
                    'data' => [
                        'modes' => [
                            [
                                'type' => 'video',
                                'label' => 'Video Appointment',
                                'price' => 800,
                                'icon' => 'video',
                            ],
                            [
                                'type' => 'in_person',
                                'label' => 'In-Person Visit',
                                'price' => 1200,
                                'icon' => 'hospital',
                            ],
                        ],
                    ],
                    'intro_message' => 'Would you prefer a video appointment or in-person visit?',
                ];

            default:
                return ['type' => null, 'data' => null, 'intro_message' => ''];
        }
    }

    /**
     * Build doctor selector component
     */
    protected function buildDoctorComponent(array $data, array $analysis): array
    {
        $urgency = $data['urgency'] ?? null;
        $hasSymptoms = !empty($data['symptoms']);
        $selectedDate = $data['selectedDate'] ?? null;

        Log::info('IntelligentOrchestrator: Building doctor selector component', [
            'urgency' => $urgency,
            'has_symptoms' => $hasSymptoms,
            'selected_date' => $selectedDate,
        ]);

        // Build context-aware intro message based on urgency, date, and search
        $searchQuery = $data['doctorSearchQuery'] ?? null;
        $introMessage = 'Available doctors';

        if ($searchQuery) {
            $introMessage = "Showing results for \"{$searchQuery}\"";
        } elseif ($urgency === 'urgent') {
            $introMessage = 'Available today';
        } elseif ($selectedDate) {
            try {
                $date = Carbon::parse($selectedDate);
                $introMessage = 'Showing doctors available on ' . $date->format('M j');
            } catch (\Exception $e) {
                $introMessage = 'Available doctors';
            }
        } elseif ($urgency === 'this_week') {
            $introMessage = 'Available this week';
        } else {
            $introMessage = 'Available this week';
        }

        return [
            'type' => 'date_doctor_selector',
            'data' => $this->getDoctorListData($data),
            'intro_message' => $introMessage,
        ];
    }

    /**
     * Build date/time selector component
     */
    protected function buildDateTimeComponent(array $data, array $analysis): array
    {
        $doctorId = $data['selectedDoctorId'] ?? null;
        $selectedDate = $data['selectedDate'] ?? null;

        if (!$doctorId) {
            // Need doctor first
            return $this->buildDoctorComponent($data, $analysis);
        }

        return [
            'type' => 'date_time_selector',
            'data' => $this->getDateTimeSelectorData($data),
            'intro_message' => 'Select a date and time',
        ];
    }

    /**
     * Build booking summary for final confirmation
     */
    protected function buildBookingSummary(BookingConversation $conversation, array $data): array
    {
        $message = "Perfect! Here's your appointment summary:";

        // Transform collected_data to match frontend DoctorSummary interface
        $summaryData = $this->buildSummaryData($data);

        Log::info('📦 Building booking summary', [
            'conversation_id' => $conversation->id,
            'summary_data' => $summaryData,
            'raw_data_keys' => array_keys($data),
        ]);

        $this->addAssistantMessage($conversation, $message, 'booking_summary', $summaryData);

        return [
            'status' => 'success',
            'message' => $message,
            'component_type' => 'booking_summary',
            'component_data' => $summaryData,
        ];
    }

    /**
     * Format datetime for summary display
     */
    protected function formatDateTime(?string $date, ?string $time): string
    {
        if (!$date || !$time) {
            return 'Not set';
        }

        try {
            return \Carbon\Carbon::parse("$date $time")->toIso8601String();
        } catch (\Exception $e) {
            return "$date at $time";
        }
    }

    /**
     * Build summary data including doctor mode availability info
     */
    protected function buildSummaryData(array $data): array
    {
        $doctorId = $data['selectedDoctorId'] ?? null;
        $doctor = $doctorId ? $this->getDoctorDetailsById($doctorId) : null;
        $supportedModes = $doctor['consultation_modes'] ?? ['video', 'in_person'];

        return [
            'doctor' => [
                'name' => $data['selectedDoctorName'] ?? 'Unknown Doctor',
                'avatar' => null,
            ],
            'patient' => [
                'name' => $data['selectedPatientName'] ?? 'Unknown Patient',
                'avatar' => $data['selectedPatientAvatar'] ?? null,
            ],
            'type' => $data['appointmentType'] ?? 'new',
            'datetime' => $this->formatDateTime($data['selectedDate'] ?? null, $data['selectedTime'] ?? null),
            'mode' => $data['consultationMode'] ?? $this->getDefaultModeForDoctor($doctorId),
            'fee' => $this->calculateFee($data),
            'supported_modes' => $supportedModes,
        ];
    }

    /**
     * Calculate appointment fee based on mode
     */
    protected function calculateFee(array $data): int
    {
        $doctorId = $data['selectedDoctorId'] ?? null;
        $mode = $data['consultationMode'] ?? $this->getDefaultModeForDoctor($doctorId);

        if ($doctorId) {
            $doctor = $this->getDoctorDetailsById($doctorId);
            if ($doctor) {
                return $mode === 'in_person'
                    ? ($doctor['in_person_fee'] ?? 1200)
                    : ($doctor['video_fee'] ?? 800);
            }
        }

        // Fallback defaults
        return $mode === 'in_person' ? 1200 : 800;
    }

    /**
     * Handle emergency situation
     */
    protected function handleEmergency(BookingConversation $conversation, array $parsed): array
    {
        $keywords = $parsed['emergency_keywords'] ?? [];
        $keywordText = implode(', ', array_slice($keywords, 0, 2));

        $message = "⚠️ EMERGENCY: This sounds like a medical emergency. Please call 108 (Ambulance) or 112 (Emergency Services) immediately. Do NOT wait for an appointment.";

        $this->addAssistantMessage($conversation, $message, 'emergency_alert', [
            'keywords' => $keywords,
            'emergency_numbers' => ['108', '112'],
        ]);

        return [
            'status' => 'emergency',
            'message' => $message,
            'component_type' => 'emergency_alert',
            'component_data' => [
                'keywords' => $keywords,
                'emergency_numbers' => ['108', '112'],
            ],
        ];
    }

    /**
     * Handle direct component selection (button clicks)
     */
    protected function handleComponentSelection(BookingConversation $conversation, array $selection): array
    {
        // Update data based on selection
        $updated = $conversation->collected_data;

        // Initialize completedSteps if not present
        if (!isset($updated['completedSteps'])) {
            $updated['completedSteps'] = [];
        }

        // Map selection to data fields
        if (isset($selection['patient_id'])) {
            $updated['selectedPatientId'] = $selection['patient_id'];
            $updated['selectedPatientName'] = $selection['patient_name'] ?? 'Unknown';
            if (!in_array('patient', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'patient';
            }
        }

        if (isset($selection['appointment_type'])) {
            $updated['appointmentType'] = $selection['appointment_type'];
            if (!in_array('appointmentType', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'appointmentType';
            }

            // Clear any AI-extracted urgency/date that wasn't explicitly selected by the user.
            // Without this, the AI parsing of the initial message (e.g. "I want to book a doctor
            // appointment") can set urgency prematurely, causing the urgency step to be skipped.
            if (!in_array('urgency', $updated['completedSteps'])) {
                unset($updated['urgency']);
            }
            if (!in_array('date', $updated['completedSteps'])) {
                unset($updated['selectedDate']);
            }
        }

        if (isset($selection['urgency'])) {
            $updated['urgency'] = $selection['urgency'];
            if (!in_array('urgency', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'urgency';
            }
        }

        if (isset($selection['followup_reason'])) {
            $updated['followup_reason'] = $selection['followup_reason'];
            if (!in_array('followup_reason', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'followup_reason';
            }
            Log::info('🔒 Selection Handler: followup_reason selected', [
                'value' => $selection['followup_reason'],
                'BEFORE_UPDATE' => $conversation->collected_data,
                'AFTER_UPDATE' => $updated,
            ]);
        }

        if (isset($selection['followup_notes'])) {
            $updated['followup_notes'] = $selection['followup_notes'];
            $updated['followup_notes_asked'] = true;
            if (!in_array('followup_notes', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'followup_notes';
            }
            Log::info('🔒 Selection Handler: followup_notes provided', [
                'has_notes' => !empty($selection['followup_notes']),
            ]);
        }

        // Handle text input response (for followup_notes or symptoms)
        if (isset($selection['text_input']) && isset($selection['field'])) {
            if ($selection['field'] === 'followup_notes') {
                $updated['followup_notes'] = $selection['text_input'];
                $updated['followup_notes_asked'] = true;
                if (!in_array('followup_notes', $updated['completedSteps'])) {
                    $updated['completedSteps'][] = 'followup_notes';
                }
                Log::info('🔒 Selection Handler: followup_notes provided via text_input', [
                    'notes' => $selection['text_input'],
                ]);
            }
        }

        // Handle skip action for followup_notes
        if (isset($selection['skip']) && $selection['skip'] === 'followup_notes') {
            $updated['followup_notes'] = '';
            $updated['followup_notes_asked'] = true;
            if (!in_array('followup_notes', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'followup_notes';
            }
            Log::info('🔒 Selection Handler: followup_notes skipped by user');
        }

        if (isset($selection['doctor_id'])) {
            $updated['selectedDoctorId'] = $selection['doctor_id'];
            $updated['selectedDoctorName'] = $selection['doctor_name'] ?? '';
            if (!in_array('doctor', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'doctor';
            }

            // Clear doctor search query now that user has confirmed a selection
            unset($updated['doctorSearchQuery']);

            // Track if this came from previous_doctors component
            if (isset($selection['from_previous_doctors']) && $selection['from_previous_doctors']) {
                $updated['previous_doctors_shown'] = true;
                Log::info('🔒 Selection Handler: Doctor selected from previous doctors');
            }

            // Validate and auto-select consultation mode based on doctor's supported modes
            $doctor = $this->getDoctorDetailsById($selection['doctor_id']);
            if ($doctor) {
                $supportedModes = $doctor['consultation_modes'] ?? [];
                $currentMode = $updated['consultationMode'] ?? null;
                $doctorName = $doctor['name'] ?? 'this doctor';

                if ($currentMode && !in_array($currentMode, $supportedModes)) {
                    // User's previously chosen mode is NOT supported by this doctor
                    $modeLabel = $currentMode === 'video' ? 'video consultations' : 'in-person visits';
                    $onlyModeLabel = count($supportedModes) === 1
                        ? ($supportedModes[0] === 'video' ? 'video appointments' : 'in-person visits')
                        : null;

                    if (count($supportedModes) === 1) {
                        // Single-mode doctor — auto-select their only mode but notify user
                        $updated['consultationMode'] = $supportedModes[0];
                        if (!in_array('mode', $updated['completedSteps'])) {
                            $updated['completedSteps'][] = 'mode';
                        }
                        $updated['mode_conflict'] = [
                            'doctor_name' => $doctorName,
                            'requested_mode' => $currentMode,
                            'available_mode' => $supportedModes[0],
                            'message' => "{$doctorName} only offers {$onlyModeLabel}. I've updated the consultation mode. If you'd prefer {$modeLabel}, you can change the doctor.",
                        ];
                    } else {
                        // Multi-mode doctor but current mode not in list — clear and re-ask
                        unset($updated['consultationMode']);
                        $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['mode']));
                    }

                    Log::info('⚠️ Mode conflict detected on doctor selection', [
                        'doctor_id' => $selection['doctor_id'],
                        'doctor_name' => $doctorName,
                        'user_mode' => $currentMode,
                        'supported_modes' => $supportedModes,
                    ]);
                } elseif (count($supportedModes) === 1 && $currentMode !== $supportedModes[0]) {
                    // No prior mode set, but doctor only supports one — auto-select silently
                    $updated['consultationMode'] = $supportedModes[0];
                    if (!in_array('mode', $updated['completedSteps'])) {
                        $updated['completedSteps'][] = 'mode';
                    }
                    Log::info('🔒 Selection Handler: Auto-selected only supported mode', [
                        'doctor_id' => $selection['doctor_id'],
                        'mode' => $supportedModes[0],
                    ]);
                }
            }
        }

        // Handle "show all doctors" action from previous_doctors component
        if (isset($selection['show_all_doctors']) && $selection['show_all_doctors']) {
            $updated['previous_doctors_shown'] = true;
            Log::info('🔒 Selection Handler: User chose to see all doctors');
        }

        if (isset($selection['date'])) {
            $updated['selectedDate'] = $selection['date'];
            if (!in_array('date', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'date';
            }
        }

        if (isset($selection['time'])) {
            $updated['selectedTime'] = $selection['time'];
            if (!in_array('time', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'time';
            }
        }

        if (isset($selection['mode'])) {
            $selectedMode = $selection['mode'];
            $doctorId = $updated['selectedDoctorId'] ?? null;

            // Validate mode against doctor's supported modes
            if ($doctorId) {
                $doctor = $this->getDoctorDetailsById($doctorId);
                if ($doctor) {
                    $supportedModes = $doctor['consultation_modes'] ?? [];
                    if (!in_array($selectedMode, $supportedModes)) {
                        Log::warning('⚠️ Mode validation failed: doctor does not support this mode', [
                            'doctor_id' => $doctorId,
                            'doctor_name' => $doctor['name'] ?? 'Unknown',
                            'requested_mode' => $selectedMode,
                            'supported_modes' => $supportedModes,
                        ]);
                        // Auto-correct to the doctor's only supported mode
                        if (count($supportedModes) === 1) {
                            $selectedMode = $supportedModes[0];
                            Log::info('🔧 Auto-corrected mode to doctor\'s only supported mode', [
                                'corrected_mode' => $selectedMode,
                            ]);
                        }
                    }
                }
            }

            $updated['consultationMode'] = $selectedMode;
            if (!in_array('mode', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'mode';
            }
            Log::info('🔍 MODE SELECTION HANDLER', [
                'mode_value' => $selectedMode,
                'BEFORE' => $conversation->collected_data['consultationMode'] ?? 'not set',
                'AFTER' => $updated['consultationMode'],
            ]);
        }

        // Handle patient change from summary
        if (isset($selection['change_patient']) && $selection['change_patient']) {
            Log::info('🔄 Change Patient Requested');
            unset($updated['selectedPatientId']);
            unset($updated['selectedPatientName']);
            unset($updated['selectedPatientAvatar']);
            unset($updated['patientRelation']);
            $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['patient']));
        }

        // Handle date/time change from summary
        if (isset($selection['change_datetime']) && $selection['change_datetime']) {
            Log::info('🔄 Change Date/Time Requested');
            unset($updated['selectedDate']);
            unset($updated['selectedTime']);
            // Clear mode too since the new time slot may affect mode availability
            unset($updated['consultationMode']);
            // Reset urgency to 'this_week' so the date picker shows all available dates
            // instead of being locked to just "Today" (urgent) or a single date (specific_date)
            $updated['urgency'] = 'this_week';
            $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['date', 'time', 'mode']));
        }

        // Handle new date selection - validate doctor availability on that date
        if (isset($selection['date']) && !empty($updated['selectedDoctorId'])) {
            $newDate = $selection['date'];
            $doctorId = $updated['selectedDoctorId'];
            $doctorName = $updated['selectedDoctorName'] ?? 'your doctor';
            $availability = $this->checkDoctorAvailabilityForDate($doctorId, $newDate);

            if (!$availability['available']) {
                Log::info('⚠️ Doctor not available on selected date', [
                    'doctor_id' => $doctorId,
                    'doctor_name' => $doctorName,
                    'requested_date' => $newDate,
                    'next_available' => $availability['next_available_date'] ?? 'unknown',
                ]);

                // Store context so the response message can inform the user
                $updated['doctor_unavailable_on_date'] = true;
                $updated['doctor_unavailable_context'] = [
                    'doctor_name' => $doctorName,
                    'requested_date' => $newDate,
                    'next_available_date' => $availability['next_available_date'] ?? null,
                    'alternative_doctors' => $availability['alternative_doctors'] ?? [],
                ];

                // Clear the doctor so user can pick a new one or wait for alternative
                unset($updated['selectedDoctorId']);
                unset($updated['selectedDoctorName']);
                unset($updated['selectedDoctorAvatar']);
                unset($updated['selectedDoctorSpecialization']);
                unset($updated['selectedTime']);
                unset($updated['consultationMode']);
                $updated['completedSteps'] = array_values(array_diff(
                    $updated['completedSteps'],
                    ['doctor', 'time', 'mode']
                ));
            } else if (!empty($updated['selectedTime'])) {
                // Doctor is available on date, but validate the specific time slot
                $timeAvailable = $this->validateTimeSlotForDoctor($doctorId, $newDate, $updated['selectedTime']);
                if (!$timeAvailable) {
                    Log::info('⚠️ Time slot not available for doctor on new date', [
                        'doctor_id' => $doctorId,
                        'date' => $newDate,
                        'time' => $updated['selectedTime'],
                    ]);
                    unset($updated['selectedTime']);
                    unset($updated['consultationMode']);
                    $updated['completedSteps'] = array_values(array_diff(
                        $updated['completedSteps'],
                        ['time', 'mode']
                    ));
                }
            }
        }

        // Handle type change from summary
        if (isset($selection['change_type']) && $selection['change_type']) {
            $previousType = $updated['appointmentType'] ?? null;
            Log::info('🔄 Change Appointment Type Requested', ['previous_type' => $previousType]);

            unset($updated['appointmentType']);
            $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['appointmentType']));

            // Clear followup-specific fields if we were in followup mode
            if ($previousType === 'followup') {
                unset($updated['followup_reason']);
                unset($updated['followup_notes']);
                unset($updated['followup_notes_asked']);
                unset($updated['previous_doctors_shown']);
                $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['followup_reason', 'followup_notes']));
            }

            // Clear all downstream fields since a type change affects the entire flow
            unset($updated['urgency']);
            unset($updated['selectedDoctorId']);
            unset($updated['selectedDoctorName']);
            unset($updated['selectedDoctorAvatar']);
            unset($updated['selectedDoctorSpecialization']);
            unset($updated['doctorSearchQuery']);
            unset($updated['selectedDate']);
            unset($updated['selectedTime']);
            unset($updated['consultationMode']);
            $updated['completedSteps'] = array_values(array_diff(
                $updated['completedSteps'],
                ['urgency', 'doctor', 'date', 'time', 'mode']
            ));
        }

        // Handle mode change from summary
        if (isset($selection['change_mode']) && $selection['change_mode']) {
            $doctorId = $updated['selectedDoctorId'] ?? null;
            $doctor = $doctorId ? $this->getDoctorDetailsById($doctorId) : null;
            $supportedModes = $doctor['consultation_modes'] ?? ['video', 'in_person'];

            if (count($supportedModes) <= 1) {
                // Doctor only supports one mode - cannot change, re-show summary
                Log::info('🔄 Change Mode Rejected: doctor only supports one mode', [
                    'doctor_id' => $doctorId,
                    'supported_modes' => $supportedModes,
                ]);
            } else {
                Log::info('🔄 Change Appointment Mode Requested');
                unset($updated['consultationMode']);
                $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['mode']));
            }
        }

        // Handle doctor change from summary - validate time slot availability
        if (isset($selection['change_doctor']) && $selection['change_doctor']) {
            Log::info('🔄 Change Doctor Requested', [
                'previous_doctor_id' => $updated['selectedDoctorId'] ?? null,
                'selected_time' => $updated['selectedTime'] ?? null,
                'selected_mode' => $updated['consultationMode'] ?? null,
            ]);

            // Clear doctor selection to show list again
            unset($updated['selectedDoctorId']);
            unset($updated['selectedDoctorName']);
            unset($updated['selectedDoctorAvatar']);
            unset($updated['selectedDoctorSpecialization']);
            unset($updated['doctorSearchQuery']);
            // Clear consultation mode — new doctor may not support the previously selected mode
            unset($updated['consultationMode']);
            $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['doctor', 'mode']));

            // Keep the time selection for validation later
            $updated['pending_time_validation'] = $updated['selectedTime'] ?? null;

            Log::info('🔄 Doctor cleared, mode and time marked for revalidation', [
                'pending_time' => $updated['pending_time_validation'] ?? null,
            ]);
        }

        // Handle new doctor selection when time validation is pending
        if (isset($selection['doctor_id']) && !empty($updated['pending_time_validation'])) {
            $newDoctorId = $selection['doctor_id'];
            $pendingTime = $updated['pending_time_validation'];

            // Check if the pending time is available with the new doctor
            $isTimeAvailable = $this->validateTimeSlotForDoctor($newDoctorId, $updated['selectedDate'] ?? null, $pendingTime);

            Log::info('⏰ Time Slot Validation', [
                'new_doctor_id' => $newDoctorId,
                'pending_time' => $pendingTime,
                'is_available' => $isTimeAvailable,
            ]);

            if (!$isTimeAvailable) {
                // Time not available - clear time and show available slots
                unset($updated['selectedTime']);
                $updated['time_validation_failed'] = true;
                $updated['requested_time'] = $pendingTime;

                Log::warning('⚠️ Time slot not available with new doctor', [
                    'requested_time' => $pendingTime,
                    'new_doctor_id' => $newDoctorId,
                ]);
            } else {
                // Time is available - keep it
                $updated['selectedTime'] = $pendingTime;
                Log::info('✅ Time slot confirmed with new doctor');
            }

            // Clear validation flag
            unset($updated['pending_time_validation']);
        }

        $conversation->collected_data = $updated;
        $conversation->save();

        Log::info('🔒 Selection Handler: Data saved to conversation', [
            'conversation_id' => $conversation->id,
            'collected_data' => $conversation->collected_data,
            'followup_reason_in_saved_data' => $conversation->collected_data['followup_reason'] ?? 'MISSING',
        ]);

        // Use state machine to determine next step
        $stateMachine = new BookingStateMachine($updated);

        Log::info('🔒 Selection Handler: State machine initialized', $stateMachine->getDebugInfo());

        return $this->buildResponseFromStateMachine($conversation, $stateMachine, ['entities' => []]);
    }

    // Data provider methods (stub implementations - replace with actual data fetching)

    protected function getPatientSelectorData(): array
    {
        return [
            'patients' => [
                ['id' => 1, 'name' => 'Yourself', 'relation' => 'self'],
                ['id' => 2, 'name' => 'Mother', 'relation' => 'mother'],
                ['id' => 3, 'name' => 'Father', 'relation' => 'father'],
            ],
        ];
    }

    protected function getDoctorListData(array $data): array
    {
        // Mock data with complete doctor information
        $doctors = [
            [
                'id' => 1,
                'name' => 'Dr. Sarah Johnson',
                'avatar' => '/assets/avatars/doctor1.jpg',
                'specialization' => 'General Physician',
                'experience_years' => 12,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'slots' => $this->generateTimeSlots(),
            ],
            [
                'id' => 2,
                'name' => 'Dr. Rajesh Kumar',
                'avatar' => '/assets/avatars/doctor2.jpg',
                'specialization' => 'Cardiologist',
                'experience_years' => 18,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 1500,
                'in_person_fee' => 2000,
                'slots' => $this->generateTimeSlots(),
            ],
            [
                'id' => 3,
                'name' => 'Dr. Priya Sharma',
                'avatar' => '/assets/avatars/doctor3.jpg',
                'specialization' => 'Pediatrician',
                'experience_years' => 10,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 900,
                'in_person_fee' => 1300,
                'slots' => $this->generateTimeSlots(),
            ],
            [
                'id' => 4,
                'name' => 'Dr. Anita Deshmukh',
                'avatar' => '/assets/avatars/doctor4.jpg',
                'specialization' => 'Dermatologist',
                'experience_years' => 15,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 1000,
                'in_person_fee' => 1500,
                'slots' => $this->generateTimeSlots(),
            ],
            [
                'id' => 5,
                'name' => 'Dr. Vikram Patel',
                'avatar' => '/assets/avatars/doctor5.jpg',
                'specialization' => 'Orthopedist',
                'experience_years' => 20,
                'consultation_modes' => ['in_person'],
                'video_fee' => 0,
                'in_person_fee' => 1800,
                'slots' => $this->generateTimeSlots(),
            ],
        ];

        // Filter doctors by search query if the user typed a doctor name
        $searchQuery = $data['doctorSearchQuery'] ?? null;
        $allDoctors = $doctors;
        if ($searchQuery) {
            $searchLower = strtolower($searchQuery);
            $filtered = array_filter($doctors, function ($doctor) use ($searchLower) {
                return stripos(strtolower($doctor['name']), $searchLower) !== false
                    || stripos(strtolower($doctor['specialization'] ?? ''), $searchLower) !== false;
            });
            if (!empty($filtered)) {
                $doctors = array_values($filtered);
            }
            // If no matches found, keep the full list so the user can still choose
        }

        // Always show a full week of dates in the doctor selector so the user
        // can browse availability. Use urgency only to pre-select a date.
        $urgency = $data['urgency'] ?? 'this_week';
        $fullWeekDates = [];
        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::today()->addDays($i);
            $label = $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D'));
            $fullWeekDates[] = [
                'value' => $date->format('Y-m-d'),
                'label' => $label,
                'day' => $date->format('M j'),
            ];
        }
        $dates = $fullWeekDates;

        // Determine which date is pre-selected.
        // Explicit selectedDate always takes priority over urgency-based defaults.
        $selectedDate = null;
        if (!empty($data['selectedDate'])) {
            $selectedDate = $data['selectedDate'];
        } elseif ($urgency === 'urgent') {
            $selectedDate = $dates[0]['value'] ?? Carbon::today()->format('Y-m-d');
        } elseif ($urgency === 'this_week') {
            $selectedDate = null;
        } else {
            $selectedDate = $dates[0]['value'] ?? null;
        }

        Log::info('IntelligentOrchestrator: Built doctor list component', [
            'next_field' => 'doctor',
            'component_type' => 'date_doctor_selector',
            'urgency' => $urgency,
            'doctors_count' => count($doctors),
            'total_doctors' => count($allDoctors),
            'search_query' => $searchQuery,
            'selected_date' => $selectedDate,
            'extracted_date' => $data['selectedDate'] ?? 'none',
        ]);

        return [
            'dates' => $dates,
            'selected_date' => $selectedDate,
            'doctors' => $doctors,
            'doctors_count' => count($doctors),
            'urgency_type' => $data['urgency'] ?? 'this_week',
            'symptoms' => $data['symptoms'] ?? null,
            'is_followup' => ($data['appointmentType'] ?? null) === 'followup',
            'show_all_doctors_option' => count($doctors) < count($allDoctors),
            'search_query' => $searchQuery,
        ];
    }

    /**
     * Generate mock time slots for doctors
     */
    protected function generateTimeSlots(): array
    {
        return [
            ['time' => '08:00', 'available' => true, 'preferred' => true],
            ['time' => '09:00', 'available' => true, 'preferred' => false],
            ['time' => '10:00', 'available' => true, 'preferred' => true],
            ['time' => '11:00', 'available' => false, 'preferred' => false],
            ['time' => '14:00', 'available' => true, 'preferred' => false],
            ['time' => '15:00', 'available' => true, 'preferred' => false],
            ['time' => '16:00', 'available' => true, 'preferred' => true],
            ['time' => '17:00', 'available' => true, 'preferred' => false],
        ];
    }

    protected function getAvailableDates(array $data): array
    {
        $urgency = $data['urgency'] ?? 'this_week';
        $userSpecifiedDate = $data['selectedDate'] ?? null;
        $dates = [];

        if ($urgency === 'urgent') {
            // URGENT: Show only today
            $dates[] = [
                'value' => Carbon::today()->format('Y-m-d'),
                'label' => 'Today',
                'day' => Carbon::today()->format('M j'),
            ];
        } elseif ($urgency === 'specific_date' && $userSpecifiedDate) {
            // SPECIFIC DATE: Show ONLY the specified date (respect user's explicit choice)
            $specifiedDate = Carbon::parse($userSpecifiedDate);

            $dates[] = [
                'value' => $specifiedDate->format('Y-m-d'),
                'label' => $specifiedDate->format('M j'),
                'day' => $specifiedDate->format('D'),
            ];
        } elseif ($urgency === 'this_week') {
            // THIS WEEK: Show next 7 days starting from today
            for ($i = 0; $i < 7; $i++) {
                $date = Carbon::today()->addDays($i);
                $label = $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D'));
                $dates[] = [
                    'value' => $date->format('Y-m-d'),
                    'label' => $label,
                    'day' => $date->format('M j'),
                ];
            }
        } elseif ($userSpecifiedDate) {
            // Date extracted but no urgency - ONLY show the specified date
            $specifiedDate = Carbon::parse($userSpecifiedDate);

            $dates[] = [
                'value' => $specifiedDate->format('Y-m-d'),
                'label' => $specifiedDate->isToday() ? 'Today' : $specifiedDate->format('D'),
                'day' => $specifiedDate->format('M j'),
            ];
        } else {
            // Default: Show next 7 days
            for ($i = 0; $i < 7; $i++) {
                $date = Carbon::today()->addDays($i);
                $label = $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D'));
                $dates[] = [
                    'value' => $date->format('Y-m-d'),
                    'label' => $label,
                    'day' => $date->format('M j'),
                ];
            }
        }

        Log::info('📅 Generated available dates', [
            'urgency' => $urgency,
            'user_specified_date' => $userSpecifiedDate,
            'dates_count' => count($dates),
            'first_date' => $dates[0]['value'] ?? 'none',
        ]);

        return $dates;
    }

    /**
     * Check if a doctor is available on a specific date.
     * Returns availability status, next available date, and alternative doctors.
     *
     * In production, this would query the database for the doctor's schedule.
     */
    /**
     * Get a doctor's days off (mock schedule).
     * In production, this would come from the database.
     */
    protected function getDoctorDaysOff(int $doctorId): array
    {
        $doctorDaysOff = [
            1 => [0],       // Dr. Sarah Johnson: off Sunday
            2 => [0, 6],    // Dr. Emily Chen: off Sunday, Saturday
            3 => [0, 3],    // Dr. Rajesh Kumar: off Sunday, Wednesday
            4 => [0, 6],    // Dr. Anita Deshmukh: off Sunday, Saturday
            5 => [0, 2, 4], // Dr. Vikram Patel: off Sunday, Tuesday, Thursday
        ];

        return $doctorDaysOff[$doctorId] ?? [0];
    }

    protected function checkDoctorAvailabilityForDate(int $doctorId, string $date): array
    {
        $doctor = $this->getDoctorDetailsById($doctorId);
        if (!$doctor) {
            return ['available' => false, 'next_available_date' => null, 'alternative_doctors' => []];
        }

        $dateObj = Carbon::parse($date);
        $dayOfWeek = $dateObj->dayOfWeek; // 0=Sunday, 6=Saturday

        $daysOff = $this->getDoctorDaysOff($doctorId);
        $isAvailable = !in_array($dayOfWeek, $daysOff);

        if ($isAvailable) {
            return ['available' => true];
        }

        // Find the next available date for this doctor
        $nextAvailable = null;
        for ($i = 1; $i <= 14; $i++) {
            $checkDate = $dateObj->copy()->addDays($i);
            if (!in_array($checkDate->dayOfWeek, $daysOff)) {
                $nextAvailable = $checkDate->format('Y-m-d');
                break;
            }
        }

        // Find alternative doctors available on the requested date
        $alternativeDoctors = [];
        $allDoctors = [1, 2, 3, 4, 5];
        foreach ($allDoctors as $altId) {
            if ($altId === $doctorId) continue;
            $altDaysOff = $this->getDoctorDaysOff($altId);
            if (!in_array($dayOfWeek, $altDaysOff)) {
                $altDoctor = $this->getDoctorDetailsById($altId);
                if ($altDoctor) {
                    $alternativeDoctors[] = [
                        'id' => $altId,
                        'name' => $altDoctor['name'],
                        'specialization' => $altDoctor['specialization'],
                    ];
                }
            }
            if (count($alternativeDoctors) >= 3) break; // Limit to 3 suggestions
        }

        Log::info('📅 Doctor availability check', [
            'doctor_id' => $doctorId,
            'doctor_name' => $doctor['name'],
            'date' => $date,
            'day_of_week' => $dayOfWeek,
            'available' => false,
            'next_available' => $nextAvailable,
            'alternative_count' => count($alternativeDoctors),
        ]);

        return [
            'available' => false,
            'next_available_date' => $nextAvailable,
            'alternative_doctors' => $alternativeDoctors,
        ];
    }

    /**
     * Build mode selector data based on the selected doctor's capabilities
     */
    protected function getModeSelectorData(array $data): array
    {
        $doctorId = $data['selectedDoctorId'] ?? null;
        $doctor = $doctorId ? $this->getDoctorDetailsById($doctorId) : null;

        $modes = [];

        if ($doctor) {
            $supportedModes = $doctor['consultation_modes'] ?? ['video', 'in_person'];

            if (in_array('video', $supportedModes) && ($doctor['video_fee'] ?? 0) > 0) {
                $modes[] = [
                    'type' => 'video',
                    'label' => 'Video Appointment',
                    'price' => $doctor['video_fee'],
                    'icon' => 'video',
                ];
            }
            if (in_array('in_person', $supportedModes) && ($doctor['in_person_fee'] ?? 0) > 0) {
                $modes[] = [
                    'type' => 'in_person',
                    'label' => 'In-Person Visit',
                    'price' => $doctor['in_person_fee'],
                    'icon' => 'hospital',
                ];
            }
        }

        // Fallback if no doctor found or no modes resolved
        if (empty($modes)) {
            $modes = [
                ['type' => 'video', 'label' => 'Video Appointment', 'price' => 800, 'icon' => 'video'],
                ['type' => 'in_person', 'label' => 'In-Person Visit', 'price' => 1200, 'icon' => 'hospital'],
            ];
        }

        return ['modes' => $modes];
    }

    protected function getDateTimeSelectorData(array $data): array
    {
        $doctorId = $data['selectedDoctorId'] ?? null;
        $doctor = $doctorId ? $this->getDoctorDetailsById($doctorId) : null;

        // Get base dates, then filter by doctor availability
        $dates = $this->getAvailableDates($data);
        $daysOff = $doctorId ? $this->getDoctorDaysOff($doctorId) : [];

        $transformedDates = [];
        foreach ($dates as $date) {
            $dateObj = Carbon::parse($date['value']);
            $isAvailable = empty($daysOff) || !in_array($dateObj->dayOfWeek, $daysOff);

            // Only include dates the doctor works on
            if ($isAvailable) {
                $transformedDates[] = [
                    'date' => $date['value'],
                    'label' => $date['label'],
                    'sublabel' => $date['day'],
                ];
            }
        }

        // If no dates available in the current range, expand search up to 14 days
        if (empty($transformedDates) && $doctorId) {
            for ($i = 0; $i < 14; $i++) {
                $date = Carbon::today()->addDays($i);
                if (!in_array($date->dayOfWeek, $daysOff)) {
                    $transformedDates[] = [
                        'date' => $date->format('Y-m-d'),
                        'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('M j')),
                        'sublabel' => $date->format('D'),
                    ];
                    if (count($transformedDates) >= 5) break;
                }
            }
        }

        // Use doctor's actual time slots if available, otherwise generic
        $slots = [];
        if ($doctor && !empty($doctor['slots'])) {
            $slots = $doctor['slots'];
        } else {
            $slots = $this->generateTimeSlots();
        }

        Log::info('📅 Built time slot selector data', [
            'doctor_id' => $doctorId,
            'doctor_name' => $doctor['name'] ?? 'none',
            'total_base_dates' => count($dates),
            'filtered_dates' => count($transformedDates),
            'slots_count' => count($slots),
        ]);

        return [
            'dates' => $transformedDates,
            'slots' => $slots,
            'doctor_name' => $doctor['name'] ?? null,
        ];
    }

    // Message handling methods

    protected function addUserMessage(BookingConversation $conversation, ?string $content, ?array $selection): void
    {
        $displayMessage = $selection['display_message'] ?? $content;

        ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $displayMessage ?? '',
        ]);
    }

    protected function addAssistantMessage(BookingConversation $conversation, string $message, ?string $componentType, ?array $componentData, array $thinkingSteps = []): void
    {
        // Check for duplicate components: If the last assistant message has the same component type
        // AND there's no user message after it, update it instead of creating a new one
        // NOTE: Use created_at for ordering since IDs are UUIDs (not chronologically ordered)
        if ($componentType) {
            $lastAssistantMessage = ConversationMessage::where('conversation_id', $conversation->id)
                ->where('role', 'assistant')
                ->whereNotNull('component_type')
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            // Only deduplicate if there's NO user message after the last assistant message
            if ($lastAssistantMessage && $lastAssistantMessage->component_type === $componentType) {
                $hasUserMessageAfter = ConversationMessage::where('conversation_id', $conversation->id)
                    ->where('created_at', '>=', $lastAssistantMessage->created_at)
                    ->where('id', '!=', $lastAssistantMessage->id)
                    ->where('role', 'user')
                    ->exists();

                if (!$hasUserMessageAfter) {
                    Log::info('🔄 Component Deduplication: Updating existing component instead of creating duplicate', [
                        'conversation_id' => $conversation->id,
                        'component_type' => $componentType,
                        'last_message_id' => $lastAssistantMessage->id,
                        'action' => 'update_existing',
                    ]);

                    $lastAssistantMessage->update([
                        'content' => $message,
                        'component_data' => $componentData,
                        'thinking_steps' => !empty($thinkingSteps) ? $thinkingSteps : null,
                    ]);

                    return;
                }
            }
        }

        // No duplicate found - create new message
        ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $message,
            'component_type' => $componentType,
            'component_data' => $componentData,
            'thinking_steps' => !empty($thinkingSteps) ? $thinkingSteps : null,
        ]);

        Log::info('✉️ New Assistant Message Created', [
            'conversation_id' => $conversation->id,
            'component_type' => $componentType ?? 'none',
            'has_component_data' => !empty($componentData),
            'has_thinking_steps' => !empty($thinkingSteps),
        ]);
    }

    /**
     * Remove duplicate sentences from message
     */
    protected function removeDuplicateSentences(string $message): string
    {
        $sentences = preg_split('/(?<=[.!?])\s+/', $message, -1, PREG_SPLIT_NO_EMPTY);

        Log::info('DUPLICATE REMOVAL - Input', [
            'original_message' => $message,
            'sentence_count' => count($sentences),
            'sentences' => $sentences,
        ]);

        $unique = array_unique($sentences);

        if (count($unique) < count($sentences)) {
            Log::info('DUPLICATE REMOVAL - Found duplicates', [
                'original_count' => count($sentences),
                'unique_count' => count($unique),
                'removed' => array_values(array_diff($sentences, $unique)),
            ]);
        } else {
            Log::info('DUPLICATE REMOVAL - No changes needed');
        }

        return implode(' ', $unique);
    }

    /**
     * Get list of previous doctors for follow-up appointments with availability info
     */
    protected function getPreviousDoctors(array $data): array
    {
        // In a real implementation, this would fetch from the database
        // For now, return mock data based on the patient

        $patientId = $data['selectedPatientId'] ?? null;

        if (!$patientId) {
            return [];
        }

        $selectedDate = $data['selectedDate'] ?? null;

        // Mock previous doctors
        $previousDoctors = [
            [
                'id' => 1,
                'name' => 'Dr. Sarah Johnson',
                'specialization' => 'General Physician',
                'last_visit' => '2 weeks ago',
                'avatar' => '/assets/avatars/doctor1.jpg',
            ],
            [
                'id' => 3,
                'name' => 'Dr. Emily Chen',
                'specialization' => 'Dermatologist',
                'last_visit' => '1 month ago',
                'avatar' => '/assets/avatars/doctor3.jpg',
            ],
        ];

        // Enhance with availability information if date is selected
        if ($selectedDate) {
            foreach ($previousDoctors as &$doctor) {
                $doctorDetails = $this->getDoctorDetailsById($doctor['id']);
                if ($doctorDetails) {
                    // Get available time slots for this doctor on the selected date
                    $slots = $doctorDetails['slots'] ?? $this->generateTimeSlots();
                    $availableSlots = array_filter($slots, fn($slot) => $slot['available'] ?? false);
                    $availableTimes = array_column($availableSlots, 'time');

                    if (!empty($availableTimes)) {
                        $doctor['available_on_date'] = true;
                        $doctor['availability_message'] = 'Available on ' . Carbon::parse($selectedDate)->format('M j');
                        $doctor['quick_times'] = array_slice($availableTimes, 0, 3); // First 3 available slots
                    } else {
                        $doctor['available_on_date'] = false;
                        $doctor['availability_message'] = 'Not available on ' . Carbon::parse($selectedDate)->format('M j');
                        $doctor['quick_times'] = [];
                    }

                    // Add consultation modes and fees
                    $doctor['consultation_modes'] = $doctorDetails['consultation_modes'] ?? ['video', 'in_person'];
                    $doctor['video_fee'] = $doctorDetails['video_fee'] ?? 800;
                    $doctor['in_person_fee'] = $doctorDetails['in_person_fee'] ?? 1200;
                }
            }
        } else {
            // No date selected yet - just show general availability
            foreach ($previousDoctors as &$doctor) {
                $doctor['available_on_date'] = true;
                $doctor['availability_message'] = 'Available';
                $doctor['quick_times'] = ['09:00', '10:00', '14:00'];
            }
        }

        Log::info('📋 Previous Doctors: Enhanced with availability', [
            'patient_id' => $patientId,
            'selected_date' => $selectedDate,
            'doctors_count' => count($previousDoctors),
            'doctors' => $previousDoctors,
        ]);

        return $previousDoctors;
    }

    /**
     * Map doctor name to doctor ID for smart step skipping
     * Enables "book with Dr. Sarah Johnson" to jump directly to time selection
     */
    protected function getDoctorIdByName(string $doctorName): ?int
    {
        // Mock doctor name to ID mapping
        // In production, this would query the database
        $doctors = [
            'Dr. Sarah Johnson' => 1,
            'Dr. Emily Chen' => 2,
            'Dr. Rajesh Kumar' => 3,
            'Dr. Meera Iyer' => 3, // Alternative name for same doctor
            'Dr. Anita Deshmukh' => 4,
            'Dr. Vikram Patel' => 5,
        ];

        // Case-insensitive partial match
        $doctorNameLower = strtolower($doctorName);
        foreach ($doctors as $name => $id) {
            $nameLower = strtolower($name);
            // Match if either name contains the other (handles "Dr. Sarah" matching "Dr. Sarah Johnson")
            if (stripos($nameLower, $doctorNameLower) !== false || stripos($doctorNameLower, $nameLower) !== false) {
                Log::info('🔍 Doctor name matched', [
                    'extracted_name' => $doctorName,
                    'matched_name' => $name,
                    'doctor_id' => $id,
                ]);
                return $id;
            }
        }

        Log::warning('⚠️ Doctor name not matched', [
            'extracted_name' => $doctorName,
            'available_doctors' => array_keys($doctors),
        ]);

        return null;
    }

    /**
     * Validate if a time slot is available for a specific doctor
     */
    protected function validateTimeSlotForDoctor(int $doctorId, ?string $date, string $time): bool
    {
        // Get doctor details
        $doctorDetails = $this->getDoctorDetailsById($doctorId);

        if (!$doctorDetails) {
            Log::warning('⚠️ Time Validation: Doctor not found', ['doctor_id' => $doctorId]);
            return false;
        }

        // Get doctor's available slots for the date
        $slots = $doctorDetails['slots'] ?? $this->generateTimeSlots();

        // Check if the requested time is in the available slots
        foreach ($slots as $slot) {
            if ($slot['time'] === $time && ($slot['available'] ?? false)) {
                Log::info('✅ Time Validation: Slot available', [
                    'doctor_id' => $doctorId,
                    'time' => $time,
                    'slot' => $slot,
                ]);
                return true;
            }
        }

        Log::warning('⚠️ Time Validation: Slot not available', [
            'doctor_id' => $doctorId,
            'requested_time' => $time,
            'available_slots' => array_column(array_filter($slots, fn($s) => $s['available'] ?? false), 'time'),
        ]);

        return false;
    }

    /**
     * Get doctor details by ID
     */
    protected function getDoctorDetailsById(int $doctorId): ?array
    {
        $allDoctors = [
            1 => [
                'id' => 1,
                'name' => 'Dr. Sarah Johnson',
                'avatar' => '/assets/avatars/doctor1.jpg',
                'specialization' => 'General Physician',
                'experience_years' => 12,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
            ],
            2 => [
                'id' => 2,
                'name' => 'Dr. Emily Chen',
                'avatar' => '/assets/avatars/doctor2.jpg',
                'specialization' => 'Cardiologist',
                'experience_years' => 18,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 1200,
                'in_person_fee' => 1500,
            ],
            3 => [
                'id' => 3,
                'name' => 'Dr. Rajesh Kumar',
                'avatar' => '/assets/avatars/doctor3.jpg',
                'specialization' => 'Pediatrician',
                'experience_years' => 10,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 700,
                'in_person_fee' => 1000,
            ],
            4 => [
                'id' => 4,
                'name' => 'Dr. Anita Deshmukh',
                'avatar' => '/assets/avatars/doctor4.jpg',
                'specialization' => 'Dermatologist',
                'experience_years' => 15,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 1000,
                'in_person_fee' => 1500,
            ],
            5 => [
                'id' => 5,
                'name' => 'Dr. Vikram Patel',
                'avatar' => '/assets/avatars/doctor5.jpg',
                'specialization' => 'Orthopedist',
                'experience_years' => 20,
                'consultation_modes' => ['in_person'],
                'video_fee' => 0,
                'in_person_fee' => 1800,
            ],
        ];

        return $allDoctors[$doctorId] ?? null;
    }

    /**
     * Get the default consultation mode for a doctor.
     * Returns the doctor's only supported mode, or 'video' as a generic fallback.
     */
    protected function getDefaultModeForDoctor(?int $doctorId): string
    {
        if ($doctorId) {
            $doctor = $this->getDoctorDetailsById($doctorId);
            if ($doctor) {
                $modes = $doctor['consultation_modes'] ?? [];
                if (count($modes) === 1) {
                    return $modes[0];
                }
            }
        }

        return 'video';
    }
}
