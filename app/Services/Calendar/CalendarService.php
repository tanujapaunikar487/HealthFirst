<?php

namespace App\Services\Calendar;

use Carbon\Carbon;
use Illuminate\Support\Str;

class CalendarService
{
    /**
     * Generate Google Calendar URL
     */
    public function generateGoogleCalendarUrl(array $eventData): string
    {
        $params = [
            'action' => 'TEMPLATE',
            'text' => $eventData['title'],
            'dates' => $this->formatGoogleDates($eventData['start'], $eventData['duration']),
            'details' => $eventData['description'],
            'location' => $eventData['location'],
        ];

        return 'https://calendar.google.com/calendar/render?' . http_build_query($params);
    }

    /**
     * Generate ICS file content for Apple Calendar / Outlook
     */
    public function generateIcsContent(array $eventData): string
    {
        $uid = Str::uuid()->toString();
        $now = Carbon::now('UTC')->format('Ymd\THis\Z');
        $start = Carbon::parse($eventData['start'])->setTimezone('UTC')->format('Ymd\THis\Z');
        $end = Carbon::parse($eventData['start'])->addMinutes($eventData['duration'])->setTimezone('UTC')->format('Ymd\THis\Z');

        // Escape special characters for ICS
        $title = $this->escapeIcsText($eventData['title']);
        $description = $this->escapeIcsText($eventData['description']);
        $location = $this->escapeIcsText($eventData['location']);

        return implode("\r\n", [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Formula Hospital//Booking System//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            "UID:{$uid}",
            "DTSTAMP:{$now}",
            "DTSTART:{$start}",
            "DTEND:{$end}",
            "SUMMARY:{$title}",
            "DESCRIPTION:{$description}",
            "LOCATION:{$location}",
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-PT1H',
            'ACTION:DISPLAY',
            'DESCRIPTION:Reminder',
            'END:VALARM',
            'BEGIN:VALARM',
            'TRIGGER:-PT24H',
            'ACTION:DISPLAY',
            'DESCRIPTION:Reminder - 24 hours',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR',
        ]);
    }

    /**
     * Build event data from collected booking data
     */
    public function buildEventFromBookingData(array $collectedData): array
    {
        $bookingType = $collectedData['booking_type'] ?? 'doctor';

        if ($bookingType === 'doctor') {
            return $this->buildDoctorEventFromData($collectedData);
        } else {
            return $this->buildLabEventFromData($collectedData);
        }
    }

    /**
     * Build doctor appointment event from collected data
     */
    private function buildDoctorEventFromData(array $data): array
    {
        // Parse date and time
        $dateStr = $data['date'] ?? now()->format('Y-m-d');
        $timeStr = $data['time'] ?? '09:00';
        $start = Carbon::parse("{$dateStr} {$timeStr}");

        $isFollowup = ($data['consultation_type'] ?? 'new') === 'followup';
        $mode = $data['mode'] ?? 'in_person';
        $doctorId = $data['doctor_id'] ?? '1';

        // Mock doctor names (replace with actual lookup)
        $doctorNames = [
            '1' => 'Dr. Sarah Johnson',
            '2' => 'Dr. Michael Chen',
            '3' => 'Dr. Priya Sharma',
        ];
        $doctorName = $doctorNames[$doctorId] ?? 'Doctor';

        $consultationType = $isFollowup ? 'Follow-up Consultation' : 'New Consultation';
        $modeText = $mode === 'video' ? 'Video Consultation' : 'In-Person Visit';

        $description = implode("\n", [
            "Type: {$consultationType}",
            "Mode: {$modeText}",
            "",
            $mode === 'video'
                ? "Video link will be sent 30 minutes before the appointment."
                : "Please arrive 10 minutes early.",
            "",
            "Contact: support@formulahospital.com",
        ]);

        $location = $mode === 'video'
            ? 'Video Call (link will be sent via email)'
            : 'Formula Hospital, Koregaon Park';

        return [
            'title' => "Doctor Appointment - {$doctorName}",
            'start' => $start,
            'duration' => 30, // minutes
            'description' => $description,
            'location' => $location,
        ];
    }

    /**
     * Build lab booking event from collected data
     */
    private function buildLabEventFromData(array $data): array
    {
        // Parse date and time
        $dateStr = $data['date'] ?? now()->format('Y-m-d');
        $timeStr = $data['time'] ?? '08:00';
        $start = Carbon::parse("{$dateStr} {$timeStr}");

        $packageId = $data['package_id'] ?? '1';
        $locationId = $data['location_id'] ?? '1';

        // Mock package names
        $packageNames = [
            '1' => 'Basic Health Checkup',
            '2' => 'Comprehensive Health Panel',
            '3' => 'Diabetes Screening',
        ];
        $packageName = $packageNames[$packageId] ?? 'Lab Test';

        // Mock locations
        $locations = [
            '1' => ['type' => 'home', 'name' => 'Home Collection'],
            '2' => ['type' => 'center', 'name' => 'Formula Hospital, Koregaon Park'],
        ];
        $locationData = $locations[$locationId] ?? ['type' => 'center', 'name' => 'Lab Center'];

        $description = implode("\n", [
            "Package: {$packageName}",
            "Collection: " . ($locationData['type'] === 'home' ? 'Home Collection' : 'Visit Center'),
            "",
            "Preparation:",
            "- Fasting required 12 hours before",
            "- Morning appointment recommended",
            "",
            "Contact: support@formulahospital.com",
        ]);

        $location = $locationData['name'];

        return [
            'title' => "Lab Test - {$packageName}",
            'start' => $start,
            'duration' => 60, // minutes
            'description' => $description,
            'location' => $location,
        ];
    }

    private function formatGoogleDates(Carbon $start, int $duration): string
    {
        $startFormatted = $start->setTimezone('UTC')->format('Ymd\THis\Z');
        $endFormatted = $start->copy()->addMinutes($duration)->setTimezone('UTC')->format('Ymd\THis\Z');
        return "{$startFormatted}/{$endFormatted}";
    }

    private function escapeIcsText(string $text): string
    {
        return str_replace(
            ["\n", ',', ';', '\\'],
            ['\n', '\,', '\;', '\\\\'],
            $text
        );
    }
}
