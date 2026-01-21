<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DashboardController
 *
 * Handles the main patient dashboard view.
 * This is a thin orchestration layer - no business logic.
 */
class DashboardController extends Controller
{
    /**
     * Display the patient dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get profile completion status
        $profileCompletion = $this->getProfileCompletionStatus($user);

        // Get family members count
        // TODO: Replace with actual database query when family members are implemented
        $familyMembers = [
            [
                'id' => 1,
                'name' => 'Sanjana Jaisinghani',
                'avatar_url' => '/assets/icons/Avatar-3.svg',
            ],
        ];

        // Get upcoming appointments count
        $upcomingAppointmentsCount = 0; // TODO: Implement when appointments are set up

        return Inertia::render('Dashboard', [
            'user' => $user->load('patient'),
            'profileCompletion' => $profileCompletion,
            'familyMembers' => $familyMembers,
            'upcomingAppointmentsCount' => $upcomingAppointmentsCount,
        ]);
    }

    /**
     * Calculate profile completion status.
     * This is simple logic, so it's acceptable in the controller.
     * If it becomes complex, move to a service.
     */
    private function getProfileCompletionStatus($user): array
    {
        $steps = [
            [
                'id' => 'account_created',
                'title' => 'Account created',
                'description' => 'Basic details saved',
                'completed' => true, // Always true if they're logged in
            ],
            [
                'id' => 'add_family_members',
                'title' => 'Add family members',
                'description' => 'Manage health for your loved ones',
                'completed' => $user->familyMembers()->exists(),
            ],
            [
                'id' => 'link_insurance',
                'title' => 'Link insurance',
                'description' => 'Make insurance claims hassle free',
                'completed' => $user->patient && $user->patient->insurance_linked,
            ],
        ];

        $completedCount = collect($steps)->where('completed', true)->count();
        $totalCount = count($steps);

        return [
            'steps' => $steps,
            'completed' => $completedCount,
            'total' => $totalCount,
        ];
    }
}
