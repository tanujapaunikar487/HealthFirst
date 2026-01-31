<?php

namespace Tests\Feature;

use App\BookingConversation;
use App\Services\AI\AIService;
use App\Services\Booking\DoctorService;
use App\Services\Booking\IntelligentBookingOrchestrator;
use App\Services\Booking\LabService;
use App\User;
use Database\Seeders\HospitalSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private MockInterface $aiMock;
    private IntelligentBookingOrchestrator $orchestrator;
    private DoctorService $doctorService;
    private LabService $labService;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user first — HospitalSeeder uses User::first()
        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->seed(HospitalSeeder::class);

        $this->doctorService = new DoctorService();
        $this->labService = new LabService();

        // Mock only AIService — everything else uses real services + seeded DB
        $this->aiMock = Mockery::mock(AIService::class);

        $this->orchestrator = new IntelligentBookingOrchestrator($this->aiMock);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private function conversation(string $type = 'doctor', array $data = []): BookingConversation
    {
        return BookingConversation::create([
            'user_id' => $this->user->id,
            'type' => $type,
            'status' => 'active',
            'current_step' => null,
            'collected_data' => $data,
        ]);
    }

    private function mockAI(string $intent, array $entities = [], float $confidence = 0.9): void
    {
        $this->aiMock
            ->shouldReceive('classifyIntent')
            ->once()
            ->andReturn([
                'intent' => $intent,
                'confidence' => $confidence,
                'entities' => $entities,
                'is_emergency' => false,
                'emergency_indicators' => null,
                'is_skip' => false,
                'is_confirmation' => false,
                'changes_requested' => null,
                'requires_clarification' => false,
                'clarification_needed' => null,
                'thinking' => [],
                'raw_response' => json_encode(['intent' => $intent, 'entities' => $entities]),
            ]);
    }

    /**
     * Helper to get a future date that a specific doctor is available on.
     */
    private function getAvailableDateForDoctor(int $doctorId, int $daysAhead = 7): ?string
    {
        for ($i = 1; $i <= $daysAhead; $i++) {
            $date = now()->addDays($i)->format('Y-m-d');
            if ($this->doctorService->isAvailableOn($doctorId, $date)) {
                return $date;
            }
        }
        return null;
    }

    // =========================================================================
    // 1. DOCTOR BOOKING — HAPPY PATH
    // =========================================================================

    public function test_doctor_booking_full_flow_via_component_selections(): void
    {
        $conv = $this->conversation('doctor');

        // Step 1: AI extracts patient=self → skips patient selector
        $this->mockAI('booking_doctor', ['patient_relation' => 'self']);
        $r = $this->orchestrator->process($conv, 'Book an appointment for myself');
        $conv->refresh();

        $this->assertEquals('appointment_type', $r['state']);
        $this->assertNotNull($r['component_type']);

        // Step 2: Select new appointment
        $r = $this->orchestrator->process($conv, null, [
            'appointment_type' => 'new',
            'display_message' => 'New Appointment',
        ]);
        $conv->refresh();
        $this->assertEquals('urgency', $r['state']);

        // Step 3: Select urgency
        $r = $this->orchestrator->process($conv, null, [
            'urgency' => 'this_week',
            'display_message' => 'This Week',
        ]);
        $conv->refresh();
        $this->assertEquals('date_selection', $r['state']);

        // Step 4: Select date (find a date doctor 1 is available)
        $date = $this->getAvailableDateForDoctor(1);
        $this->assertNotNull($date, 'Should find an available date for doctor 1');

        $r = $this->orchestrator->process($conv, null, [
            'date' => $date,
            'display_message' => $date,
        ]);
        $conv->refresh();
        $this->assertEquals('doctor_selection', $r['state']);

        // Step 5: Select doctor
        $r = $this->orchestrator->process($conv, null, [
            'doctor_id' => 1,
            'doctor_name' => 'Dr. Sarah Johnson',
            'display_message' => 'Dr. Sarah Johnson',
        ]);
        $conv->refresh();

        // Step 6: Select time
        $r = $this->orchestrator->process($conv, null, [
            'time' => '10:00',
            'display_message' => '10:00 AM',
        ]);
        $conv->refresh();

        // Step 7: If mode not auto-selected, select it
        $data = $conv->collected_data;
        if (empty($data['consultationMode'])) {
            $r = $this->orchestrator->process($conv, null, [
                'mode' => 'video',
                'display_message' => 'Video Consultation',
            ]);
            $conv->refresh();
        }

        $this->assertEquals('summary', $r['state']);
        $this->assertTrue($r['ready_to_book']);

        // Verify all data present
        $data = $conv->collected_data;
        $this->assertEquals(1, $data['selectedPatientId']);
        $this->assertEquals('new', $data['appointmentType']);
        $this->assertEquals(1, $data['selectedDoctorId']);
        $this->assertEquals($date, $data['selectedDate']);
        $this->assertEquals('10:00', $data['selectedTime']);
        $this->assertNotEmpty($data['consultationMode']);
    }

    // =========================================================================
    // 2. LAB BOOKING — HAPPY PATH (HOME COLLECTION)
    // =========================================================================

    public function test_lab_booking_home_collection_full_flow(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
        ]);

        // Step 1: Patient selection via AI
        $this->mockAI('booking_lab', ['patient_relation' => 'self']);
        $r = $this->orchestrator->process($conv, 'I want a blood test for myself');
        $conv->refresh();
        $this->assertEquals('package_inquiry', $r['state']);

        // Step 2: Package search (handled by package_inquiry handler, not AI)
        $r = $this->orchestrator->process($conv, 'diabetes');
        $conv->refresh();

        // Either auto-selected or shows list
        $data = $conv->collected_data;
        if (empty($data['selectedPackageId'])) {
            $packageId = ($data['packageSearchResults'] ?? [])[0] ?? 2;
            $r = $this->orchestrator->process($conv, null, [
                'package_id' => $packageId,
                'display_message' => 'Diabetes Screening',
            ]);
            $conv->refresh();
        }
        $this->assertEquals('collection_type_selection', $r['state']);

        // Step 3: Home collection
        $r = $this->orchestrator->process($conv, null, [
            'collection_type' => 'home',
            'display_message' => 'Home Collection',
        ]);
        $conv->refresh();
        $this->assertEquals('address_selection', $r['state']);

        // Step 4: Select address
        $r = $this->orchestrator->process($conv, null, [
            'address_id' => 1,
            'address_label' => 'Home',
            'address_text' => 'Flat 302, Sunrise Apartments, Pune',
            'display_message' => 'Home',
        ]);
        $conv->refresh();
        $this->assertEquals('lab_date_time_selection', $r['state']);

        // Step 5: Date + time
        $futureDate = now()->addDays(3)->format('Y-m-d');
        $r = $this->orchestrator->process($conv, null, [
            'date' => $futureDate,
            'time' => '08:00',
            'display_message' => "$futureDate at 8:00 AM",
        ]);
        $conv->refresh();

        $this->assertEquals('summary', $r['state']);
        $this->assertTrue($r['ready_to_book']);
        $this->assertEquals('home', $conv->collected_data['collectionType']);
        $this->assertEquals(1, $conv->collected_data['selectedAddressId']);
    }

    // =========================================================================
    // 3. LAB BOOKING — CENTER VISIT
    // =========================================================================

    public function test_lab_booking_center_visit_flow(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'completedSteps' => ['patient'],
        ]);

        // Package search
        $r = $this->orchestrator->process($conv, 'full body checkup');
        $conv->refresh();

        $data = $conv->collected_data;
        if (empty($data['selectedPackageId'])) {
            $packageId = ($data['packageSearchResults'] ?? [])[0] ?? 1;
            $r = $this->orchestrator->process($conv, null, [
                'package_id' => $packageId,
                'display_message' => 'Complete Health Checkup',
            ]);
            $conv->refresh();
        }

        // Center visit
        $r = $this->orchestrator->process($conv, null, [
            'collection_type' => 'center',
            'display_message' => 'Hospital Visit',
        ]);
        $conv->refresh();
        $this->assertEquals('center_selection', $r['state']);

        // Select center
        $r = $this->orchestrator->process($conv, null, [
            'center_id' => 1,
            'display_message' => 'Lab Center',
        ]);
        $conv->refresh();
        $this->assertEquals('lab_date_time_selection', $r['state']);

        // Date + time
        $r = $this->orchestrator->process($conv, null, [
            'date' => now()->addDays(2)->format('Y-m-d'),
            'time' => '09:00',
            'display_message' => 'Tomorrow at 9 AM',
        ]);
        $conv->refresh();

        $this->assertEquals('summary', $r['state']);
        $this->assertTrue($r['ready_to_book']);
        $this->assertEquals('center', $conv->collected_data['collectionType']);
        $this->assertNotEmpty($conv->collected_data['selectedCenterId']);
    }

    // =========================================================================
    // 4. COMPOUND INPUT — MULTIPLE ENTITIES AT ONCE
    // =========================================================================

    public function test_compound_input_extracts_multiple_entities(): void
    {
        $conv = $this->conversation('doctor');
        $date = $this->getAvailableDateForDoctor(1) ?? now()->addDays(3)->format('Y-m-d');

        $this->mockAI('booking_doctor', [
            'patient_relation' => 'self',
            'appointment_type' => 'new',
            'doctor_name' => 'Dr. Sarah Johnson',
            'doctor_id' => 1,
            'date' => $date,
            'time' => '15:00',
        ]);
        $r = $this->orchestrator->process($conv, "Book for me with Dr. Sarah on $date at 3pm, new appointment");
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEquals(1, $data['selectedPatientId']);
        $this->assertEquals('new', $data['appointmentType']);
        $this->assertNotEmpty($data['selectedDate']);
    }

    // =========================================================================
    // 5. PATIENT RELATION REGEX FALLBACK
    // =========================================================================

    public function test_regex_fallback_extracts_self_from_for_me(): void
    {
        $conv = $this->conversation('doctor');

        // AI returns NO patient_relation — regex fallback should catch "for me"
        $this->mockAI('booking_doctor', []);
        $r = $this->orchestrator->process($conv, 'Book an appointment for me');
        $conv->refresh();

        // Should NOT be stuck at patient_selection
        $this->assertNotEquals('patient_selection', $r['state'],
            '"for me" should resolve patient via regex fallback');
        $this->assertEquals(1, $conv->collected_data['selectedPatientId']);
    }

    public function test_regex_fallback_extracts_mother_from_for_my_mother(): void
    {
        $conv = $this->conversation('doctor');

        $this->mockAI('booking_doctor', []);
        $r = $this->orchestrator->process($conv, 'Book a doctor for my mother');
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEquals('mother', $data['patientRelation'] ?? null);
    }

    public function test_regex_does_not_falsely_extract_self_from_ambiguous_input(): void
    {
        $conv = $this->conversation('doctor');

        $this->mockAI('booking_doctor', []);
        $r = $this->orchestrator->process($conv, 'I need a doctor');
        $conv->refresh();

        // No "for me" or "for my X" → should stay at patient_selection
        $this->assertEquals('patient_selection', $r['state']);
    }

    // =========================================================================
    // 6. GREETING VS BOOKING INTENT GATE
    // =========================================================================

    public function test_greeting_with_no_progress_shows_greeting(): void
    {
        // Empty collected_data → no booking progress
        $conv = $this->conversation('doctor', []);

        $this->mockAI('greeting', []);
        $r = $this->orchestrator->process($conv, 'Hi');

        $this->assertEquals('success', $r['status']);
        $this->assertNull($r['component_type']);
        $this->assertFalse($r['ready_to_book']);
    }

    public function test_greeting_with_booking_progress_continues_flow(): void
    {
        $conv = $this->conversation('doctor', [
            'booking_type' => 'doctor',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'completedSteps' => ['patient'],
        ]);

        $this->mockAI('greeting', []);
        $r = $this->orchestrator->process($conv, 'Hello');
        $conv->refresh();

        // Should continue to appointment_type, not show greeting
        $this->assertEquals('appointment_type', $r['state']);
        $this->assertNotNull($r['component_type']);
    }

    // =========================================================================
    // 7. CANCELLATION
    // =========================================================================

    public function test_cancellation_mid_flow_cancels_conversation(): void
    {
        $conv = $this->conversation('doctor', [
            'booking_type' => 'doctor',
            'selectedPatientId' => 1,
            'appointmentType' => 'new',
            'urgency' => 'this_week',
            'completedSteps' => ['patient', 'appointmentType', 'urgency'],
        ]);

        $this->mockAI('cancel', []);
        $r = $this->orchestrator->process($conv, 'Cancel this');
        $conv->refresh();

        $this->assertEquals('cancelled', $r['status']);
        $this->assertTrue($r['conversation_cancelled']);
        $this->assertEquals('cancelled', $conv->status);
    }

    // =========================================================================
    // 8. SUMMARY CHANGE REQUESTS
    // =========================================================================

    private function summaryConversation(): BookingConversation
    {
        $date = $this->getAvailableDateForDoctor(1) ?? now()->addDays(2)->format('Y-m-d');
        return $this->conversation('doctor', [
            'booking_type' => 'doctor',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'appointmentType' => 'new',
            'urgency' => 'this_week',
            'selectedDoctorId' => 1,
            'selectedDoctorName' => 'Dr. Sarah Johnson',
            'selectedDate' => $date,
            'selectedTime' => '10:00',
            'consultationMode' => 'video',
            'completedSteps' => ['patient', 'appointmentType', 'urgency', 'doctor', 'date', 'time', 'mode'],
        ]);
    }

    public function test_change_doctor_clears_doctor_and_mode(): void
    {
        $conv = $this->summaryConversation();

        $r = $this->orchestrator->process($conv, null, [
            'change_doctor' => true,
            'display_message' => 'Change Doctor',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEmpty($data['selectedDoctorId'] ?? null);
        $this->assertEmpty($data['consultationMode'] ?? null);
        $this->assertEquals('doctor_selection', $r['state']);
    }

    public function test_change_datetime_clears_date_time_and_mode(): void
    {
        $conv = $this->summaryConversation();

        $r = $this->orchestrator->process($conv, null, [
            'change_datetime' => true,
            'display_message' => 'Change Date/Time',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEmpty($data['selectedDate'] ?? null);
        $this->assertEmpty($data['selectedTime'] ?? null);
        $this->assertEmpty($data['consultationMode'] ?? null);
    }

    public function test_change_appointment_type_clears_all_downstream(): void
    {
        $conv = $this->summaryConversation();

        $r = $this->orchestrator->process($conv, null, [
            'change_type' => true,
            'display_message' => 'Change Appointment Type',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEmpty($data['appointmentType'] ?? null);
        $this->assertEmpty($data['urgency'] ?? null);
        $this->assertEmpty($data['selectedDoctorId'] ?? null);
        $this->assertEmpty($data['selectedDate'] ?? null);
        $this->assertEmpty($data['selectedTime'] ?? null);
        $this->assertEmpty($data['consultationMode'] ?? null);
        $this->assertEquals('appointment_type', $r['state']);
    }

    public function test_change_patient_clears_patient_data(): void
    {
        $conv = $this->summaryConversation();

        $r = $this->orchestrator->process($conv, null, [
            'change_patient' => true,
            'display_message' => 'Change Patient',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEmpty($data['selectedPatientId'] ?? null);
        $this->assertEquals('patient_selection', $r['state']);
    }

    public function test_change_mode_for_multi_mode_doctor(): void
    {
        $conv = $this->summaryConversation();

        // Doctor 1 supports both video and in_person
        $doctor = $this->doctorService->getById(1);
        $modes = $doctor['consultation_modes'] ?? [];

        if (count($modes) <= 1) {
            $this->markTestSkipped('Doctor 1 has only one mode');
        }

        $r = $this->orchestrator->process($conv, null, [
            'change_mode' => true,
            'display_message' => 'Change Mode',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEmpty($data['consultationMode'] ?? null);
        $this->assertEquals('mode_selection', $r['state']);
    }

    // =========================================================================
    // 9. FLOW SWITCHING
    // =========================================================================

    public function test_switch_from_doctor_to_lab_mid_flow(): void
    {
        $conv = $this->conversation('doctor', [
            'booking_type' => 'doctor',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'appointmentType' => 'new',
            'completedSteps' => ['patient', 'appointmentType'],
        ]);

        $this->mockAI('booking_lab', []);
        $r = $this->orchestrator->process($conv, 'Actually I want a lab test instead');
        $conv->refresh();

        $this->assertEquals('lab_test', $conv->collected_data['booking_type']);
    }

    public function test_booking_doctor_intent_sets_booking_type(): void
    {
        $conv = $this->conversation('doctor', []);

        $this->mockAI('booking_doctor', ['patient_relation' => 'self']);
        $r = $this->orchestrator->process($conv, 'I want to see a doctor for myself');
        $conv->refresh();

        $this->assertEquals('doctor', $conv->collected_data['booking_type']);
    }

    // =========================================================================
    // 10. FOLLOW-UP FLOW
    // =========================================================================

    public function test_followup_flow_reason_then_notes(): void
    {
        $conv = $this->conversation('doctor', [
            'booking_type' => 'doctor',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'completedSteps' => ['patient'],
        ]);

        // Select followup
        $r = $this->orchestrator->process($conv, null, [
            'appointment_type' => 'followup',
            'display_message' => 'Follow-up Visit',
        ]);
        $conv->refresh();
        $this->assertEquals('followup_reason', $r['state']);

        // Select reason
        $r = $this->orchestrator->process($conv, null, [
            'followup_reason' => 'ongoing_issue',
            'display_message' => 'Ongoing issue',
        ]);
        $conv->refresh();
        $this->assertEquals('followup_notes', $r['state']);

        // Provide notes via text
        $r = $this->orchestrator->process($conv, 'Headache has improved but occasional dizziness');
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertTrue($data['followup_notes_asked']);
        $this->assertNotEmpty($data['followup_notes']);
    }

    public function test_followup_notes_can_be_skipped(): void
    {
        $conv = $this->conversation('doctor', [
            'booking_type' => 'doctor',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'appointmentType' => 'followup',
            'followup_reason' => 'scheduled',
            'completedSteps' => ['patient', 'appointmentType', 'followup_reason'],
        ]);

        $r = $this->orchestrator->process($conv, 'skip');
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertTrue($data['followup_notes_asked']);
        $this->assertEquals('', $data['followup_notes']);
    }

    // =========================================================================
    // 11. LAB PACKAGE SEARCH
    // =========================================================================

    public function test_lab_package_search_no_match_shows_all_packages(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'completedSteps' => ['patient'],
        ]);

        $r = $this->orchestrator->process($conv, 'xyznonexistent');
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertTrue($data['package_inquiry_asked']);
        $this->assertEquals(0, $data['packageMatchCount'] ?? 0);
        $this->assertEquals('package_selection', $r['state']);
    }

    // =========================================================================
    // 12. LAB CHANGE REQUESTS
    // =========================================================================

    public function test_change_location_clears_collection_and_downstream(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPackageId' => 1,
            'selectedPackageName' => 'Complete Health Checkup',
            'packageRequiresFasting' => false,
            'package_inquiry_asked' => true,
            'collectionType' => 'home',
            'selectedAddressId' => 1,
            'selectedAddressLabel' => 'Home',
            'selectedAddressText' => '123 Main St',
            'selectedDate' => now()->addDays(3)->format('Y-m-d'),
            'selectedTime' => '08:00',
            'completedSteps' => ['patient', 'package', 'collection_type', 'address', 'date', 'time'],
        ]);

        $r = $this->orchestrator->process($conv, null, [
            'change_location' => true,
            'display_message' => 'Change Location',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEmpty($data['collectionType'] ?? null);
        $this->assertEmpty($data['selectedAddressId'] ?? null);
        $this->assertEmpty($data['selectedDate'] ?? null);
        $this->assertEquals('collection_type_selection', $r['state']);
    }

    public function test_change_package_resets_inquiry_state(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPackageId' => 1,
            'selectedPackageName' => 'Complete Health Checkup',
            'package_inquiry_asked' => true,
            'packageSearchQuery' => 'checkup',
            'collectionType' => 'home',
            'completedSteps' => ['patient', 'package', 'collection_type'],
        ]);

        $r = $this->orchestrator->process($conv, null, [
            'change_package' => true,
            'display_message' => 'Change Package',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEmpty($data['selectedPackageId'] ?? null);
        $this->assertEmpty($data['package_inquiry_asked'] ?? null);
        $this->assertEmpty($data['packageSearchQuery'] ?? null);
        $this->assertEquals('package_inquiry', $r['state']);
    }

    // =========================================================================
    // 13. LAB FLOW ORDER
    // =========================================================================

    public function test_home_collection_requires_address_before_date(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPackageId' => 1,
            'selectedPackageName' => 'Test Package',
            'package_inquiry_asked' => true,
            'collectionType' => 'home',
            'completedSteps' => ['patient', 'package', 'collection_type'],
        ]);

        $this->mockAI('booking_lab', []);
        $r = $this->orchestrator->process($conv, 'continue');
        $conv->refresh();

        $this->assertEquals('address_selection', $r['state']);
    }

    public function test_center_visit_requires_center_before_date(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPackageId' => 1,
            'selectedPackageName' => 'Test Package',
            'package_inquiry_asked' => true,
            'collectionType' => 'center',
            'completedSteps' => ['patient', 'package', 'collection_type'],
        ]);

        $this->mockAI('booking_lab', []);
        $r = $this->orchestrator->process($conv, 'continue');
        $conv->refresh();

        $this->assertEquals('center_selection', $r['state']);
    }

    // =========================================================================
    // 14. COMPONENT SELECTIONS BYPASS AI
    // =========================================================================

    public function test_component_selection_does_not_call_ai(): void
    {
        $conv = $this->conversation('doctor', [
            'booking_type' => 'doctor',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'completedSteps' => ['patient'],
        ]);

        // No mockAI() — if AI is called, Mockery throws "unexpected method call"
        $r = $this->orchestrator->process($conv, null, [
            'appointment_type' => 'new',
            'display_message' => 'New Appointment',
        ]);
        $conv->refresh();

        $this->assertEquals('urgency', $r['state']);
    }

    // =========================================================================
    // 15. PROGRESS TRACKING
    // =========================================================================

    public function test_progress_increases_through_flow(): void
    {
        $conv = $this->conversation('doctor');

        $this->mockAI('booking_doctor', ['patient_relation' => 'self']);
        $r1 = $this->orchestrator->process($conv, 'Book for myself');
        $conv->refresh();
        $p1 = $r1['progress']['percentage'];

        $r2 = $this->orchestrator->process($conv, null, [
            'appointment_type' => 'new',
            'display_message' => 'New',
        ]);
        $conv->refresh();
        $p2 = $r2['progress']['percentage'];

        $r3 = $this->orchestrator->process($conv, null, [
            'urgency' => 'this_week',
            'display_message' => 'This Week',
        ]);
        $conv->refresh();
        $p3 = $r3['progress']['percentage'];

        $this->assertGreaterThan($p1, $p2, 'Progress should increase after step 2');
        $this->assertGreaterThan($p2, $p3, 'Progress should increase after step 3');
    }

    // =========================================================================
    // 16. MESSAGES PERSISTED
    // =========================================================================

    public function test_messages_are_persisted_to_database(): void
    {
        $conv = $this->conversation('doctor');

        $this->mockAI('booking_doctor', ['patient_relation' => 'self']);
        $this->orchestrator->process($conv, 'Book for me');
        $conv->refresh();

        $messages = $conv->messages()->get();
        $this->assertGreaterThanOrEqual(2, $messages->count(), 'Should have user + assistant messages');

        $this->assertTrue($messages->contains('role', 'user'));
        $this->assertTrue($messages->contains('role', 'assistant'));
    }

    // =========================================================================
    // 17. SINGLE-MODE DOCTOR AUTO-SELECTS MODE
    // =========================================================================

    public function test_single_mode_doctor_auto_selects_mode(): void
    {
        // Find a single-mode doctor
        $allDoctors = $this->doctorService->getAllAsList();
        $singleModeDoctor = null;
        foreach ($allDoctors as $doctor) {
            if (count($doctor['consultation_modes'] ?? []) === 1) {
                $singleModeDoctor = $doctor;
                break;
            }
        }

        if (!$singleModeDoctor) {
            $this->markTestSkipped('No single-mode doctor in seeded data');
        }

        $date = $this->getAvailableDateForDoctor($singleModeDoctor['id']);
        if (!$date) {
            $this->markTestSkipped('No available date for single-mode doctor');
        }

        $conv = $this->conversation('doctor', [
            'booking_type' => 'doctor',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'appointmentType' => 'new',
            'urgency' => 'this_week',
            'selectedDate' => $date,
            'completedSteps' => ['patient', 'appointmentType', 'urgency', 'date'],
        ]);

        $r = $this->orchestrator->process($conv, null, [
            'doctor_id' => $singleModeDoctor['id'],
            'doctor_name' => $singleModeDoctor['name'],
            'display_message' => $singleModeDoctor['name'],
        ]);
        $conv->refresh();

        // After selecting time, mode should be auto-selected
        $r = $this->orchestrator->process($conv, null, [
            'time' => '10:00',
            'display_message' => '10:00 AM',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEquals($singleModeDoctor['consultation_modes'][0], $data['consultationMode']);
        $this->assertEquals('summary', $r['state']);
    }

    // =========================================================================
    // 18. ENTITY MERGE — AI-HALLUCINATED URGENCY CLEARED
    // =========================================================================

    public function test_ai_extracted_urgency_preserved_as_text_mentioned(): void
    {
        $conv = $this->conversation('doctor');

        // AI extracts urgency alongside booking intent — tracked as textMentionedFields
        $this->mockAI('booking_doctor', [
            'patient_relation' => 'self',
            'urgency_level' => 'urgent',
        ]);
        $r = $this->orchestrator->process($conv, 'I urgently need a doctor');
        $conv->refresh();

        // Selecting appointment_type should NOT clear AI-extracted urgency
        // because it's tracked in textMentionedFields (user explicitly mentioned it)
        $r = $this->orchestrator->process($conv, null, [
            'appointment_type' => 'new',
            'display_message' => 'New Appointment',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        $this->assertEquals('urgent', $data['urgency'] ?? null,
            'AI-extracted urgency should be preserved as text-mentioned field');
        $this->assertContains('urgency', $data['textMentionedFields'] ?? []);
    }

    // =========================================================================
    // 19. MIXED TEXT + COMPONENT FLOW
    // =========================================================================

    public function test_mixed_text_and_component_selections_work_together(): void
    {
        $conv = $this->conversation('doctor');

        // Step 1: Text with multiple entities
        $this->mockAI('booking_doctor', [
            'patient_relation' => 'self',
            'appointment_type' => 'new',
        ]);
        $r = $this->orchestrator->process($conv, 'New appointment for myself');
        $conv->refresh();

        $this->assertEquals('new', $conv->collected_data['appointmentType']);
        $this->assertEquals(1, $conv->collected_data['selectedPatientId']);

        // Step 2: Component selection continues from where text left off
        $r = $this->orchestrator->process($conv, null, [
            'urgency' => 'this_week',
            'display_message' => 'This Week',
        ]);
        $conv->refresh();

        $this->assertEquals('date_selection', $r['state']);
    }

    // =========================================================================
    // 20. EMPTY CONVERSATION STARTS AT PATIENT SELECTION
    // =========================================================================

    public function test_empty_conversation_starts_at_patient_selection(): void
    {
        $conv = $this->conversation('doctor');

        $this->mockAI('booking_doctor', []);
        $r = $this->orchestrator->process($conv, 'I want to book an appointment');
        $conv->refresh();

        $this->assertEquals('patient_selection', $r['state']);
        $this->assertNotNull($r['component_type']);
    }

    // =========================================================================
    // 21. CHANGE ADDRESS FROM SUMMARY
    // =========================================================================

    public function test_change_address_from_summary_clears_address_and_downstream(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Yourself',
            'selectedPackageId' => 1,
            'selectedPackageName' => 'Complete Health Checkup',
            'package_inquiry_asked' => true,
            'collectionType' => 'home',
            'selectedAddressId' => 1,
            'selectedAddressLabel' => 'Home',
            'selectedAddressText' => 'Flat 302, Sunrise Apartments',
            'selectedDate' => now()->addDays(2)->format('Y-m-d'),
            'selectedTime' => '10:00',
            'completedSteps' => ['patient', 'package', 'collection_type', 'address', 'date', 'time'],
        ]);

        $r = $this->orchestrator->process($conv, null, [
            'change_address' => true,
            'display_message' => 'Change Address',
        ]);
        $conv->refresh();

        $data = $conv->collected_data;
        // Address cleared
        $this->assertEmpty($data['selectedAddressId'] ?? null);
        $this->assertEmpty($data['selectedAddressLabel'] ?? null);
        // Date/time cleared (downstream)
        $this->assertEmpty($data['selectedDate'] ?? null);
        $this->assertEmpty($data['selectedTime'] ?? null);
        // Collection type preserved
        $this->assertEquals('home', $data['collectionType']);
        // State goes back to address_selection
        $this->assertEquals('address_selection', $r['state']);
    }

    // =========================================================================
    // INDIVIDUAL LAB TEST BOOKING
    // =========================================================================

    public function test_individual_test_search_and_selection(): void
    {
        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Test User',
            'completedSteps' => ['patient'],
        ]);

        // Simulate user typing "CBC" in package inquiry
        $r = $this->orchestrator->process($conv, 'CBC');
        $conv->refresh();
        $data = $conv->collected_data;

        // CBC should match the individual test
        $this->assertNotEmpty($data['testSearchResults'] ?? []);
        $this->assertTrue($data['package_inquiry_asked']);

        // If only 1 test and 0 packages matched, auto-select happens
        // If multiple results, user sees the list — either way the flow progresses
        if (!empty($data['selectedTestIds'])) {
            // Auto-selected: verify test data is set (as arrays)
            $this->assertIsArray($data['selectedTestIds']);
            $this->assertNotEmpty($data['selectedTestNames']);
            $this->assertContains('package', $data['completedSteps']);
            // State should advance past package selection
            $this->assertNotEquals('package_selection', $r['state']);
            $this->assertNotEquals('package_inquiry', $r['state']);
        } else {
            // Multiple results: user needs to pick
            $this->assertEquals('package_selection', $r['state']);
        }
    }

    public function test_individual_test_selection_via_component(): void
    {
        // Get the first lab test type ID from the database
        $testType = \App\Models\LabTestType::where('is_active', true)->first();
        $this->assertNotNull($testType, 'No active lab test types found in DB');

        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Test User',
            'package_inquiry_asked' => true,
            'packageSearchQuery' => 'cbc',
            'testSearchResults' => [$testType->id],
            'testMatchCount' => 1,
            'packageSearchResults' => [],
            'packageMatchCount' => 0,
            'completedSteps' => ['patient'],
        ]);

        // Select the individual test (now sends test_ids array)
        $r = $this->orchestrator->process($conv, null, [
            'test_ids' => [$testType->id],
            'display_message' => "Selected: {$testType->name}",
        ]);
        $conv->refresh();
        $data = $conv->collected_data;

        // Test should be selected as arrays
        $this->assertEquals([$testType->id], $data['selectedTestIds']);
        $this->assertEquals([$testType->name], $data['selectedTestNames']);
        // Package should NOT be selected
        $this->assertEmpty($data['selectedPackageId'] ?? null);
        // 'package' step should be completed
        $this->assertContains('package', $data['completedSteps']);
        // State should advance to collection_type_selection
        $this->assertEquals('collection_type_selection', $r['state']);
    }

    public function test_individual_test_full_flow_to_summary(): void
    {
        $testType = \App\Models\LabTestType::where('is_active', true)->first();

        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Test User',
            'package_inquiry_asked' => true,
            'selectedTestIds' => [$testType->id],
            'selectedTestNames' => [$testType->name],
            'packageRequiresFasting' => $testType->requires_fasting,
            'packageFastingHours' => $testType->fasting_hours,
            'collectionType' => 'center',
            'selectedCenterId' => 1,
            'selectedCenterName' => 'Pathology Lab',
            'selectedDate' => now()->addDays(2)->format('Y-m-d'),
            'selectedTime' => '09:00',
            'completedSteps' => ['patient', 'package', 'collection_type', 'center', 'date', 'time'],
        ]);

        $stateMachine = new \App\Services\Booking\BookingStateMachine($conv->collected_data);
        $this->assertEquals('summary', $stateMachine->getCurrentState());
        $this->assertTrue($stateMachine->isReadyToBook());
    }

    // =========================================================================
    // MULTI-TEST SELECTION
    // =========================================================================

    public function test_multi_test_selection_sums_fees(): void
    {
        $tests = \App\Models\LabTestType::where('is_active', true)->take(2)->get();
        $this->assertCount(2, $tests, 'Need at least 2 active lab test types');

        $conv = $this->conversation('lab_test', [
            'booking_type' => 'lab_test',
            'selectedPatientId' => 1,
            'selectedPatientName' => 'Test User',
            'package_inquiry_asked' => true,
            'packageSearchQuery' => 'blood',
            'testSearchResults' => $tests->pluck('id')->toArray(),
            'testMatchCount' => 2,
            'packageSearchResults' => [],
            'packageMatchCount' => 0,
            'completedSteps' => ['patient'],
        ]);

        // Select both tests via component
        $r = $this->orchestrator->process($conv, null, [
            'test_ids' => $tests->pluck('id')->toArray(),
            'display_message' => 'Selected: ' . $tests->pluck('name')->join(', '),
        ]);
        $conv->refresh();
        $data = $conv->collected_data;

        // Both tests should be selected
        $this->assertCount(2, $data['selectedTestIds']);
        $this->assertCount(2, $data['selectedTestNames']);
        $this->assertEquals($tests->pluck('id')->map(fn($id) => (int) $id)->toArray(), $data['selectedTestIds']);
        // Package should NOT be set
        $this->assertEmpty($data['selectedPackageId'] ?? null);
        // Flow should advance to collection type
        $this->assertEquals('collection_type_selection', $r['state']);

        // Verify fee calculation sums both test prices
        $expectedFee = $tests->sum('price');
        $actualFee = $this->labService->calculateFee(null, 'center', $data['selectedTestIds']);
        $this->assertEquals($expectedFee, $actualFee, 'Fee should sum prices of all selected tests');
    }
}
