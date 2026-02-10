<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'check' => (bool) $user,
            ],
            'notificationUnreadCount' => $user
                ? \App\Models\BillingNotification::where('user_id', $user->id)->whereNull('read_at')->count()
                : 0,
            'allNotifications' => $user
                ? \App\Models\BillingNotification::where('user_id', $user->id)
                    ->with('appointment.doctor')
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(fn ($n) => [
                        'id' => $n->id,
                        'type' => $n->type,
                        'title' => $n->title,
                        'message' => $n->message,
                        'channels' => $n->channels,
                        'read_at' => $n->read_at?->toIso8601String(),
                        'created_at' => $n->created_at->toIso8601String(),
                        'appointment_id' => $n->appointment_id,
                        'insurance_claim_id' => $n->data['insurance_claim_id'] ?? null,
                        'health_record_id' => $n->data['health_record_id'] ?? null,
                        'family_member_id' => $n->data['family_member_id'] ?? null,
                        'insurance_policy_id' => $n->data['insurance_policy_id'] ?? null,
                        'doctor' => $n->appointment && $n->appointment->doctor ? [
                            'name' => $n->appointment->doctor->name,
                            'avatar_url' => $n->appointment->doctor->avatar_url,
                        ] : null,
                    ])
                : [],
            'profileWarnings' => $user ? $this->getProfileWarnings($user) : [],
            'toast' => fn () => $request->session()->get('toast'),
            'userPreferences' => $user ? $user->getSetting('preferences', [
                'language' => 'en',
                'date_format' => 'DD Mon YYYY',
                'time_format' => '12h',
                'accessibility' => ['text_size' => 14, 'high_contrast' => false],
            ]) : null,
            'bookingDefaults' => $user ? $user->getSetting('booking_defaults', [
                'default_patient_id' => null,
                'default_consultation_mode' => null,
                'default_lab_collection_method' => null,
            ]) : null,
        ];
    }

    private function getProfileWarnings($user): array
    {
        $warnings = [];
        $selfMember = \App\Models\FamilyMember::where('user_id', $user->id)
            ->where('relation', 'self')
            ->first();

        if (! \App\Models\InsurancePolicy::where('user_id', $user->id)->where('is_active', true)->exists()) {
            $warnings[] = [
                'key' => 'insurance',
                'label' => 'insurance details',
                'href' => '/insurance',
            ];
        }

        if (! $selfMember || ! $selfMember->blood_group) {
            $warnings[] = [
                'key' => 'blood_group',
                'label' => 'blood type',
                'href' => '/family-members/'.($selfMember?->id ?? ''),
            ];
        }

        if (! $selfMember || ! $selfMember->emergency_contact_name || ! $selfMember->emergency_contact_phone) {
            $warnings[] = [
                'key' => 'emergency_contact',
                'label' => 'emergency contact',
                'href' => '/settings',
            ];
        }

        return $warnings;
    }
}
