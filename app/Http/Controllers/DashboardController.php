<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\FamilyMember;
use App\Models\HealthRecord;
use App\Models\InsurancePolicy;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user() ?? \App\User::first();

        $profileSteps = $this->getProfileSteps($user);

        $allCompleted = collect($profileSteps)->every(fn ($s) => $s['completed']);
        $profileJustCompleted = false;
        if ($allCompleted && !session('profile_completed_seen')) {
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
                        'id' => 'checkup-' . $member->id,
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

        return Inertia::render('Dashboard', [
            'user' => $user,
            'profileSteps' => $profileSteps,
            'profileJustCompleted' => $profileJustCompleted,
            'upcomingAppointments' => $upcomingAppointments,
            'overdueBills' => $overdueBills,
            'healthAlerts' => $healthAlerts,
            'preventiveCare' => $preventiveCare,
            'promotions' => $promotions,
        ]);
    }

    private function getInitials(string $name): string
    {
        $parts = explode(' ', trim($name));
        if (count($parts) >= 2) {
            return strtoupper($parts[0][0] . $parts[count($parts) - 1][0]);
        }
        return strtoupper(substr($name, 0, 2));
    }

    private function getProfileSteps($user): array
    {
        $selfMember = FamilyMember::where('user_id', $user->id)
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
                'href' => '/family-members/' . ($selfMember?->id ?? ''),
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
