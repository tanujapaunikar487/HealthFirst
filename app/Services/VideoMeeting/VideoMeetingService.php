<?php

namespace App\Services\VideoMeeting;

use App\Models\Appointment;
use App\Services\VideoMeeting\Providers\GoogleMeetProvider;
use App\Services\VideoMeeting\Providers\ZoomProvider;
use App\Services\VideoMeeting\Providers\VideoProviderInterface;

class VideoMeetingService
{
    private GoogleMeetProvider $googleMeetProvider;
    private ZoomProvider $zoomProvider;

    public function __construct(
        GoogleMeetProvider $googleMeetProvider,
        ZoomProvider $zoomProvider
    ) {
        $this->googleMeetProvider = $googleMeetProvider;
        $this->zoomProvider = $zoomProvider;
    }

    public function generateMeetingLink(Appointment $appointment): ?string
    {
        $user = $appointment->user;
        $settings = $user->getSetting('video_conferencing', [
            'provider' => 'google_meet',
        ]);

        $provider = $this->getProvider($settings['provider']);

        if (!$provider) {
            return null;
        }

        $meetingData = [
            'title' => "Doctor Appointment - {$appointment->doctor->name}",
            'start_time' => $appointment->appointment_date->format('Y-m-d') . ' ' . $appointment->appointment_time,
            'duration' => 30,
        ];

        return $provider->createMeeting($meetingData);
    }

    private function getProvider(string $providerName): ?VideoProviderInterface
    {
        return match($providerName) {
            'google_meet' => $this->googleMeetProvider,
            'zoom' => $this->zoomProvider,
            default => null,
        };
    }
}
