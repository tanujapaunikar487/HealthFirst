<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class GuidedDoctorController extends Controller
{
    /**
     * Show patient selection step
     */
    public function patient()
    {
        $savedData = session('guided_doctor_booking', []);

        // Mock family members data
        $familyMembers = [
            [
                'id' => '1',
                'name' => 'Sanjana Jaisinghani',
                'avatar' => null,
                'relationship' => 'Self',
                'age' => 28,
            ],
            [
                'id' => '2',
                'name' => 'Kriti Jaisinghani',
                'avatar' => null,
                'relationship' => 'Mother',
                'age' => 54,
            ],
            [
                'id' => '3',
                'name' => 'Raj Jaisinghani',
                'avatar' => null,
                'relationship' => 'Father',
                'age' => 58,
            ],
        ];

        // Mock previous consultations
        $previousConsultations = [
            [
                'id' => '1',
                'doctor' => [
                    'id' => 'd1',
                    'name' => 'Dr. Sarah Johnson',
                    'avatar' => null,
                    'specialization' => 'General Physician',
                ],
                'date' => '2026-01-15',
                'symptoms' => ['Fever', 'Headache'],
                'nextAvailable' => [
                    ['time' => '9:00 AM', 'available' => true],
                    ['time' => '2:00 PM', 'available' => true],
                    ['time' => '4:00 PM', 'available' => false],
                ],
            ],
        ];

        return Inertia::render('Booking/Doctor/PatientStep', [
            'familyMembers' => $familyMembers,
            'previousConsultations' => $previousConsultations,
            'savedData' => $savedData,
        ]);
    }

    /**
     * Store patient selection
     */
    public function storePatient(Request $request)
    {
        $validated = $request->validate([
            'patientId' => 'required|string',
            'consultationType' => 'required|in:new,followup',
            'quickBookDoctorId' => 'nullable|string',
            'quickBookTime' => 'nullable|string',
        ]);

        session([
            'guided_doctor_booking' => array_merge(
                session('guided_doctor_booking', []),
                $validated
            ),
        ]);

        // If quick booking from previous consultation, skip to confirm
        if ($validated['quickBookDoctorId'] && $validated['quickBookTime']) {
            return redirect()->route('booking.doctor.confirm');
        }

        return redirect()->route('booking.doctor.concerns');
    }

    /**
     * Show concerns/symptoms step
     */
    public function concerns()
    {
        $savedData = session('guided_doctor_booking', []);

        if (!isset($savedData['patientId'])) {
            return redirect()->route('booking.doctor.patient');
        }

        // Mock symptoms data
        $symptoms = [
            ['id' => 's1', 'name' => 'Fever'],
            ['id' => 's2', 'name' => 'Cough'],
            ['id' => 's3', 'name' => 'Headache'],
            ['id' => 's4', 'name' => 'Body ache'],
            ['id' => 's5', 'name' => 'Fatigue'],
            ['id' => 's6', 'name' => 'Sore throat'],
            ['id' => 's7', 'name' => 'Nausea'],
            ['id' => 's8', 'name' => 'Dizziness'],
        ];

        // Mock urgency options
        $urgencyOptions = [
            [
                'value' => 'urgent',
                'label' => 'Urgent - Today',
                'description' => "Only today's slots",
                'doctorCount' => 3,
            ],
            [
                'value' => 'this_week',
                'label' => 'This Week',
                'description' => 'Next 7 days',
                'doctorCount' => 12,
            ],
            [
                'value' => 'specific_date',
                'label' => 'Specific date',
                'description' => 'Choose your date',
            ],
        ];

        // Mock follow-up data if applicable
        $followUp = null;
        if (isset($savedData['consultationType']) && $savedData['consultationType'] === 'followup') {
            $followUp = [
                'symptoms' => ['Fever', 'Headache'],
                'doctorName' => 'Dr. Sarah Johnson',
                'date' => 'Jan 15, 2026',
            ];
        }

        return Inertia::render('Booking/Doctor/ConcernsStep', [
            'symptoms' => $symptoms,
            'urgencyOptions' => $urgencyOptions,
            'followUp' => $followUp,
            'savedData' => $savedData,
        ]);
    }

    /**
     * Store concerns/symptoms
     */
    public function storeConcerns(Request $request)
    {
        $validated = $request->validate([
            'selectedSymptoms' => 'array',
            'selectedSymptoms.*' => 'string',
            'symptomNotes' => 'nullable|string|max:1000',
            'urgency' => 'required|in:urgent,this_week,specific_date',
        ]);

        session([
            'guided_doctor_booking' => array_merge(
                session('guided_doctor_booking', []),
                $validated
            ),
        ]);

        return redirect()->route('booking.doctor.doctor-time');
    }

    /**
     * Show doctor and time selection step
     */
    public function doctorTime(Request $request)
    {
        $savedData = session('guided_doctor_booking', []);

        if (!isset($savedData['urgency'])) {
            return redirect()->route('booking.doctor.concerns');
        }

        $selectedDate = $request->get('date', now()->toDateString());

        // Mock available dates
        $availableDates = [];
        for ($i = 0; $i < 5; $i++) {
            $date = now()->addDays($i);
            $availableDates[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D')),
                'sublabel' => $date->format('M d'),
            ];
        }

        // Mock doctors data
        $doctors = [
            [
                'id' => 'd1',
                'name' => 'Dr. Sarah Johnson',
                'avatar' => null,
                'specialization' => 'General Physician',
                'experience_years' => 12,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '10:00 AM', 'available' => false, 'preferred' => false],
                    ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
                    ['time' => '2:00 PM', 'available' => true, 'preferred' => true],
                    ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '4:00 PM', 'available' => false, 'preferred' => false],
                ],
            ],
            [
                'id' => 'd2',
                'name' => 'Dr. Michael Chen',
                'avatar' => null,
                'specialization' => 'Internal Medicine',
                'experience_years' => 8,
                'consultation_modes' => ['video', 'in_person'],
                'video_fee' => 900,
                'in_person_fee' => 1300,
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true, 'preferred' => false],
                    ['time' => '10:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '11:00 AM', 'available' => false, 'preferred' => false],
                    ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '3:00 PM', 'available' => true, 'preferred' => true],
                    ['time' => '4:00 PM', 'available' => true, 'preferred' => false],
                ],
            ],
        ];

        return Inertia::render('Booking/Doctor/DoctorTimeStep', [
            'availableDates' => $availableDates,
            'doctors' => $doctors,
            'savedData' => $savedData,
        ]);
    }

    /**
     * Store doctor and time selection
     */
    public function storeDoctorTime(Request $request)
    {
        $validated = $request->validate([
            'selectedDate' => 'required|date',
            'selectedDoctorId' => 'required|string',
            'selectedTime' => 'required|string',
            'consultationMode' => 'required|in:video,in_person',
        ]);

        session([
            'guided_doctor_booking' => array_merge(
                session('guided_doctor_booking', []),
                $validated
            ),
        ]);

        return redirect()->route('booking.doctor.confirm');
    }

    /**
     * Show confirmation step
     */
    public function confirm()
    {
        $savedData = session('guided_doctor_booking', []);

        if (!isset($savedData['selectedDoctorId'])) {
            return redirect()->route('booking.doctor.doctor-time');
        }

        // Mock doctor data
        $doctor = [
            'id' => $savedData['selectedDoctorId'],
            'name' => 'Dr. Sarah Johnson',
            'avatar' => null,
        ];

        // Mock patient data
        $patient = [
            'id' => $savedData['patientId'],
            'name' => 'Kriti Jaisinghani',
            'avatar' => null,
        ];

        // Calculate fee based on consultation mode
        $fee = $savedData['consultationMode'] === 'video' ? 800 : 1200;

        // Format datetime
        $datetime = $savedData['selectedDate'] . 'T' . str_replace(' ', '', $savedData['selectedTime']);

        $summary = [
            'doctor' => $doctor,
            'patient' => $patient,
            'datetime' => $datetime,
            'consultationType' => $savedData['consultationMode'] === 'video'
                ? 'Video Consultation'
                : 'In-Person Visit',
            'fee' => $fee,
        ];

        return Inertia::render('Booking/Doctor/ConfirmStep', [
            'summary' => $summary,
        ]);
    }

    /**
     * Process payment and create booking
     */
    public function processPayment(Request $request)
    {
        $savedData = session('guided_doctor_booking', []);

        // In production, create booking record and initiate payment
        // For now, redirect to mock confirmation

        // Clear session data
        session()->forget('guided_doctor_booking');

        return redirect()->route('booking.confirmation', ['booking' => 'DOC-' . time()]);
    }
}
