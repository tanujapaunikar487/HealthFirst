<?php

namespace App\Services\Booking;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * BookingStateMachine
 *
 * Deterministic state machine for booking flow.
 * No priority scoring - states are determined by what data exists.
 * Clear, predictable transitions.
 */
class BookingStateMachine
{
    // Define ALL possible states
    const STATES = [
        'patient_selection',
        'appointment_type',
        'urgency',           // For both new and followup appointments (unless date already known)
        'followup_reason',   // Only for followup
        'followup_notes',    // Only for followup
        'previous_doctors',  // Only for followup
        'date_selection',    // Pick a date before seeing doctors
        'doctor_selection',
        'time_selection',    // Separate from doctor if needed
        'mode_selection',
        'summary',
        'payment',
        'completed',
    ];

    private array $data;
    private string $currentState;
    private string $appointmentType;

    public function __construct(array $collectedData)
    {
        $this->data = $collectedData;
        $this->appointmentType = $collectedData['appointmentType'] ?? 'unknown';
        $this->currentState = $this->determineCurrentState();

        Log::info('🎰 State Machine Initialized', [
            'current_state' => $this->currentState,
            'appointment_type' => $this->appointmentType,
            'has_patient' => !empty($this->data['selectedPatientId']),
            'has_doctor' => !empty($this->data['selectedDoctorId']),
            'has_date' => !empty($this->data['selectedDate']),
            'has_time' => !empty($this->data['selectedTime']),
            'has_mode' => !empty($this->data['consultationMode']),
        ]);
    }

    /**
     * Determine current state based on what data we have.
     * Check states IN ORDER - first incomplete state is current.
     */
    private function determineCurrentState(): string
    {
        // 1. Must have patient
        if (empty($this->data['selectedPatientId'])) {
            return 'patient_selection';
        }

        // 2. Must have appointment type
        if (empty($this->data['appointmentType'])) {
            return 'appointment_type';
        }

        $type = $this->data['appointmentType'];

        // 3. FOLLOWUP-SPECIFIC STATES
        if ($type === 'followup') {
            // Need followup reason
            if (empty($this->data['followup_reason'])) {
                return 'followup_reason';
            }

            // Need followup notes (or user must have been asked)
            if (empty($this->data['followup_notes_asked'])) {
                return 'followup_notes';
            }

            // Need urgency (unless date already known)
            $hasDate = !empty($this->data['selectedDate']);
            $hasUrgency = !empty($this->data['urgency']);
            if (!$hasDate && !$hasUrgency) {
                return 'urgency';
            }

            // Show previous doctors (unless already shown or user chose "see all")
            if (empty($this->data['selectedDoctorId']) && empty($this->data['previous_doctors_shown'])) {
                return 'previous_doctors';
            }

            // Need date selection (pick a date before seeing doctors)
            if (empty($this->data['selectedDate'])) {
                return 'date_selection';
            }

            // Need doctor selection
            if (empty($this->data['selectedDoctorId'])) {
                return 'doctor_selection';
            }
        }

        // 4. NEW APPOINTMENT-SPECIFIC STATES
        if ($type === 'new') {
            // Skip urgency if date is already known (AI extracted or user specified)
            $hasDate = !empty($this->data['selectedDate']);
            $hasUrgency = !empty($this->data['urgency']);

            if (!$hasDate && !$hasUrgency) {
                return 'urgency';
            }

            // Need date selection (pick a date before seeing doctors)
            if (empty($this->data['selectedDate'])) {
                return 'date_selection';
            }

            // Need doctor selection
            if (empty($this->data['selectedDoctorId'])) {
                return 'doctor_selection';
            }
        }

        // 5. COMMON STATES (both new and followup)

        // Need time (if not selected with doctor)
        if (empty($this->data['selectedTime'])) {
            return 'time_selection';
        }

        // Need appointment mode
        if (empty($this->data['consultationMode'])) {
            return 'mode_selection';
        }

        // All data collected - show summary
        return 'summary';
    }

    /**
     * Get the current state
     */
    public function getCurrentState(): string
    {
        return $this->currentState;
    }

    /**
     * Check if booking is complete and ready for summary
     */
    public function isReadyForSummary(): bool
    {
        return $this->currentState === 'summary';
    }

