<?php

namespace App\Http\Controllers;

use App\BookingConversation;
use App\Services\Booking\ConversationOrchestrator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingConversationController extends Controller
{
    public function __construct(
        private ConversationOrchestrator $orchestrator
    ) {}

    public function start(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:doctor,lab_test',
            'initial_message' => 'nullable|string',
        ]);

        // TODO: Replace with actual authenticated user when auth is implemented
        // For now, get or create a mock user
        $user = \App\User::firstOrCreate(
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
            ],
        ]);

        // Add user's initial selection as a message
        $userMessage = $validated['type'] === 'doctor'
            ? 'I want to book a doctor appointment'
            : 'I want to book a lab test';

        $conversation->addMessage('user', $userMessage);

        // Initialize conversation with first message
        $response = $this->orchestrator->process($conversation);

        return redirect()->route('booking.show', $conversation->id);
    }

    public function show(BookingConversation $conversation): Response
    {
        // TODO: Re-enable authorization when auth is implemented
        // $this->authorize('view', $conversation);

        return Inertia::render('Booking/Conversation', [
            'conversation' => $conversation->load('messages'),
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

        // Only add user message if there's actual text content (not component selections)
        if (!empty($validated['content']) && empty($validated['user_selection'])) {
            $conversation->addMessage(
                'user',
                $validated['content'],
                $validated['component_type'] ?? null
            );
        }

        // Process the conversation with user input
        $response = $this->orchestrator->process(
            $conversation,
            $validated['content'] ?? null,
            $validated['user_selection'] ?? null
        );

        // If there's a redirect (e.g., to confirmation page), handle it
        if (isset($response['redirect'])) {
            return redirect($response['redirect']);
        }

        return back();
    }
}
