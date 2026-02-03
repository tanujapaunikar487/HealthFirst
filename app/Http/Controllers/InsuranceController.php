<?php

namespace App\Http\Controllers;

use App\Models\FamilyMember;
use App\Models\InsuranceClaim;
use App\Models\InsurancePolicy;
use App\Models\InsuranceProvider;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InsuranceController extends Controller
{
    public function index()
    {
        $user = auth()->user() ?? \App\User::first();

        $policies = InsurancePolicy::where('user_id', $user->id)
            ->with('insuranceProvider')
            ->where('is_active', true)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'provider_name' => $p->insuranceProvider->name,
                'provider_logo' => $p->insuranceProvider->logo_url,
                'plan_name' => $p->plan_name,
                'policy_number' => $p->policy_number,
                'plan_type' => $p->plan_type,
                'sum_insured' => $p->sum_insured,
                'end_date' => $p->end_date->format('Y-m-d'),
                'end_date_formatted' => $p->end_date->format('d M Y'),
                'is_expiring_soon' => $p->end_date->isFuture() && $p->end_date->diffInDays(now()) <= 60,
                'days_until_expiry' => $p->end_date->isFuture() ? (int) now()->diffInDays($p->end_date) : 0,
                'members' => $p->members ?? [],
                'member_count' => count($p->members ?? []),
                'claims_count' => $p->claims()->count(),
            ]);

        $claims = InsuranceClaim::where('user_id', $user->id)
            ->with(['insuranceProvider', 'insurancePolicy', 'familyMember'])
            ->orderByDesc('claim_date')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'claim_date' => $c->claim_date?->format('Y-m-d'),
                'claim_date_formatted' => $c->claim_date?->format('d M Y'),
                'treatment_name' => $c->treatment_name ?? $c->description,
                'patient_name' => $c->familyMember?->name ?? 'Self',
                'policy_number' => $c->policy_number,
                'provider_name' => $c->insuranceProvider?->name,
                'plan_name' => $c->insurancePolicy?->plan_name ?? null,
                'claim_amount' => $c->claim_amount,
                'status' => $c->status,
            ]);

        $familyMembers = FamilyMember::where('user_id', $user->id)
            ->orderByRaw("CASE WHEN relation = 'self' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get()
            ->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'relation' => $m->relation]);

        $providers = InsuranceProvider::where('is_active', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Insurance/Index', [
            'policies' => $policies,
            'claims' => $claims,
            'familyMembers' => $familyMembers,
            'insuranceProviders' => $providers,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user() ?? \App\User::first();

        $validated = $request->validate([
            'insurance_provider_id' => 'required|exists:insurance_providers,id',
            'policy_number' => 'required|string|max:100|unique:insurance_policies,policy_number',
            'plan_name' => 'required|string|max:255',
            'plan_type' => 'required|string|in:individual,family,corporate,senior_citizen',
            'sum_insured' => 'required|integer|min:1',
            'premium_amount' => 'nullable|integer|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'members' => 'nullable|array',
            'members.*' => 'integer|exists:family_members,id',
        ]);

        InsurancePolicy::create([
            'user_id' => $user->id,
            ...$validated,
        ]);

        return redirect()->route('insurance.index')
            ->with('toast', 'Policy added successfully');
    }

    public function show(InsurancePolicy $policy)
    {
        $policy->load('insuranceProvider');

        $memberIds = $policy->members ?? [];
        $coveredMembers = FamilyMember::whereIn('id', $memberIds)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'relation' => $m->relation,
            ]);

        $claims = InsuranceClaim::where('insurance_policy_id', $policy->id)
            ->with('familyMember')
            ->orderByDesc('claim_date')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'claim_date_formatted' => $c->claim_date?->format('d M Y'),
                'treatment_name' => $c->treatment_name ?? $c->description,
                'patient_name' => $c->familyMember?->name ?? 'Self',
                'claim_amount' => $c->claim_amount,
                'status' => $c->status,
            ]);

        return Inertia::render('Insurance/Show', [
            'policy' => [
                'id' => $policy->id,
                'provider_name' => $policy->insuranceProvider->name,
                'provider_logo' => $policy->insuranceProvider->logo_url,
                'plan_name' => $policy->plan_name,
                'policy_number' => $policy->policy_number,
                'plan_type' => $policy->plan_type,
                'sum_insured' => $policy->sum_insured,
                'premium_amount' => $policy->premium_amount,
                'start_date_formatted' => $policy->start_date->format('d M Y'),
                'end_date_formatted' => $policy->end_date->format('d M Y'),
                'is_expiring_soon' => $policy->is_expiring_soon,
                'days_until_expiry' => $policy->end_date->isFuture()
                    ? (int) now()->diffInDays($policy->end_date) : 0,
                'metadata' => $policy->metadata ?? [],
            ],
            'coveredMembers' => $coveredMembers,
            'claims' => $claims,
        ]);
    }

    public function showClaim(InsuranceClaim $claim)
    {
        $claim->load([
            'insuranceProvider',
            'insurancePolicy',
            'familyMember',
            'appointment.doctor.department',
        ]);

        $patient = $claim->familyMember
            ? [
                'name' => $claim->familyMember->name,
                'relation' => $claim->familyMember->relation,
                'avatar_url' => $claim->familyMember->avatar_url ?? null,
            ]
            : ['name' => 'Self', 'relation' => 'self', 'avatar_url' => null];

        $doctor = $claim->appointment?->doctor
            ? [
                'name' => $claim->appointment->doctor->name,
                'specialization' => $claim->appointment->doctor->specialization,
                'avatar_url' => $claim->appointment->doctor->avatar_url ?? null,
            ]
            : null;

        // Load original policy if claim was transferred
        $originalPolicy = null;
        $originalPolicyId = $claim->financial['original_policy_id'] ?? null;
        if ($originalPolicyId) {
            $originalPolicy = InsurancePolicy::with('insuranceProvider')->find($originalPolicyId);
        }

        return Inertia::render('Insurance/ClaimDetail', [
            'claim' => [
                'id' => $claim->id,
                'claim_reference' => 'CLM-' . now()->format('Y') . '-' . str_pad($claim->id, 4, '0', STR_PAD_LEFT),
                'treatment_name' => $claim->treatment_name ?? $claim->description,
                'procedure_type' => $claim->procedure_type,
                'status' => $claim->status,
                'rejection_reason' => $claim->rejection_reason,
                'claim_amount' => $claim->claim_amount,
                'claim_date_formatted' => $claim->claim_date?->format('d M Y'),
                'provider_name' => $claim->insuranceProvider?->name,
                'policy_id' => $claim->insurance_policy_id,
                'policy_plan_name' => $claim->insurancePolicy?->plan_name,
                'original_policy_id' => $originalPolicy?->id,
                'original_policy_plan_name' => $originalPolicy?->plan_name,
                'original_policy_expired_date' => $originalPolicy?->end_date?->format('d M Y'),
                'transfer_date' => $claim->financial['transfer_date'] ?? null,
                'appointment_id' => $claim->appointment_id,
                'family_member_id' => $claim->family_member_id,
                'stay_details' => $claim->stay_details,
                'financial' => $claim->financial,
                'documents' => $claim->documents ?? [],
                'timeline' => $claim->timeline ?? [],
            ],
            'patient' => $patient,
            'doctor' => $doctor,
            'appointment' => $claim->appointment ? [
                'id' => $claim->appointment->id,
                'date_formatted' => $claim->appointment->appointment_date?->format('d M Y'),
                'time' => $claim->appointment->appointment_time,
                'type' => $claim->appointment->appointment_type,
                'status' => $claim->appointment->status,
            ] : null,
        ]);
    }

    public function acceptClaim(InsuranceClaim $claim)
    {
        $claim->update(['status' => 'settled']);

        return back()->with('success', 'Claim accepted and settled.');
    }

    public function requestEnhancement(InsuranceClaim $claim)
    {
        $metadata = $claim->metadata ?? [];
        $metadata['enhancement_requested_at'] = now()->toISOString();
        $claim->update([
            'status' => 'enhancement_required',
            'metadata' => $metadata,
        ]);

        return back()->with('success', 'Enhancement request submitted.');
    }

    public function requestPreAuth(InsuranceClaim $claim)
    {
        $metadata = $claim->metadata ?? [];
        $metadata['preauth_requested_at'] = now()->toISOString();
        $claim->update([
            'status' => 'pre_auth',
            'metadata' => $metadata,
        ]);

        return back()->with('success', 'New pre-authorization request submitted.');
    }

    public function disputeClaim(InsuranceClaim $claim)
    {
        $metadata = $claim->metadata ?? [];
        $metadata['dispute_raised_at'] = now()->toISOString();
        $claim->update([
            'status' => 'disputed',
            'metadata' => $metadata,
        ]);

        return back()->with('success', 'Dispute raised successfully.');
    }

    public function preAuth(Request $request)
    {
        $user = auth()->user() ?? \App\User::first();

        $validated = $request->validate([
            'policy_id' => 'required|exists:insurance_policies,id',
            'family_member_id' => 'required|exists:family_members,id',
            'treatment_name' => 'required|string|max:255',
            'admission_date' => 'required|date|after_or_equal:today',
            'discharge_date' => 'nullable|date|after:admission_date',
            'room_type' => 'required|string|in:general,semi_private,private,icu',
            'estimated_cost' => 'nullable|integer|min:0',
            'doctor_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $policy = InsurancePolicy::findOrFail($validated['policy_id']);

        $claim = InsuranceClaim::create([
            'user_id' => $user->id,
            'insurance_provider_id' => $policy->insurance_provider_id,
            'insurance_policy_id' => $policy->id,
            'family_member_id' => $validated['family_member_id'],
            'policy_number' => $policy->policy_number,
            'treatment_name' => $validated['treatment_name'],
            'procedure_type' => 'hospitalization',
            'claim_amount' => $validated['estimated_cost'] ?? 0,
            'status' => 'pending',
            'claim_date' => now(),
            'stay_details' => [
                'admission_date' => $validated['admission_date'],
                'discharge_date' => $validated['discharge_date'] ?? null,
                'room_type' => $validated['room_type'],
            ],
            'financial' => [
                'preauth_requested' => $validated['estimated_cost'] ?? 0,
            ],
            'timeline' => [[
                'event' => 'Pre-authorization requested',
                'date' => now()->format('d M Y'),
                'status' => 'pending',
                'details' => 'Pre-auth request submitted for ' . $validated['treatment_name'],
            ]],
            'documents' => [],
            'description' => $validated['notes'] ?? null,
        ]);

        return redirect("/insurance/claims/{$claim->id}")
            ->with('toast', 'Pre-authorization request submitted');
    }

    public function destroy(InsurancePolicy $policy)
    {
        $policy->update(['is_active' => false]);

        return redirect()->route('insurance.index')
            ->with('toast', 'Policy removed');
    }

    public function setPrimary(InsurancePolicy $policy)
    {
        $user = auth()->user() ?? \App\User::first();

        // Remove primary flag from all other policies
        InsurancePolicy::where('user_id', $user->id)
            ->where('id', '!=', $policy->id)
            ->update(['is_primary' => false]);

        // Set this policy as primary
        $policy->update(['is_primary' => true]);

        return back()->with('success', 'Policy set as primary');
    }

    public function edit(InsurancePolicy $policy)
    {
        $policy->load('insuranceProvider');

        $providers = InsuranceProvider::where('is_active', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $familyMembers = FamilyMember::where('user_id', $policy->user_id)
            ->orderByRaw("CASE WHEN relation = 'self' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get()
            ->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'relation' => $m->relation]);

        return Inertia::render('Insurance/Edit', [
            'policy' => [
                'id' => $policy->id,
                'insurance_provider_id' => $policy->insurance_provider_id,
                'provider_name' => $policy->insuranceProvider->name,
                'plan_name' => $policy->plan_name,
                'policy_number' => $policy->policy_number,
                'plan_type' => $policy->plan_type,
                'sum_insured' => $policy->sum_insured,
                'premium_amount' => $policy->premium_amount,
                'start_date' => $policy->start_date->format('Y-m-d'),
                'end_date' => $policy->end_date->format('Y-m-d'),
                'members' => $policy->members ?? [],
            ],
            'insuranceProviders' => $providers,
            'familyMembers' => $familyMembers,
        ]);
    }

    public function update(Request $request, InsurancePolicy $policy)
    {
        $validated = $request->validate([
            'plan_name' => 'sometimes|string|max:255',
            'plan_type' => 'sometimes|string|in:individual,family,corporate,senior_citizen',
            'sum_insured' => 'sometimes|integer|min:1',
            'premium_amount' => 'nullable|integer|min:0',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'members' => 'nullable|array',
            'members.*' => 'integer|exists:family_members,id',
        ]);

        $policy->update($validated);

        return redirect()->route('insurance.show', $policy)
            ->with('toast', 'Policy updated successfully');
    }

    public function appealClaim(InsuranceClaim $claim)
    {
        if ($claim->status !== 'rejected') {
            return back()->with('error', 'Only rejected claims can be appealed.');
        }

        $timeline = $claim->timeline ?? [];
        $timeline[] = [
            'event' => 'Appeal filed',
            'date' => now()->format('d M Y'),
            'status' => 'under_review',
            'details' => 'Appeal request submitted for review',
        ];

        $claim->update([
            'status' => 'under_review',
            'timeline' => $timeline,
        ]);

        return back()->with('success', 'Appeal request submitted');
    }
}
