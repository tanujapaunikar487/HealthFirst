<?php

namespace App\Services\Booking;

use App\BookingConversation;
use App\ConversationMessage;
use App\Models\UserAddress;
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
    private DoctorService $doctorService;
    private LabService $labService;
    private BookingPromptBuilder $promptBuilder;
    private EntityNormalizer $entityNormalizer;

    public function __construct(
        private AIService $aiService,
        ?DoctorService $doctorService = null,
        ?LabService $labService = null,
        ?BookingPromptBuilder $promptBuilder = null,
        ?EntityNormalizer $entityNormalizer = null
    ) {
        $this->doctorService = $doctorService ?? new DoctorService();
        $this->labService = $labService ?? new LabService();
        $this->promptBuilder = $promptBuilder ?? new BookingPromptBuilder($this->doctorService, $this->labService);
        $this->entityNormalizer = $entityNormalizer ?? new EntityNormalizer($this->doctorService, $this->labService);
    }

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

        // Special handling: If we're waiting for package_inquiry, capture the search input
        $bookingType = $currentData['booking_type'] ?? 'doctor';
        $packageInquiryAsked = $currentData['package_inquiry_asked'] ?? false;

        if ($bookingType === 'lab_test'
            && !empty($currentData['selectedPatientId'])
            && empty($currentData['selectedPackageId'])
            && empty($currentData['selectedTestIds'])
            && !$packageInquiryAsked
            && $userInput) {

            $trimmedInput = trim($userInput);
            Log::info('🔒 Detected package_inquiry response', ['input' => $trimmedInput]);

            $currentData['package_inquiry_asked'] = true;

            // Search for matching packages AND individual tests
            $searchResults = $this->labService->searchPackages($trimmedInput);
            $testResults = $this->labService->searchTests($trimmedInput);

            $currentData['packageSearchQuery'] = $trimmedInput;
            $currentData['testSearchResults'] = array_column($testResults, 'id');
            $currentData['testMatchCount'] = count($testResults);

            if (count($searchResults) === 0 && count($testResults) === 1) {
                // Only one individual test matched — auto-select it
                $test = $testResults[0];
                $currentData['selectedTestIds'] = [$test['id']];
                $currentData['selectedTestNames'] = [$test['name']];
                $currentData['packageRequiresFasting'] = $test['requires_fasting'];
                $currentData['packageFastingHours'] = $test['fasting_hours'];
                if (!in_array('package', $currentData['completedSteps'] ?? [])) {
                    $currentData['completedSteps'][] = 'package';
                }
                Log::info('🎯 Individual test auto-selected', ['test' => $test['name']]);
            } elseif (count($searchResults) === 1 && count($testResults) === 0) {
                // Only one package matched — auto-select it
                $pkg = $searchResults[0];
                $currentData['selectedPackageId'] = $pkg['id'];
                $currentData['selectedPackageName'] = $pkg['name'];
                $currentData['packageRequiresFasting'] = $pkg['requires_fasting'];
                $currentData['packageFastingHours'] = $pkg['fasting_hours'];
                if (!in_array('package', $currentData['completedSteps'] ?? [])) {
                    $currentData['completedSteps'][] = 'package';
                }
                Log::info('🎯 Package auto-selected', ['package' => $pkg['name']]);
            } else {
                // Multiple or no results — store for filtered display
                $currentData['packageSearchResults'] = array_column($searchResults, 'id');
                $currentData['packageMatchCount'] = count($searchResults);
                Log::info('🔍 Search results', [
                    'query' => $trimmedInput,
                    'package_matches' => count($searchResults),
                    'test_matches' => count($testResults),
                ]);
            }

            $conversation->collected_data = $currentData;
            $conversation->save();

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
                $supportedModes = $doctorId ? $this->doctorService->getSupportedModes($doctorId) : ['video', 'in_person'];

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

        // Handle non-booking intents (greeting, question, general_info, unclear)
        // Only when the conversation has no collected data yet (fresh start)
        $intent = $parsed['intent'] ?? 'unclear';
        $currentData = $conversation->collected_data;
        $hasBookingProgress = !empty($currentData['selectedPatientId']) || !empty($currentData['appointmentType']) || !empty($currentData['selectedPackageId']) || !empty($currentData['booking_type']);

        if (!$hasBookingProgress && in_array($intent, ['greeting', 'question', 'general_info', 'unclear'])) {
            $greetingResponses = [
                'greeting' => "Hi there! I'm your booking assistant. I can help you book a doctor appointment or a lab test. What would you like to do?",
                'question' => $parsed['ai_response'] ?? "I'm here to help you book appointments. Would you like to book a doctor visit or a lab test?",
                'general_info' => $parsed['ai_response'] ?? "I can help you with booking doctor appointments and lab tests. How can I assist you today?",
                'unclear' => "I'm your booking assistant. I can help you book a doctor appointment or a lab test. What would you like to do?",
            ];

            $message = $greetingResponses[$intent];

            Log::info('IntelligentOrchestrator: Non-booking intent detected', [
                'intent' => $intent,
                'has_booking_progress' => $hasBookingProgress,
            ]);

            $this->addAssistantMessage($conversation, $message, null, null);

            return [
                'status' => 'success',
                'message' => $message,
                'component_type' => null,
                'component_data' => null,
                'ready_to_book' => false,
                'progress' => [
                    'percentage' => 0,
                    'current_state' => 'greeting',
                    'missing_fields' => [],
                ],
            ];
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

        // Auto-detect booking_type from intent
        $currentData = $conversation->collected_data;
        $intent = $parsed['intent'] ?? 'unclear';
        if ($intent === 'booking_lab' && ($currentData['booking_type'] ?? 'doctor') !== 'lab_test') {
            $currentData['booking_type'] = 'lab_test';
            $conversation->collected_data = $currentData;
        } elseif ($intent === 'booking_doctor' && empty($currentData['booking_type'])) {
            $currentData['booking_type'] = 'doctor';
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
            // Build a context-aware prompt with today's date, doctor list, and booking state
            $dynamicPrompt = $this->promptBuilder->build($conversation->collected_data);

            Log::info('🤖 AI Classification: Calling classifyIntent with dynamic prompt', [
                'message' => $message,
                'history_count' => count($history),
                'prompt_length' => strlen($dynamicPrompt),
            ]);

            $result = $this->aiService->classifyIntent($message, $history, $dynamicPrompt);

            Log::info('🤖 AI Classification: Result received', [
                'full_result' => $result,
                'intent' => $result['intent'] ?? 'null',
                'confidence' => $result['confidence'] ?? 'null',
                'entities' => $result['entities'] ?? [],
                'is_emergency' => $result['is_emergency'] ?? 'null',
            ]);

            // Fallback: detect patient_relation from message if AI missed it
            $entities = $result['entities'] ?? [];
            if (empty($entities['patient_relation'])) {
                // Check for family member first (more specific), then self (more general)
                if (preg_match('/\bfor\s+my\s+(mother|mom|father|dad|son|daughter|spouse|wife|husband|brother|sister|grandmother|grandfather)\b/i', $message, $m)) {
                    $entities['patient_relation'] = strtolower($m[1]);
                } elseif (preg_match('/\bfor\s+(me|myself)\b/i', $message)) {
                    $entities['patient_relation'] = 'self';
                }
                $result['entities'] = $entities;
            }

            // Determine if this is a correction based on changes_requested
            $isCorrection = !empty($result['changes_requested']);

            return [
                'intent' => $result['intent'] ?? 'unclear',
                'confidence' => $result['confidence'] ?? 0.5,
                'entities' => $entities,
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
     * Intelligently merge AI-extracted entities with existing data.
     *
     * Delegates normalization/validation to EntityNormalizer, then handles
     * merge logic: field updates, cascade clearing, and textMentionedFields tracking.
     */
    protected function mergeEntities(array $currentData, array $newEntities, array $parsed): array
    {
        $updated = $currentData;

        Log::info('🔀 Entity Merge: Starting', [
            'new_entities_received' => $newEntities,
            'current_data_keys' => array_keys($currentData),
        ]);

        if (empty($newEntities)) {
            return $updated;
        }

        // Step 1: Normalize and validate all entities via EntityNormalizer
        $normalized = $this->entityNormalizer->normalize($newEntities, $currentData);
        $entities = $normalized['entities'];
        $warnings = $normalized['warnings'];

        if (!empty($warnings)) {
            Log::info('🔧 Entity Merge: Normalizer warnings', ['warnings' => $warnings]);
        }

        $isCorrection = $parsed['is_correction'] ?? false;
        $appointmentType = $currentData['appointmentType'] ?? null;
        $hasFollowupReason = !empty($currentData['followup_reason']);

        // Step 2: Merge normalized entities into current data
        foreach ($entities as $dataKey => $entityValue) {
            if (empty($entityValue) && $entityValue !== 0 && $entityValue !== '0') {
                continue;
            }

            // Block symptoms for follow-up until followup_reason is selected
            if ($appointmentType === 'followup' && !$hasFollowupReason && $dataKey === 'symptoms') {
                Log::info('⛔ Entity Merge: BLOCKING symptoms until followup_reason selected');
                continue;
            }

            $currentValue = $updated[$dataKey] ?? null;

            // Decide if we should update this field
            if (!$this->shouldUpdateField($dataKey, $entityValue, $currentValue, $isCorrection)) {
                continue;
            }

            Log::info('✅ Entity Merge: UPDATING field', [
                'field' => $dataKey,
                'old_value' => $currentValue,
                'new_value' => $entityValue,
            ]);

            $updated[$dataKey] = $entityValue;

            // Track fields explicitly mentioned in user's text input
            $textMentioned = $updated['textMentionedFields'] ?? [];
            if (!in_array($dataKey, $textMentioned)) {
                $textMentioned[] = $dataKey;
                $updated['textMentionedFields'] = $textMentioned;
            }

            // === Cascade clearing for field changes ===

            // Patient relation → resolve to patient data
            if ($dataKey === 'patientRelation') {
                if ($entityValue === 'self') {
                    $updated['selectedPatientId'] = 1;
                    $updated['selectedPatientName'] = 'Yourself';
                    $updated['selectedPatientAvatar'] = '/assets/avatars/self.png';
                } else {
                    unset($updated['selectedPatientId']);
                    $updated['selectedPatientName'] = $entityValue;
                    unset($updated['selectedPatientAvatar']);
                    $updated['completedSteps'] = array_values(array_diff(
                        $updated['completedSteps'] ?? [], ['patient']
                    ));
                }
            }

            // Appointment type change → clear all downstream
            if ($dataKey === 'appointmentType' && !empty($currentValue) && $entityValue !== $currentValue) {
                unset($updated['urgency'], $updated['selectedDoctorId'], $updated['selectedDoctorName']);
                unset($updated['selectedDoctorAvatar'], $updated['selectedDoctorSpecialization']);
                unset($updated['doctorSearchQuery'], $updated['selectedDate']);
                unset($updated['selectedTime'], $updated['consultationMode']);
                if ($currentValue === 'followup') {
                    unset($updated['followup_reason'], $updated['followup_notes']);
                    unset($updated['followup_notes_asked'], $updated['previous_doctors_shown']);
                }
                $updated['completedSteps'] = array_values(array_diff(
                    $updated['completedSteps'] ?? [],
                    ['urgency', 'doctor', 'date', 'time', 'mode', 'followup_reason', 'followup_notes']
                ));
            }

            // Urgency change → clear downstream date/time
            if ($dataKey === 'urgency' && !empty($currentValue) && $entityValue !== $currentValue) {
                unset($updated['selectedDate'], $updated['selectedTime'], $updated['consultationMode']);
                $updated['completedSteps'] = array_values(array_diff(
                    $updated['completedSteps'] ?? [], ['date', 'time', 'mode']
                ));
            }

            // Package name handling — auto-select if resolved by normalizer
            if ($dataKey === 'selectedPackageName' && !empty($entityValue)) {
                $packageId = $entities['selectedPackageId'] ?? $this->labService->findPackageByName($entityValue);
                if ($packageId) {
                    $package = $this->labService->getPackageById($packageId);
                    $updated['selectedPackageId'] = $packageId;
                    $updated['selectedPackageName'] = $package['name'] ?? $entityValue;
                    $updated['packageRequiresFasting'] = $package['requires_fasting'] ?? false;
                    $updated['packageFastingHours'] = $package['fasting_hours'] ?? null;
                    $updated['package_inquiry_asked'] = true; // Skip inquiry since AI resolved it
                    if (!in_array('package', $updated['completedSteps'] ?? [])) {
                        $updated['completedSteps'][] = 'package';
                    }
                }
            }

            // Collection type change → clear date/time
            if ($dataKey === 'collectionType' && !empty($currentValue) && $entityValue !== $currentValue) {
                unset($updated['selectedDate'], $updated['selectedTime']);
                unset($updated['selectedCenterId'], $updated['selectedCenterName']);
                $updated['completedSteps'] = array_values(array_diff(
                    $updated['completedSteps'] ?? [], ['location', 'date', 'time']
                ));
            }

            // Doctor name handling — auto-select if resolved by normalizer, otherwise show list
            if ($dataKey === 'selectedDoctorName' && !empty($entityValue)) {
                $doctorId = $entities['selectedDoctorId'] ?? $this->doctorService->findByName($entityValue);
                $existingDoctorId = $updated['selectedDoctorId'] ?? null;

                if ($doctorId && $existingDoctorId && $doctorId != $existingDoctorId) {
                    // Changing doctor — clear old selection
                    unset($updated['selectedDoctorId'], $updated['selectedDoctorName']);
                    unset($updated['selectedDoctorAvatar'], $updated['selectedDoctorSpecialization']);
                    unset($updated['selectedTime'], $updated['consultationMode']);
                    $updated['completedSteps'] = array_values(array_diff(
                        $updated['completedSteps'] ?? [], ['doctor', 'time', 'mode']
                    ));
                } elseif ($doctorId && empty($existingDoctorId)) {
                    // Doctor resolved — auto-select them
                    $doctor = $this->doctorService->getById($doctorId);
                    $updated['selectedDoctorId'] = $doctorId;
                    $updated['selectedDoctorName'] = $doctor['name'] ?? $entityValue;
                    $updated['selectedDoctorSpecialization'] = $doctor['specialization'] ?? '';
                    $updated['selectedDoctorAvatar'] = $doctor['avatar'] ?? '';
                    if (!in_array('doctor', $updated['completedSteps'] ?? [])) {
                        $updated['completedSteps'][] = 'doctor';
                    }
                    unset($updated['doctorSearchQuery']);
                }
            }
        }

        // Step 3: Apply normalizer-detected conflicts and warnings

        // Past date warning — user typed a date that has already passed
        if (!empty($entities['past_date_warning'])) {
            $updated['past_date_warning'] = $entities['past_date_warning'];
            // Ensure date-related fields are cleared
            unset($updated['selectedDate']);
            unset($updated['selectedTime']);
            $updated['completedSteps'] = array_values(array_diff(
                $updated['completedSteps'] ?? [], ['date', 'time']
            ));
            $updated['textMentionedFields'] = array_values(array_diff(
                $updated['textMentionedFields'] ?? [], ['selectedDate', 'selectedTime']
            ));
            // Set urgency so state machine doesn't regress
            if (empty($updated['urgency'])) {
                $updated['urgency'] = 'this_week';
            }
        }

        if (!empty($entities['mode_conflict'])) {
            $updated['mode_conflict'] = $entities['mode_conflict'];
        }
        if (!empty($entities['doctor_date_conflict'])) {
            $conflict = $entities['doctor_date_conflict'];
            Log::info('⚠️ Entity Merge: Doctor-date conflict detected by normalizer', [
                'doctor' => $conflict['searched_doctor'] ?? '',
                'date' => $conflict['date'] ?? '',
            ]);

            // Clear the conflicting date so state machine goes to date_selection
            unset($updated['selectedDate']);
            unset($updated['selectedTime']);
            unset($updated['consultationMode']);
            $updated['completedSteps'] = array_values(array_diff(
                $updated['completedSteps'] ?? [],
                ['date', 'time', 'mode']
            ));
            // Remove date from textMentionedFields since it was invalid
            $updated['textMentionedFields'] = array_values(array_diff(
                $updated['textMentionedFields'] ?? [],
                ['selectedDate']
            ));
            // Set urgency to prevent regression past urgency step
            if (empty($updated['urgency'])) {
                $updated['urgency'] = 'this_week';
            }
            // Store the conflict info so buildResponseFromStateMachine can show it
            // The doctor_date_conflict will be picked up by getDoctorListForDate
            // or we store it directly for the response builder
            $updated['doctor_date_conflict'] = $conflict;
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
            // Lab-specific fields
            'selectedPackageName', 'selectedPackageId', 'collectionType',
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

        // Check for doctor-date conflict from entity normalization
        if (!empty($data['doctor_date_conflict'])) {
            $message = $data['doctor_date_conflict']['message'];

            // Clear the flag so it doesn't repeat
            unset($data['doctor_date_conflict']);
        }

        // Check for past date warning
        if (!empty($data['past_date_warning'])) {
            $message = $data['past_date_warning']['message'];

            // Clear the flag so it doesn't repeat
            unset($data['past_date_warning']);
        }

        // Save data
        $conversation->collected_data = $data;
        $conversation->save();

        // Build component data
        $componentData = null;
        if ($component['type']) {
            $componentData = $this->buildComponentDataForType($component['type'], $data, $conversation->user_id);
        }

        // Auto-show address form when user has no saved addresses
        if ($component['type'] === 'address_selector' && empty($componentData['addresses'] ?? [])) {
            $component['type'] = 'address_form';
            $componentData = [];
            $message = "You don't have any saved addresses yet. Please add one for home collection.";
        }

        // Check for doctor-date conflict (requested doctor unavailable on selected date)
        if (!empty($componentData['doctor_date_conflict'])) {
            $message = $componentData['doctor_date_conflict']['message'];
            // Clear the conflicting date so user can pick an available one
            unset($data['selectedDate']);
            $data['completedSteps'] = array_values(array_diff(
                $data['completedSteps'] ?? [],
                ['date']
            ));
            // Remove from textMentionedFields too since the date was invalid for this doctor
            $data['textMentionedFields'] = array_values(array_diff(
                $data['textMentionedFields'] ?? [],
                ['selectedDate']
            ));
            // Ensure urgency is set so the flow goes to date_selection, not back to urgency.
            // The user was already past urgency (they had a date), so don't regress.
            if (empty($data['urgency'])) {
                $data['urgency'] = 'this_week';
            }
            $conversation->collected_data = $data;
            $conversation->save();
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
    protected function buildComponentDataForType(?string $type, array $data, ?string $userId = null): ?array
    {
        if (!$type) {
            return null;
        }

        return match($type) {
            'patient_selector' => $this->getPatientSelectorData($userId),
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
            'date_picker' => $this->getDatePickerData($data),
            'doctor_selector' => $this->getDoctorListForDate($data),
            'date_doctor_selector' => $this->getDoctorListData($data),
            'time_slot_selector' => $this->getDateTimeSelectorData($data),
            'mode_selector' => $this->getModeSelectorData($data),
            // Lab-specific components
            'package_list' => $this->getPackageListData($data),
            'collection_type_selector' => $this->getCollectionTypeSelectorData(),
            'address_selector' => $this->getAddressSelectorData($data, $userId),
            'center_list' => $this->getCenterListData($data),
            'location_selector' => $this->getLocationSelectorData($data),
            'date_time_selector' => $this->getLabDateTimeSelectorData($data),
            'booking_summary' => $this->buildSummaryDataByType($data),
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
            // Use format without timezone offset so the frontend displays the exact
            // time the user selected, without any timezone conversion.
            return \Carbon\Carbon::parse("$date $time")->format('Y-m-d\TH:i:s');
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
        $doctor = $doctorId ? $this->doctorService->getById($doctorId) : null;
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
     * Route summary building based on booking type
     */
    protected function buildSummaryDataByType(array $data): array
    {
        $bookingType = $data['booking_type'] ?? 'doctor';

        if ($bookingType === 'lab_test') {
            return $this->buildLabSummaryData($data);
        }

        return $this->buildSummaryData($data);
    }

    /**
     * Build lab test booking summary data
     */
    protected function buildLabSummaryData(array $data): array
    {
        $packageId = $data['selectedPackageId'] ?? null;
        $testIds = $data['selectedTestIds'] ?? [];
        $testNames = $data['selectedTestNames'] ?? [];
        $package = $packageId ? $this->labService->getPackageById($packageId) : null;
        $collectionType = $data['collectionType'] ?? 'center';

        // Calculate fee
        $fee = $this->labService->calculateFee($packageId, $collectionType, !empty($testIds) ? $testIds : null);

        // Get center address
        $address = 'Address not available';
        if ($collectionType === 'home') {
            $address = $data['selectedAddressText'] ?? 'Your registered address';
        } elseif (!empty($data['selectedCenterId'])) {
            $center = $this->labService->getCenterById($data['selectedCenterId']);
            $address = $center['address'] ?? $address;
        } else {
            $centers = $this->labService->getAllCenters();
            if (!empty($centers)) {
                $address = $centers[0]['address'];
            }
        }

        // Build preparation instructions
        $prepInstructions = [];
        $requiresFasting = $package ? ($package['requires_fasting'] ?? false) : !empty($data['packageRequiresFasting']);
        if ($requiresFasting) {
            $fastingHours = $package ? ($package['fasting_hours'] ?? 12) : ($data['packageFastingHours'] ?? 12);
            $prepInstructions = [
                "Fasting for {$fastingHours}-" . ($fastingHours + 2) . " hours required",
                'Water is allowed',
                'Avoid alcohol 24 hours before',
                'Continue regular medications unless advised otherwise',
            ];
        }

        return [
            'package' => $data['selectedPackageName'] ?? (!empty($testNames) ? implode(', ', $testNames) : ($package['name'] ?? 'Unknown Package')),
            'patient' => [
                'name' => $data['selectedPatientName'] ?? 'Unknown Patient',
                'avatar' => $data['selectedPatientAvatar'] ?? null,
            ],
            'datetime' => $this->formatDateTime($data['selectedDate'] ?? null, $data['selectedTime'] ?? null),
            'collection' => $collectionType === 'home'
                ? 'Home Collection'
                : ($data['selectedCenterName'] ?? 'Visit Center'),
            'address' => $address,
            'fee' => $fee,
            'prepInstructions' => $prepInstructions,
        ];
    }

    /**
     * Get package list data for lab booking
     */
    protected function getPackageListData(array $data): array
    {
        $searchResultIds = $data['packageSearchResults'] ?? null;

        if (!empty($searchResultIds)) {
            // Show only filtered packages matching search results
            $allPackages = $this->labService->getAllPackages();
            $packages = array_values(array_filter(
                $allPackages,
                fn($p) => in_array($p['id'], $searchResultIds)
            ));
        } else {
            // Fallback to all packages (no search or zero results)
            $packages = $this->labService->getAllPackages();
        }

        // Format for EmbeddedPackageList component
        $formatPackage = fn($p) => [
            'id' => $p['id'],
            'name' => $p['name'],
            'description' => $p['description'] ?? '',
            'duration_hours' => $p['duration_hours'] ?? null,
            'tests_count' => $p['tests_count'] ?? 0,
            'age_range' => $p['age_range'] ?? null,
            'price' => $p['price'],
            'original_price' => $p['original_price'] ?? null,
            'is_recommended' => $p['is_popular'] ?? false,
            'requires_fasting' => $p['requires_fasting'] ?? false,
            'fasting_hours' => $p['fasting_hours'] ?? null,
        ];

        // Build individual tests list from search results
        $individualTests = [];
        $testResultIds = $data['testSearchResults'] ?? [];
        if (!empty($testResultIds)) {
            foreach ($testResultIds as $testId) {
                $test = $this->labService->getTestById($testId);
                if ($test) {
                    $individualTests[] = [
                        'id' => $test['id'],
                        'name' => $test['name'],
                        'description' => $test['description'] ?? '',
                        'category' => $test['category'] ?? '',
                        'price' => $test['price'],
                        'turnaround_hours' => $test['turnaround_hours'] ?? null,
                        'requires_fasting' => $test['requires_fasting'] ?? false,
                        'fasting_hours' => $test['fasting_hours'] ?? null,
                    ];
                }
            }
        }

        return [
            'packages' => array_map($formatPackage, $packages),
            'individual_tests' => $individualTests,
            'selectedPackageId' => $data['selectedPackageId'] ?? null,
            'selectedTestIds' => $data['selectedTestIds'] ?? [],
        ];
    }

    /**
     * Get location selector data for lab booking
     */
    protected function getLocationSelectorData(array $data): array
    {
        $locations = $this->labService->getLocationOptions();

        return [
            'locations' => $locations,
            'selectedLocationId' => $data['collectionType'] ?? null,
        ];
    }

    /**
     * Get collection type selector data (Home Collection / Hospital Visit)
     */
    protected function getCollectionTypeSelectorData(): array
    {
        return [
            'options' => [
                [
                    'id' => 'home',
                    'label' => 'Home Collection',
                    'description' => 'Sample collected at your doorstep',
                    'icon' => 'home',
                ],
                [
                    'id' => 'center',
                    'label' => 'Hospital Visit',
                    'description' => 'Visit a lab center near you',
                    'icon' => 'building',
                ],
            ],
        ];
    }

    /**
     * Get address selector data for home collection
     */
    protected function getAddressSelectorData(array $data, ?string $userId): array
    {
        $addresses = [];
        if ($userId) {
            $addresses = UserAddress::where('user_id', $userId)
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id,
                    'label' => $a->label,
                    'address' => $a->getFullAddress(),
                    'is_default' => $a->is_default,
                ])
                ->toArray();
        }

        return [
            'addresses' => $addresses,
            'selectedAddressId' => $data['selectedAddressId'] ?? null,
        ];
    }

    /**
     * Get center list data for lab booking (sorted by distance)
     */
    protected function getCenterListData(array $data): array
    {
        return [
            'centers' => $this->labService->getAllCenters(),
            'selectedCenterId' => $data['selectedCenterId'] ?? null,
        ];
    }

    /**
     * Get date+time selector data for lab booking
     */
    protected function getLabDateTimeSelectorData(array $data): array
    {
        // Build dates for the next 7 days
        $dates = [];
        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::today()->addDays($i);
            $dates[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D')),
                'sublabel' => $date->format('M j'),
            ];
        }

        // Lab time slots (morning preferred for fasting tests)
        $slots = [
            ['time' => '6:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '7:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '8:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '9:00 AM', 'available' => true, 'preferred' => false],
            ['time' => '10:00 AM', 'available' => true, 'preferred' => false],
            ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
            ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
            ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
            ['time' => '4:00 PM', 'available' => true, 'preferred' => false],
        ];

        $requiresFasting = !empty($data['packageRequiresFasting']);
        $fastingHours = $data['packageFastingHours'] ?? null;

        return [
            'dates' => $dates,
            'slots' => $slots,
            'selected_date' => $data['selectedDate'] ?? null,
            'selected_time' => $data['selectedTime'] ?? null,
            'fastingRequired' => $requiresFasting,
            'fastingHours' => $fastingHours,
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
            $doctor = $this->doctorService->getById($doctorId);
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

        // Handle "Add family member or guest" trigger from patient selector
        if (!empty($selection['add_family_member'])) {
            Log::info('🔒 Selection Handler: Add family member form requested');

            $conversation->collected_data = $updated;
            $conversation->save();

            $this->addAssistantMessage(
                $conversation,
                'Please fill in the details for the new family member or guest.',
                'family_member_form',
                [],
                []
            );

            return [
                'status' => 'success',
                'state' => 'patient_selection',
                'message' => 'Please fill in the details for the new family member or guest.',
                'component_type' => 'family_member_form',
                'component_data' => [],
                'ready_to_book' => false,
                'progress' => [
                    'percentage' => 0,
                    'current_state' => 'patient_selection',
                    'missing_fields' => ['patient'],
                ],
            ];
        }

        // Handle new family member form submission
        if (isset($selection['new_member_name']) && isset($selection['new_member_relation'])) {
            $memberName = trim($selection['new_member_name']);
            $memberRelation = strtolower(trim($selection['new_member_relation']));
            $memberAge = isset($selection['new_member_age']) ? (int) $selection['new_member_age'] : null;
            $memberGender = isset($selection['new_member_gender']) ? strtolower(trim($selection['new_member_gender'])) : null;

            Log::info('🔒 Selection Handler: Creating new family member', [
                'name' => $memberName,
                'relation' => $memberRelation,
            ]);

            if (empty($memberName) || empty($memberRelation)) {
                $conversation->collected_data = $updated;
                $conversation->save();

                $this->addAssistantMessage(
                    $conversation,
                    'Name and relation are required. Please try again.',
                    'family_member_form',
                    ['error' => 'Name and relation are required.'],
                    []
                );

                return [
                    'status' => 'success',
                    'state' => 'patient_selection',
                    'message' => 'Name and relation are required. Please try again.',
                    'component_type' => 'family_member_form',
                    'component_data' => ['error' => 'Name and relation are required.'],
                    'ready_to_book' => false,
                    'progress' => [
                        'percentage' => 0,
                        'current_state' => 'patient_selection',
                        'missing_fields' => ['patient'],
                    ],
                ];
            }

            $newMember = \App\Models\FamilyMember::create([
                'user_id' => $conversation->user_id,
                'name' => $memberName,
                'relation' => $memberRelation,
                'age' => $memberAge,
                'gender' => $memberGender,
            ]);

            $updated['selectedPatientId'] = $newMember->id;
            $updated['selectedPatientName'] = $newMember->name;
            $updated['selectedPatientAvatar'] = '';
            $updated['patientRelation'] = $memberRelation;
            if (!in_array('patient', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'patient';
            }

            Log::info('✅ New family member created and auto-selected', [
                'member_id' => $newMember->id,
                'member_name' => $newMember->name,
            ]);
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

            // Clear AI-hallucinated urgency/date that wasn't explicitly provided by the user.
            // Only clear if the field is NOT in completedSteps (UI-selected) AND NOT in
            // textMentionedFields (explicitly mentioned in user's text, e.g. "5th Feb").
            $textMentioned = $updated['textMentionedFields'] ?? [];
            if (!in_array('urgency', $updated['completedSteps']) && !in_array('urgency', $textMentioned)) {
                unset($updated['urgency']);
            }
            if (!in_array('date', $updated['completedSteps']) && !in_array('selectedDate', $textMentioned)) {
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
            $doctor = $this->doctorService->getById($selection['doctor_id']);
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
            // When user picks a specific date, ensure urgency reflects it
            // so getAvailableDates() includes that date in downstream components
            if (empty($updated['urgency']) || $updated['urgency'] === 'urgent') {
                $updated['urgency'] = 'specific_date';
            }
            if (!in_array('urgency', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'urgency';
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
                $doctor = $this->doctorService->getById($doctorId);
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

        // === Lab-specific selection handlers ===

        if (isset($selection['package_id'])) {
            $packageId = (int) $selection['package_id'];
            $package = $this->labService->getPackageById($packageId);
            if ($package) {
                $updated['selectedPackageId'] = $packageId;
                $updated['selectedPackageName'] = $package['name'];
                $updated['packageRequiresFasting'] = $package['requires_fasting'];
                $updated['packageFastingHours'] = $package['fasting_hours'];
                // Clear any individual test selection
                unset($updated['selectedTestIds']);
                unset($updated['selectedTestNames']);
                if (!in_array('package', $updated['completedSteps'])) {
                    $updated['completedSteps'][] = 'package';
                }
                Log::info('🔒 Selection Handler: Package selected', [
                    'package_id' => $packageId,
                    'package_name' => $package['name'],
                    'requires_fasting' => $package['requires_fasting'],
                ]);
            }
        }

        // Individual test(s) selection (supports multi-select)
        if (isset($selection['test_ids'])) {
            $testIds = array_map('intval', (array) $selection['test_ids']);
            $testNames = [];
            $requiresFasting = false;
            $maxFastingHours = 0;

            foreach ($testIds as $tid) {
                $test = $this->labService->getTestById($tid);
                if ($test) {
                    $testNames[] = $test['name'];
                    if ($test['requires_fasting']) {
                        $requiresFasting = true;
                        $maxFastingHours = max($maxFastingHours, $test['fasting_hours'] ?? 0);
                    }
                }
            }

            if (!empty($testNames)) {
                $updated['selectedTestIds'] = $testIds;
                $updated['selectedTestNames'] = $testNames;
                $updated['packageRequiresFasting'] = $requiresFasting;
                $updated['packageFastingHours'] = $maxFastingHours ?: null;
                // Clear any package selection
                unset($updated['selectedPackageId']);
                unset($updated['selectedPackageName']);
                if (!in_array('package', $updated['completedSteps'])) {
                    $updated['completedSteps'][] = 'package';
                }
                Log::info('🔒 Selection Handler: Individual test(s) selected', [
                    'test_ids' => $testIds,
                    'test_names' => $testNames,
                    'requires_fasting' => $requiresFasting,
                ]);
            }
        }

        // Collection type selection (Home / Hospital)
        if (isset($selection['collection_type'])) {
            $updated['collectionType'] = $selection['collection_type'];
            if ($selection['collection_type'] === 'home') {
                unset($updated['selectedCenterId']);
                unset($updated['selectedCenterName']);
            }
            if (!in_array('collection_type', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'collection_type';
            }
            Log::info('🔒 Selection Handler: Collection type selected', [
                'collection_type' => $selection['collection_type'],
            ]);
        }

        // Center selection (for hospital visit)
        if (isset($selection['center_id'])) {
            $centerId = (int) $selection['center_id'];
            $center = $this->labService->getCenterById($centerId);
            if ($center) {
                $updated['selectedCenterId'] = $centerId;
                $updated['selectedCenterName'] = $center['name'];
            }
            if (!in_array('center', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'center';
            }
            Log::info('🔒 Selection Handler: Center selected', [
                'center_id' => $centerId,
                'center_name' => $center['name'] ?? 'Unknown',
            ]);
        }

        // Address selection (for home collection)
        // Handle "Add new address" trigger from address selector
        if (!empty($selection['add_address'])) {
            Log::info('🔒 Selection Handler: Add address form requested');

            $conversation->collected_data = $updated;
            $conversation->save();

            $this->addAssistantMessage(
                $conversation,
                'Please enter the details for your new address.',
                'address_form',
                [],
                []
            );

            return [
                'status' => 'success',
                'state' => 'address_selection',
                'message' => 'Please enter the details for your new address.',
                'component_type' => 'address_form',
                'component_data' => [],
                'ready_to_book' => false,
                'progress' => [
                    'percentage' => 0,
                    'current_state' => 'address_selection',
                    'missing_fields' => ['address'],
                ],
            ];
        }

        // Handle new address form submission
        if (isset($selection['new_address_label']) && isset($selection['new_address_line_1'])) {
            $addrLabel = trim($selection['new_address_label']);
            $addrLine1 = trim($selection['new_address_line_1']);
            $addrLine2 = isset($selection['new_address_line_2']) ? trim($selection['new_address_line_2']) : null;
            $addrCity = trim($selection['new_address_city'] ?? '');
            $addrState = trim($selection['new_address_state'] ?? '');
            $addrPincode = trim($selection['new_address_pincode'] ?? '');

            Log::info('🔒 Selection Handler: Creating new address', [
                'label' => $addrLabel,
                'city' => $addrCity,
            ]);

            if (empty($addrLabel) || empty($addrLine1) || empty($addrCity) || empty($addrState) || empty($addrPincode)) {
                $conversation->collected_data = $updated;
                $conversation->save();

                $this->addAssistantMessage(
                    $conversation,
                    'Please fill in all required fields (label, address, city, state, pincode).',
                    'address_form',
                    ['error' => 'All required fields must be filled.'],
                    []
                );

                return [
                    'status' => 'success',
                    'state' => 'address_selection',
                    'message' => 'Please fill in all required fields.',
                    'component_type' => 'address_form',
                    'component_data' => ['error' => 'All required fields must be filled.'],
                    'ready_to_book' => false,
                    'progress' => [
                        'percentage' => 0,
                        'current_state' => 'address_selection',
                        'missing_fields' => ['address'],
                    ],
                ];
            }

            // First address for user gets is_default = true
            $hasExistingAddresses = \App\Models\UserAddress::where('user_id', $conversation->user_id)
                ->where('is_active', true)
                ->exists();

            $newAddress = \App\Models\UserAddress::create([
                'user_id' => $conversation->user_id,
                'label' => $addrLabel,
                'address_line_1' => $addrLine1,
                'address_line_2' => $addrLine2,
                'city' => $addrCity,
                'state' => $addrState,
                'pincode' => $addrPincode,
                'is_default' => !$hasExistingAddresses,
                'is_active' => true,
            ]);

            $updated['selectedAddressId'] = $newAddress->id;
            $updated['selectedAddressLabel'] = $newAddress->label;
            $updated['selectedAddressText'] = $newAddress->getFullAddress();
            if (!in_array('address', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'address';
            }

            Log::info('✅ New address created and auto-selected', [
                'address_id' => $newAddress->id,
                'label' => $newAddress->label,
            ]);
        }

        if (isset($selection['address_id'])) {
            $updated['selectedAddressId'] = $selection['address_id'];
            $updated['selectedAddressLabel'] = $selection['address_label'] ?? 'Selected address';
            $updated['selectedAddressText'] = $selection['address_text'] ?? '';
            if (!in_array('address', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'address';
            }
            Log::info('🔒 Selection Handler: Address selected', [
                'address_id' => $selection['address_id'],
                'address_label' => $selection['address_label'] ?? 'Unknown',
            ]);
        }

        // Legacy location_id handler (backward compatibility)
        if (isset($selection['location_id'])) {
            $locationId = $selection['location_id'];
            if ($locationId === 'home') {
                $updated['collectionType'] = 'home';
                unset($updated['selectedCenterId']);
                unset($updated['selectedCenterName']);
            } else {
                $updated['collectionType'] = 'center';
                $centerId = (int) str_replace('center_', '', $locationId);
                $center = $this->labService->getCenterById($centerId);
                if ($center) {
                    $updated['selectedCenterId'] = $centerId;
                    $updated['selectedCenterName'] = $center['name'];
                }
            }
            if (!in_array('location', $updated['completedSteps'])) {
                $updated['completedSteps'][] = 'location';
            }
            Log::info('🔒 Selection Handler: Location selected (legacy)', [
                'location_id' => $locationId,
                'collection_type' => $updated['collectionType'],
            ]);
        }

        // Handle package change from summary
        if (isset($selection['change_package']) && $selection['change_package']) {
            Log::info('🔄 Change Package Requested');
            unset($updated['selectedPackageId']);
            unset($updated['selectedPackageName']);
            unset($updated['selectedTestIds']);
            unset($updated['selectedTestNames']);
            unset($updated['packageRequiresFasting']);
            unset($updated['packageFastingHours']);
            unset($updated['package_inquiry_asked']);
            unset($updated['packageSearchQuery']);
            unset($updated['packageSearchResults']);
            unset($updated['packageMatchCount']);
            unset($updated['testSearchResults']);
            unset($updated['testMatchCount']);
            $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['package']));
        }

        // Handle location change from summary
        if (isset($selection['change_location']) && $selection['change_location']) {
            Log::info('🔄 Change Location Requested');
            unset($updated['collectionType']);
            unset($updated['selectedCenterId']);
            unset($updated['selectedCenterName']);
            unset($updated['selectedAddressId']);
            unset($updated['selectedAddressLabel']);
            unset($updated['selectedAddressText']);
            // Clear date/time since location change may affect availability
            unset($updated['selectedDate']);
            unset($updated['selectedTime']);
            $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['collection_type', 'center', 'address', 'location', 'date', 'time']));
        }

        // Handle address change from summary (keeps collectionType = 'home')
        if (isset($selection['change_address']) && $selection['change_address']) {
            Log::info('🔄 Change Address Requested');
            unset($updated['selectedAddressId']);
            unset($updated['selectedAddressLabel']);
            unset($updated['selectedAddressText']);
            unset($updated['selectedDate']);
            unset($updated['selectedTime']);
            $updated['completedSteps'] = array_values(array_diff($updated['completedSteps'], ['address', 'date', 'time']));
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
            $doctor = $doctorId ? $this->doctorService->getById($doctorId) : null;
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

    protected function getPatientSelectorData(?string $userId = null): array
    {
        $patients = [];

        if ($userId) {
            $patients = \App\Models\FamilyMember::where('user_id', $userId)
                ->get()
                ->map(fn($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'relation' => ucfirst($m->relation),
                    'avatar' => $m->avatar_url ?? '',
                ])
                ->toArray();
        }

        // Fallback if no family members found
        if (empty($patients)) {
            $patients = [
                ['id' => 1, 'name' => 'Yourself', 'relation' => 'Self'],
                ['id' => 2, 'name' => 'Mother', 'relation' => 'Mother'],
                ['id' => 3, 'name' => 'Father', 'relation' => 'Father'],
            ];
        }

        return ['patients' => $patients];
    }

    /**
     * Build date picker data - shows only date pills, no doctors.
     * Used when the user needs to pick a date before seeing doctors.
     */
    protected function getDatePickerData(array $data): array
    {
        // If a doctor is already selected, only show dates they're available
        $selectedDoctorId = $data['selectedDoctorId'] ?? null;
        $checkDoctorIds = $selectedDoctorId ? [$selectedDoctorId] : $this->doctorService->getAllIds();

        $fullWeekDates = [];
        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::today()->addDays($i);
            $dayOfWeek = $date->dayOfWeek;

            // Only include dates where the relevant doctor(s) are available
            $anyAvailable = false;
            foreach ($checkDoctorIds as $docId) {
                $daysOff = $this->doctorService->getDaysOff($docId);
                if (!in_array($dayOfWeek, $daysOff)) {
                    $anyAvailable = true;
                    break;
                }
            }
            if (!$anyAvailable) {
                continue;
            }

            $label = $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D'));
            $fullWeekDates[] = [
                'value' => $date->format('Y-m-d'),
                'label' => $label,
                'day' => $date->format('M j'),
            ];
        }

        $result = [
            'dates' => $fullWeekDates,
            'selected_date' => $data['selectedDate'] ?? null,
        ];

        // Include past date warning if present
        if (!empty($data['past_date_warning'])) {
            $result['warning'] = [
                'title' => 'Date Unavailable',
                'description' => $data['past_date_warning']['message'],
            ];
        }

        return $result;
    }

    /**
     * Build doctor list for a specific already-selected date.
     * Only shows doctors available on that date.
     */
    protected function getDoctorListForDate(array $data): array
    {
        $result = $this->getDoctorListData($data);

        // Since the date is already selected, pre-filter doctors to only those
        // available on the selected date and set it as selected
        $selectedDate = $data['selectedDate'] ?? null;
        if ($selectedDate) {
            $dayOfWeek = Carbon::parse($selectedDate)->dayOfWeek;

            // Check if a searched doctor is unavailable on this date
            $searchQuery = $data['doctorSearchQuery'] ?? null;
            if ($searchQuery) {
                $doctorId = $this->doctorService->findByName($searchQuery);
                if ($doctorId) {
                    $daysOff = $this->doctorService->getDaysOff($doctorId);
                    if (in_array($dayOfWeek, $daysOff)) {
                        // Doctor is NOT available on the selected date.
                        // Show the doctor with their available dates this week instead.
                        $dateFormatted = Carbon::parse($selectedDate)->format('M j');
                        $availableDays = $this->doctorService->getAvailableDates($doctorId);
                        $dayLabels = array_map(fn($d) => Carbon::parse($d)->format('D'), $availableDays);

                        // Strip "Dr." prefix to avoid "Dr. Dr. Vikram"
                        $cleanName = preg_replace('/^Dr\.?\s*/i', '', $searchQuery);
                        $result['doctor_date_conflict'] = [
                            'searched_doctor' => $searchQuery,
                            'date' => $dateFormatted,
                            'available_dates' => $availableDays,
                            'message' => "Dr. {$cleanName} isn't available on {$dateFormatted}. They're available " . implode(', ', $dayLabels) . ' this week.',
                        ];

                        // Override: show full week dates filtered to doctor's availability
                        $result['selected_date'] = null; // Clear so user picks a new date
                        $result['dates'] = array_values(array_filter($result['dates'], function ($d) use ($availableDays) {
                            return in_array($d['value'], $availableDays);
                        }));

                        // Keep only the searched doctor (unfiltered by date)
                        $result['doctors'] = array_values(array_filter($result['doctors'], function ($doc) use ($doctorId) {
                            return $doc['id'] === $doctorId;
                        }));
                        $result['doctors_count'] = count($result['doctors']);

                        return $result;
                    }
                }
            }

            // Normal flow: filter to selected date
            $result['selected_date'] = $selectedDate;
            $result['dates'] = array_values(array_filter($result['dates'], function ($d) use ($selectedDate) {
                return $d['value'] === $selectedDate;
            }));
            if (empty($result['dates'])) {
                $dateObj = Carbon::parse($selectedDate);
                $result['dates'] = [[
                    'value' => $selectedDate,
                    'label' => $dateObj->isToday() ? 'Today' : $dateObj->format('D'),
                    'day' => $dateObj->format('M j'),
                ]];
            }
            // Filter doctors to those available on the selected date
            $filteredDoctors = array_values(array_filter($result['doctors'], function ($doc) use ($dayOfWeek) {
                $daysOff = $this->doctorService->getDaysOff($doc['id']);
                return !in_array($dayOfWeek, $daysOff);
            }));

            $result['doctors'] = $filteredDoctors;
            $result['doctors_count'] = count($filteredDoctors);
        }

        return $result;
    }

    protected function getDoctorListData(array $data): array
    {
        // Get all doctors from centralized DoctorService, add time slots
        $doctors = array_map(function ($doctor) {
            $doctor['slots'] = $this->generateTimeSlots();
            return $doctor;
        }, $this->doctorService->getAllAsList());

        // Filter doctors by search query if the user typed a doctor name
        $searchQuery = $data['doctorSearchQuery'] ?? null;
        $allDoctors = $doctors;
        if ($searchQuery) {
            $filtered = array_map(function ($doctor) {
                $doctor['slots'] = $this->generateTimeSlots();
                return $doctor;
            }, $this->doctorService->search($searchQuery));
            if (!empty($filtered)) {
                $doctors = $filtered;
            }
        }

        // Build a full week of dates, but only include dates where at least
        // one doctor is available.  Per doctor, attach the list of dates they
        // can be booked on so the frontend can filter the doctor list when the
        // user switches date pills.
        $urgency = $data['urgency'] ?? 'this_week';

        // Pre-compute each doctor's days-off set for quick lookup
        $doctorDaysOff = [];
        foreach ($doctors as $doctor) {
            $doctorDaysOff[$doctor['id']] = $this->doctorService->getDaysOff($doctor['id']);
        }

        // Generate 7-day window, keeping only dates with ≥1 available doctor
        $fullWeekDates = [];
        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::today()->addDays($i);
            $dayOfWeek = $date->dayOfWeek; // 0=Sun … 6=Sat

            // Check if ANY doctor is available on this day
            $anyAvailable = false;
            foreach ($doctors as $doctor) {
                if (!in_array($dayOfWeek, $doctorDaysOff[$doctor['id']])) {
                    $anyAvailable = true;
                    break;
                }
            }
            if (!$anyAvailable) {
                continue; // skip dates where no doctor works
            }

            $label = $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D'));
            $fullWeekDates[] = [
                'value' => $date->format('Y-m-d'),
                'label' => $label,
                'day' => $date->format('M j'),
            ];
        }
        $dates = $fullWeekDates;

        // Attach available_dates to each doctor so the frontend can show/hide
        // doctors when the user picks a different date pill.
        foreach ($doctors as &$doctor) {
            $daysOff = $doctorDaysOff[$doctor['id']];
            $availDates = [];
            foreach ($dates as $d) {
                $dow = Carbon::parse($d['value'])->dayOfWeek;
                if (!in_array($dow, $daysOff)) {
                    $availDates[] = $d['value'];
                }
            }
            $doctor['available_dates'] = $availDates;
        }
        unset($doctor); // break reference

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
    protected function checkDoctorAvailabilityForDate(int $doctorId, string $date): array
    {
        return $this->doctorService->checkAvailability($doctorId, $date);
    }

    /**
     * Build mode selector data based on the selected doctor's capabilities
     */
    protected function getModeSelectorData(array $data): array
    {
        $doctorId = $data['selectedDoctorId'] ?? null;
        $doctor = $doctorId ? $this->doctorService->getById($doctorId) : null;

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
        $doctor = $doctorId ? $this->doctorService->getById($doctorId) : null;
        $daysOff = $doctorId ? $this->doctorService->getDaysOff($doctorId) : [];

        // Always generate a week of available dates for the doctor,
        // so the user can adjust their selection from the time slot picker
        $transformedDates = [];
        for ($i = 0; $i < 14; $i++) {
            $date = Carbon::today()->addDays($i);
            $isAvailable = empty($daysOff) || !in_array($date->dayOfWeek, $daysOff);

            if ($isAvailable) {
                $transformedDates[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D')),
                    'sublabel' => $date->format('M j'),
                ];
                if (count($transformedDates) >= 5) break;
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
            'available_dates' => count($transformedDates),
            'slots_count' => count($slots),
            'selected_date' => $data['selectedDate'] ?? null,
        ]);

        return [
            'dates' => $transformedDates,
            'slots' => $slots,
            'doctor_name' => $doctor['name'] ?? null,
            'selected_date' => $data['selectedDate'] ?? null,
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
                $doctorDetails = $this->doctorService->getById($doctor['id']);
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
     * Validate if a time slot is available for a specific doctor
     */
    protected function validateTimeSlotForDoctor(int $doctorId, ?string $date, string $time): bool
    {
        // Get doctor details
        $doctorDetails = $this->doctorService->getById($doctorId);

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
     * Get the default consultation mode for a doctor.
     * Returns the doctor's only supported mode, or 'video' as a generic fallback.
     */
    protected function getDefaultModeForDoctor(?int $doctorId): string
    {
        if ($doctorId) {
            return $this->doctorService->getDefaultMode($doctorId);
        }

        return 'video';
    }
}
