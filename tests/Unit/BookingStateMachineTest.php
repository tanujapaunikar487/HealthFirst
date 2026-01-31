<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\Booking\BookingStateMachine;

class BookingStateMachineTest extends TestCase
{
    public function test_it_starts_at_patient_selection_with_empty_data()
    {
        $stateMachine = new BookingStateMachine([]);

        $this->assertEquals('patient_selection', $stateMachine->getCurrentState());
        $this->assertFalse($stateMachine->isReadyForSummary());
        $this->assertFalse($stateMachine->isReadyToBook());
    }

    public function test_it_moves_to_appointment_type_after_patient_selected()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'selectedPatientName' => 'John Doe',
        ]);

        $this->assertEquals('appointment_type', $stateMachine->getCurrentState());
    }

    public function test_new_appointment_without_date_shows_urgency()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
        ]);

        $this->assertEquals('urgency', $stateMachine->getCurrentState());
        $this->assertContains('urgency', $stateMachine->getMissingFields());
    }

    public function test_new_appointment_with_date_skips_urgency()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'selectedDate' => '2026-02-05',
        ]);

        // Should skip urgency and go straight to doctor selection
        $this->assertEquals('doctor_selection', $stateMachine->getCurrentState());
        $this->assertNotContains('urgency', $stateMachine->getMissingFields());
    }

    public function test_followup_appointment_shows_followup_reason()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'followup',
        ]);

        $this->assertEquals('followup_reason', $stateMachine->getCurrentState());
    }

    public function test_followup_flow_requires_notes_prompt()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'followup',
            'followup_reason' => 'scheduled',
        ]);

        $this->assertEquals('followup_notes', $stateMachine->getCurrentState());

        $component = $stateMachine->getComponentForCurrentState();
        $this->assertNull($component['type']); // No component, waiting for chat input
        $this->assertTrue($component['awaiting_chat_input']);
        $this->assertStringContainsString('skip', $component['message']);
    }

    public function test_followup_shows_previous_doctors_before_full_list()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'followup',
            'followup_reason' => 'scheduled',
            'followup_notes_asked' => true,
            'urgency' => 'this_week',
        ]);

        $this->assertEquals('previous_doctors', $stateMachine->getCurrentState());
    }

    public function test_followup_skips_previous_doctors_if_already_shown()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'followup',
            'followup_reason' => 'scheduled',
            'followup_notes_asked' => true,
            'previous_doctors_shown' => true,
            'urgency' => 'this_week',
        ]);

        $this->assertEquals('doctor_selection', $stateMachine->getCurrentState());
    }

    public function test_it_shows_time_selection_if_doctor_selected_without_time()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'urgency' => 'urgent',
            'selectedDoctorId' => 1,
            'selectedDate' => '2026-02-05',
            // No selectedTime
        ]);

        $this->assertEquals('time_selection', $stateMachine->getCurrentState());
    }

    public function test_it_shows_mode_selection_after_doctor_and_time()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'urgency' => 'urgent',
            'selectedDoctorId' => 1,
            'selectedDate' => '2026-02-05',
            'selectedTime' => '09:00',
        ]);

        $this->assertEquals('mode_selection', $stateMachine->getCurrentState());
    }

    public function test_it_shows_summary_when_all_data_collected()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'urgency' => 'urgent',
            'selectedDoctorId' => 1,
            'selectedDate' => '2026-02-05',
            'selectedTime' => '09:00',
            'consultationMode' => 'video',
        ]);

        $this->assertEquals('summary', $stateMachine->getCurrentState());
        $this->assertTrue($stateMachine->isReadyForSummary());
        $this->assertTrue($stateMachine->isReadyToBook());
        $this->assertEquals([], $stateMachine->getMissingFields());
    }

    public function test_apply_data_updates_state()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
        ]);

        $this->assertEquals('appointment_type', $stateMachine->getCurrentState());

        $stateMachine->applyData(['appointmentType' => 'new']);

        $this->assertEquals('urgency', $stateMachine->getCurrentState());
    }

    public function test_request_change_clears_field_and_updates_state()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'urgency' => 'urgent',
            'selectedDoctorId' => 1,
            'selectedDate' => '2026-02-05',
            'selectedTime' => '09:00',
            'consultationMode' => 'video',
        ]);

        $this->assertEquals('summary', $stateMachine->getCurrentState());

        // User wants to change doctor
        $stateMachine->requestChange('doctor');

        $this->assertEquals('doctor_selection', $stateMachine->getCurrentState());
        $data = $stateMachine->getData();
        $this->assertArrayNotHasKey('selectedDoctorId', $data);
        $this->assertEquals('09:00', $data['pending_time_validation']); // Time saved for validation
    }

    public function test_request_change_type_clears_type_specific_data()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'followup',
            'followup_reason' => 'scheduled',
            'followup_notes' => 'Some notes',
            'followup_notes_asked' => true,
        ]);

        $stateMachine->requestChange('type');

        $data = $stateMachine->getData();
        $this->assertArrayNotHasKey('appointmentType', $data);
        $this->assertArrayNotHasKey('followup_reason', $data);
        $this->assertArrayNotHasKey('followup_notes', $data);
        $this->assertEquals('appointment_type', $stateMachine->getCurrentState());
    }

    public function test_completeness_percentage_calculates_correctly()
    {
        // Empty data = 0%
        $stateMachine = new BookingStateMachine([]);
        $this->assertEquals(0.0, $stateMachine->getCompletenessPercentage());

        // Patient only = ~16% (1 of 6 base fields)
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
        ]);
        $this->assertGreaterThan(0.15, $stateMachine->getCompletenessPercentage());
        $this->assertLessThan(0.20, $stateMachine->getCompletenessPercentage());

        // All fields = 100%
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'urgency' => 'urgent',
            'selectedDoctorId' => 1,
            'selectedDate' => '2026-02-05',
            'selectedTime' => '09:00',
            'consultationMode' => 'video',
        ]);
        $this->assertEquals(1.0, $stateMachine->getCompletenessPercentage());
    }

    public function test_followup_completeness_includes_extra_fields()
    {
        // Followup has 8 fields (6 base + 2 followup-specific)
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'followup',
            'followup_reason' => 'scheduled',
            'followup_notes_asked' => true,
            'selectedDoctorId' => 1,
            'selectedDate' => '2026-02-05',
            'selectedTime' => '09:00',
            'consultationMode' => 'video',
        ]);

        $this->assertEquals(1.0, $stateMachine->getCompletenessPercentage());
        $this->assertTrue($stateMachine->isReadyForSummary());
    }

    public function test_has_field_checks_individual_fields()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'selectedDate' => '2026-02-05',
        ]);

        $this->assertTrue($stateMachine->hasField('patient'));
        $this->assertTrue($stateMachine->hasField('appointment_type'));
        $this->assertTrue($stateMachine->hasField('urgency')); // Date satisfies urgency
        $this->assertFalse($stateMachine->hasField('doctor'));
        $this->assertTrue($stateMachine->hasField('date'));
        $this->assertFalse($stateMachine->hasField('time'));
        $this->assertFalse($stateMachine->hasField('mode'));
    }

    public function test_component_messages_are_context_aware()
    {
        // Followup notes message changes based on reason
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'followup',
            'followup_reason' => 'new_concern',
        ]);

        $component = $stateMachine->getComponentForCurrentState();
        $this->assertStringContainsString('new symptoms', $component['message']);

        // Doctor selection message includes date
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'urgency' => 'urgent',
            'selectedDate' => '2026-02-05',
        ]);

        $component = $stateMachine->getComponentForCurrentState();
        $this->assertStringContainsString('Feb 5', $component['message']);
    }

    public function test_debug_info_provides_useful_information()
    {
        $stateMachine = new BookingStateMachine([
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
        ]);

        $debug = $stateMachine->getDebugInfo();

        $this->assertEquals('urgency', $debug['current_state']);
        $this->assertEquals('new', $debug['appointment_type']);
        $this->assertArrayHasKey('completeness', $debug);
        $this->assertArrayHasKey('missing_fields', $debug);
        $this->assertFalse($debug['ready_for_summary']);
        $this->assertFalse($debug['ready_to_book']);
    }
}
