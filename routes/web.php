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
        'patient' => null,
    ];

    // Get profile completion steps
    $profileSteps = [
        [
            'id' => 1,
            'number' => 1,
            'title' => 'Complete your health profile',
            'subtitle' => 'Add DOB, blood group, allergies, medical history',
            'completed' => true,
            'href' => '/profile/health',
        ],
        [
            'id' => 2,
            'number' => 2,
            'title' => 'Link insurance',
            'subtitle' => 'Make insurance claims hassle free',
            'completed' => true,
            'href' => '/insurance/setup',
        ],
        [
            'id' => 3,
            'number' => 3,
            'title' => 'Add family members',
            'subtitle' => 'Manage appointments for your entire family',
            'completed' => true,
            'href' => '/family-members/create',
        ],
    ];

    return \Inertia\Inertia::render('Dashboard', [
        'user' => $mockUser,
        'profileSteps' => $profileSteps,
    ]);
})->name('dashboard');

// Appointments
Route::get('/appointments/create', function () {
    // Create a mock user for demo
    $mockUser = (object) [
        'id' => 1,
        'name' => 'Sanjana Jaisinghani',
        'email' => 'sanjana@example.com',
        'avatar_url' => null,
        'patient' => null,
    ];

    return \Inertia\Inertia::render('Appointments/Create', [
        'user' => $mockUser,
    ]);
})->name('appointments.create');

// Auth routes (commented out for demo)
// require __DIR__.'/auth.php';
