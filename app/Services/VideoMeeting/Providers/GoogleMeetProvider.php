<?php

namespace App\Services\VideoMeeting\Providers;

class GoogleMeetProvider implements VideoProviderInterface
{
    public function createMeeting(array $data): ?string
    {
        // Mock mode - generate valid-looking Google Meet URL
        // Real implementation would use Google Calendar API
        return 'https://meet.google.com/' . substr(md5(uniqid()), 0, 12);
    }

    public function isConfigured(): bool
    {
        return !empty(config('services.google.calendar_token'));
    }
}
