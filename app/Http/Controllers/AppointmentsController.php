<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\FamilyMember;
use App\Models\LabTestType;
use App\Models\TimeSlot;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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

        $appointment->update([
            'appointment_date' => $validated['date'],
            'appointment_time' => $validated['time'],
        ]);

        return back()->with('success', 'Appointment rescheduled successfully.');
    }

    public function availableSlots(Appointment $appointment, Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        if ($appointment->appointment_type === 'doctor' && $appointment->doctor_id) {
            $slots = TimeSlot::where('doctor_id', $appointment->doctor_id)
                ->whereDate('date', $date)
                ->where('is_booked', false)
                ->orderBy('time')
                ->get()
                ->map(fn($slot) => [
                    'time' => $slot->time,
                    'display' => Carbon::parse($slot->time)->format('g:i A'),
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
                ],
            ]);
            return redirect()->route('booking.doctor.patient');
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

        return Inertia::render('Booking/Confirmation', [
            'booking' => $bookingData,
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

        return Inertia::render('Booking/Confirmation', [
            'booking' => $bookingData,
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
