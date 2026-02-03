<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\FamilyMember;
use App\Models\HealthRecord;
use App\Models\InsuranceClaim;
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

        // Load appointments for billing alerts
        $overdueAppointments = Appointment::where('user_id', $user->id)
            ->whereIn('family_member_id', $members->pluck('id'))
            ->where('payment_status', 'pending')
            ->where('appointment_date', '<', now()->subDays(7))
            ->get();

        // Load insurance claims for insurance alerts
        $actionableClaims = InsuranceClaim::where('user_id', $user->id)
            ->whereIn('family_member_id', $members->pluck('id'))
            ->whereIn('claim_status', [
                'enhancement_required',
                'partially_approved',
                'disputed',
                'enhancement_rejected'
            ])
            ->get();

        $membersData = $members->map(function (FamilyMember $m) use ($healthRecords, $overdueAppointments, $actionableClaims) {
            // 1. Lab report alerts (include borderline to match Show page detection)
            $labAlertCount = $healthRecords
                ->where('family_member_id', $m->id)
                ->filter(function ($r) {
                    if ($r->category !== 'lab_report') return false;
                    foreach ($r->metadata['results'] ?? [] as $result) {
                        $status = strtolower($result['status'] ?? 'normal');
                        if (in_array($status, ['abnormal', 'high', 'borderline'])) return true;
                    }
                    return false;
                })
                ->count();

            // 2. Billing alerts (overdue payments)
            $billingAlertCount = $overdueAppointments
                ->where('family_member_id', $m->id)
                ->count();

            // 3. Insurance alerts (actionable claims)
            $insuranceAlertCount = $actionableClaims
                ->where('family_member_id', $m->id)
                ->count();

            $alertCount = $labAlertCount + $billingAlertCount + $insuranceAlertCount;

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
        })
        // Sort members with alerts first (alert_count > 0 at top)
        // Maintains original ordering within each group (self first, then by created_at)
        ->sortByDesc('alert_count')
        ->values(); // Re-index the array

        return Inertia::render('FamilyMembers/Index', [
            'members' => $membersData,
            'canCreate' => $members->count() < 12,
            'memberCount' => $members->count(),
            'alertMemberCount' => $membersData->where('alert_count', '>', 0)->count(),
        ]);
    }

    /**
     * Detect all alerts for a family member across health records, billing, and insurance
     */
    private function detectAlerts($user, FamilyMember $member): array
    {
        $alerts = [];

        // 1. Check for abnormal health records (lab reports)
        $abnormalRecords = HealthRecord::where('user_id', $user->id)
            ->where('family_member_id', $member->id)
            ->where('category', 'lab_report')
            ->get()
            ->filter(function ($record) {
                foreach ($record->metadata['results'] ?? [] as $result) {
                    if (in_array(strtolower($result['status'] ?? ''), ['abnormal', 'high', 'borderline'])) {
                        return true;
                    }
                }
                return false;
            });

        foreach ($abnormalRecords as $record) {
            $abnormalParams = [];
            $lastStatus = '';
            foreach ($record->metadata['results'] ?? [] as $result) {
                $status = strtolower($result['status'] ?? 'normal');
                if (in_array($status, ['abnormal', 'high', 'borderline'])) {
                    $abnormalParams[] = $result['parameter'];
                    $lastStatus = ucfirst($status);
                }
            }

            $alerts[] = [
                'type' => 'health_record',
                'category' => 'lab_report',
                'id' => $record->id,
                'title' => $record->title,
                'message' => 'Lab results needs attention',
                'date' => $record->record_date->format('Y-m-d'),
                'details' => implode(', ', $abnormalParams) . ' - ' . $lastStatus,
                'url' => "/health-records?record={$record->id}",
            ];
        }

        // 2. Check for overdue bills
        $overdueBills = Appointment::where('user_id', $user->id)
            ->where('family_member_id', $member->id)
            ->where('payment_status', 'pending')
            ->where('appointment_date', '<', now()->subDays(7))
            ->get();

        foreach ($overdueBills as $bill) {
            $daysOverdue = now()->diffInDays($bill->appointment_date->copy()->addDays(7));

            $alerts[] = [
                'type' => 'billing',
                'id' => $bill->id,
                'title' => $bill->title ?? 'Medical Bill',
                'message' => "Bill overdue by {$daysOverdue} days",
                'date' => $bill->appointment_date->format('Y-m-d'),
                'details' => 'Amount due: ₹' . number_format($bill->fee, 0),
                'url' => "/billing/{$bill->id}",
            ];
        }

        // 3. Check for insurance claims needing action
        $actionableClaimsStatuses = [
            'enhancement_required',
            'partially_approved',
            'disputed',
            'enhancement_rejected'
        ];

        $actionableClaims = InsuranceClaim::where('user_id', $user->id)
            ->where('family_member_id', $member->id)
            ->whereIn('claim_status', $actionableClaimsStatuses)
            ->get();

        foreach ($actionableClaims as $claim) {
            $messageMap = [
                'enhancement_required' => 'Enhancement request needed',
                'partially_approved' => 'Claim partially approved - action needed',
                'disputed' => 'Claim dispute under review',
                'enhancement_rejected' => 'Enhancement request rejected',
            ];

            $alerts[] = [
                'type' => 'insurance',
                'category' => 'claim',
                'id' => $claim->id,
                'title' => $claim->treatment_name ?? 'Insurance Claim',
                'message' => $messageMap[$claim->claim_status] ?? 'Claim requires action',
                'date' => $claim->claim_date->format('Y-m-d'),
                'details' => 'Claim amount: ₹' . number_format($claim->claim_amount, 0),
                'url' => "/insurance/claims/{$claim->id}",
            ];
        }

        // Sort by date (most recent first)
        usort($alerts, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return $alerts;
    }

    /**
     * Mask phone number for display (e.g., +919876543210 → +91****3210)
     */
    private function maskPhone(?string $phone): ?string
    {
        if (!$phone || strlen($phone) < 8) {
            return null;
        }
        // Keep first 3 chars and last 4 chars, mask the middle
        return substr($phone, 0, 3) . '****' . substr($phone, -4);
    }

    /**
     * Mask email for display (e.g., ramesh.kumar@example.com → r***@example.com)
     */
    private function maskEmail(?string $email): ?string
    {
        if (!$email || !str_contains($email, '@')) {
            return null;
        }
        $parts = explode('@', $email);
        $localPart = $parts[0];
        $domain = $parts[1];
        // Keep first character of local part, mask the rest
        return substr($localPart, 0, 1) . '***@' . $domain;
    }

    public function show(FamilyMember $member)
    {
        $user = auth()->user() ?? \App\User::first();

        // Authorization check - belongs to this user
        if ($member->user_id !== $user->id) {
            abort(403, 'Unauthorized access to family member');
        }

        // Detect all alerts (health records, billing, insurance)
        $alerts = $this->detectAlerts($user, $member);

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
            'alerts' => $alerts,
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
            'date_of_birth' => 'nullable|date|before:today',
            'age' => 'nullable|integer|min:0|max:150',
            'gender' => 'nullable|string|in:male,female,other',
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
     * Lookup existing member by phone, email, or patient ID
     */
    public function lookup(Request $request)
    {
        $validated = $request->validate([
            'search_type' => 'required|in:phone,patient_id,email',
            'search_value' => 'required|string',
        ]);

        $user = auth()->user() ?? \App\User::first();

        // Search for family member based on search type
        $query = FamilyMember::query();

        if ($validated['search_type'] === 'phone') {
            $query->where('phone', $validated['search_value']);
        } elseif ($validated['search_type'] === 'email') {
            $query->where('email', $validated['search_value']);
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
                // Masked contact info for secure display
                'masked_phone' => $this->maskPhone($member->phone),
                'masked_email' => $this->maskEmail($member->email),
                // Flags for available contact methods
                'has_phone' => !empty($member->phone),
                'has_email' => !empty($member->email),
            ],
            'already_linked' => $alreadyLinked,
        ]);
    }

    /**
     * Send OTP for verification (phone or email)
     * SECURITY: OTP is sent ONLY to the member's registered contact info from database
     * User cannot specify a different contact - this prevents linking someone else's record
     */
    public function sendOtp(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|integer|exists:family_members,id',
            'contact_method' => 'required|in:phone,email',
        ]);

        $otpService = app(\App\Services\OtpService::class);
        $member = FamilyMember::findOrFail($validated['member_id']);
        $contactMethod = $validated['contact_method'];

        // Get the contact value from MEMBER'S record (not user input)
        $contactValue = $contactMethod === 'phone' ? $member->phone : $member->email;

        if (!$contactValue) {
            return response()->json([
                'otp_sent' => false,
                'error' => $contactMethod === 'phone'
                    ? 'No phone number on record for this patient'
                    : 'No email address on record for this patient',
            ], 400);
        }

        // Check if attempts are within limit
        if (!$otpService->checkAttempts($contactMethod, $contactValue)) {
            return response()->json([
                'otp_sent' => false,
                'error' => 'Too many attempts. Please try again after 15 minutes.',
                'locked_out' => true,
                'attempts_remaining' => 0,
            ], 429);
        }

        // Generate and send OTP based on contact method
        if ($contactMethod === 'email') {
            $otp = $otpService->generateForEmail($contactValue);
            $sent = $otpService->sendEmail($contactValue, $otp);
        } else {
            $otp = $otpService->generate($contactValue);
            $sent = $otpService->send($contactValue, $otp);
        }

        if (!$sent) {
            return response()->json([
                'otp_sent' => false,
                'error' => 'Failed to send OTP. Please try again.',
                'method_used' => $contactMethod,
            ], 500);
        }

        // Record the attempt
        $otpService->recordAttempt($contactMethod, $contactValue);

        // Return masked contact info to show where OTP was sent
        $maskedContact = $contactMethod === 'phone'
            ? $this->maskPhone($contactValue)
            : $this->maskEmail($contactValue);

        return response()->json([
            'otp_sent' => true,
            'sent_to' => $maskedContact,  // Show masked contact where OTP was sent
            'method_used' => $contactMethod,
            'expires_at' => now()->addMinutes(5)->toIso8601String(),
            'attempts_remaining' => $otpService->getAttemptsRemaining($contactMethod, $contactValue),
        ]);
    }

    /**
     * Verify OTP (phone or email)
     * SECURITY: Uses member_id to look up the contact info from database
     */
    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|integer|exists:family_members,id',
            'contact_method' => 'required|in:phone,email',
            'otp' => 'required|string|size:6',
        ]);

        $otpService = app(\App\Services\OtpService::class);
        $member = FamilyMember::findOrFail($validated['member_id']);
        $contactMethod = $validated['contact_method'];
        $otp = $validated['otp'];

        // Get contact value from MEMBER'S record (not user input)
        $contactValue = $contactMethod === 'phone' ? $member->phone : $member->email;

        if (!$contactValue) {
            return response()->json([
                'verified' => false,
                'verification_token' => null,
                'error' => 'No contact information on record',
            ], 400);
        }

        // Verify OTP based on contact type
        $verified = $contactMethod === 'email'
            ? $otpService->verifyEmail($contactValue, $otp)
            : $otpService->verify($contactValue, $otp);

        if (!$verified) {
            return response()->json([
                'verified' => false,
                'verification_token' => null,
                'error' => 'Invalid or expired OTP. Please try again.',
            ], 400);
        }

        // Clear attempts on successful verification
        $otpService->clearAttempts($contactMethod, $contactValue);

        // Generate verification token
        $token = $contactMethod === 'email'
            ? $otpService->generateVerificationTokenForEmail($contactValue)
            : $otpService->generateVerificationToken($contactValue);

        return response()->json([
            'verified' => true,
            'verification_token' => $token,
            'contact_method' => $contactMethod,
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
