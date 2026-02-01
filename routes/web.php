<?php

use App\Http\Controllers\AppointmentsController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BookingConversationController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuidedDoctorController;
use App\Http\Controllers\GuidedLabController;
use App\Http\Controllers\HealthRecordController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\FamilyMembersController;
use App\Http\Controllers\InsuranceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SearchController;
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
            'href' => '/insurance',
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

// Generic transcription endpoint (without conversation)
Route::post('/api/transcribe', [BookingConversationController::class, 'transcribeGeneric'])->name('api.transcribe');

// Booking Conversations (temporarily without auth for demo)
Route::prefix('booking')->name('booking.')->group(function () {
    Route::post('/start', [BookingConversationController::class, 'start'])->name('start');
    Route::get('/{conversation}', [BookingConversationController::class, 'show'])->name('show');
    Route::post('/{conversation}/message', [BookingConversationController::class, 'message'])->name('message');
    Route::post('/{conversation}/transcribe', [BookingConversationController::class, 'transcribeAudio'])->name('transcribe');

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
        Route::post('/add-family-member', [GuidedDoctorController::class, 'addFamilyMember'])->name('add-family-member');

        Route::get('/doctor-time', [GuidedDoctorController::class, 'doctorTime'])->name('doctor-time');
        Route::post('/doctor-time', [GuidedDoctorController::class, 'storeDoctorTime']);

        Route::get('/confirm', [GuidedDoctorController::class, 'confirm'])->name('confirm');
        Route::post('/confirm', [GuidedDoctorController::class, 'processPayment']);
    });

    // Guided Lab Booking Flow
    Route::prefix('lab')->name('lab.')->group(function () {
        Route::get('/patient', [GuidedLabController::class, 'patient'])->name('patient');
        Route::post('/patient', [GuidedLabController::class, 'storePatient']);

        Route::get('/test-search', [GuidedLabController::class, 'testSearch'])->name('test-search');
        Route::post('/test-search', [GuidedLabController::class, 'storeTestSearch']);
        Route::post('/search-tests', [GuidedLabController::class, 'searchTests'])->name('search-tests');

        Route::get('/schedule', [GuidedLabController::class, 'schedule'])->name('schedule');
        Route::post('/schedule', [GuidedLabController::class, 'storeSchedule']);
        Route::post('/add-address', [GuidedLabController::class, 'addAddress']);

        Route::get('/confirm', [GuidedLabController::class, 'confirm'])->name('confirm');
        Route::post('/confirm', [GuidedLabController::class, 'processPayment']);

        // Legacy redirects (old 3-step URLs)
        Route::get('/patient-test', fn() => redirect('/booking/lab/patient'));
        Route::get('/packages-schedule', fn() => redirect('/booking/lab/schedule'));
    });
});

// Booking confirmation page (loads real data from DB)
Route::get('/booking/confirmation/{booking}', [AppointmentsController::class, 'showConfirmation'])->name('booking.confirmation');

// My Appointments
Route::get('/appointments', [AppointmentsController::class, 'index'])->name('appointments.index');
Route::get('/appointments/{appointment}', [AppointmentsController::class, 'show'])->name('appointments.show');
Route::post('/appointments/{appointment}/cancel', [AppointmentsController::class, 'cancel'])->name('appointments.cancel');
Route::post('/appointments/{appointment}/reschedule', [AppointmentsController::class, 'reschedule'])->name('appointments.reschedule');
Route::get('/appointments/{appointment}/available-slots', [AppointmentsController::class, 'availableSlots'])->name('appointments.available-slots');
Route::get('/appointments/{appointment}/book-again', [AppointmentsController::class, 'bookAgain'])->name('appointments.book-again');

// Family Members
Route::get('/family-members', [FamilyMembersController::class, 'index'])->name('family-members.index');
Route::get('/family-members/create', [FamilyMembersController::class, 'create'])->name('family-members.create');
Route::get('/family-members/{member}', [FamilyMembersController::class, 'show'])->name('family-members.show');
Route::post('/family-members', [FamilyMembersController::class, 'store'])->name('family-members.store');
Route::put('/family-members/{member}', [FamilyMembersController::class, 'update'])->name('family-members.update');
Route::delete('/family-members/{member}', [FamilyMembersController::class, 'destroy'])->name('family-members.destroy');

// Insurance
Route::get('/insurance', [InsuranceController::class, 'index'])->name('insurance.index');
Route::post('/insurance', [InsuranceController::class, 'store'])->name('insurance.store');
Route::get('/insurance/claims/{claim}', [InsuranceController::class, 'showClaim'])->name('insurance.claim.show');
Route::get('/insurance/{policy}', [InsuranceController::class, 'show'])->name('insurance.show');
Route::delete('/insurance/{policy}', [InsuranceController::class, 'destroy'])->name('insurance.destroy');

// Health Records
Route::get('/health-records', [HealthRecordController::class, 'index'])->name('health-records.index');

// Billing
Route::get('/billing', [BillingController::class, 'index'])->name('billing.index');
Route::get('/billing/{appointment}', [BillingController::class, 'show'])->name('billing.show');
Route::post('/billing/{appointment}/payment/create-order', [BillingController::class, 'createOrder'])->name('billing.payment.create-order');
Route::post('/billing/{appointment}/payment/verify', [BillingController::class, 'verifyPayment'])->name('billing.payment.verify');

// Search
Route::get('/search', [SearchController::class, 'search'])->name('search');

// Notifications
Route::post('/notifications/{billing_notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');

// Auth routes (commented out for demo)
// require __DIR__.'/auth.php';
