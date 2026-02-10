<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\FamilyMember;
use App\Models\HealthRecord;
use App\Models\InsuranceClaim;
use App\Models\InsurancePolicy;
use App\Models\InsuranceProvider;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user() ?? \App\User::first();

        $selfMember = FamilyMember::where('user_id', $user->id)
            ->where('relation', 'self')
            ->first();

        $profileSteps = $this->getProfileSteps($user, $selfMember);

        $allCompleted = collect($profileSteps)->every(fn ($s) => $s['completed']);
        $profileJustCompleted = false;
        if ($allCompleted && ! session('profile_completed_seen')) {
            session(['profile_completed_seen' => true]);
            $profileJustCompleted = true;
        }

        $upcomingAppointments = Appointment::where('user_id', $user->id)
            ->where('status', 'confirmed')
            ->where('appointment_date', '>=', Carbon::today())
            ->orderBy('appointment_date', 'asc')
            ->with(['doctor', 'familyMember', 'labPackage'])
            ->limit(10)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'type' => $a->appointment_type,
                'title' => $a->appointment_type === 'doctor'
                    ? ($a->doctor?->name ?? 'Doctor Appointment')
                    : ($a->labPackage?->name ?? 'Lab Test'),
                'subtitle' => $a->appointment_type === 'doctor'
                    ? ($a->doctor?->specialization ?? '')
                    : ($a->collection_type === 'home' ? 'Home Collection' : 'Hospital Visit'),
                'patient_name' => $a->familyMember?->name ?? 'Self',
                'patient_initials' => $this->getInitials($a->familyMember?->name ?? 'Self'),
                'date_formatted' => $a->appointment_date->format('D, d M'),
                'time' => $a->appointment_time,
                'mode' => $a->consultation_mode,
                'fee' => $a->fee,
                'is_today' => $a->appointment_date->isToday(),
            ]);

        $overdueBills = [];
        $healthAlerts = [];

        if ($allCompleted) {
            $overdueBills = Appointment::where('user_id', $user->id)
                ->where('payment_status', 'pending')
                ->with(['familyMember', 'doctor', 'labPackage'])
                ->get()
                ->filter(function ($a) {
                    $dueDate = $a->appointment_date->copy()->addDays(7);

                    return $dueDate->isPast();
                })
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'patient_name' => $a->familyMember?->name ?? 'Self',
                    'patient_initials' => $this->getInitials($a->familyMember?->name ?? 'Self'),
                    'days_overdue' => (int) now()->diffInDays($a->appointment_date->copy()->addDays(7)),
                    'amount' => $a->fee,
                    'title' => $a->appointment_type === 'doctor'
                        ? ($a->doctor?->name ?? 'Doctor Visit')
                        : ($a->labPackage?->name ?? 'Lab Test'),
                ])
                ->values()
                ->toArray();

            $healthAlerts = HealthRecord::where('user_id', $user->id)
                ->where('category', 'lab_report')
                ->with('familyMember')
                ->orderByDesc('record_date')
                ->get()
                ->filter(function ($r) {
                    foreach ($r->metadata['results'] ?? [] as $result) {
                        if (in_array($result['status'] ?? '', ['abnormal', 'high', 'borderline'])) {
                            return true;
                        }
                    }

                    return false;
                })
                ->take(3)
                ->map(function ($r) {
                    $abnormal = collect($r->metadata['results'] ?? [])
                        ->first(fn ($res) => in_array($res['status'] ?? '', ['abnormal', 'high', 'borderline']));

                    return [
                        'id' => $r->id,
                        'title' => $r->title,
                        'patient_name' => $r->familyMember?->name ?? 'Self',
                        'patient_initials' => $this->getInitials($r->familyMember?->name ?? 'Self'),
                        'metric_name' => $abnormal['name'] ?? $r->title,
                        'metric_value' => $abnormal['value'] ?? '—',
                        'metric_reference' => $abnormal['reference'] ?? '—',
                        'record_date_formatted' => $r->record_date->format('d M Y'),
                    ];
                })
                ->values()
                ->toArray();
        }

        $preventiveCare = [];
        if ($allCompleted) {
            $members = FamilyMember::where('user_id', $user->id)->get();
            foreach ($members as $member) {
                $lastAppt = Appointment::where('user_id', $user->id)
                    ->where('family_member_id', $member->id)
                    ->where('status', 'completed')
                    ->where('appointment_type', 'doctor')
                    ->orderByDesc('appointment_date')
                    ->first();

                $monthsSince = $lastAppt
                    ? (int) $lastAppt->appointment_date->diffInMonths(now())
                    : null;

                if ($monthsSince === null || $monthsSince >= 6) {
                    $preventiveCare[] = [
                        'id' => 'checkup-'.$member->id,
                        'member_id' => $member->id,
                        'patient_name' => $member->name,
                        'patient_initials' => $this->getInitials($member->name),
                        'months_since' => $monthsSince,
                        'relation' => $member->relation,
                    ];
                }
            }
        }

        $promotions = Promotion::active()->get()->map(fn ($p) => [
            'id' => $p->id,
            'title' => $p->title,
            'description' => $p->description,
            'button_text' => $p->button_text,
            'button_href' => $p->button_href,
            'image_url' => $p->image_url,
            'bg_gradient' => $p->bg_gradient,
        ]);

        // New diverse card types (Step 2 of plan)
        $paymentsDueSoon = [];
        $emisDue = [];
        $insuranceClaimUpdates = [];

        $followUpsDue = [];
        $preAppointmentReminders = [];
        $newResultsReady = [];
        $vaccinationsDue = [];

        $prescriptionsExpiring = [];

        if ($allCompleted) {
            $paymentsDueSoon = $this->getPaymentsDueSoon($user);
            $emisDue = $this->getEmisDue($user);
            $insuranceClaimUpdates = $this->getInsuranceClaimUpdates($user);

            $followUpsDue = $this->getFollowUpsDue($user);
            $preAppointmentReminders = $this->getPreAppointmentReminders($user);
            $newResultsReady = $this->getNewResultsReady($user);
            $vaccinationsDue = $this->getVaccinationsDue($user);
            $prescriptionsExpiring = $this->getPrescriptionsExpiring($user);
        }

        return Inertia::render('Dashboard', [
            'user' => $user,
            'profileSteps' => $profileSteps,
            'profileJustCompleted' => $profileJustCompleted,
            'upcomingAppointments' => $upcomingAppointments,
            'overdueBills' => $overdueBills,
            'healthAlerts' => $healthAlerts,
            'preventiveCare' => $preventiveCare,
            'promotions' => $promotions,
            'paymentsDueSoon' => $paymentsDueSoon,
            'emisDue' => $emisDue,
            'insuranceClaimUpdates' => $insuranceClaimUpdates,

            'followUpsDue' => $followUpsDue,
            'preAppointmentReminders' => $preAppointmentReminders,
            'newResultsReady' => $newResultsReady,
            'vaccinationsDue' => $vaccinationsDue,
            'prescriptionsExpiring' => $prescriptionsExpiring,

            // Onboarding sheet data
            'selfMember' => $selfMember ? [
                'id' => $selfMember->id,
                'date_of_birth' => $selfMember->date_of_birth?->format('Y-m-d'),
                'blood_group' => $selfMember->blood_group,
                'medical_conditions' => $selfMember->medical_conditions ?? [],
                'allergies' => $selfMember->allergies ?? [],
            ] : null,
            'insuranceProviders' => InsuranceProvider::where('is_active', true)
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'onboardingFamilyMembers' => FamilyMember::where('user_id', $user->id)
                ->orderByRaw("CASE WHEN relation = 'self' THEN 0 ELSE 1 END")
                ->orderBy('name')
                ->get()
                ->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'relation' => $m->relation]),
        ]);
    }

    private function getPaymentsDueSoon($user): array
    {
        // Query appointments with payment_status='pending' where due_date (appointment_date + 7d) is 1-7 days from now
        return Appointment::where('user_id', $user->id)
            ->where('payment_status', 'pending')
            ->with(['familyMember', 'doctor', 'labPackage'])
            ->get()
            ->filter(function ($a) {
                $dueDate = $a->appointment_date->copy()->addDays(7);
                $daysUntilDue = (int) now()->diffInDays($dueDate, false);

                return $daysUntilDue >= 1 && $daysUntilDue <= 7;
            })
            ->sortBy(function ($a) {
                return $a->appointment_date->copy()->addDays(7);
            })
            ->take(3)
            ->map(function ($a) {
                $dueDate = $a->appointment_date->copy()->addDays(7);

                return [
                    'id' => $a->id,
                    'patient_name' => $a->familyMember?->name ?? 'Self',
                    'patient_initials' => $this->getInitials($a->familyMember?->name ?? 'Self'),
                    'amount' => $a->fee,
                    'due_date' => $dueDate->toDateString(),
                    'days_until_due' => (int) now()->diffInDays($dueDate, false),
                    'title' => $a->appointment_type === 'doctor'
                        ? ($a->doctor?->name ?? 'Doctor Visit')
                        : ($a->labPackage?->name ?? 'Lab Test'),
                ];
            })
            ->values()
            ->toArray();
    }

    private function getEmisDue($user): array
    {
        // Mock EMI data for demo - in production, query from billing_details table
        // For now, return appointments with specific IDs that have EMI flag
        return Appointment::where('user_id', $user->id)
            ->where('payment_status', 'pending')
            ->with('familyMember')
            ->limit(2)
            ->get()
            ->map(function ($a) {
                // Mock EMI data - in production, this would come from metadata or billing_details table
                return [
                    'id' => $a->id,
                    'patient_name' => $a->familyMember?->name ?? 'Self',
                    'patient_initials' => $this->getInitials($a->familyMember?->name ?? 'Self'),
                    'emi_amount' => 1500, // Monthly EMI
                    'current_installment' => 2,
                    'total_installments' => 6,
                    'due_date' => now()->addDays(3)->toDateString(),
                    'title' => 'EMI Payment Due',
                ];
            })
            ->values()
            ->toArray();
    }

    private function getInsuranceClaimUpdates($user): array
    {
        // Query insurance_claims where status changed recently (last 7 days) or status requires action
        return InsuranceClaim::where('user_id', $user->id)
            ->whereIn('claim_status', ['pending', 'approved', 'rejected', 'action_required'])
            ->with('familyMember')
            ->orderByDesc('updated_at')
            ->limit(2)
            ->get()
            ->map(function ($claim) {
                return [
                    'id' => $claim->id,
                    'claim_id' => $claim->id,
                    'patient_name' => $claim->familyMember?->name ?? 'Self',
                    'patient_initials' => $this->getInitials($claim->familyMember?->name ?? 'Self'),
                    'claim_status' => $claim->claim_status,
                    'claim_amount' => $claim->claim_amount,
                    'treatment' => $claim->treatment_name ?? 'Medical Treatment',
                    'title' => 'Insurance Claim Update',
                ];
            })
            ->toArray();
    }

    private function getFollowUpsDue($user): array
    {
        // Query appointments where status='completed' AND metadata has follow_up_date
        // AND follow_up_date is past or within 7 days
        return Appointment::where('user_id', $user->id)
            ->where('status', 'completed')
            ->with(['familyMember', 'doctor', 'department'])
            ->get()
            ->filter(function ($a) {
                // Check if there's a consultation note health record with follow_up field
                $consultationNote = HealthRecord::where('appointment_id', $a->id)
                    ->where('category', 'consultation_notes')
                    ->first();
                if (! $consultationNote) {
                    return false;
                }
                $followUpDate = $consultationNote->metadata['follow_up_date'] ?? null;
                if (! $followUpDate) {
                    return false;
                }
                $daysOverdue = (int) Carbon::parse($followUpDate)->diffInDays(now(), false);

                return $daysOverdue >= -7; // Show if due in next 7 days or already overdue
            })
            ->take(2)
            ->map(function ($a) {
                $consultationNote = HealthRecord::where('appointment_id', $a->id)
                    ->where('category', 'consultation_notes')
                    ->first();
                $followUpDate = Carbon::parse($consultationNote->metadata['follow_up_date']);

                return [
                    'id' => $a->id,
                    'original_appointment_id' => $a->id,
                    'patient_name' => $a->familyMember?->name ?? 'Self',
                    'patient_initials' => $this->getInitials($a->familyMember?->name ?? 'Self'),
                    'doctor_name' => $a->doctor?->name ?? 'Doctor',
                    'department' => $a->department?->name ?? $a->doctor?->specialization ?? '',
                    'recommended_date' => $followUpDate->toDateString(),
                    'days_overdue' => (int) $followUpDate->diffInDays(now(), false),
                ];
            })
            ->values()
            ->toArray();
    }

    private function getPreAppointmentReminders($user): array
    {
        // Query confirmed appointments where appointment_date+time is 6-24 hours from now
        $sixHoursFromNow = now()->addHours(6);
        $twentyFourHoursFromNow = now()->addHours(24);

        return Appointment::where('user_id', $user->id)
            ->where('status', 'confirmed')
            ->whereBetween('appointment_date', [now()->toDateString(), now()->addDay()->toDateString()])
            ->with(['familyMember', 'doctor', 'department', 'labPackage'])
            ->get()
            ->filter(function ($a) use ($sixHoursFromNow, $twentyFourHoursFromNow) {
                $apptDateTime = Carbon::parse($a->appointment_date->toDateString().' '.$a->appointment_time);

                return $apptDateTime->between($sixHoursFromNow, $twentyFourHoursFromNow);
            })
            ->take(2)
            ->map(function ($a) {
                $apptDateTime = Carbon::parse($a->appointment_date->toDateString().' '.$a->appointment_time);

                return [
                    'id' => $a->id,
                    'appointment_id' => $a->id,
                    'patient_name' => $a->familyMember?->name ?? 'Self',
                    'patient_initials' => $this->getInitials($a->familyMember?->name ?? 'Self'),
                    'title' => $a->appointment_type === 'doctor'
                        ? ($a->doctor?->name ?? 'Doctor Appointment')
                        : ($a->labPackage?->name ?? 'Lab Test'),
                    'subtitle' => $a->appointment_type === 'doctor'
                        ? ($a->department?->name ?? $a->doctor?->specialization ?? '')
                        : ($a->collection_type === 'home' ? 'Home Collection' : 'Hospital Visit'),
                    'time' => $a->appointment_time,
                    'hours_until' => (int) now()->diffInHours($apptDateTime, false),
                    'preparation_notes' => null, // Could add fasting instructions from lab packages
                ];
            })
            ->values()
            ->toArray();
    }

    private function getNewResultsReady($user): array
    {
        // Query health_records where category='lab_report' AND created_at within last 48 hours
        return HealthRecord::where('user_id', $user->id)
            ->where('category', 'lab_report')
            ->where('created_at', '>=', now()->subHours(48))
            ->with('familyMember')
            ->orderByDesc('created_at')
            ->limit(2)
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'record_id' => $r->id,
                    'patient_name' => $r->familyMember?->name ?? 'Self',
                    'patient_initials' => $this->getInitials($r->familyMember?->name ?? 'Self'),
                    'test_name' => $r->title,
                    'uploaded_date' => $r->created_at->format('d M'),
                    'status' => 'Ready', // Could derive from metadata.results status
                ];
            })
            ->toArray();
    }

    private function getVaccinationsDue($user): array
    {
        // Query family_members and check vaccination schedule against current date
        // For demo: use vaccination records with upcoming_vaccinations metadata
        return FamilyMember::where('user_id', $user->id)
            ->get()
            ->filter(function ($member) use ($user) {
                // Check vaccination_history in health_records
                $vaccinations = HealthRecord::where('user_id', $user->id)
                    ->where('family_member_id', $member->id)
                    ->where('category', 'vaccination')
                    ->get();

                // Determine if any vaccines are due based on upcoming_vaccinations metadata
                foreach ($vaccinations as $vacc) {
                    $upcoming = $vacc->metadata['upcoming_vaccinations'] ?? [];
                    foreach ($upcoming as $upcomingVacc) {
                        $dueDate = Carbon::parse($upcomingVacc['due_date']);
                        if ($dueDate->isPast() || $dueDate->diffInDays(now(), false) <= 30) {
                            return true;
                        }
                    }
                }

                return false;
            })
            ->take(2)
            ->map(function ($member) use ($user) {
                $vaccinations = HealthRecord::where('user_id', $user->id)
                    ->where('family_member_id', $member->id)
                    ->where('category', 'vaccination')
                    ->first();

                $upcomingVacc = ($vaccinations->metadata['upcoming_vaccinations'] ?? [])[0] ?? null;

                return [
                    'id' => $member->id,
                    'patient_name' => $member->name,
                    'patient_initials' => $this->getInitials($member->name),
                    'vaccine_name' => $upcomingVacc['vaccine_name'] ?? 'Vaccine',
                    'due_date' => $upcomingVacc['due_date'] ?? now()->toDateString(),
                    'age_requirement' => $upcomingVacc['dose_label'] ?? '',
                ];
            })
            ->values()
            ->toArray();
    }

    private function getPrescriptionsExpiring($user): array
    {
        return HealthRecord::where('user_id', $user->id)
            ->where('category', 'prescription')
            ->whereNotNull('metadata')
            ->with('familyMember')
            ->get()
            ->map(function ($r) {
                $drugs = $r->metadata['drugs'] ?? [];
                $startDate = $r->record_date;
                if (! $startDate || empty($drugs)) {
                    return null;
                }

                $now = Carbon::now();
                $threshold = $now->copy()->addDays(7);
                $expiringDrugs = [];

                foreach ($drugs as $drug) {
                    $duration = $this->parseDuration($drug['duration'] ?? '');
                    if ($duration <= 0) {
                        continue;
                    }
                    $endDate = $startDate->copy()->addDays($duration);

                    if ($endDate->isAfter($now) && $endDate->lte($threshold)) {
                        $expiringDrugs[] = [
                            'name' => $drug['name'] ?? 'Medication',
                            'days_remaining' => max(0, (int) $now->diffInDays($endDate, false)),
                        ];
                    }
                }

                if (empty($expiringDrugs)) {
                    return null;
                }

                return [
                    'id' => $r->id,
                    'title' => $r->title,
                    'doctor_name' => $r->doctor_name,
                    'patient_name' => $r->familyMember?->name ?? 'Self',
                    'patient_initials' => $this->getInitials($r->familyMember?->name ?? 'Self'),
                    'drugs' => $expiringDrugs,
                    'record_date_formatted' => $r->record_date->format('d M Y'),
                ];
            })
            ->filter()
            ->values()
            ->toArray();
    }

    private function parseDuration(string $duration): int
    {
        if (preg_match('/(\d+)\s*(day|week|month)/i', $duration, $matches)) {
            $num = (int) $matches[1];
            $unit = strtolower($matches[2]);

            return match ($unit) {
                'day', 'days' => $num,
                'week', 'weeks' => $num * 7,
                'month', 'months' => $num * 30,
                default => 0,
            };
        }

        return 0;
    }

    public function updateHealthProfile(Request $request): RedirectResponse
    {
        $user = $request->user() ?? \App\User::first();

        $validated = $request->validate([
            'date_of_birth' => ['required', 'date', 'before:today'],
            'blood_group' => ['required', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'medical_conditions' => ['nullable', 'array'],
            'medical_conditions.*' => ['string', 'max:100'],
            'allergies' => ['nullable', 'array'],
            'allergies.*' => ['string', 'max:100'],
        ]);

        $selfMember = FamilyMember::where('user_id', $user->id)
            ->where('relation', 'self')
            ->first();

        if ($selfMember) {
            $selfMember->update([
                'date_of_birth' => $validated['date_of_birth'],
                'blood_group' => $validated['blood_group'],
                'medical_conditions' => $validated['medical_conditions'] ?? null,
                'allergies' => $validated['allergies'] ?? null,
            ]);
        }

        return back();
    }

    private function getInitials(string $name): string
    {
        $parts = explode(' ', trim($name));
        if (count($parts) >= 2) {
            return strtoupper($parts[0][0].$parts[count($parts) - 1][0]);
        }

        return strtoupper(substr($name, 0, 2));
    }

    private function getProfileSteps($user, $selfMember = null): array
    {
        $selfMember = $selfMember ?? FamilyMember::where('user_id', $user->id)
            ->where('relation', 'self')
            ->first();

        $healthProfileComplete = $selfMember
            && $selfMember->date_of_birth
            && $selfMember->blood_group;

        $insuranceLinked = InsurancePolicy::where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();

        $hasFamilyMembers = FamilyMember::where('user_id', $user->id)
            ->where('relation', '!=', 'self')
            ->exists();

        return [
            [
                'id' => 1,
                'number' => 1,
                'title' => 'Complete your health profile',
                'subtitle' => 'Add DOB, blood group, allergies, medical history',
                'completed' => $healthProfileComplete,
                'href' => '/settings',
            ],
            [
                'id' => 2,
                'number' => 2,
                'title' => 'Link insurance',
                'subtitle' => 'Make insurance claims hassle free',
                'completed' => $insuranceLinked,
                'href' => '/insurance',
            ],
            [
                'id' => 3,
                'number' => 3,
                'title' => 'Add family members',
                'subtitle' => 'Manage appointments for your entire family',
                'completed' => $hasFamilyMembers,
                'href' => '/family-members',
            ],
        ];
    }
}
