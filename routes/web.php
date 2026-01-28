<?php

use App\Http\Controllers\BookingConversationController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuidedDoctorController;
use App\Http\Controllers\GuidedLabController;
use App\Http\Controllers\PaymentController;
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

// Booking entry page (AI assistant mode)
Route::get('/booking', function () {
    return \Inertia\Inertia::render('Booking/Index');
})->name('booking.index');

// Booking Conversations (temporarily without auth for demo)
Route::prefix('booking')->name('booking.')->group(function () {
    Route::post('/start', [BookingConversationController::class, 'start'])->name('start');
    Route::get('/{conversation}', [BookingConversationController::class, 'show'])->name('show');
    Route::post('/{conversation}/message', [BookingConversationController::class, 'message'])->name('message');

    // Payment routes
    Route::post('/{conversation}/payment/create-order', [PaymentController::class, 'createOrder'])->name('payment.create-order');
    Route::post('/{conversation}/payment/verify', [PaymentController::class, 'verifyPayment'])->name('payment.verify');

    // Calendar routes
    Route::get('/{conversation}/calendar/google', [CalendarController::class, 'googleCalendar'])->name('calendar.google');
    Route::get('/{conversation}/calendar/download', [CalendarController::class, 'downloadIcs'])->name('calendar.download');

    // Guided Doctor Booking Flow
    Route::prefix('doctor')->name('doctor.')->group(function () {
        Route::get('/patient', [GuidedDoctorController::class, 'patient'])->name('patient');
        Route::post('/patient', [GuidedDoctorController::class, 'storePatient']);

        Route::get('/concerns', [GuidedDoctorController::class, 'concerns'])->name('concerns');
        Route::post('/concerns', [GuidedDoctorController::class, 'storeConcerns']);

        Route::get('/doctor-time', [GuidedDoctorController::class, 'doctorTime'])->name('doctor-time');
        Route::post('/doctor-time', [GuidedDoctorController::class, 'storeDoctorTime']);

        Route::get('/confirm', [GuidedDoctorController::class, 'confirm'])->name('confirm');
        Route::post('/confirm', [GuidedDoctorController::class, 'processPayment']);
    });

    // Guided Lab Booking Flow
    Route::prefix('lab')->name('lab.')->group(function () {
        Route::get('/patient-test', [GuidedLabController::class, 'patientTest'])->name('patient-test');
        Route::post('/patient-test', [GuidedLabController::class, 'storePatientTest']);

        Route::get('/packages-schedule', [GuidedLabController::class, 'packagesSchedule'])->name('packages-schedule');
        Route::post('/packages-schedule', [GuidedLabController::class, 'storePackagesSchedule']);

        Route::get('/confirm', [GuidedLabController::class, 'confirm'])->name('confirm');
        Route::post('/confirm', [GuidedLabController::class, 'processPayment']);
    });
});

// Booking confirmation page
Route::get('/booking/confirmation/{booking}', function ($booking) {
    // Mock booking data - replace with actual database query
    $bookingData = [
        'id' => $booking,
        'booking_id' => $booking,
        'type' => 'doctor',
        'status' => 'confirmed',
        'patient_name' => 'Kriti Jaisinghani',
        'doctor_name' => 'Dr. Sarah Johnson',
        'date' => '2026-01-25',
        'time' => '08:00 AM',
        'mode' => 'Video Consultation',
        'fee' => 800,
    ];

    return \Inertia\Inertia::render('Booking/Confirmation', [
        'booking' => $bookingData,
    ]);
})->name('booking.confirmation');

// Auth routes (commented out for demo)
// require __DIR__.'/auth.php';
