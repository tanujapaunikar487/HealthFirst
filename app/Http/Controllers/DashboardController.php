<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\FamilyMember;
use App\Models\InsurancePolicy;
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

        $upcomingAppointments = Appointment::where('user_id', $user->id)
            ->where('status', 'confirmed')
            ->where('appointment_date', '>=', Carbon::today())
            ->orderBy('appointment_date', 'asc')
            ->with(['doctor', 'familyMember', 'labPackage'])
            ->limit(3)
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
                'date_formatted' => $a->appointment_date->format('D, d M'),
                'time' => $a->appointment_time,
                'mode' => $a->consultation_mode,
                'fee' => $a->fee,
            ]);

        return Inertia::render('Dashboard', [
            'user' => $user->load('patient'),
            'profileSteps' => $profileSteps,
            'upcomingAppointments' => $upcomingAppointments,
        ]);
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
