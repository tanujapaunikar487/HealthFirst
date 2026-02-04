<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateNotificationsRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Doctor;
use App\Models\FamilyMember;
use App\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingsController extends Controller
{
    /**
     * Display the settings page with all user settings.
     */
    public function index(): Response
    {
        $user = Auth::user() ?? User::first();

        // Get the self family member record for health data
        $selfMember = FamilyMember::where('user_id', $user->id)
            ->where('relation', 'self')
            ->first();

        return Inertia::render('Settings/Index', [
            'user' => array_merge($user->toArray(), [
                'avatar_url' => $user->avatar_url,
                // Include health data from self family member
                'blood_group' => $selfMember?->blood_group,
                'primary_doctor_id' => $selfMember?->primary_doctor_id,
                'medical_conditions' => $selfMember?->medical_conditions ?? [],
                'allergies' => $selfMember?->allergies ?? [],
            ]),
            'familyMembers' => $user->familyMembers()
                ->select('id', 'name', 'relation', 'phone')
                ->get(),
            'doctors' => Doctor::select('id', 'name', 'specialization')
                ->orderBy('name')
                ->get(),
            'notifications' => $user->getSetting('notifications', [
                'channels' => ['email' => true, 'sms' => false, 'whatsapp' => false],
                'categories' => [
                    'appointments' => true,
                    'health_alerts' => true,
                    'billing' => true,
                    'insurance' => true,
                    'promotions' => false,
                ],
                'health_alerts' => [
                    'lab_results' => true,
                    'medication_reminders' => true,
                    'doctor_messages' => true,
                ],
            ]),
            'preferences' => $user->getSetting('preferences', [
                'language' => 'en',
                'date_format' => 'DD/MM/YYYY',
                'time_format' => '12h',
                'accessibility' => ['text_size' => 16, 'high_contrast' => false],
            ]),
            'bookingDefaults' => $user->getSetting('booking_defaults', [
                'default_patient_id' => null,
                'default_consultation_mode' => null,
                'default_lab_collection_method' => null,
            ]),
            'videoSettings' => $user->getSetting('video_conferencing', [
                'provider' => 'google_meet',
                'google_meet' => ['enabled' => true],
                'zoom' => ['enabled' => false],
            ]),
            'calendarSettings' => $user->getSetting('calendar_sync', [
                'google' => ['enabled' => false],
                'apple' => ['enabled' => false],
            ]),
        ]);
    }

    /**
     * Update user profile (personal info, address, emergency contact).
     */
    public function updateProfile(UpdateProfileRequest $request): RedirectResponse
    {
        $user = Auth::user() ?? User::first();
        $validated = $request->validated();

        // Clear emergency contact fields based on type
        if ($validated['emergency_contact_type'] === 'family_member') {
            $validated['emergency_contact_name'] = null;
            $validated['emergency_contact_phone'] = null;
            $validated['emergency_contact_relation'] = null;
        } elseif ($validated['emergency_contact_type'] === 'custom') {
            $validated['emergency_contact_member_id'] = null;
        }

        // Extract health-specific fields for family member sync
        $healthFields = [
            'blood_group' => $validated['blood_group'] ?? null,
            'primary_doctor_id' => $validated['primary_doctor_id'] ?? null,
            'medical_conditions' => $validated['medical_conditions'] ?? null,
            'allergies' => $validated['allergies'] ?? null,
        ];

        // Remove health fields from user update (they go to FamilyMember)
        unset($validated['blood_group'], $validated['primary_doctor_id'], $validated['medical_conditions'], $validated['allergies']);

        $user->update($validated);

        // Sync health data to self family member record
        $selfMember = FamilyMember::where('user_id', $user->id)
            ->where('relation', 'self')
            ->first();

        if ($selfMember) {
            $selfMember->update(array_merge($healthFields, [
                'name' => $validated['name'],
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address_line_1' => $validated['address_line_1'] ?? null,
                'address_line_2' => $validated['address_line_2'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'pincode' => $validated['pincode'] ?? null,
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'emergency_contact_relation' => $validated['emergency_contact_relation'] ?? null,
            ]));
        } else {
            // Create self family member if it doesn't exist
            FamilyMember::create(array_merge($healthFields, [
                'user_id' => $user->id,
                'relation' => 'self',
                'name' => $validated['name'],
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address_line_1' => $validated['address_line_1'] ?? null,
                'address_line_2' => $validated['address_line_2'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'pincode' => $validated['pincode'] ?? null,
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'emergency_contact_relation' => $validated['emergency_contact_relation'] ?? null,
            ]));
        }

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Upload user avatar.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,webp|max:5120', // 5MB
        ]);

        $user = Auth::user() ?? User::first();

        // Delete old avatar if exists
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update(['avatar_path' => $path]);

        return response()->json([
            'success' => true,
            'avatar_url' => Storage::url($path),
        ]);
    }

    /**
     * Delete user avatar.
     */
    public function deleteAvatar(): JsonResponse
    {
        $user = Auth::user() ?? User::first();

        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->update(['avatar_path' => null]);

        return response()->json(['success' => true]);
    }

    /**
     * Update notification preferences.
     */
    public function updateNotifications(UpdateNotificationsRequest $request): RedirectResponse
    {
        $user = Auth::user() ?? User::first();

        $user->setSetting('notifications', $request->validated());

        return back()->with('success', 'Notification preferences updated.');
    }

    /**
     * Update user preferences (language, format, accessibility).
     */
    public function updatePreferences(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'language' => 'required|string|in:en,hi,mr',
            'date_format' => 'required|string|in:DD/MM/YYYY,MM/DD/YYYY,YYYY-MM-DD',
            'time_format' => 'required|string|in:12h,24h',
            'accessibility' => 'required|array',
            'accessibility.text_size' => 'required|integer|min:14|max:24',
            'accessibility.high_contrast' => 'required|boolean',
        ]);

        $user = Auth::user() ?? User::first();
        $user->setSetting('preferences', $validated);

        return back()->with('success', 'Preferences updated successfully.');
    }

    /**
     * Update booking defaults.
     */
    public function updateBookingDefaults(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'default_patient_id' => 'nullable|string',
            'default_consultation_mode' => 'nullable|string|in:video,in_person',
            'default_lab_collection_method' => 'nullable|string|in:home,center',
        ]);

        $user = Auth::user() ?? User::first();
        $user->setSetting('booking_defaults', $validated);

        return back()->with('success', 'Booking defaults updated.');
    }

    /**
     * Update video conferencing settings.
     */
    public function updateVideoSettings(Request $request): RedirectResponse
    {
        $user = Auth::user() ?? User::first();

        $validated = $request->validate([
            'provider' => 'required|in:google_meet,zoom',
        ]);

        $currentSettings = $user->getSetting('video_conferencing', [
            'provider' => 'google_meet',
            'google_meet' => ['enabled' => true],
            'zoom' => ['enabled' => false],
        ]);

        $currentSettings['provider'] = $validated['provider'];

        $user->setSetting('video_conferencing', $currentSettings);

        return back()->with('success', 'Video provider updated successfully.');
    }

    /**
     * Disconnect Google Meet.
     */
    public function disconnectGoogleMeet(): RedirectResponse
    {
        $user = Auth::user() ?? User::first();
        $settings = $user->getSetting('video_conferencing', [
            'provider' => 'google_meet',
            'google_meet' => ['enabled' => true],
            'zoom' => ['enabled' => false],
        ]);

        $settings['google_meet'] = ['enabled' => false];

        // If Google Meet was the active provider, switch to Zoom
        if ($settings['provider'] === 'google_meet') {
            $settings['provider'] = 'zoom';
            $settings['zoom'] = ['enabled' => true];
        }

        $user->setSetting('video_conferencing', $settings);

        return back()->with('success', 'Google Meet disconnected.');
    }

    /**
     * Disconnect Zoom.
     */
    public function disconnectZoom(): RedirectResponse
    {
        $user = Auth::user() ?? User::first();
        $settings = $user->getSetting('video_conferencing', [
            'provider' => 'google_meet',
            'google_meet' => ['enabled' => true],
            'zoom' => ['enabled' => false],
        ]);

        $settings['zoom'] = ['enabled' => false];

        // If Zoom was the active provider, switch to Google Meet
        if ($settings['provider'] === 'zoom') {
            $settings['provider'] = 'google_meet';
            $settings['google_meet'] = ['enabled' => true];
        }

        $user->setSetting('video_conferencing', $settings);

        return back()->with('success', 'Zoom disconnected.');
    }

    /**
     * Initiate Google Calendar OAuth flow.
     */
    public function initiateGoogleCalendarOAuth(): RedirectResponse
    {
        // For now, return a placeholder - OAuth implementation requires Google API credentials
        return back()->with('info', 'Google Calendar OAuth not yet configured. Please add Google API credentials.');
    }

    /**
     * Handle Google Calendar OAuth callback.
     */
    public function handleGoogleCalendarCallback(Request $request): RedirectResponse
    {
        // Placeholder for OAuth callback handling
        return redirect()->route('settings.index')->with('success', 'Google Calendar connected.');
    }

    /**
     * Disconnect Google Calendar.
     */
    public function disconnectGoogleCalendar(): RedirectResponse
    {
        $user = Auth::user() ?? User::first();
        $currentSettings = $user->getSetting('calendar_sync', []);

        $user->setSetting('calendar_sync', [
            'google' => ['enabled' => false],
            'apple' => $currentSettings['apple'] ?? ['enabled' => false],
        ]);

        return back()->with('success', 'Google Calendar disconnected.');
    }

    /**
     * Generate Apple Calendar .ics export.
     */
    public function generateAppleCalendarExport(): JsonResponse
    {
        $user = Auth::user() ?? User::first();

        $appointments = $user->familyMembers()
            ->with(['appointments' => function ($q) {
                $q->where('appointment_date', '>=', now())->with('doctor');
            }])
            ->get()
            ->pluck('appointments')
            ->flatten();

        // Generate .ics content
        $icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Healthcare Platform//EN\r\nCALSCALE:GREGORIAN\r\n";

        foreach ($appointments as $appointment) {
            if (!$appointment->doctor) continue;

            $startDate = $appointment->appointment_date->format('Ymd\THis');
            $endDate = $appointment->appointment_date->addMinutes(30)->format('Ymd\THis');

            $icsContent .= "BEGIN:VEVENT\r\n";
            $icsContent .= "UID:{$appointment->id}@healthcare.app\r\n";
            $icsContent .= "DTSTART:{$startDate}\r\n";
            $icsContent .= "DTEND:{$endDate}\r\n";
            $icsContent .= "SUMMARY:Appointment with {$appointment->doctor->name}\r\n";
            $icsContent .= "DESCRIPTION:Healthcare appointment\r\n";
            $icsContent .= "END:VEVENT\r\n";
        }

        $icsContent .= "END:VCALENDAR";

        // Store temporarily and return download URL
        $filename = 'appointments-' . now()->format('Y-m-d') . '.ics';
        Storage::disk('public')->put('exports/' . $filename, $icsContent);

        return response()->json([
            'download_url' => Storage::url('exports/' . $filename),
        ]);
    }

    /**
     * Verify current password (Step 1 of password change).
     */
    public function verifyCurrentPassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
        ]);

        $user = Auth::user() ?? User::first();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'valid' => false,
                'message' => 'The current password is incorrect.',
            ], 422);
        }

        return response()->json(['valid' => true]);
    }

    /**
     * Change user password (Step 2 of password change).
     */
    public function changePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = Auth::user() ?? User::first();

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password changed successfully.');
    }

    /**
     * Download all user data as JSON.
     */
    public function downloadMyData(): StreamedResponse
    {
        $user = Auth::user() ?? User::first();

        $data = [
            'profile' => $user->only([
                'name', 'email', 'phone', 'date_of_birth', 'gender',
                'address_line_1', 'address_line_2', 'city', 'state', 'pincode',
                'emergency_contact_type', 'emergency_contact_name',
                'emergency_contact_phone', 'emergency_contact_relation',
            ]),
            'family_members' => $user->familyMembers->map(fn($m) => $m->only([
                'name', 'relation', 'phone', 'email', 'date_of_birth', 'gender',
            ])),
            'appointments' => $user->familyMembers->pluck('appointments')->flatten()->map(fn($a) => [
                'date' => $a->appointment_date?->format('Y-m-d'),
                'time' => $a->appointment_time,
                'doctor' => $a->doctor?->name,
                'status' => $a->status,
            ]),
            'health_records' => $user->healthRecords->map(fn($r) => $r->only([
                'category', 'title', 'date', 'status',
            ])),
            'settings' => $user->settings->pluck('settings', 'category'),
            'exported_at' => now()->toISOString(),
        ];

        $filename = 'healthcare-data-' . now()->format('Y-m-d') . '.json';

        return response()->streamDownload(function () use ($data) {
            echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, $filename, [
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Delete user account.
     */
    public function deleteAccount(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = Auth::user() ?? User::first();

        // Delete avatar if exists
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Your account has been deleted.');
    }
}
