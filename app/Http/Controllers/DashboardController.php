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

        // Get empty state tasks
        $tasks = $this->getEmptyStateTasks();

        return Inertia::render('Dashboard', [
            'user' => $user->load('patient'),
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get empty state tasks for the dashboard.
     */
    private function getEmptyStateTasks(): array
    {
        return [
            [
                'id' => 1,
                'number' => 1,
                'title' => 'Add family members',
                'description' => 'Manage health for your loved ones',
                'href' => '/family-members/create',
            ],
            [
                'id' => 2,
                'number' => 2,
                'title' => 'Link insurance',
                'description' => 'Make insurance claims hassle free',
                'href' => '/insurance/setup',
            ],
            [
                'id' => 3,
                'number' => 3,
                'title' => 'Book your first appointment',
                'description' => 'Find doctors and book appointments',
                'href' => '/appointments/create',
            ],
        ];
    }
}
