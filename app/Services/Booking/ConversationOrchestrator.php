<?php

namespace App\Services\Booking;

use App\BookingConversation;
use App\ConversationMessage;
use Illuminate\Support\Facades\Log;

class ConversationOrchestrator
{
    /**
     * Process user input and advance the conversation
     */
    public function process(BookingConversation $conversation, ?string $userInput = null, ?array $componentSelection = null): array
    {
        // Determine current step
        $currentStep = $conversation->collected_data['current_step'] ?? 'initial';
        $bookingType = $conversation->collected_data['booking_type'] ?? null;

        // Check if this is a duplicate selection that should be ignored
        if ($componentSelection && $this->shouldIgnoreSelection($conversation, $currentStep, $componentSelection)) {
            // Don't add user message, don't process - just return current state
            return ['status' => 'ignored'];
        }

        // Add user message if there's input
        if ($userInput || $componentSelection) {
            $this->addUserMessage($conversation, $userInput, $componentSelection);
        }

        // Process the current step
        $response = $this->handleStep($conversation, $currentStep, $bookingType, $componentSelection);

        return $response;
    }

    /**
     * Check if a selection should be ignored (duplicate or invalid)
     */
    protected function shouldIgnoreSelection(BookingConversation $conversation, string $currentStep, array $selection): bool
    {
        // Ignore duplicate follow-up reason selections
        if ($currentStep === 'followup_reason' && isset($selection['reason']) && isset($conversation->collected_data['followup_reason'])) {
            return true;
        }

        // Ignore follow-up reason selections when we're past that step
        if ($currentStep === 'followup_update' && isset($selection['reason'])) {
            return true;
        }

        return false;
    }

