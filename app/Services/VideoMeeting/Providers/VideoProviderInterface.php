<?php

namespace App\Services\VideoMeeting\Providers;

interface VideoProviderInterface
{
    public function createMeeting(array $data): ?string;
    public function isConfigured(): bool;
}
