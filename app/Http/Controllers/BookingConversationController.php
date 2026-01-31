<?php

namespace App\Http\Controllers;

use App\BookingConversation;
use App\Models\FamilyMember;
use App\Services\Booking\IntelligentBookingOrchestrator;
use App\Services\AI\AudioTranscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingConversationController extends Controller
{
    public function __construct(
        private IntelligentBookingOrchestrator $orchestrator,
        private AudioTranscriptionService $transcriptionService
    ) {}

    public function start(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:doctor,lab_test',
            'initial_message' => 'nullable|string',
        ]);

        // Use authenticated user if available, otherwise create/get mock user
        $user = $request->user() ?? \App\User::firstOrCreate(
            ['email' => 'sanjana@example.com'],
            [
                'name' => 'Sanjana Jaisinghani',
                'password' => bcrypt('password'),
            ]
        );

        $conversation = BookingConversation::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'status' => 'active',
            'current_step' => 'init',
            'collected_data' => [
                'booking_type' => $validated['type'],
                'current_step' => 'patient_selection',
                'completedSteps' => [],
            ],
        ]);

        // Use the user's actual message if provided, otherwise use a default
        $userMessage = $validated['initial_message'] ?? (
            $validated['type'] === 'doctor'
                ? 'I want to book a doctor appointment'
                : 'I want to book a lab test'
        );

        \Illuminate\Support\Facades\Log::info('📥 BookingConversationController::start', [
            'ACTUAL_USER_INPUT' => $validated['initial_message'] ?? 'null',
            'MESSAGE_SENT_TO_ORCHESTRATOR' => $userMessage,
            'conversation_id' => $conversation->id,
            'type' => $validated['type'],
        ]);

        // Initialize conversation with first message
        $response = $this->orchestrator->process($conversation, $userMessage);

        // Calculate completeness for logging
        $data = $conversation->fresh()->collected_data;
        $requiredFields = ['selectedPatientId', 'appointmentType', 'selectedDoctorId', 'selectedDate', 'selectedTime', 'consultationMode'];
        $completedCount = 0;
        foreach ($requiredFields as $field) {
            if (!empty($data[$field])) {
                $completedCount++;
            }
        }
        $completeness = count($requiredFields) > 0 ? $completedCount / count($requiredFields) : 0;

        \Illuminate\Support\Facades\Log::info('Intelligent orchestrator result', [
            'conversation_id' => $conversation->id,
            'has_component' => !empty($response['component_type']),
            'component_type' => $response['component_type'] ?? 'none',
            'completeness' => $completeness,
        ]);

        return redirect()->route('booking.show', $conversation->id);
    }

    public function show(BookingConversation $conversation): Response
    {
        // TODO: Re-enable authorization when auth is implemented
        // $this->authorize('view', $conversation);

        \Illuminate\Support\Facades\Log::warning('Unauthenticated conversation access in development', [
            'conversation_id' => $conversation->id,
            'ip' => request()->ip(),
        ]);

        // Get family members for the conversation owner
        $familyMembers = FamilyMember::where('user_id', $conversation->user_id)
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'relation' => ucfirst($m->relation),
                'avatar' => $m->avatar_url ?? '',
            ])
            ->toArray();

        return Inertia::render('Booking/Conversation', [
            'conversation' => $conversation->load('messages'),
            'familyMembers' => $familyMembers,
        ]);
    }

    public function message(Request $request, BookingConversation $conversation)
    {
        // TODO: Re-enable authorization when auth is implemented
        // $this->authorize('update', $conversation);

        $validated = $request->validate([
            'content' => 'nullable|string',
            'component_type' => 'nullable|string',
            'user_selection' => 'nullable|array',
        ]);

        \Illuminate\Support\Facades\Log::info('Message received (Intelligent)', [
            'conversation_id' => $conversation->id,
            'has_input' => !empty($validated['content']),
            'has_selection' => !empty($validated['user_selection']),
        ]);

        // Process the conversation with user input
        // The orchestrator will handle adding the user message
        $response = $this->orchestrator->process(
            $conversation,
            $validated['content'] ?? null,
            $validated['user_selection'] ?? null
        );

        // Calculate completeness for logging
        $data = $conversation->fresh()->collected_data;
        $requiredFields = ['selectedPatientId', 'appointmentType', 'selectedDoctorId', 'selectedDate', 'selectedTime', 'consultationMode'];
        $completedCount = 0;
        foreach ($requiredFields as $field) {
            if (!empty($data[$field])) {
                $completedCount++;
            }
        }
        $completeness = count($requiredFields) > 0 ? $completedCount / count($requiredFields) : 0;

        \Illuminate\Support\Facades\Log::info('Intelligent message processed', [
            'conversation_id' => $conversation->id,
            'has_component' => !empty($response['component_type']),
            'component_type' => $response['component_type'] ?? 'none',
            'completeness' => $completeness,
        ]);

        // If there's a redirect (e.g., to confirmation page), handle it
        if (isset($response['redirect'])) {
            return redirect($response['redirect']);
        }

        return back();
    }

    public function transcribeAudio(Request $request, BookingConversation $conversation)
    {
        // TODO: Re-enable authorization when auth is implemented
        // $this->authorize('update', $conversation);

        $validated = $request->validate([
            'audio' => 'required|file|mimes:webm,mp3,wav,m4a,mp4|max:25600', // 25MB max
            'language' => 'nullable|string|size:2',
        ]);

        try {
            // Validate audio file
            $this->transcriptionService->validateAudioFile($validated['audio']);

            // Transcribe audio
            $result = $this->transcriptionService->transcribe(
                $validated['audio'],
                $validated['language'] ?? 'en'
            );

            \Illuminate\Support\Facades\Log::info('Audio transcribed successfully', [
                'conversation_id' => $conversation->id,
                'text_length' => strlen($result['text']),
                'duration' => $result['duration'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'text' => $result['text'],
                'language' => $result['language'],
                'duration' => $result['duration'],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Audio transcription failed', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function transcribeGeneric(Request $request)
    {
        $validated = $request->validate([
            'audio' => 'required|file|mimes:webm,mp3,wav,m4a,mp4|max:25600', // 25MB max
            'language' => 'nullable|string|size:2',
        ]);

        try {
            // Validate audio file
            $this->transcriptionService->validateAudioFile($validated['audio']);

            // Transcribe audio
            $result = $this->transcriptionService->transcribe(
                $validated['audio'],
                $validated['language'] ?? 'en'
            );

            \Illuminate\Support\Facades\Log::info('Generic audio transcribed successfully', [
                'text_length' => strlen($result['text']),
                'duration' => $result['duration'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'text' => $result['text'],
                'language' => $result['language'],
                'duration' => $result['duration'],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Generic audio transcription failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
