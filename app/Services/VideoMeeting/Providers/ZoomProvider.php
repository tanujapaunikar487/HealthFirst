<?php

namespace App\Services\VideoMeeting\Providers;

class ZoomProvider implements VideoProviderInterface
{
    public function createMeeting(array $data): ?string
    {
        // Mock mode - generate valid-looking Zoom URL
        // Real implementation would use Zoom API
        return 'https://zoom.us/j/' . rand(100000000, 999999999);
    }

    public function isConfigured(): bool
    {
        return !empty(config('services.zoom.client_id'));
    }
}
