<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\FamilyMember;
use App\Models\HealthRecord;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FamilyMembersController extends Controller
{
    public function index()
    {
        $user = auth()->user() ?? \App\User::first();

        // Simple hasMany relationship
        $members = $user->familyMembers()
            ->orderByRaw("CASE WHEN relation = 'self' THEN 0 ELSE 1 END") // Self first
            ->orderBy('created_at')
            ->get();

        $healthRecords = HealthRecord::where('user_id', $user->id)
            ->whereIn('family_member_id', $members->pluck('id'))
            ->get();

        $membersData = $members->map(function (FamilyMember $m) use ($healthRecords) {
            $alertCount = $healthRecords
                ->where('family_member_id', $m->id)
                ->filter(function ($r) {
                    if ($r->category !== 'lab_report') return false;
                    foreach ($r->metadata['results'] ?? [] as $result) {
                        $status = strtolower($result['status'] ?? 'normal');
                        if (in_array($status, ['abnormal', 'high'])) return true;
                    }
                    return false;
                })
                ->count();

            return [
                'id' => $m->id,
                'name' => $m->name,
                'relation' => $m->relation, // Direct column
                'age' => $m->age,
                'gender' => $m->gender,
                'blood_group' => $m->blood_group,
                'avatar_url' => $m->avatar_url,
                'alert_count' => $alertCount,
            ];
        });

        return Inertia::render('FamilyMembers/Index', [
            'members' => $membersData,
            'canCreate' => $members->count() < 10,
            'alertMemberCount' => $membersData->where('alert_count', '>', 0)->count(),
        ]);
    }

    public function show(FamilyMember $member)
    {
        $user = auth()->user() ?? \App\User::first();

        // Authorization check - belongs to this user
        if ($member->user_id !== $user->id) {
            abort(403, 'Unauthorized access to family member');
        }

        $hasAlerts = HealthRecord::where('user_id', $user->id)
            ->where('family_member_id', $member->id)
            ->where('category', 'lab_report')
            ->get()
            ->contains(function ($r) {
                foreach ($r->metadata['results'] ?? [] as $result) {
                    if (in_array(strtolower($result['status'] ?? ''), ['abnormal', 'high'])) {
                        return true;
                    }
                }
                return false;
            });

        $doctors = Doctor::where('is_active', true)
            ->select('id', 'name', 'specialization')
            ->orderBy('name')
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'name' => 'Dr. ' . $d->name,
                'specialization' => $d->specialization,
            ]);

        return Inertia::render('FamilyMembers/Show', [
            'member' => [
                'id' => $member->id,
                'patient_id' => $member->patient_id,
                'name' => $member->name,
                'relation' => $member->relation, // Direct column
                'is_guest' => $member->is_guest,
                'age' => $member->computed_age,
                'date_of_birth' => $member->date_of_birth?->format('Y-m-d'),
                'date_of_birth_formatted' => $member->date_of_birth?->format('d/m/Y'),
                'gender' => $member->gender,
                'blood_group' => $member->blood_group,
                'phone' => $member->phone,
                'full_address' => $member->full_address,
                'address_line_1' => $member->address_line_1,
                'address_line_2' => $member->address_line_2,
                'city' => $member->city,
                'state' => $member->state,
                'pincode' => $member->pincode,
                'primary_doctor_id' => $member->primary_doctor_id,
                'primary_doctor_name' => $member->primaryDoctor
                    ? 'Dr. ' . $member->primaryDoctor->name
                    : null,
                'medical_conditions' => $member->medical_conditions ?? [],
                'allergies' => $member->allergies ?? [],
                'emergency_contact_name' => $member->emergency_contact_name,
                'emergency_contact_relation' => $member->emergency_contact_relation,
                'emergency_contact_phone' => $member->emergency_contact_phone,
                'avatar_url' => $member->avatar_url,
            ],
            'doctors' => $doctors,
            'hasAlerts' => $hasAlerts,
            'alertType' => 'Lab results',
            'canDelete' => $member->relation !== 'self',
        ]);
    }

    public function create()
    {
        return redirect()->route('family-members.index', ['create' => 1]);
    }

    public function store(Request $request)
    {
        $user = auth()->user() ?? \App\User::first();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'relation' => 'required|string|in:self,mother,father,brother,sister,spouse,son,daughter,grandmother,grandfather,other,guest',
            'phone' => 'required|string|regex:/^\+91[6-9]\d{9}$/',
            'age' => 'required|integer|min:0|max:150',
            'gender' => 'required|string|in:male,female,other',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        // Add user_id to the validated data
        $validated['user_id'] = $user->id;

        // Create family member with user_id and relation
        $member = FamilyMember::create($validated);

        return redirect()->route('family-members.index')->with('toast', 'Family member added successfully');
    }

    /**
     * Create a new family member (AJAX endpoint, returns JSON)
     * Used by the booking chat flow for adding new family members without OTP verification
     */
    public function createNew(Request $request)
    {
        $user = auth()->user() ?? \App\User::first();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'relation' => 'required|string|in:mother,father,brother,sister,spouse,son,daughter,grandmother,grandfather,other',
            'phone' => 'required|string|regex:/^\+91[6-9]\d{9}$/',
            'age' => 'nullable|integer|min:0|max:150',
            'gender' => 'nullable|string|in:male,female,other',
            'email' => 'nullable|email|max:255',
            'date_of_birth' => 'nullable|date|before:today',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        // Check if phone number already exists
        $existingMember = FamilyMember::where('phone', $validated['phone'])->first();

        if ($existingMember) {
            // Check if already linked to this user
            if ($existingMember->user_id === $user->id) {
                return response()->json([
                    'success' => false,
                    'error' => 'This phone number is already registered to one of your family members.',
                    'already_linked' => true,
                ], 422);
            }

            // Member exists but linked to different user - suggest linking instead
            return response()->json([
                'success' => false,
                'error' => 'A patient record with this phone number already exists. Please use "Link Existing Patient" to connect it to your account.',
                'should_link' => true,
                'existing_member' => [
                    'name' => $existingMember->name,
                    'age' => $existingMember->computed_age,
                    'gender' => $existingMember->gender,
                    'patient_id' => $existingMember->patient_id,
                ],
            ], 422);
        }

        // Add user_id to the validated data
        $validated['user_id'] = $user->id;

        try {
            // Create family member with user_id and relation
            $member = FamilyMember::create($validated);

            return response()->json([
                'success' => true,
                'member_data' => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'relation' => $member->relation,
                    'age' => $member->computed_age,
                    'gender' => $member->gender,
                    'patient_id' => $member->patient_id,
                    'avatar_url' => $member->avatar_url,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create family member', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'validated_data' => $validated,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to create family member. Please try again.',
                'debug' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(Request $request, FamilyMember $member)
    {
        $user = auth()->user() ?? \App\User::first();

        // Authorization check
        if ($member->user_id !== $user->id) {
            abort(403, 'Unauthorized access to family member');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'relation' => 'required|string|in:self,mother,father,brother,sister,spouse,son,daughter,grandmother,grandfather,other',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|string|in:male,female,other',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:10',
            'primary_doctor_id' => 'nullable|integer|exists:doctors,id',
            'medical_conditions' => 'nullable|array',
            'medical_conditions.*' => 'string|max:100',
            'allergies' => 'nullable|array',
            'allergies.*' => 'string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_relation' => 'nullable|string|max:100',
            'emergency_contact_phone' => 'nullable|string|max:20',
        ]);

        // Compute age from DOB for backward compatibility
        if (!empty($validated['date_of_birth'])) {
            $validated['age'] = Carbon::parse($validated['date_of_birth'])->age;
        }

        // Update the FamilyMember record
        $member->update($validated);

        return redirect()->back()->with('toast', 'Profile updated successfully');
    }

    public function destroy(FamilyMember $member)
    {
        $user = auth()->user() ?? \App\User::first();

        // Authorization check
        if ($member->user_id !== $user->id) {
            abort(403, 'Unauthorized access to family member');
        }

        if ($member->relation === 'self') {
            return redirect()->route('family-members.index')->with('toast', 'Cannot delete your own profile');
        }

        // Delete the member
        $member->delete();

        return redirect()->route('family-members.index')->with('toast', 'Family member removed');
    }

    /**
     * Upgrade guest to full family member
     */
    public function upgrade(FamilyMember $member)
    {
        $user = auth()->user() ?? \App\User::first();

        // Authorization check
        if ($member->user_id !== $user->id) {
            abort(403, 'Unauthorized access to family member');
        }

        // Only guests can be upgraded
        if (!$member->is_guest) {
            return redirect()->back()->with('toast', 'This member is already a full family member');
        }

        // Upgrade the guest to family member
        $member->update([
            'is_guest' => false,
        ]);

        return redirect()->back()->with('toast', 'Successfully upgraded to family member');
    }

    /**
     * Lookup existing member by phone or patient ID
     */
    public function lookup(Request $request)
    {
        $validated = $request->validate([
            'search_type' => 'required|in:phone,patient_id',
            'search_value' => 'required|string',
        ]);

        $user = auth()->user() ?? \App\User::first();

        // Search for family member based on search type
        $query = FamilyMember::query();

        if ($validated['search_type'] === 'phone') {
            $query->where('phone', $validated['search_value']);
        } else {
            $query->where('patient_id', $validated['search_value']);
        }

        $member = $query->first();

        if (!$member) {
            return response()->json([
                'found' => false,
                'member_data' => null,
                'already_linked' => false,
            ]);
        }

        // Check if already linked to current user
        $alreadyLinked = ($member->user_id === $user->id);

        return response()->json([
            'found' => true,
            'member_data' => [
                'id' => $member->id,
                'name' => $member->name,
                'age' => $member->computed_age,
                'gender' => $member->gender,
                'patient_id' => $member->patient_id,
                'phone' => $member->phone,
                'verified_phone' => $member->verified_phone,
            ],
            'already_linked' => $alreadyLinked,
        ]);
    }

    /**
     * Send OTP for verification (phone or email)
     */
    public function sendOtp(Request $request)
    {
        $validated = $request->validate([
            'contact_type' => 'required|in:phone,email',
            'contact_value' => 'required|string',
            'purpose' => 'required|in:link_member,verify_new',
        ]);

        $otpService = app(\App\Services\OtpService::class);
        $contactType = $validated['contact_type'];
        $contactValue = $validated['contact_value'];

        // Check if attempts are within limit
        if (!$otpService->checkAttempts($contactType, $contactValue)) {
            return response()->json([
                'otp_sent' => false,
                'error' => 'Too many attempts. Please try again after 15 minutes.',
                'locked_out' => true,
                'attempts_remaining' => 0,
            ], 429);
        }

        // Generate and send OTP based on contact type
        if ($contactType === 'email') {
            // Validate email format
            if (!filter_var($contactValue, FILTER_VALIDATE_EMAIL)) {
                return response()->json([
                    'otp_sent' => false,
                    'error' => 'Invalid email format',
                ], 400);
            }

            $otp = $otpService->generateForEmail($contactValue);
            $sent = $otpService->sendEmail($contactValue, $otp);
        } else {
            // Validate phone format
            if (!preg_match('/^\+?[1-9]\d{1,14}$/', $contactValue)) {
                return response()->json([
                    'otp_sent' => false,
                    'error' => 'Invalid phone format',
                ], 400);
            }

            $otp = $otpService->generate($contactValue);
            $sent = $otpService->send($contactValue, $otp);
        }

        if (!$sent) {
            return response()->json([
                'otp_sent' => false,
                'error' => 'Failed to send OTP. Please try again.',
                'method_used' => $contactType,
            ], 500);
        }

        // Record the attempt
        $otpService->recordAttempt($contactType, $contactValue);

        return response()->json([
            'otp_sent' => true,
            'expires_at' => now()->addMinutes(5)->toIso8601String(),
            'method_used' => $contactType,
            'attempts_remaining' => $otpService->getAttemptsRemaining($contactType, $contactValue),
        ]);
    }

    /**
     * Verify OTP (phone or email)
     */
    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'contact_type' => 'required|in:phone,email',
            'contact_value' => 'required|string',
            'otp' => 'required|string|size:6',
        ]);

        $otpService = app(\App\Services\OtpService::class);
        $contactType = $validated['contact_type'];
        $contactValue = $validated['contact_value'];
        $otp = $validated['otp'];

        // Verify OTP based on contact type
        $verified = $contactType === 'email'
            ? $otpService->verifyEmail($contactValue, $otp)
            : $otpService->verify($contactValue, $otp);

        if (!$verified) {
            return response()->json([
                'verified' => false,
                'verification_token' => null,
                'error' => 'Invalid or expired OTP',
            ], 400);
        }

        // Clear attempts on successful verification
        $otpService->clearAttempts($contactType, $contactValue);

        // Generate verification token
        $token = $contactType === 'email'
            ? $otpService->generateVerificationTokenForEmail($contactValue)
            : $otpService->generateVerificationToken($contactValue);

        return response()->json([
            'verified' => true,
            'verification_token' => $token,
            'contact_type' => $contactType,
        ]);
    }

    /**
     * Link existing member to current user
     */
    public function linkMember(Request $request)
    {
        $validated = $request->validate([
            'family_member_id' => 'required|integer|exists:family_members,id',
            'relation_to_user' => 'required|string|in:self,mother,father,brother,sister,spouse,son,daughter,grandmother,grandfather,other',
            'verification_token' => 'required|string',
        ]);

        $user = auth()->user() ?? \App\User::first();
        $otpService = app(\App\Services\OtpService::class);

        // Verify token validity
        $verificationData = $otpService->verifyToken($validated['verification_token']);

        if (!$verificationData) {
            return response()->json([
                'linked' => false,
                'member_data' => null,
                'error' => 'Invalid or expired verification token',
            ], 400);
        }

        $member = FamilyMember::findOrFail($validated['family_member_id']);

        // Verify the contact info matches
        $contactType = $verificationData['type'];
        $contactValue = $verificationData['value'];

        if ($contactType === 'phone' && $member->phone !== $contactValue) {
            return response()->json([
                'linked' => false,
                'member_data' => null,
                'error' => 'Phone verification mismatch',
            ], 400);
        }

        if ($contactType === 'email' && $member->email !== $contactValue) {
            return response()->json([
                'linked' => false,
                'member_data' => null,
                'error' => 'Email verification mismatch',
            ], 400);
        }

        // Check if already linked
        if ($member->user_id === $user->id) {
            return response()->json([
                'linked' => false,
                'member_data' => null,
                'error' => 'Member already linked to your account',
            ], 400);
        }

        // Update member - link to current user
        $updateData = [
            'user_id' => $user->id,
            'relation' => $validated['relation_to_user'],
            'linked_at' => now(),
        ];

        // Set verified contact info
        if ($contactType === 'phone') {
            $updateData['verified_phone'] = $contactValue;
        } else {
            $updateData['verified_email'] = $contactValue;
        }

        $member->update($updateData);

        return response()->json([
            'linked' => true,
            'member_data' => [
                'id' => $member->id,
                'name' => $member->name,
                'relation' => $member->relation,
                'age' => $member->computed_age,
                'gender' => $member->gender,
                'patient_id' => $member->patient_id,
                'avatar_url' => $member->avatar_url,
            ],
        ]);
    }
}
