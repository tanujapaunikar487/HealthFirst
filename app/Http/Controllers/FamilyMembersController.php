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

        $members = FamilyMember::where('user_id', $user->id)
            ->orderByRaw("CASE WHEN relation = 'self' THEN 0 ELSE 1 END")
            ->orderBy('created_at')
            ->get();

        $healthRecords = HealthRecord::where('user_id', $user->id)->get();

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
                'relation' => $m->relation,
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

        if ($member->user_id !== $user->id) {
            abort(403);
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
                'relation' => $member->relation,
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
            'relation' => 'required|string|in:self,mother,father,brother,sister,spouse,son,daughter,grandmother,grandfather,other',
            'age' => 'nullable|integer|min:0|max:150',
            'gender' => 'nullable|string|in:male,female,other',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        FamilyMember::create([
            'user_id' => $user->id,
            ...$validated,
        ]);

        return redirect()->route('family-members.index')->with('toast', 'Family member added successfully');
    }

    public function update(Request $request, FamilyMember $member)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'relation' => 'required|string|in:self,mother,father,brother,sister,spouse,son,daughter,grandmother,grandfather,other',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|string|in:male,female,other',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'phone' => 'nullable|string|max:20',
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

        $member->update($validated);

        return redirect()->back()->with('toast', 'Profile updated successfully');
    }

    public function destroy(FamilyMember $member)
    {
        if ($member->relation === 'self') {
            return redirect()->route('family-members.index')->with('toast', 'Cannot delete your own profile');
        }

        $member->delete();

        return redirect()->route('family-members.index')->with('toast', 'Family member removed');
    }

}
