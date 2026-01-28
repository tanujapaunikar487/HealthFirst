<?php

namespace App\Http\Controllers;

use App\BookingConversation;
use App\Services\Calendar\CalendarService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CalendarController extends Controller
{
    public function __construct(
        private CalendarService $calendarService
    ) {}

    /**
     * Generate Google Calendar URL
     */
    public function googleCalendar(string $conversationId): JsonResponse
    {
        // Try to find conversation, fallback to mock data if not found
        $conversation = BookingConversation::find($conversationId);

        if ($conversation) {
            // Build event data from conversation
            $eventData = $this->calendarService->buildEventFromBookingData(
                $conversation->collected_data ?? []
            );
        } else {
            // Use mock event data for demo purposes
            $eventData = [
                'title' => 'Doctor Appointment - Dr. Sarah Johnson',
                'start' => \Carbon\Carbon::parse('2026-01-25 08:00'),
                'duration' => 30,
                'description' => "Type: New Consultation\nMode: Video Consultation\n\nVideo link will be sent 30 minutes before the appointment.\n\nContact: support@formulahospital.com",
                'location' => 'Video Call (link will be sent via email)',
            ];
        }

        // Generate Google Calendar URL
        $url = $this->calendarService->generateGoogleCalendarUrl($eventData);

        return response()->json([
            'url' => $url,
        ]);
    }

    /**
     * Download ICS file for Apple Calendar
     */
    public function downloadIcs(string $conversationId): StreamedResponse
    {
        // Try to find conversation, fallback to mock data if not found
        $conversation = BookingConversation::find($conversationId);

        if ($conversation) {
            // Build event data from conversation
            $eventData = $this->calendarService->buildEventFromBookingData(
                $conversation->collected_data ?? []
            );
            $bookingType = $conversation->collected_data['booking_type'] ?? 'appointment';
        } else {
            // Use mock event data for demo purposes
            $eventData = [
                'title' => 'Doctor Appointment - Dr. Sarah Johnson',
                'start' => \Carbon\Carbon::parse('2026-01-25 08:00'),
                'duration' => 30,
                'description' => "Type: New Consultation\nMode: Video Consultation\n\nVideo link will be sent 30 minutes before the appointment.\n\nContact: support@formulahospital.com",
                'location' => 'Video Call (link will be sent via email)',
            ];
            $bookingType = 'doctor';
        }

        // Generate ICS content
        $icsContent = $this->calendarService->generateIcsContent($eventData);

        // Generate filename based on booking type and date
        $date = $eventData['start']->format('Y-m-d');
        $filename = "{$bookingType}-{$date}.ics";

        return response()->streamDownload(
            function () use ($icsContent) {
                echo $icsContent;
            },
            $filename,
            [
                'Content-Type' => 'text/calendar; charset=utf-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]
        );
    }
}
