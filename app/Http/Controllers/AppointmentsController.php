<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\FamilyMember;
use App\Models\InsuranceClaim;
use App\Models\LabTestType;
use App\Models\TimeSlot;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\Calendar\GoogleCalendarService;
use App\Services\NotificationService;
use App\Notifications\AppointmentCancelled;
use App\Notifications\RefundInitiated;
use App\Notifications\AppointmentRescheduled;
use App\Notifications\AppointmentCheckedIn;
use App\Notifications\AppointmentConfirmed;
use Illuminate\Support\Facades\Log;

class AppointmentsController extends Controller
{
    public function index()
    {
        $user = Auth::user() ?? \App\User::first();

        $appointments = Appointment::where('user_id', $user->id)
            ->with(['doctor', 'familyMember', 'labPackage', 'labCenter', 'userAddress'])
            ->orderByDesc('appointment_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($appt) => $this->formatAppointment($appt))
            ->toArray();

        $familyMembers = FamilyMember::where('user_id', $user->id)
            ->select('id', 'name', 'relation')
            ->get()
            ->toArray();

        // Unique doctors from user's appointments for filter
        $doctorIds = collect($appointments)->pluck('doctor_id')->filter()->unique()->values()->toArray();
        $doctors = Doctor::whereIn('id', $doctorIds)
            ->select('id', 'name')
            ->get()
            ->toArray();

        return Inertia::render('Appointments/Index', [
            'user' => $user,
            'appointments' => $appointments,
            'familyMembers' => $familyMembers,
            'doctors' => $doctors,
        ]);
    }

    public function show(Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        $appointment->load(['doctor', 'familyMember', 'labPackage', 'labCenter', 'userAddress', 'department']);

        return Inertia::render('Appointments/Show', [
            'user' => $user,
            'appointment' => $this->formatDetailedAppointment($appointment),
        ]);
    }

    public function cancel(Request $request, Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        if ($appointment->status !== 'confirmed') {
            return back()->with('error', 'Only confirmed appointments can be cancelled.');
        }

        $validated = $request->validate([
            'cancellation_reason' => 'nullable|string|max:255',
        ]);

        $appointment->update([
            'status' => 'cancelled',
            'payment_status' => 'fully_refunded',
            'cancellation_reason' => $validated['cancellation_reason'] ?? null,
        ]);

        app(NotificationService::class)->send($user, new AppointmentCancelled($appointment), 'appointments');
        app(NotificationService::class)->send($user, new RefundInitiated($appointment, $appointment->fee), 'billing');

        try {
            app(GoogleCalendarService::class)->deleteEvent($user, $appointment);
            $appointment->update(['google_calendar_event_id' => null]);
        } catch (\Exception $e) {
            Log::warning('Calendar sync failed on cancel: ' . $e->getMessage());
        }

        return back()->with('success', 'Appointment cancelled successfully. A full refund has been initiated.');
    }

    public function reschedule(Request $request, Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        if ($appointment->status !== 'confirmed') {
            return back()->with('error', 'Only confirmed appointments can be rescheduled.');
        }

        $validated = $request->validate([
            'date' => 'required|date|after_or_equal:today|before_or_equal:' . now()->addDays(14)->format('Y-m-d'),
            'time' => 'required|string',
        ]);

        // Capture old date/time before update
        $oldDate = $appointment->appointment_date;
        $oldTime = $appointment->appointment_time;

        $appointment->update([
            'appointment_date' => $validated['date'],
            'appointment_time' => $validated['time'],
        ]);

        app(NotificationService::class)->send($user, new AppointmentRescheduled($appointment, $oldDate, $oldTime), 'appointments');

        try {
            app(GoogleCalendarService::class)->updateEvent($user, $appointment);
        } catch (\Exception $e) {
            Log::warning('Calendar sync failed on reschedule: ' . $e->getMessage());
        }

        return back()->with('success', 'Appointment rescheduled successfully.');
    }

    public function checkIn(Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        if ($appointment->status !== 'confirmed') {
            return back()->with('error', 'Only confirmed appointments can be checked in.');
        }

        // Check if appointment is within 48 hours
        $appointmentDate = Carbon::parse($appointment->appointment_date . ' ' . $appointment->appointment_time);
        $hoursUntil = now()->diffInHours($appointmentDate, false);

        if ($hoursUntil < 0 || $hoursUntil > 48) {
            return back()->with('error', 'Check-in is only available within 48 hours of your appointment.');
        }

        $appointment->update([
            'checked_in_at' => now(),
        ]);

        app(NotificationService::class)->send($user, new AppointmentCheckedIn($appointment), 'appointments');

        return back()->with('success', 'Checked in successfully.');
    }

    public function updateNotes(Request $request, Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:5000',
        ]);

