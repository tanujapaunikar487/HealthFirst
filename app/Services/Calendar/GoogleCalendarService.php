<?php

namespace App\Services\Calendar;

use App\Models\Appointment;
use App\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleCalendarService
{
    private bool $isMockMode;

    public function __construct()
    {
        $clientId = config('services.google.client_id');
        $this->isMockMode = empty($clientId) || str_contains($clientId, 'placeholder');
    }

    public function isMockMode(): bool
    {
        return $this->isMockMode;
    }

    /**
     * Get the Google OAuth authorization URL.
     */
    public function getAuthUrl(string $state): string
    {
        if ($this->isMockMode) {
            return route('settings.calendar.google.callback', [
                'code' => 'mock_auth_code_'.Str::random(16),
                'state' => $state,
            ]);
        }

        $params = [
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.calendar_redirect'),
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query($params);
    }

    /**
     * Exchange authorization code for access tokens.
     */
    public function exchangeCode(string $code): array
    {
        if ($this->isMockMode) {
            Log::info('[Google Calendar Mock] OAuth code exchanged successfully');

            return [
                'access_token' => 'mock_access_token_'.Str::random(32),
                'refresh_token' => 'mock_refresh_token_'.Str::random(32),
                'expires_in' => 3600,
                'email' => 'demo@gmail.com',
            ];
        }

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => config('services.google.calendar_redirect'),
        ]);

        $data = $response->json();

        // Fetch user email
        $email = null;
        if (isset($data['access_token'])) {
            $userInfo = Http::withToken($data['access_token'])
                ->get('https://www.googleapis.com/oauth2/v2/userinfo');
            $email = $userInfo->json('email');
        }

        return [
            'access_token' => $data['access_token'] ?? null,
            'refresh_token' => $data['refresh_token'] ?? null,
            'expires_in' => $data['expires_in'] ?? 3600,
            'email' => $email,
        ];
    }

    /**
     * Create a Google Calendar event for an appointment.
     */
    public function createEvent(User $user, Appointment $appointment): ?string
    {
        $settings = $user->getSetting('calendar_sync', []);
        if (! ($settings['google']['connected'] ?? false) || ! ($settings['google']['enabled'] ?? false)) {
            return null;
        }

        $eventData = $this->buildEventData($appointment);

        if ($this->isMockMode) {
            $eventId = 'gcal_mock_'.Str::random(16);
            Log::info("[Google Calendar Mock] Created event {$eventId} for appointment {$appointment->id}");

            return $eventId;
        }

        $accessToken = $this->getValidToken($user);
        if (! $accessToken) {
            return null;
        }

        $calendarId = $settings['google']['calendar_id'] ?? 'primary';

        $response = Http::withToken($accessToken)
            ->post("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", [
                'summary' => $eventData['summary'],
                'location' => $eventData['location'],
                'description' => $eventData['description'],
                'start' => [
                    'dateTime' => $eventData['start']->toIso8601String(),
                    'timeZone' => 'Asia/Kolkata',
                ],
                'end' => [
                    'dateTime' => $eventData['start']->copy()->addMinutes($eventData['duration'])->toIso8601String(),
                    'timeZone' => 'Asia/Kolkata',
                ],
                'reminders' => [
                    'useDefault' => false,
                    'overrides' => [
                        ['method' => 'popup', 'minutes' => 60],
                        ['method' => 'popup', 'minutes' => 1440],
                    ],
                ],
            ]);

        return $response->json('id');
    }

    /**
     * Update a Google Calendar event (e.g., on reschedule).
     */
    public function updateEvent(User $user, Appointment $appointment): bool
    {
        if (! $appointment->google_calendar_event_id) {
            return false;
        }

        $settings = $user->getSetting('calendar_sync', []);
        if (! ($settings['google']['connected'] ?? false)) {
            return false;
        }

        $eventData = $this->buildEventData($appointment);

        if ($this->isMockMode) {
            Log::info("[Google Calendar Mock] Updated event {$appointment->google_calendar_event_id} for appointment {$appointment->id}");

            return true;
        }

        $accessToken = $this->getValidToken($user);
        if (! $accessToken) {
            return false;
        }

        $calendarId = $settings['google']['calendar_id'] ?? 'primary';
        $eventId = $appointment->google_calendar_event_id;

        $response = Http::withToken($accessToken)
            ->patch("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events/{$eventId}", [
                'summary' => $eventData['summary'],
                'location' => $eventData['location'],
                'description' => $eventData['description'],
                'start' => [
                    'dateTime' => $eventData['start']->toIso8601String(),
                    'timeZone' => 'Asia/Kolkata',
                ],
                'end' => [
                    'dateTime' => $eventData['start']->copy()->addMinutes($eventData['duration'])->toIso8601String(),
                    'timeZone' => 'Asia/Kolkata',
                ],
            ]);

        return $response->successful();
    }

    /**
     * Delete a Google Calendar event (e.g., on cancellation).
     */
    public function deleteEvent(User $user, Appointment $appointment): bool
    {
        if (! $appointment->google_calendar_event_id) {
            return false;
        }

        $settings = $user->getSetting('calendar_sync', []);
        if (! ($settings['google']['connected'] ?? false)) {
            return false;
        }

        if ($this->isMockMode) {
            Log::info("[Google Calendar Mock] Deleted event {$appointment->google_calendar_event_id} for appointment {$appointment->id}");

            return true;
        }

        $accessToken = $this->getValidToken($user);
        if (! $accessToken) {
            return false;
        }

        $calendarId = $settings['google']['calendar_id'] ?? 'primary';
        $eventId = $appointment->google_calendar_event_id;

        $response = Http::withToken($accessToken)
            ->delete("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events/{$eventId}");

        return $response->successful();
    }

    /**
     * Build privacy-safe event data from an appointment.
     */
    private function buildEventData(Appointment $appointment): array
    {
        $appointment->loadMissing(['doctor', 'labPackage']);

        $isDoctor = $appointment->appointment_type === 'doctor';

        $summary = $isDoctor
            ? 'Doctor Appointment'.($appointment->doctor ? " - {$appointment->doctor->name}" : '')
            : 'Lab Test'.($appointment->labPackage ? " - {$appointment->labPackage->name}" : '');

        $mode = $appointment->consultation_mode;
        $location = $mode === 'video'
            ? 'Video Call (link in app)'
            : 'Formula Hospital, Koregaon Park';

        $description = "Healthcare appointment booked via Formula Hospital.\nManage your appointments at: ".url('/appointments');

        $start = Carbon::parse(
            $appointment->appointment_date->format('Y-m-d').' '.$appointment->appointment_time
        );

        return [
            'summary' => $summary,
            'location' => $location,
            'description' => $description,
            'start' => $start,
            'duration' => $isDoctor ? 30 : 60,
        ];
    }

    /**
     * Get a valid access token, refreshing if needed.
     */
    private function getValidToken(User $user): ?string
    {
        $settings = $user->getSetting('calendar_sync', []);
        $google = $settings['google'] ?? [];

        $expiresAt = isset($google['token_expires_at'])
            ? Carbon::parse($google['token_expires_at'])
            : null;

        // Token still valid (with 5-minute buffer)
        if ($expiresAt && $expiresAt->gt(now()->addMinutes(5))) {
            return $google['access_token'] ?? null;
        }

        // Need to refresh
        $refreshToken = $google['refresh_token'] ?? null;
        if (! $refreshToken) {
            Log::warning("[Google Calendar] No refresh token for user {$user->id}");

            return null;
        }

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ]);

        if (! $response->successful()) {
            Log::warning("[Google Calendar] Token refresh failed for user {$user->id}");
            // Mark as disconnected
            $settings['google']['connected'] = false;
            $user->setSetting('calendar_sync', $settings);

            return null;
        }

        $data = $response->json();

        // Update stored tokens
        $settings['google']['access_token'] = $data['access_token'];
        $settings['google']['token_expires_at'] = now()->addSeconds($data['expires_in'] ?? 3600)->toIso8601String();
        $user->setSetting('calendar_sync', $settings);

        return $data['access_token'];
    }
}
