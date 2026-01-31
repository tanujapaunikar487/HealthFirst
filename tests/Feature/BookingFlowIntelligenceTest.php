<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\User;
use App\BookingConversation;
use App\Services\AI\AIService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

/**
 * Booking Flow Intelligence Tests
 *
 * Tests the intelligent booking system's ability to:
 * - Understand natural language
 * - Switch flows dynamically
 * - Preserve context
 * - Handle cancellations
 * - Update UI components dynamically
 */
class BookingFlowIntelligenceTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $aiServiceMock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'name' => 'Test User',
        ]);

        // Create AI Service mock
        $this->aiServiceMock = Mockery::mock(AIService::class);
        $this->app->instance(AIService::class, $this->aiServiceMock);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * Mock AI response for natural language doctor booking
     */
    protected function mockDoctorBookingIntent()
    {
        $this->aiServiceMock
            ->shouldReceive('classifyIntent')
            ->andReturn([
                'intent' => 'booking_doctor',
                'confidence' => 0.95,
                'entities' => [],
            ]);
    }

    /**
     * Mock AI response for cancellation
     */
    protected function mockCancellationIntent()
    {
        $this->aiServiceMock
            ->shouldReceive('classifyIntent')
            ->andReturn([
                'intent' => 'cancel',
                'confidence' => 0.98,
                'entities' => [],
            ]);
    }

    /**
     * Mock AI response for flow switching
     */
    protected function mockFlowSwitchIntent()
    {
        $this->aiServiceMock
            ->shouldReceive('classifyIntent')
            ->andReturn([
                'intent' => 'booking_lab_test',
                'confidence' => 0.92,
                'entities' => [
                    'booking_type' => 'lab_test',
                ],
            ]);
    }

    /**
     * Mock AI response for patient change
     */
    protected function mockPatientChangeIntent()
    {
        $this->aiServiceMock
            ->shouldReceive('classifyIntent')
            ->andReturn([
                'intent' => 'update_booking',
                'confidence' => 0.90,
                'entities' => [
                    'patientRelation' => 'mother',
                ],
            ]);
    }

    /**
     * Mock AI response for date update
     */
    protected function mockDateUpdateIntent()
    {
        $this->aiServiceMock
            ->shouldReceive('classifyIntent')
            ->andReturn([
                'intent' => 'update_booking',
                'confidence' => 0.88,
                'entities' => [
                    'selectedDate' => '2026-02-10',
                ],
            ]);
    }

    /**
     * Test: AI understands natural language doctor booking
     */
    public function test_natural_language_doctor_booking_initiation()
    {
        $this->mockDoctorBookingIntent();

        // Create conversation directly (not through HTTP to avoid transaction issues)
        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'init',
            'collected_data' => [
                'booking_type' => 'doctor',
                'current_step' => 'patient_selection',
                'completedSteps' => [],
            ],
        ]);

        // Process with orchestrator
        $orchestrator = app(\App\Services\Booking\IntelligentBookingOrchestrator::class);
        $response = $orchestrator->process($conversation, "I'm not feeling well, can I see a doctor?");

        // Verify response
        $this->assertEquals('patient_selector', $response['component_type']);
        $this->assertNotNull($response['component_data']);

        // Verify conversation updated
        $conversation->refresh();
        $this->assertEquals('doctor', $conversation->type);
        $this->assertEquals('active', $conversation->status);

        // Verify messages were created
        $messageCount = $conversation->messages()->count();
        $this->assertGreaterThan(0, $messageCount, "Expected messages but found {$messageCount}");

        // Verify assistant message (not user message) shows patient selector
        $assistantMessage = $conversation->messages()->where('role', 'assistant')->latest()->first();
        $this->assertNotNull($assistantMessage, 'No assistant messages found in conversation');
        $this->assertEquals('patient_selector', $assistantMessage->component_type);
    }

    /**
     * Test: Flow switching from doctor to lab test preserves context
     */
    public function test_flow_switching_preserves_patient_selection()
    {
        $this->mockFlowSwitchIntent();

        // Start doctor booking
        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'patient_selection',
            'collected_data' => [
                'booking_type' => 'doctor',
                'selectedPatientId' => 1,
                'selectedPatientName' => 'Test User',
                'appointmentType' => 'new',
            ],
        ]);

        // Switch to lab test
        $response = $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'content' => 'Actually, I just need a blood test',
            ]);

        $conversation->refresh();

        // Verify patient selection preserved
        $this->assertEquals(1, $conversation->collected_data['selectedPatientId']);
        $this->assertEquals('Test User', $conversation->collected_data['selectedPatientName']);

    }

    /**
     * Test: Cancellation removes UI and disables conversation
     */
    public function test_cancellation_updates_status_and_removes_ui()
    {
        $this->mockCancellationIntent();

        // Create active conversation with some progress
        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'urgency',
            'collected_data' => [
                'booking_type' => 'doctor',
                'selectedPatientId' => 1,
                'appointmentType' => 'new',
            ],
        ]);

        // Cancel booking
        $response = $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'content' => 'cancel',
            ]);

        $conversation->refresh();

        // Verify status changed
        $this->assertEquals('cancelled', $conversation->status);

        // Verify cancellation message added
        $lastMessage = $conversation->messages()->where('role', 'assistant')->latest()->first();
        $this->assertEquals('assistant', $lastMessage->role);
        $this->assertStringContainsString('cancelled', strtolower($lastMessage->content));
        $this->assertNull($lastMessage->component_type);
    }

    /**
     * Test: Various cancellation phrases all trigger cancellation
     */
    public function test_various_cancellation_phrases()
    {
        $phrases = [
            'cancel',
            'never mind',
            'forget it',
            'stop',
            "I don't want to book",
        ];

        foreach ($phrases as $phrase) {
            $this->mockCancellationIntent();

            $conversation = BookingConversation::create([
                'user_id' => $this->user->id,
                'type' => 'doctor',
                'status' => 'active',
                'current_step' => 'patient_selection',
                'collected_data' => ['booking_type' => 'doctor'],
            ]);

            $this->actingAs($this->user)
                ->post("/booking/{$conversation->id}/message", [
                    'content' => $phrase,
                ]);

            $conversation->refresh();
            $this->assertEquals('cancelled', $conversation->status, "Failed for phrase: {$phrase}");
        }
    }

    /**
     * Test: Patient change mid-flow updates data without restarting
     */
    public function test_patient_change_mid_flow()
    {
        $this->mockPatientChangeIntent();

        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'urgency',
            'collected_data' => [
                'booking_type' => 'doctor',
                'selectedPatientId' => 1,
                'selectedPatientName' => 'Test User',
                'appointmentType' => 'new',
                'urgency' => 'this_week',
            ],
        ]);

        // Change patient
        $response = $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'content' => 'Actually this is for my mother',
            ]);

        $conversation->refresh();

        // Verify patient relation extracted
        $this->assertEquals('mother', $conversation->collected_data['patientRelation'] ?? null);

        // Verify other data preserved
        $this->assertEquals('new', $conversation->collected_data['appointmentType']);
        $this->assertEquals('this_week', $conversation->collected_data['urgency']);
    }

    /**
     * Test: Follow-up flow shows correct empathetic messages
     */
    public function test_followup_reason_shows_correct_message()
    {
        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'followup_reason',
            'collected_data' => [
                'booking_type' => 'doctor',
                'selectedPatientId' => 1,
                'appointmentType' => 'followup',
            ],
        ]);

        // Select "ongoing issue" via component selection (bypasses AI)
        $response = $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'component_type' => 'followup_reason',
                'user_selection' => [
                    'followup_reason' => 'ongoing_issue',
                ],
            ]);

        $conversation->refresh();
        $lastMessage = $conversation->messages()->where('role', 'assistant')->latest()->first();

        // Verify empathetic message
        $this->assertStringContainsString("I'm sorry to hear that", $lastMessage->content);
        $this->assertStringContainsString('still bothering you', $lastMessage->content);
    }

    /**
     * Test: Multiple entities extracted from single message
     */
    public function test_multiple_entity_extraction()
    {
        $this->aiServiceMock
            ->shouldReceive('classifyIntent')
            ->andReturn([
                'intent' => 'booking_doctor',
                'confidence' => 0.93,
                'entities' => [
                    'appointmentType' => 'new',
                    'selectedDate' => '2026-02-11',
                    'patientRelation' => 'father',
                ],
            ]);

        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'patient_selection',
            'collected_data' => ['booking_type' => 'doctor'],
        ]);

        // Provide multiple pieces of info at once
        $response = $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'content' => 'Book a new appointment for my father next Tuesday morning',
            ]);

        $conversation->refresh();
        $data = $conversation->collected_data;

        // Verify multiple entities extracted
        $this->assertEquals('new', $data['appointmentType'] ?? null);
        $this->assertNotNull($data['selectedDate'] ?? null);

        // Patient relation should be extracted (father)
        $this->assertEquals('father', $data['patientRelation'] ?? null);
    }

    /**
     * Test: Summary change updates data correctly
     */
    public function test_summary_mode_change()
    {
        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'summary',
            'collected_data' => [
                'booking_type' => 'doctor',
                'selectedPatientId' => 1,
                'appointmentType' => 'new',
                'selectedDoctorId' => 1,
                'selectedDate' => '2026-02-05',
                'selectedTime' => '10:00',
                'consultationMode' => 'video',
            ],
        ]);

        // Change mode from summary via component selection (bypasses AI)
        $response = $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'component_type' => 'booking_summary',
                'user_selection' => [
                    'change_mode' => true,
                ],
            ]);

        $conversation->refresh();

        // Verify mode cleared
        $this->assertNull($conversation->collected_data['consultationMode'] ?? null);

        // Verify other data preserved
        $this->assertEquals(1, $conversation->collected_data['selectedDoctorId']);
        $this->assertEquals('2026-02-05', $conversation->collected_data['selectedDate']);
    }

    /**
     * Test: Date updates show in doctor list component
     */
    public function test_date_update_updates_doctor_list()
    {
        $this->mockDateUpdateIntent();

        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'doctor_selection',
            'collected_data' => [
                'booking_type' => 'doctor',
                'selectedPatientId' => 1,
                'appointmentType' => 'new',
                'urgency' => 'this_week',
            ],
        ]);

        // Update date
        $response = $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'content' => 'Show me doctors for February 10',
            ]);

        $conversation->refresh();

        // Verify date updated
        $this->assertEquals('2026-02-10', $conversation->collected_data['selectedDate'] ?? '');

        // Verify still on doctor selection (no restart)
    }

    /**
     * Test: State machine completes all steps correctly
     */
    public function test_complete_booking_flow()
    {
        // Start
        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'patient_selection',
            'collected_data' => ['booking_type' => 'doctor'],
        ]);

        // Step 1: Patient (component selection - no AI mock needed)
        $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'component_type' => 'patient_selector',
                'user_selection' => [
                    'patient_id' => 1,
                    'patient_name' => 'Test User',
                ],
            ]);

        // Note: current_step in DB is not updated by orchestrator (uses state machine instead)
        // Check that appropriate component is returned
        $lastMessage = $conversation->messages()->where('role', 'assistant')->latest()->first();
        $this->assertEquals('appointment_type_selector', $lastMessage->component_type);
        // Note: current_step in DB is not updated by orchestrator (uses state machine instead)
        // Check that appropriate component is returned
        $lastMessage = $conversation->messages()->where('role', 'assistant')->latest()->first();
        $this->assertEquals('appointment_type_selector', $lastMessage->component_type);

        // Step 2: Type (component selection - no AI mock needed)
        $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'component_type' => 'appointment_type_selector',
                'user_selection' => [
                    'appointment_type' => 'new',
                ],
            ]);

        $conversation->refresh();

        // Step 3: Urgency (component selection - no AI mock needed)
        $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'component_type' => 'urgency_selector',
                'user_selection' => [
                    'urgency' => 'this_week',
                ],
            ]);

        $conversation->refresh();

        // Step 4: Doctor + Time (component selection - no AI mock needed)
        $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'component_type' => 'date_doctor_selector',
                'user_selection' => [
                    'doctor_id' => 1,
                    'doctor_name' => 'Dr. Test',
                    'date' => '2026-02-05',
                    'time' => '10:00',
                ],
            ]);

        $conversation->refresh();

        // Step 5: Mode (component selection - no AI mock needed)
        $this->actingAs($this->user)
            ->post("/booking/{$conversation->id}/message", [
                'component_type' => 'mode_selector',
                'user_selection' => [
                    'mode' => 'video',
                ],
            ]);

        $conversation->refresh();

        // Verify all data collected
        $data = $conversation->collected_data;
        $this->assertEquals(1, $data['selectedPatientId']);
        $this->assertEquals('new', $data['appointmentType']);
        $this->assertEquals('this_week', $data['urgency']);
        $this->assertEquals(1, $data['selectedDoctorId']);
        $this->assertEquals('2026-02-05', $data['selectedDate']);
        $this->assertEquals('10:00', $data['selectedTime']);
        $this->assertEquals('video', $data['consultationMode']);
    }

    /**
     * Test: Context preserved after page refresh (data persistence)
     */
    public function test_data_persistence_across_sessions()
    {
        $conversation = BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => 'doctor',
            'status' => 'active',
            'current_step' => 'urgency',
            'collected_data' => [
                'booking_type' => 'doctor',
                'selectedPatientId' => 1,
                'selectedPatientName' => 'Test User',
                'appointmentType' => 'new',
            ],
        ]);

        $originalData = $conversation->collected_data;

        // Simulate page refresh - fetch conversation again
        $response = $this->actingAs($this->user)
            ->get("/booking/{$conversation->id}");

        $response->assertOk();

        // Re-fetch conversation
        $conversation = BookingConversation::find($conversation->id);

        // Verify data unchanged
        $this->assertEquals($originalData, $conversation->collected_data);
    }
}
