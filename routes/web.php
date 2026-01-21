<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Redirect root to dashboard
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Dashboard - temporarily without auth for demo
Route::get('/dashboard', function () {
    // Create a mock user for demo
    $mockUser = (object) [
        'id' => 1,
        'name' => 'Sanjana Jaisinghani',
        'email' => 'sanjana@example.com',
        'avatar_url' => null,
    ];

    return \Inertia\Inertia::render('Dashboard', [
        'user' => $mockUser,
        'profileCompletion' => [
            'steps' => [
                [
                    'id' => 'account_created',
                    'title' => 'Account created',
                    'description' => 'Basic details saved',
                    'completed' => true,
                ],
                [
                    'id' => 'add_family_members',
                    'title' => 'Add family members',
                    'description' => 'Manage health for your loved ones',
                    'completed' => false,
                ],
                [
                    'id' => 'link_insurance',
                    'title' => 'Link insurance',
                    'description' => 'Make insurance claims hassle free',
                    'completed' => false,
                ],
            ],
            'completed' => 1,
            'total' => 3,
        ],
        'familyMembers' => [
            (object) [
                'id' => 1,
                'name' => 'Sanjana',
                'avatar_url' => null,
            ],
        ],
        'upcomingAppointmentsCount' => 0,
    ]);
})->name('dashboard');

// Auth routes (commented out for demo)
// require __DIR__.'/auth.php';