    /**
     * Check if we're ready to book (all required data present)
     */
    public function isReadyToBook(): bool
    {
        $required = [
            'selectedPatientId',
            'appointmentType',
            'selectedDoctorId',
            'selectedDate',
            'selectedTime',
            'consultationMode',
        ];

        foreach ($required as $field) {
            if (empty($this->data[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Apply new data and recalculate state
     */
    public function applyData(array $newData): self
    {
        $before = $this->currentState;
        $this->data = array_merge($this->data, $newData);
        $this->appointmentType = $this->data['appointmentType'] ?? 'unknown';
        $this->currentState = $this->determineCurrentState();

        Log::info('🎰 State Machine: Data Applied', [
            'state_before' => $before,
            'state_after' => $this->currentState,
            'new_data_keys' => array_keys($newData),
        ]);

        return $this;
    }

    /**
     * Handle explicit change request (goes backwards in flow)
     */
    public function requestChange(string $field): self
    {
        Log::info('🔄 State Machine: Change Requested', [
            'field' => $field,
            'state_before' => $this->currentState,
        ]);

        switch ($field) {
            case 'patient':
                unset($this->data['selectedPatientId']);
                unset($this->data['selectedPatientName']);
                unset($this->data['selectedPatientAvatar']);
                unset($this->data['patientRelation']);
                break;

            case 'doctor':
                // Store time for validation when new doctor is selected
                $this->data['pending_time_validation'] = $this->data['selectedTime'] ?? null;
                unset($this->data['selectedDoctorId']);
                unset($this->data['selectedDoctorName']);
                unset($this->data['selectedDoctorAvatar']);
                unset($this->data['selectedDoctorSpecialization']);
                break;

            case 'datetime':
            case 'date':
                unset($this->data['selectedDate']);
                unset($this->data['selectedTime']);
                // Clear urgency so it can be re-asked
                unset($this->data['urgency']);
                break;

            case 'time':
                unset($this->data['selectedTime']);
                break;

            case 'mode':
                unset($this->data['consultationMode']);
                break;

            case 'type':
            case 'appointment_type':
                unset($this->data['appointmentType']);
                // Clear type-specific data
                unset($this->data['followup_reason']);
                unset($this->data['followup_notes']);
                unset($this->data['followup_notes_asked']);
                unset($this->data['previous_doctors_shown']);
                unset($this->data['urgency']);
                break;
        }

        $this->currentState = $this->determineCurrentState();

        Log::info('🔄 State Machine: Change Applied', [
            'field' => $field,
            'state_after' => $this->currentState,
        ]);

        return $this;
    }

    /**
     * Get the component to show for current state
     */
    public function getComponentForCurrentState(): array
    {
        return match($this->currentState) {
            'patient_selection' => [
                'type' => 'patient_selector',
                'message' => 'Who is this appointment for?',
                'awaiting_chat_input' => false,
            ],
            'appointment_type' => [
                'type' => 'appointment_type_selector',
                'message' => 'Is this a new appointment or a follow-up visit?',
                'awaiting_chat_input' => false,
            ],
            'urgency' => [
                'type' => 'urgency_selector',
                'message' => 'When do you need to see the doctor?',
                'awaiting_chat_input' => false,
            ],
            'followup_reason' => [
                'type' => 'followup_reason_selector',
                'message' => 'What brings you back?',
                'awaiting_chat_input' => false,
            ],
            'followup_notes' => [
                'type' => null,  // NO component, just message waiting for chat input
                'message' => $this->getFollowupNotesMessage(),
                'awaiting_chat_input' => true,
            ],
            'previous_doctors' => [
                'type' => 'previous_doctors',
                'message' => 'Would you like to book with one of these doctors you\'ve seen before?',
                'awaiting_chat_input' => false,
            ],
            'date_selection' => [
                'type' => 'date_picker',
                'message' => $this->getDateSelectionMessage(),
                'awaiting_chat_input' => false,
            ],
            'doctor_selection' => [
                'type' => 'doctor_selector',
                'message' => $this->getDoctorSelectionMessage(),
                'awaiting_chat_input' => false,
            ],
            'time_selection' => [
                'type' => 'time_slot_selector',
                'message' => $this->getTimeSelectionMessage(),
                'awaiting_chat_input' => false,
            ],
            'mode_selection' => [
                'type' => 'mode_selector',
                'message' => 'How would you like to consult?',
                'awaiting_chat_input' => false,
            ],
            'summary' => [
                'type' => 'booking_summary',
                'message' => 'Here\'s your appointment summary:',
                'awaiting_chat_input' => false,
            ],
            default => [
                'type' => null,
                'message' => 'Something went wrong. Please try again.',
                'awaiting_chat_input' => false,
            ],
        };
    }

    /**
     * Get context-aware message for followup notes
     */
    private function getFollowupNotesMessage(): string
    {
        $reason = $this->data['followup_reason'] ?? '';

        return match($reason) {
            'scheduled', 'routine_checkup', 'scheduled_followup' =>
                "Got it. Any updates you'd like to share with the doctor? This will help the doctor prepare for your visit. You can also skip this.",

            'new_concerns', 'new_concern' =>
                "What new symptoms or changes have you noticed? This will help the doctor prepare for your visit. You can also skip this.",

            'ongoing_treatment', 'ongoing_issue' =>
                "I'm sorry to hear that. Can you describe what's still bothering you? This will help the doctor prepare for your visit. You can also skip this.",

            default =>
                "Can you describe what's bothering you? This will help the doctor prepare. You can also skip this.",
        };
    }

    /**
     * Get context-aware message for date selection
     */
    private function getDateSelectionMessage(): string
    {
        $doctorName = $this->data['selectedDoctorName'] ?? null;

        if ($doctorName) {
            return "Pick a date for your appointment with {$doctorName}:";
        }

        return 'When would you like your appointment?';
    }

    /**
     * Get context-aware message for time selection
     */
    private function getTimeSelectionMessage(): string
    {
        $doctorName = $this->data['selectedDoctorName'] ?? null;

        if ($doctorName) {
            return "Here are {$doctorName}'s available slots:";
        }

        return 'Select a time slot:';
    }

    /**
     * Get context-aware message for doctor selection
     */
    private function getDoctorSelectionMessage(): string
    {
        $date = $this->data['selectedDate'] ?? null;

        if ($date) {
            try {
                $formatted = Carbon::parse($date)->format('M j');
                return "Here are doctors available on {$formatted}:";
            } catch (\Exception $e) {
                return "Here are the available doctors:";
            }
        }

        $urgency = $this->data['urgency'] ?? null;
        if ($urgency === 'urgent') {
            return "Here are doctors available today:";
        }

        return "Here are the available doctors:";
    }

    /**
     * Get list of missing required fields
     */
    public function getMissingFields(): array
    {
        $missing = [];

        if (empty($this->data['selectedPatientId'])) {
            $missing[] = 'patient';
        }

        if (empty($this->data['appointmentType'])) {
            $missing[] = 'appointment_type';
        }

        if ($this->appointmentType === 'followup') {
            if (empty($this->data['followup_reason'])) {
                $missing[] = 'followup_reason';
            }
            if (empty($this->data['followup_notes_asked'])) {
                $missing[] = 'followup_notes';
            }
        }

        if (in_array($this->appointmentType, ['new', 'followup'])) {
            $hasDate = !empty($this->data['selectedDate']);
            $hasUrgency = !empty($this->data['urgency']);
            if (!$hasDate && !$hasUrgency) {
                $missing[] = 'urgency';
            }
        }

        if (empty($this->data['selectedDoctorId'])) {
            $missing[] = 'doctor';
        }

        if (empty($this->data['selectedTime'])) {
            $missing[] = 'time';
        }

        if (empty($this->data['consultationMode'])) {
            $missing[] = 'mode';
        }

        return $missing;
    }

    /**
     * Get updated collected_data
     */
    public function getData(): array
    {
        return $this->data;
    }

    /**
     * Check if a specific field is complete
     */
    public function hasField(string $field): bool
    {
        return match($field) {
            'patient' => !empty($this->data['selectedPatientId']),
            'appointment_type' => !empty($this->data['appointmentType']),
            'urgency' => !empty($this->data['urgency']) || !empty($this->data['selectedDate']),
            'followup_reason' => !empty($this->data['followup_reason']),
            'followup_notes' => !empty($this->data['followup_notes_asked']),
            'doctor' => !empty($this->data['selectedDoctorId']),
            'date' => !empty($this->data['selectedDate']),
            'time' => !empty($this->data['selectedTime']),
            'mode' => !empty($this->data['consultationMode']),
            default => false,
        };
    }

    /**
     * Get completeness percentage (0.0 to 1.0)
     */
    public function getCompletenessPercentage(): float
    {
        $total = 6; // patient, type, doctor, date, time, mode

        // Add followup-specific fields
        if ($this->appointmentType === 'followup') {
            $total += 2; // reason, notes
        }

        // Add urgency for appointments (unless date specified)
        if (in_array($this->appointmentType, ['new', 'followup']) && empty($this->data['selectedDate'])) {
            $total += 1;
        }

        $completed = 0;
        if ($this->hasField('patient')) $completed++;
        if ($this->hasField('appointment_type')) $completed++;
        if ($this->hasField('doctor')) $completed++;
        if ($this->hasField('date')) $completed++;
        if ($this->hasField('time')) $completed++;
        if ($this->hasField('mode')) $completed++;

        if ($this->appointmentType === 'followup') {
            if ($this->hasField('followup_reason')) $completed++;
            if ($this->hasField('followup_notes')) $completed++;
        }

        if (in_array($this->appointmentType, ['new', 'followup']) && empty($this->data['selectedDate'])) {
            if ($this->hasField('urgency')) $completed++;
        }

        return $total > 0 ? $completed / $total : 0;
    }

    /**
     * Debug info for logging
     */
    public function getDebugInfo(): array
    {
        return [
            'current_state' => $this->currentState,
            'appointment_type' => $this->appointmentType,
            'completeness' => round($this->getCompletenessPercentage() * 100) . '%',
            'missing_fields' => $this->getMissingFields(),
            'ready_for_summary' => $this->isReadyForSummary(),
            'ready_to_book' => $this->isReadyToBook(),
        ];
    }
}