        $appointment->update(['notes' => $validated['notes']]);

        return back()->with('success', 'Notes updated successfully.');
    }

    public function availableSlots(Appointment $appointment, Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        if ($appointment->appointment_type === 'doctor' && $appointment->doctor_id) {
            $slots = TimeSlot::where('doctor_id', $appointment->doctor_id)
                ->whereDate('date', $date)
                ->where('is_booked', false)
                ->orderBy('start_time')
                ->get()
                ->map(fn($slot) => [
                    'time' => Carbon::parse($slot->start_time)->format('H:i'),
                    'display' => Carbon::parse($slot->start_time)->format('g:i A'),
                ])
                ->toArray();
        } else {
            // For lab appointments, generate standard morning slots
            $slots = [];
            foreach (['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'] as $time) {
                $slots[] = [
                    'time' => $time,
                    'display' => Carbon::parse($time)->format('g:i A'),
                ];
            }
        }

        // Generate available dates (next 14 days)
        $dates = [];
        $doctorDaysOff = [];

        if ($appointment->appointment_type === 'doctor' && $appointment->doctor_id) {
            $availabilities = \App\Models\DoctorAvailability::where('doctor_id', $appointment->doctor_id)
                ->pluck('day_of_week')
                ->toArray();

            for ($i = 0; $i < 14; $i++) {
                $d = Carbon::today()->addDays($i);
                $dayOfWeek = $d->dayOfWeek;
                if (in_array($dayOfWeek, $availabilities)) {
                    $dates[] = [
                        'date' => $d->format('Y-m-d'),
                        'display' => $d->format('D, d M'),
                        'is_today' => $i === 0,
                    ];
                }
            }
        } else {
            for ($i = 0; $i < 14; $i++) {
                $d = Carbon::today()->addDays($i);
                $dates[] = [
                    'date' => $d->format('Y-m-d'),
                    'display' => $d->format('D, d M'),
                    'is_today' => $i === 0,
                ];
            }
        }

        return response()->json([
            'slots' => $slots,
            'dates' => $dates,
        ]);
    }

    public function bookAgain(Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        if ($appointment->appointment_type === 'doctor') {
            session([
                'guided_doctor_booking' => [
                    'patientId' => $appointment->family_member_id,
                    'selectedSymptoms' => $appointment->symptoms ?? [],
                    'appointmentType' => 'new',  // Always "new" for book again
                    'selectedDoctorId' => 'd' . $appointment->doctor_id,  // Pre-select same doctor
                    'appointmentMode' => $appointment->consultation_mode,  // Pre-select same mode
                ],
            ]);
            // Skip patient step, go directly to doctor-time selection
            return redirect()->route('booking.doctor.doctor-time');
        }

        session([
            'guided_lab_booking' => [
                'patientId' => $appointment->family_member_id,
            ],
        ]);
        return redirect()->route('booking.lab.patient');
    }

    public function showConfirmation(string $bookingId)
    {
        // Try as integer appointment ID first (guided flow)
        $appointment = null;
        if (ctype_digit($bookingId)) {
            $appointment = Appointment::with(['doctor', 'familyMember', 'labPackage', 'labCenter', 'userAddress'])
                ->find((int) $bookingId);
        }

        // Fallback: look up by booking_id in conversations (AI chat flow)
        if (!$appointment) {
            $conversation = \App\BookingConversation::where('status', 'completed')
                ->get()
                ->first(function ($conv) use ($bookingId) {
                    return ($conv->collected_data['booking_id'] ?? null) === $bookingId;
                });

            if ($conversation) {
                return $this->showConversationConfirmation($conversation, $bookingId);
            }

            return redirect()->route('dashboard');
        }

        $bookingData = [
            'id' => (string) $appointment->id,
            'booking_id' => strtoupper($appointment->appointment_type === 'doctor' ? 'DOC' : 'LAB') . '-' . $appointment->id,
            'type' => $appointment->appointment_type === 'doctor' ? 'doctor' : 'lab_test',
            'status' => $appointment->status,
            'patient_name' => $appointment->familyMember?->name ?? 'Unknown',
            'date' => $appointment->appointment_date->format('Y-m-d'),
            'time' => $appointment->appointment_time,
            'fee' => $appointment->fee,
        ];

        if ($appointment->appointment_type === 'doctor') {
            $bookingData['doctor_name'] = $appointment->doctor?->name ?? 'Unknown';
            $mode = $appointment->consultation_mode;
            $bookingData['mode'] = $mode === 'video' ? 'Video Appointment' : 'In-Person Visit';
        } else {
            if ($appointment->labPackage) {
                $bookingData['package'] = $appointment->labPackage->name;
            } elseif ($appointment->lab_test_ids) {
                $testNames = LabTestType::whereIn('id', $appointment->lab_test_ids)
                    ->pluck('name')
                    ->toArray();
                $bookingData['package'] = implode(', ', $testNames);
            }
            $bookingData['mode'] = $appointment->collection_type === 'home' ? 'Home Collection' : 'Visit Center';
        }

        $user = Auth::user() ?? \App\User::first();
        $calendarSync = $user->getSetting('calendar_sync', []);
        $calendarConnected = ($calendarSync['google']['connected'] ?? false) && ($calendarSync['google']['enabled'] ?? false);

        return Inertia::render('Booking/Confirmation', [
            'booking' => $bookingData,
            'calendarConnected' => $calendarConnected,
        ]);
    }

    private function showConversationConfirmation(\App\BookingConversation $conversation, string $bookingId)
    {
        $data = $conversation->collected_data;
        $isDoctor = ($data['booking_type'] ?? 'doctor') === 'doctor';

        $bookingData = [
            'id' => (string) $conversation->id,
            'booking_id' => $bookingId,
            'type' => $isDoctor ? 'doctor' : 'lab_test',
            'status' => 'confirmed',
            'patient_name' => $data['selectedPatientName'] ?? 'Unknown',
            'date' => $data['selectedDate'] ?? now()->format('Y-m-d'),
            'time' => $data['selectedTime'] ?? '',
            'fee' => $data['fee'] ?? 0,
        ];

        if ($isDoctor) {
            $doctorId = $data['selectedDoctorId'] ?? null;
            $doctor = $doctorId ? \App\Models\Doctor::find($doctorId) : null;
            $bookingData['doctor_name'] = $doctor?->name ?? ($data['selectedDoctorName'] ?? 'Unknown');
            $mode = $data['consultationMode'] ?? 'video';
            $bookingData['mode'] = $mode === 'video' ? 'Video Appointment' : 'In-Person Visit';
        } else {
            $bookingData['package'] = $data['selectedPackageName']
                ?? (isset($data['selectedTestNames']) ? implode(', ', $data['selectedTestNames']) : 'Lab Test');
            $collectionType = $data['collectionType'] ?? 'center';
            $bookingData['mode'] = $collectionType === 'home' ? 'Home Collection' : 'Visit Center';
        }

        $user = Auth::user() ?? \App\User::first();
        $calendarSync = $user->getSetting('calendar_sync', []);
        $calendarConnected = ($calendarSync['google']['connected'] ?? false) && ($calendarSync['google']['enabled'] ?? false);

        return Inertia::render('Booking/Confirmation', [
            'booking' => $bookingData,
            'calendarConnected' => $calendarConnected,
        ]);
    }

    public function rate(Request $request, Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
        ]);

        $metadata = $appointment->metadata ?? [];
        $metadata['rating'] = $validated['rating'];
        $appointment->update(['metadata' => $metadata]);

        return back()->with('success', 'Thank you for rating this consultation.');
    }

    /**
     * Get available slots for book-again (same doctor, new appointment)
     */
    public function bookAgainSlots(Appointment $appointment, Request $request)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        // Only doctor appointments can be booked again via sheet
        if ($appointment->appointment_type !== 'doctor' || !$appointment->doctor_id) {
            return response()->json(['error' => 'Book again only available for doctor appointments'], 400);
        }

        $selectedDate = $request->get('date', now()->toDateString());
        $doctor = $appointment->doctor;

        // Get doctor's working days
        $availabilities = \App\Models\DoctorAvailability::where('doctor_id', $doctor->id)
            ->where('is_available', true)
            ->pluck('day_of_week')
            ->toArray();

        // Generate available dates (next 14 days filtered by doctor availability)
        $dates = [];
        for ($i = 0; $i < 14; $i++) {
            $d = Carbon::today()->addDays($i);
            $dayOfWeek = $d->dayOfWeek;
            if (in_array($dayOfWeek, $availabilities)) {
                $dates[] = [
                    'date' => $d->format('Y-m-d'),
                    'display' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $d->format('D')),
                    'sublabel' => $d->format('M d'),
                    'is_today' => $i === 0,
                ];
            }
        }

        // Get time slots for selected date
        $slots = TimeSlot::where('doctor_id', $doctor->id)
            ->whereDate('date', $selectedDate)
            ->where('is_booked', false)
            ->orderBy('start_time')
            ->get()
            ->map(fn($slot) => [
                'time' => Carbon::parse($slot->start_time)->format('g:i A'),
                'available' => true,
                'preferred' => $slot->is_preferred ?? false,
            ])
            ->toArray();

        // Get doctor info with consultation modes
        $doctor->load('consultationModes');
        $modes = [];
        foreach ($doctor->consultationModes as $mode) {
            $modes[] = [
                'type' => $mode->mode,
                'label' => $mode->mode === 'video' ? 'Video Appointment' : 'In-Person Visit',
                'description' => $mode->mode === 'video'
                    ? 'Connect from home via video call'
                    : 'Visit the doctor at the clinic',
                'price' => $mode->fee,
            ];
        }

        // Patient info
        $patient = $appointment->familyMember;

        // Original appointment mode (for pre-selection)
        $originalMode = $appointment->consultation_mode;

        return response()->json([
            'dates' => $dates,
            'slots' => $slots,
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialization' => $doctor->specialization,
                'avatar_url' => $doctor->avatar_url,
            ],
            'patient' => [
                'id' => $patient?->id,
                'name' => $patient?->name ?? 'Unknown',
            ],
            'modes' => $modes,
            'original_mode' => $originalMode,
        ]);
    }

    /**
     * Create a book-again appointment (new appointment with same doctor)
     */
    public function createBookAgain(Request $request, Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        if ($appointment->appointment_type !== 'doctor' || !$appointment->doctor_id) {
            return back()->with('error', 'Book again only available for doctor appointments');
        }

        $validated = $request->validate([
            'date' => 'required|date|after_or_equal:today|before_or_equal:' . now()->addDays(14)->format('Y-m-d'),
            'time' => 'required|string',
            'mode' => 'required|in:video,in_person',
        ]);

        $doctor = $appointment->doctor;
        $doctor->load('consultationModes');

        // Validate mode is supported by doctor
        $supportedModes = $doctor->consultationModes->pluck('mode')->toArray();
        if (!in_array($validated['mode'], $supportedModes)) {
            return back()->with('error', "{$doctor->name} does not offer {$validated['mode']} appointments");
        }

        // Get fee for selected mode
        $fee = $doctor->consultationModes->firstWhere('mode', $validated['mode'])?->fee ?? 0;

        // Create the new appointment
        $newAppointment = Appointment::create([
            'user_id' => $user->id,
            'family_member_id' => $appointment->family_member_id,
            'doctor_id' => $doctor->id,
            'department_id' => $doctor->department_id,
            'appointment_type' => 'doctor',
            'consultation_mode' => $validated['mode'],
            'appointment_date' => $validated['date'],
            'appointment_time' => $validated['time'],
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'fee' => $fee,
            'metadata' => [
                'booked_again_from' => $appointment->id,
            ],
        ]);

        app(NotificationService::class)->send($user, new AppointmentConfirmed($newAppointment), 'appointments');

        try {
            $eventId = app(GoogleCalendarService::class)->createEvent($user, $newAppointment);
            if ($eventId) {
                $newAppointment->update(['google_calendar_event_id' => $eventId]);
            }
        } catch (\Exception $e) {
            Log::warning('Calendar sync failed on book again: ' . $e->getMessage());
        }

        return back()->with('success', 'Appointment booked successfully.');
    }

    /**
     * Get available slots for follow-up booking
     */
    public function followUpSlots(Appointment $appointment, Request $request)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        // Only doctor appointments can have follow-ups
        if ($appointment->appointment_type !== 'doctor' || !$appointment->doctor_id) {
            return response()->json(['error' => 'Follow-up only available for doctor appointments'], 400);
        }

        $selectedDate = $request->get('date', now()->toDateString());
        $doctor = $appointment->doctor;

        // Get doctor's working days
        $availabilities = \App\Models\DoctorAvailability::where('doctor_id', $doctor->id)
            ->where('is_available', true)
            ->pluck('day_of_week')
            ->toArray();

        // Generate available dates (next 14 days filtered by doctor availability)
        $dates = [];
        for ($i = 0; $i < 14; $i++) {
            $d = Carbon::today()->addDays($i);
            $dayOfWeek = $d->dayOfWeek;
            if (in_array($dayOfWeek, $availabilities)) {
                $dates[] = [
                    'date' => $d->format('Y-m-d'),
                    'display' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $d->format('D')),
                    'sublabel' => $d->format('M d'),
                    'is_today' => $i === 0,
                ];
            }
        }

        // Get time slots for selected date
        $slots = TimeSlot::where('doctor_id', $doctor->id)
            ->whereDate('date', $selectedDate)
            ->where('is_booked', false)
            ->orderBy('start_time')
            ->get()
            ->map(fn($slot) => [
                'time' => Carbon::parse($slot->start_time)->format('g:i A'),
                'available' => true,
                'preferred' => $slot->is_preferred ?? false,
            ])
            ->toArray();

        // Get doctor info with consultation modes
        $doctor->load('consultationModes');
        $modes = [];
        foreach ($doctor->consultationModes as $mode) {
            $modes[] = [
                'type' => $mode->mode,
                'label' => $mode->mode === 'video' ? 'Video Appointment' : 'In-Person Visit',
                'description' => $mode->mode === 'video'
                    ? 'Connect from home via video call'
                    : 'Visit the doctor at the clinic',
                'price' => $mode->fee,
            ];
        }

        // Patient info
        $patient = $appointment->familyMember;

        return response()->json([
            'dates' => $dates,
            'slots' => $slots,
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialization' => $doctor->specialization,
                'avatar_url' => $doctor->avatar_url,
            ],
            'patient' => [
                'id' => $patient?->id,
                'name' => $patient?->name ?? 'Unknown',
            ],
            'modes' => $modes,
        ]);
    }

    /**
     * Create a follow-up appointment
     */
    public function createFollowUp(Request $request, Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        if ($appointment->appointment_type !== 'doctor' || !$appointment->doctor_id) {
            return back()->with('error', 'Follow-up only available for doctor appointments');
        }

        $validated = $request->validate([
            'date' => 'required|date|after_or_equal:today|before_or_equal:' . now()->addDays(14)->format('Y-m-d'),
            'time' => 'required|string',
            'mode' => 'required|in:video,in_person',
        ]);

        $doctor = $appointment->doctor;
        $doctor->load('consultationModes');

        // Validate mode is supported by doctor
        $supportedModes = $doctor->consultationModes->pluck('mode')->toArray();
        if (!in_array($validated['mode'], $supportedModes)) {
            return back()->with('error', "{$doctor->name} does not offer {$validated['mode']} appointments");
        }

        // Get fee for selected mode
        $fee = $doctor->consultationModes->firstWhere('mode', $validated['mode'])?->fee ?? 0;

        // Create the follow-up appointment
        $followUp = Appointment::create([
            'user_id' => $user->id,
            'family_member_id' => $appointment->family_member_id,
            'doctor_id' => $doctor->id,
            'department_id' => $doctor->department_id,
            'appointment_type' => 'doctor',
            'consultation_mode' => $validated['mode'],
            'appointment_date' => $validated['date'],
            'appointment_time' => $validated['time'],
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'fee' => $fee,
            'metadata' => [
                'is_followup' => true,
                'original_appointment_id' => $appointment->id,
            ],
        ]);

        app(NotificationService::class)->send($user, new AppointmentConfirmed($followUp), 'appointments');

        try {
            $eventId = app(GoogleCalendarService::class)->createEvent($user, $followUp);
            if ($eventId) {
                $followUp->update(['google_calendar_event_id' => $eventId]);
            }
        } catch (\Exception $e) {
            Log::warning('Calendar sync failed on follow-up: ' . $e->getMessage());
        }

        return back()->with('success', 'Follow-up appointment booked successfully.');
    }

    private function formatDetailedAppointment(Appointment $appt): array
    {
        $base = $this->formatAppointment($appt);
        $isDoctor = $appt->appointment_type === 'doctor';
        $createdAt = $appt->created_at;
        $apptDate = $appt->appointment_date;

        // Doctor details
        $doctor = null;
        if ($isDoctor && $appt->doctor) {
            $d = $appt->doctor;
            $doctor = [
                'name' => $d->name,
                'specialization' => $d->specialization ?? '',
                'qualification' => $d->qualification ?? 'MBBS',
                'experience_years' => $d->experience_years ?? 10,
                'rating' => $d->rating ?? 4.5,
                'bio' => $d->bio ?? '',
                'avatar_url' => $d->avatar_url,
            ];
        }

        // Patient details
        $patient = null;
        if ($appt->familyMember) {
            $fm = $appt->familyMember;
            $patient = [
                'name' => $fm->name,
                'relation' => $fm->relation ?? 'Self',
                'age' => $fm->age ?? null,
                'gender' => $fm->gender ?? null,
                'blood_group' => $fm->blood_group ?? null,
            ];
        }

        // Mock vitals (realistic Indian adult values)
        $vitals = $isDoctor ? [
            ['label' => 'Blood Pressure', 'value' => '128/82', 'unit' => 'mmHg', 'status' => 'elevated', 'reference' => '< 120/80'],
            ['label' => 'Pulse Rate', 'value' => '76', 'unit' => 'bpm', 'status' => 'normal', 'reference' => '60-100'],
            ['label' => 'Weight', 'value' => '68', 'unit' => 'kg', 'status' => 'normal', 'reference' => 'BMI 18.5-24.9'],
            ['label' => 'Height', 'value' => '165', 'unit' => 'cm', 'status' => 'normal', 'reference' => '—'],
            ['label' => 'BMI', 'value' => '25.0', 'unit' => 'kg/m²', 'status' => 'elevated', 'reference' => '18.5-24.9'],
            ['label' => 'SpO2', 'value' => '98', 'unit' => '%', 'status' => 'normal', 'reference' => '95-100'],
            ['label' => 'Temperature', 'value' => '99.2', 'unit' => '°F', 'status' => 'elevated', 'reference' => '97.8-99.1'],
        ] : [];

        // Mock clinical summary
        $symptoms = $appt->symptoms ?? [];
        $clinicalSummary = $isDoctor ? [
            'diagnosis' => [
                'name' => count($symptoms) > 0 && in_array('Fever', $symptoms)
                    ? 'Acute viral fever with myalgia'
                    : (count($symptoms) > 0 && in_array('Chest pain', $symptoms)
                        ? 'Non-cardiac chest pain — musculoskeletal origin'
                        : (count($symptoms) > 0 && in_array('Skin rash', $symptoms)
                            ? 'Mild eczema (atopic dermatitis)'
                            : 'General consultation')),
                'icd_code' => count($symptoms) > 0 && in_array('Fever', $symptoms)
                    ? 'J06.9' : (in_array('Chest pain', $symptoms ?? []) ? 'R07.9' : 'L30.9'),
                'severity' => 'mild',
            ],
            'chief_complaint' => implode(', ', $symptoms) ?: 'General check-up',
            'history_of_present_illness' => 'Patient presents with symptoms for the past 3-4 days. No significant worsening. No associated vomiting or diarrhea. Appetite slightly reduced.',
            'past_medical_history' => 'No known chronic illnesses. No previous surgeries. Last health checkup 6 months ago — unremarkable.',
            'family_history' => 'Father — Type 2 Diabetes (managed). Mother — Hypothyroidism. No family history of cardiac disease or malignancy.',
            'allergies' => ['Sulfonamides', 'Dust mites'],
            'social_history' => 'Non-smoker. Occasional social drinker. Regular exercise 3x/week. Software professional — sedentary work.',
            'examination_findings' => 'General: Alert, oriented, mild pallor. CVS: S1S2 normal, no murmurs. RS: Bilateral clear. Abdomen: Soft, non-tender. Throat: Mild pharyngeal congestion.',
            'assessment' => 'Likely viral upper respiratory tract infection. Low risk for complications. Symptoms expected to resolve within 5-7 days with supportive care.',
            'treatment_plan' => 'Symptomatic management with antipyretics and antihistamines. Adequate hydration and rest. Follow up in 1 week if symptoms persist or worsen.',
        ] : [
            'diagnosis' => ['name' => 'Routine health screening', 'icd_code' => 'Z00.0', 'severity' => 'routine'],
            'chief_complaint' => 'Annual health checkup',
            'history_of_present_illness' => 'No acute complaints. Patient requested routine screening.',
            'past_medical_history' => 'No known chronic illnesses.',
            'family_history' => 'Father — Type 2 Diabetes.',
            'allergies' => ['Sulfonamides'],
            'social_history' => 'Non-smoker. Regular exercise.',
            'examination_findings' => 'Not applicable — lab visit.',
            'assessment' => 'Routine screening. Await lab results.',
            'treatment_plan' => 'Review results at follow-up appointment.',
        ];

        // Mock prescriptions
        $prescriptions = $isDoctor ? [
            ['drug' => 'Paracetamol', 'strength' => '500mg', 'dosage' => '1 tablet', 'frequency' => 'Three times a day', 'duration' => '5 days', 'purpose' => 'Fever and pain relief', 'status' => 'active'],
            ['drug' => 'Cetirizine', 'strength' => '10mg', 'dosage' => '1 tablet', 'frequency' => 'Once daily at bedtime', 'duration' => '7 days', 'purpose' => 'Allergic rhinitis / congestion', 'status' => 'active'],
            ['drug' => 'Azithromycin', 'strength' => '500mg', 'dosage' => '1 tablet', 'frequency' => 'Once daily', 'duration' => '3 days', 'purpose' => 'Bacterial infection prophylaxis', 'status' => 'completed'],
            ['drug' => 'Pantoprazole', 'strength' => '40mg', 'dosage' => '1 tablet', 'frequency' => 'Once daily before breakfast', 'duration' => '7 days', 'purpose' => 'Gastric protection', 'status' => 'active'],
        ] : [];

        // Mock lab tests
        $labTests = [
            ['name' => 'Complete Blood Count (CBC)', 'reason' => 'Routine / Infection markers', 'status' => 'completed', 'result' => 'WBC 8,200 /µL, Hb 13.8 g/dL, Plt 2.4 L', 'date' => $apptDate->format('Y-m-d'), 'is_normal' => true],
            ['name' => 'C-Reactive Protein (CRP)', 'reason' => 'Inflammation marker', 'status' => 'completed', 'result' => '12.4 mg/L (High)', 'date' => $apptDate->format('Y-m-d'), 'is_normal' => false],
            ['name' => 'Thyroid Panel (TSH, T3, T4)', 'reason' => 'Routine screening', 'status' => 'pending', 'result' => null, 'date' => null, 'is_normal' => null],
        ];

        // Mock billing
        $consultationFee = $appt->fee ?? 800;
        $platformFee = 49;
        $gst = 0;
        $discount = 0;
        $total = $consultationFee + $platformFee + $gst - $discount;

        $billing = [
            'line_items' => [
                ['label' => $isDoctor ? 'Consultation Fee' : 'Test / Package Fee', 'amount' => $consultationFee],
                ['label' => 'Platform Fee', 'amount' => $platformFee],
                ['label' => 'GST (0%)', 'amount' => $gst],
                ['label' => 'Discount', 'amount' => -$discount],
            ],
            'total' => $total,
            'payment_method' => 'UPI (PhonePe)',
            'payment_status' => $appt->payment_status ?? 'paid',
            'invoice_number' => 'INV-' . str_pad($appt->id, 6, '0', STR_PAD_LEFT),
            'payment_date' => $createdAt->format('d M Y, g:i A'),
        ];

        // Mock documents
        $documents = [
            ['name' => 'Prescription', 'type' => 'pdf', 'date' => $apptDate->format('d M Y'), 'size' => '124 KB'],
            ['name' => 'Visit Summary', 'type' => 'pdf', 'date' => $apptDate->format('d M Y'), 'size' => '89 KB'],
        ];
        if (!$isDoctor || count($labTests) > 0) {
            $documents[] = ['name' => 'Lab Report — CBC', 'type' => 'pdf', 'date' => $apptDate->format('d M Y'), 'size' => '215 KB'];
        }

        // Mock activity log
        $activity = [
            ['event' => 'Appointment Booked', 'timestamp' => $createdAt->format('d M Y, g:i A'), 'icon' => 'calendar'],
            ['event' => 'Payment Received', 'timestamp' => $createdAt->addMinutes(1)->format('d M Y, g:i A'), 'icon' => 'credit-card'],
        ];
        if ($appt->status === 'completed') {
            $activity[] = ['event' => 'Check-in', 'timestamp' => $apptDate->format('d M Y') . ', ' . $appt->appointment_time, 'icon' => 'log-in'];
            $activity[] = ['event' => 'Consultation Completed', 'timestamp' => $apptDate->format('d M Y') . ', ' . Carbon::parse($appt->appointment_time)->addMinutes(30)->format('g:i A'), 'icon' => 'check-circle'];
            if ($isDoctor) {
                $activity[] = ['event' => 'Prescription Generated', 'timestamp' => $apptDate->format('d M Y') . ', ' . Carbon::parse($appt->appointment_time)->addMinutes(32)->format('g:i A'), 'icon' => 'file-text'];
            }
            $activity[] = ['event' => 'Lab Order Placed', 'timestamp' => $apptDate->format('d M Y') . ', ' . Carbon::parse($appt->appointment_time)->addMinutes(35)->format('g:i A'), 'icon' => 'flask'];
            $activity[] = ['event' => 'Follow-up Recommended', 'timestamp' => $apptDate->format('d M Y') . ', ' . Carbon::parse($appt->appointment_time)->addMinutes(36)->format('g:i A'), 'icon' => 'repeat'];
        } elseif ($appt->status === 'cancelled') {
            $activity[] = ['event' => 'Appointment Cancelled', 'timestamp' => $appt->updated_at->format('d M Y, g:i A'), 'icon' => 'x-circle'];
            $activity[] = ['event' => 'Refund Initiated', 'timestamp' => $appt->updated_at->addMinutes(5)->format('d M Y, g:i A'), 'icon' => 'rotate-ccw'];
        }

        // Follow-up info
        $followUp = [
            'recommended_date' => $apptDate->addDays(14)->format('Y-m-d'),
            'recommended_date_formatted' => $apptDate->addDays(14)->format('D, d M Y'),
            'notes' => 'Follow up in 2 weeks if symptoms persist. Contact immediately if you experience high fever (>103°F), difficulty breathing, or chest pain.',
        ];

        return array_merge($base, [
            'appointment_id' => strtoupper($isDoctor ? 'APT' : 'LAB') . '-' . str_pad($appt->id, 3, '0', STR_PAD_LEFT),
            'doctor' => $doctor,
            'patient' => $patient,
            'department' => $appt->department?->name,
            'duration' => '30 min',
            'notes' => $appt->notes,
            'symptoms' => $symptoms,
            'vitals' => $vitals,
            'clinical_summary' => $clinicalSummary,
            'prescriptions' => $prescriptions,
            'lab_tests' => $labTests,
            'billing' => $billing,
            'documents' => $documents,
            'activity' => $activity,
            'follow_up' => $followUp,
            'insurance_claim_id' => InsuranceClaim::where('appointment_id', $appt->id)->value('id'),
        ]);
    }

    private function formatAppointment(Appointment $appt): array
    {
        $isUpcoming = $appt->appointment_date->gte(Carbon::today()) && $appt->status === 'confirmed';

        $data = [
            'id' => $appt->id,
            'type' => $appt->appointment_type,
            'patient_name' => $appt->familyMember?->name ?? 'You',
            'patient_id' => $appt->family_member_id,
            'doctor_id' => $appt->doctor_id,
            'date' => $appt->appointment_date->format('Y-m-d'),
            'date_formatted' => $appt->appointment_date->format('D, d M Y'),
            'time' => $appt->appointment_time,
            'status' => $appt->status,
            'fee' => $appt->fee,
            'payment_status' => $appt->payment_status ?? 'paid',
            'is_upcoming' => $isUpcoming,
            'google_calendar_event_id' => $appt->google_calendar_event_id,
        ];

        if ($appt->appointment_type === 'doctor') {
            $data['title'] = $appt->doctor?->name ?? 'Doctor Appointment';
            $data['subtitle'] = $appt->doctor?->specialization ?? '';
            $data['mode'] = $appt->consultation_mode === 'video' ? 'Video' : 'In-Person';
        } else {
            if ($appt->labPackage) {
                $data['title'] = $appt->labPackage->name;
            } elseif ($appt->lab_test_ids) {
                $testNames = LabTestType::whereIn('id', $appt->lab_test_ids)
                    ->pluck('name')
                    ->toArray();
                $data['title'] = count($testNames) > 2
                    ? $testNames[0] . ' +' . (count($testNames) - 1) . ' more'
                    : implode(', ', $testNames);
            } else {
                $data['title'] = 'Lab Test';
            }
            $data['subtitle'] = $appt->collection_type === 'home' ? 'Home Collection' : 'Lab Visit';
            $data['mode'] = $appt->collection_type === 'home' ? 'Home' : 'Center';
        }

        return $data;
    }
}
