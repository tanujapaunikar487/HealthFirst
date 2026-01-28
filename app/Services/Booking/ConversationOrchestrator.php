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
        // Add user message if there's input
        if ($userInput || $componentSelection) {
            $this->addUserMessage($conversation, $userInput, $componentSelection);
        }

        // Determine current step
        $currentStep = $conversation->collected_data['current_step'] ?? 'initial';
        $bookingType = $conversation->collected_data['booking_type'] ?? null;

        // Process the current step
        $response = $this->handleStep($conversation, $currentStep, $bookingType, $componentSelection);

        return $response;
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
            'current_step' => 'patient_selection',
        ]);
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
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'patient_id' => $selection['patient_id'],
            'current_step' => $conversation->collected_data['booking_type'] === 'doctor' ? 'consultation_type' : 'package_selection',
        ]);
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

        $conversation->collected_data = array_merge($conversation->collected_data, [
            'consultation_type' => $selection['consultation_type'],
            'current_step' => 'urgency',
        ]);
        $conversation->save();

        return $this->handleUrgency($conversation, null);
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
            'current_step' => 'doctor_selection',
        ]);
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
            'current_step' => 'consultation_mode',
        ]);
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
            'current_step' => 'summary',
        ]);
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
            'current_step' => 'location_selection',
        ]);
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
            'current_step' => 'date_time_selection',
        ]);
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
            'current_step' => 'summary',
        ]);
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
}