    /**
     * Update current step in both collected_data and model attribute
     */
    protected function updateCurrentStep(BookingConversation $conversation, string $step): void
    {
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'current_step' => $step,
        ]);
        $conversation->current_step = $step;
    }

    /**
     * Handle a specific step in the conversation
     */
    protected function handleStep(BookingConversation $conversation, string $step, ?string $bookingType, ?array $selection): array
    {
        // Route to appropriate handler based on booking type and step
        if ($bookingType === 'doctor') {
            return $this->handleDoctorStep($conversation, $step, $selection);
        } elseif ($bookingType === 'lab_test') {
            return $this->handleLabTestStep($conversation, $step, $selection);
        } else {
            return $this->handleInitialStep($conversation, $selection);
        }
    }

    /**
     * Handle initial booking type selection
     */
    protected function handleInitialStep(BookingConversation $conversation, ?array $selection): array
    {
        // This method should not be called anymore since booking type is set during conversation creation
        // But keeping it as a fallback for any edge cases
        if (!$selection) {
            return $this->addAssistantMessage($conversation, [
                'text' => "I can help you book a doctor's appointment or schedule lab tests. What would you like to do?",
                'component_type' => 'booking_type_selector',
                'component_data' => [
                    'types' => [
                        ['id' => 'doctor', 'label' => "Book Doctor's Appointment", 'icon' => 'stethoscope'],
                        ['id' => 'lab_test', 'label' => 'Schedule Lab Tests', 'icon' => 'flask'],
                    ],
                ],
                'next_step' => 'patient_selection',
            ]);
        }

        // Store booking type
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'booking_type' => $selection['booking_type'],
        ]);
        $this->updateCurrentStep($conversation, 'patient_selection');
        $conversation->save();

        // Move to patient selection
        return $this->handleStep($conversation, 'patient_selection', $selection['booking_type'], null);
    }

    /**
     * Handle doctor appointment flow
     */
    protected function handleDoctorStep(BookingConversation $conversation, string $step, ?array $selection): array
    {
        switch ($step) {
            case 'patient_selection':
                return $this->handlePatientSelection($conversation, $selection);

            case 'consultation_type':
                return $this->handleConsultationType($conversation, $selection);

            case 'followup_reason':
                return $this->handleFollowUpFlow($conversation, $selection);

            case 'followup_update':
                return $this->handleFollowUpUpdate($conversation, $selection);

            case 'previous_doctors':
                return $this->handlePreviousDoctorsSelection($conversation, $selection);

            case 'urgency':
                return $this->handleUrgency($conversation, $selection);

            case 'doctor_selection':
                return $this->handleDoctorSelection($conversation, $selection);

            case 'consultation_mode':
                return $this->handleConsultationMode($conversation, $selection);

            case 'summary':
                return $this->handleBookingSummary($conversation, $selection);

            case 'payment':
                return $this->handlePayment($conversation, $selection);

            default:
                return $this->handlePatientSelection($conversation, null);
        }
    }

    /**
     * Handle lab test flow
     */
    protected function handleLabTestStep(BookingConversation $conversation, string $step, ?array $selection): array
    {
        switch ($step) {
            case 'patient_selection':
                return $this->handlePatientSelection($conversation, $selection);

            case 'package_selection':
                return $this->handlePackageSelection($conversation, $selection);

            case 'location_selection':
                return $this->handleLocationSelection($conversation, $selection);

            case 'date_time_selection':
                return $this->handleDateTimeSelection($conversation, $selection);

            case 'summary':
                return $this->handleLabSummary($conversation, $selection);

            case 'payment':
                return $this->handlePayment($conversation, $selection);

            default:
                return $this->handlePatientSelection($conversation, null);
        }
    }

    /**
     * Handle patient selection
     */
    protected function handlePatientSelection(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            $patients = $this->getFamilyMembers($conversation->user_id);

            return $this->addAssistantMessage($conversation, [
                'text' => 'Who is this appointment for?',
                'component_type' => 'patient_selector',
                'component_data' => ['patients' => $patients],
                'next_step' => $conversation->collected_data['booking_type'] === 'doctor' ? 'consultation_type' : 'package_selection',
            ]);
        }

        // Store patient selection
        $nextStep = $conversation->collected_data['booking_type'] === 'doctor' ? 'consultation_type' : 'package_selection';
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'patient_id' => $selection['patient_id'],
        ]);
        $this->updateCurrentStep($conversation, $nextStep);
        $conversation->save();

        // Move to next step
        if ($conversation->collected_data['booking_type'] === 'doctor') {
            return $this->handleConsultationType($conversation, null);
        } else {
            return $this->handlePackageSelection($conversation, null);
        }
    }

    /**
     * Handle consultation type selection
     */
    protected function handleConsultationType(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            return $this->addAssistantMessage($conversation, [
                'text' => 'Is this a new consultation or a follow-up?',
                'component_type' => 'consultation_type_selector',
                'component_data' => null,
                'next_step' => 'urgency',
            ]);
        }

        // If follow-up, start follow-up flow
        if ($selection['consultation_type'] === 'followup') {
            $conversation->collected_data = array_merge($conversation->collected_data, [
                'consultation_type' => $selection['consultation_type'],
            ]);
            $this->updateCurrentStep($conversation, 'followup_reason');
            $conversation->save();
            return $this->handleFollowUpFlow($conversation, null);
        }

        // Otherwise, continue with regular flow
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'consultation_type' => $selection['consultation_type'],
        ]);
        $this->updateCurrentStep($conversation, 'urgency');
        $conversation->save();

        return $this->handleUrgency($conversation, null);
    }

    /**
     * Handle follow-up flow with reason selection
     */
    protected function handleFollowUpFlow(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            // Fetch the most recent consultation for this patient
            $previousVisit = $this->getPreviousConsultation($conversation->collected_data['patient_id']);

            if (!$previousVisit) {
                // No previous visits found - redirect to regular flow
                return $this->addAssistantMessage($conversation, [
                    'text' => "I couldn't find any previous consultations. Let's book a new appointment instead.",
                    'component_type' => null,
                    'component_data' => null,
                    'next_step' => 'urgency',
                ]);
            }

            return $this->addAssistantMessage($conversation, [
                'text' => 'I found your previous consultation. What brings you back today?',
                'component_type' => 'followup_flow',
                'component_data' => [
                    'previousVisit' => $previousVisit,
                ],
                'next_step' => 'followup_update',
            ]);
        }

        // Store the selected reason and update step
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'followup_reason' => $selection['reason'],
        ]);
        $this->updateCurrentStep($conversation, 'followup_update');
        $conversation->save();

        return $this->handleFollowUpUpdate($conversation, null);
    }

    /**
     * Handle follow-up update collection
     */
    protected function handleFollowUpUpdate(BookingConversation $conversation, ?array $selection): array
    {
        $reason = $conversation->collected_data['followup_reason'];

        // Customize message based on reason
        $messageText = match ($reason) {
            'scheduled' => "Got it. Any updates you'd like to share with the doctor?\nThis will help the doctor prepare for your visit. You can also skip this.",
            'new_concern' => "What new symptoms or changes have you noticed?\nThis will help the doctor prepare for your visit. You can also skip this.",
            'ongoing_issue' => "I'm sorry to hear that. Can you describe what's still bothering you?\nThis will help the doctor prepare for your visit. You can also skip this.",
            default => "Would you like to share any updates about your condition?\nThis will help the doctor prepare for your visit. You can also skip this.",
        };

        // If no user input yet, show the message and wait
        if (!$selection) {
            return $this->addAssistantMessage($conversation, [
                'text' => $messageText,
                'component_type' => null,
                'component_data' => null,
                'next_step' => 'previous_doctors',
            ]);
        }

        // Store the update (user typed something or skipped)
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'followup_update' => $selection['text'] ?? null,
        ]);
        $this->updateCurrentStep($conversation, 'previous_doctors');
        $conversation->save();

        return $this->handlePreviousDoctorsSelection($conversation, null);
    }

    /**
     * Handle previous doctors selection
     */
    protected function handlePreviousDoctorsSelection(BookingConversation $conversation, ?array $selection): array
    {
        // If selection doesn't have doctorId or action, treat as no selection
        // (This handles cases where text input from previous step is passed)
        if (!$selection || (!isset($selection['doctorId']) && !isset($selection['action']))) {
            $patientId = $conversation->collected_data['patient_id'];
            $previousDoctors = $this->getPreviousDoctors($patientId);

            if (empty($previousDoctors)) {
                // No previous doctors - go to regular doctor selection
                $this->updateCurrentStep($conversation, 'doctor_selection');
                $conversation->save();
                return $this->handleDoctorSelection($conversation, null);
            }

            $primaryDoctor = $previousDoctors[0];
            $otherDoctors = array_slice($previousDoctors, 1, 2); // Show up to 2 other doctors

            return $this->addAssistantMessage($conversation, [
                'text' => 'Here are doctors you\'ve seen before with available slots:',
                'component_type' => 'previous_doctors',
                'component_data' => [
                    'primaryDoctor' => $primaryDoctor,
                    'otherDoctors' => $otherDoctors,
                ],
                'next_step' => 'consultation_mode',
            ]);
        }

        // Check if user wants to see other doctors
        if (isset($selection['action']) && $selection['action'] === 'see_other_doctors') {
            $this->updateCurrentStep($conversation, 'doctor_selection');
            $conversation->save();
            return $this->handleDoctorSelection($conversation, null);
        }

        // Store selected doctor and time
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'doctor_id' => $selection['doctorId'],
            'time' => $selection['time'],
        ]);
        $this->updateCurrentStep($conversation, 'consultation_mode');
        $conversation->save();

        return $this->handleConsultationMode($conversation, null);
    }

    /**
     * Handle urgency selection
     */
    protected function handleUrgency(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            return $this->addAssistantMessage($conversation, [
                'text' => 'When do you need to see a doctor?',
                'component_type' => 'urgency_selector',
                'component_data' => null,
                'next_step' => 'doctor_selection',
            ]);
        }

        $conversation->collected_data = array_merge($conversation->collected_data, [
            'urgency' => $selection['urgency'],
        ]);
        $this->updateCurrentStep($conversation, 'doctor_selection');
        $conversation->save();

        return $this->handleDoctorSelection($conversation, null);
    }

    /**
     * Handle doctor selection
     */
    protected function handleDoctorSelection(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            $doctors = $this->getAvailableDoctors($conversation->collected_data);

            // Customize message based on urgency
            $urgency = $conversation->collected_data['urgency'] ?? null;
            $messageText = $urgency === 'urgent'
                ? 'These doctors match your needs and are available today:'
                : 'Here are the available doctors based on your requirements:';

            return $this->addAssistantMessage($conversation, [
                'text' => $messageText,
                'component_type' => 'doctor_list',
                'component_data' => ['doctors' => $doctors],
                'next_step' => 'consultation_mode',
            ]);
        }

        $conversation->collected_data = array_merge($conversation->collected_data, [
            'doctor_id' => $selection['doctor_id'],
            'time' => $selection['time'],
        ]);
        $this->updateCurrentStep($conversation, 'consultation_mode');
        $conversation->save();

        return $this->handleConsultationMode($conversation, null);
    }

    /**
     * Handle consultation mode selection
     */
    protected function handleConsultationMode(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            return $this->addAssistantMessage($conversation, [
                'text' => 'How would you like to consult with the doctor?',
                'component_type' => 'mode_selector',
                'component_data' => [
                    'modes' => [
                        ['type' => 'video', 'price' => 800],
                        ['type' => 'in_person', 'price' => 1200],
                    ],
                ],
                'next_step' => 'summary',
            ]);
        }

        $conversation->collected_data = array_merge($conversation->collected_data, [
            'mode' => $selection['mode'],
        ]);
        $this->updateCurrentStep($conversation, 'summary');
        $conversation->save();

        return $this->handleBookingSummary($conversation, null);
    }

    /**
     * Handle booking summary
     */
    protected function handleBookingSummary(BookingConversation $conversation, ?array $selection): array
    {
        if ($selection && isset($selection['action']) && $selection['action'] === 'pay') {
            return $this->handlePayment($conversation, $selection);
        }

        $summary = $this->buildDoctorSummary($conversation->collected_data);

        return $this->addAssistantMessage($conversation, [
            'text' => 'Please review your booking details:',
            'component_type' => 'booking_summary',
            'component_data' => ['summary' => $summary],
            'next_step' => 'payment',
        ]);
    }

    /**
     * Handle package selection for lab tests
     */
    protected function handlePackageSelection(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            $packages = $this->getAvailablePackages();

            return $this->addAssistantMessage($conversation, [
                'text' => 'Which health package would you like to book?',
                'component_type' => 'package_list',
                'component_data' => ['packages' => $packages],
                'next_step' => 'location_selection',
            ]);
        }

        $conversation->collected_data = array_merge($conversation->collected_data, [
            'package_id' => $selection['package_id'],
        ]);
        $this->updateCurrentStep($conversation, 'location_selection');
        $conversation->save();

        return $this->handleLocationSelection($conversation, null);
    }

    /**
     * Handle location selection for lab tests
     */
    protected function handleLocationSelection(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            $locations = $this->getAvailableLocations($conversation->user_id);

            return $this->addAssistantMessage($conversation, [
                'text' => 'Where should we collect the sample?',
                'component_type' => 'location_selector',
                'component_data' => ['locations' => $locations],
                'next_step' => 'date_time_selection',
            ]);
        }

        $conversation->collected_data = array_merge($conversation->collected_data, [
            'location_id' => $selection['location_id'],
        ]);
        $this->updateCurrentStep($conversation, 'date_time_selection');
        $conversation->save();

        return $this->handleDateTimeSelection($conversation, null);
    }

    /**
     * Handle date/time selection for lab tests
     */
    protected function handleDateTimeSelection(BookingConversation $conversation, ?array $selection): array
    {
        if (!$selection) {
            return $this->addAssistantMessage($conversation, [
                'text' => 'When should this be done?',
                'component_type' => 'date_picker',
                'component_data' => [
                    'warning' => [
                        'title' => 'Fasting required',
                        'description' => '12 hours before. Morning recommended.',
                    ],
                ],
                'next_step' => 'summary',
            ]);
        }

        $conversation->collected_data = array_merge($conversation->collected_data, [
            'date' => $selection['date'],
            'time' => $selection['time'],
        ]);
        $this->updateCurrentStep($conversation, 'summary');
        $conversation->save();

        return $this->handleLabSummary($conversation, null);
    }

    /**
     * Handle lab test summary
     */
    protected function handleLabSummary(BookingConversation $conversation, ?array $selection): array
    {
        if ($selection && isset($selection['action']) && $selection['action'] === 'pay') {
            return $this->handlePayment($conversation, $selection);
        }

        $summary = $this->buildLabSummary($conversation->collected_data);

        return $this->addAssistantMessage($conversation, [
            'text' => 'Please review your booking details:',
            'component_type' => 'booking_summary',
            'component_data' => ['summary' => $summary],
            'next_step' => 'payment',
        ]);
    }

    /**
     * Handle payment
     */
    protected function handlePayment(BookingConversation $conversation, ?array $selection): array
    {
        // Create booking record
        $booking = $this->createBooking($conversation);

        // Mark conversation as completed
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'current_step' => 'completed',
            'booking_id' => $booking->id,
        ]);
        $conversation->save();

        return [
            'redirect' => route('booking.confirmation', ['booking' => $booking->id]),
        ];
    }

    /**
     * Add user message to conversation
     */
    protected function addUserMessage(BookingConversation $conversation, ?string $text, ?array $componentSelection): void
    {
        ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $text ?? json_encode($componentSelection),
            'user_selection' => $componentSelection,
        ]);
    }

    /**
     * Add assistant message to conversation
     */
    protected function addAssistantMessage(BookingConversation $conversation, array $data): array
    {
        ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $data['text'],
            'component_type' => $data['component_type'] ?? null,
            'component_data' => $data['component_data'] ?? null,
        ]);

        return [
            'message' => $data['text'],
            'component_type' => $data['component_type'] ?? null,
            'component_data' => $data['component_data'] ?? null,
        ];
    }

    /**
     * Get family members for patient selection
     */
    protected function getFamilyMembers(string $userId): array
    {
        // Mock data - replace with actual database query
        return [
            ['id' => 1, 'name' => 'Sanjana Jaisinghani', 'relation' => 'Self', 'avatar' => null],
            ['id' => 2, 'name' => 'Richa Jaisinghani', 'relation' => 'Mother', 'avatar' => null],
            ['id' => 3, 'name' => 'Prateek Jaisinghani', 'relation' => 'Father', 'avatar' => null],
            ['id' => 4, 'name' => 'Manav Jaisinghani', 'relation' => 'Brother', 'avatar' => null],
            ['id' => 5, 'name' => 'Kriti Jaisinghani', 'relation' => 'Sister', 'avatar' => null],
            ['id' => 6, 'name' => 'Prateek Jaisinghani', 'relation' => 'Grandfather', 'avatar' => null],
        ];
    }

    /**
     * Get available doctors based on requirements
     */
    protected function getAvailableDoctors(array $state): array
    {
        // Mock data - replace with actual database query
        return [
            [
                'id' => '1',
                'name' => 'Dr. Sarah Johnson',
                'specialization' => 'General Physician',
                'experience_years' => 15,
                'avatar' => null,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'slots' => [
                    ['time' => '09:00', 'preferred' => true, 'available' => true],
                    ['time' => '10:00', 'preferred' => true, 'available' => true],
                    ['time' => '11:00', 'preferred' => false, 'available' => true],
                    ['time' => '14:00', 'preferred' => false, 'available' => true],
                    ['time' => '15:00', 'preferred' => false, 'available' => true],
                    ['time' => '17:00', 'preferred' => false, 'available' => true],
                ],
            ],
            [
                'id' => '2',
                'name' => 'Dr. Michael Chen',
                'specialization' => 'Cardiologist',
                'experience_years' => 12,
                'avatar' => null,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'slots' => [
                    ['time' => '09:00', 'preferred' => true, 'available' => true],
                    ['time' => '10:00', 'preferred' => true, 'available' => true],
                    ['time' => '11:00', 'preferred' => false, 'available' => true],
                    ['time' => '14:00', 'preferred' => false, 'available' => true],
                    ['time' => '15:00', 'preferred' => false, 'available' => true],
                    ['time' => '17:00', 'preferred' => false, 'available' => true],
                ],
            ],
            [
                'id' => '3',
                'name' => 'Dr. Priya Sharma',
                'specialization' => 'Dermatologist',
                'experience_years' => 10,
                'avatar' => null,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'slots' => [
                    ['time' => '09:00', 'preferred' => true, 'available' => true],
                    ['time' => '10:00', 'preferred' => true, 'available' => true],
                    ['time' => '11:00', 'preferred' => false, 'available' => true],
                    ['time' => '14:00', 'preferred' => false, 'available' => true],
                    ['time' => '15:00', 'preferred' => false, 'available' => true],
                    ['time' => '17:00', 'preferred' => false, 'available' => true],
                ],
            ],
        ];
    }

    /**
     * Get available lab test packages
     */
    protected function getAvailablePackages(): array
    {
        return [
            [
                'id' => '1',
                'name' => 'Basic Health Checkup',
                'description' => 'Essential tests for general wellness monitoring',
                'duration_hours' => '2-3',
                'tests_count' => 35,
                'age_range' => '18-60',
                'price' => 1999,
                'original_price' => 2999,
                'is_recommended' => true,
            ],
            [
                'id' => '2',
                'name' => 'Comprehensive Health Package',
                'description' => 'Complete health assessment with advanced screenings',
                'duration_hours' => '3-4',
                'tests_count' => 68,
                'age_range' => '18-60',
                'price' => 4999,
                'original_price' => 7999,
                'is_recommended' => false,
            ],
        ];
    }

    /**
     * Get available locations for sample collection
     */
    protected function getAvailableLocations(string $userId): array
    {
        return [
            [
                'id' => '1',
                'type' => 'home',
                'address' => '123, Palm Grove, Koregaon Park',
                'fee' => 800,
            ],
            [
                'id' => '2',
                'type' => 'center',
                'name' => 'Koregaon Park',
                'address' => 'Formula Hospital, Koregaon Park',
                'distance_km' => 1.2,
                'fee' => 'free',
            ],
        ];
    }

    /**
     * Build doctor appointment summary
     */
    protected function buildDoctorSummary(array $state): array
    {
        // Mock - replace with actual data lookup
        return [
            'doctor' => ['name' => 'Dr. Sarah Johnson', 'avatar' => null],
            'patient' => ['name' => 'Kriti Jaisinghani', 'avatar' => null],
            'type' => 'Video Consultation',
            'datetime' => '2026-01-25T08:00:00',
            'fee' => 800,
        ];
    }

    /**
     * Build lab test summary
     */
    protected function buildLabSummary(array $state): array
    {
        return [
            'package' => 'Basic Health Checkup',
            'patient' => ['name' => 'Kriti Jaisinghani', 'avatar' => null],
            'datetime' => '2026-01-25T08:00:00',
            'collection' => 'Home Collection',
            'address' => '123, Palm Grove, Koregaon Park',
            'fee' => 4999,
        ];
    }

    /**
     * Create booking record
     */
    protected function createBooking(BookingConversation $conversation): object
    {
        // Mock - replace with actual booking creation
        return (object) [
            'id' => 'HF3VY6A550',
            'booking_id' => 'HF3VY6A550',
            'type' => $conversation->collected_data['booking_type'],
        ];
    }

    /**
     * Get the most recent consultation for a patient
     */
    protected function getPreviousConsultation(int $patientId): ?array
    {
        // Mock data - replace with actual database query
        // Query: Appointment::where('patient_id', $patientId)
        //          ->where('status', 'completed')
        //          ->with('doctor')
        //          ->orderBy('appointment_date', 'desc')
        //          ->first();

        return [
            'doctor' => [
                'id' => '1',
                'name' => 'Dr. Sarah Johnson',
                'avatar' => null,
                'specialization' => 'General Physician',
            ],
            'date' => '2026-01-15',
            'reason' => 'Persistent headaches, difficulty sleeping',
            'doctorNotes' => 'Advised stress management techniques and prescribed mild pain relief. Follow-up recommended in 2 weeks.',
        ];
    }

    /**
     * Get previous doctors this patient has seen, with available slots
     */
    protected function getPreviousDoctors(int $patientId): array
    {
        // Mock data - replace with actual database query
        // Query: Doctor::whereHas('appointments', function($q) use ($patientId) {
        //            $q->where('patient_id', $patientId)
        //              ->where('status', 'completed');
        //        })
        //        ->with(['appointments' => function($q) use ($patientId) {
        //            $q->where('patient_id', $patientId)
        //              ->where('status', 'completed')
        //              ->orderBy('appointment_date', 'desc')
        //              ->limit(1);
        //        }])
        //        ->get();

        return [
            [
                'id' => '1',
                'name' => 'Dr. Sarah Johnson',
                'avatar' => null,
                'specialization' => 'General Physician',
                'experience_years' => 15,
                'rating' => 4.8,
                'reviewCount' => 324,
                'price' => 800,
                'lastVisitDate' => '2026-01-15',
                'previousSymptoms' => ['Headaches', 'Sleep issues'],
                'slots' => [
                    ['time' => '09:00', 'available' => true],
                    ['time' => '10:00', 'available' => true],
                    ['time' => '14:00', 'available' => true],
                    ['time' => '15:00', 'available' => true],
                ],
            ],
            [
                'id' => '2',
                'name' => 'Dr. Michael Chen',
                'avatar' => null,
                'specialization' => 'Cardiologist',
                'experience_years' => 12,
                'rating' => 4.9,
                'reviewCount' => 156,
                'price' => 1200,
                'lastVisitDate' => '2025-12-20',
                'previousSymptoms' => ['Chest pain', 'Irregular heartbeat'],
                'slots' => [
                    ['time' => '11:00', 'available' => true],
                    ['time' => '16:00', 'available' => true],
                    ['time' => '17:00', 'available' => true],
                ],
            ],
            [
                'id' => '3',
                'name' => 'Dr. Priya Sharma',
                'avatar' => null,
                'specialization' => 'Dermatologist',
                'experience_years' => 10,
                'rating' => 4.7,
                'reviewCount' => 289,
                'price' => 900,
                'lastVisitDate' => '2025-11-10',
                'previousSymptoms' => ['Skin rash', 'Acne'],
                'slots' => [
                    ['time' => '10:00', 'available' => true],
                    ['time' => '13:00', 'available' => true],
                    ['time' => '15:00', 'available' => true],
                ],
            ],
        ];
    }
}
