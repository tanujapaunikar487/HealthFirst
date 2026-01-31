<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class GuidedDoctorController extends Controller
{
    /**
     * Show concerns step (merged with patient selection)
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

        // Mock previous appointments
        $previousConsultations = [
            [
                'id' => '1',
                'patientId' => '1',
                'doctor' => [
                    'id' => 'd1',
                    'name' => 'Dr. Sarah Johnson',
                    'avatar' => null,
                    'specialization' => 'General Physician',
                    'experience_years' => 15,
                    'appointment_modes' => ['video', 'in_person'],
                    'video_fee' => 800,
                    'in_person_fee' => 1200,
                ],
                'date' => '2026-01-15',
                'symptoms' => ['Fever', 'Headache'],
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '4:00 PM', 'available' => false, 'preferred' => false],
                ],
            ],
        ];

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

        // Follow-up reason options (matches chat flow)
        $followUpReasonOptions = [
            [
                'value' => 'scheduled',
                'label' => 'Scheduled follow-up',
                'description' => 'Doctor asked me to come back',
            ],
            [
                'value' => 'new_concern',
                'label' => 'New concern',
                'description' => 'Something changed since last visit',
            ],
            [
                'value' => 'ongoing_issue',
                'label' => 'Ongoing issue',
                'description' => "Symptoms haven't improved",
            ],
        ];

        // Mock follow-up data if applicable
        $followUp = null;
        if (isset($savedData['appointmentType']) && $savedData['appointmentType'] === 'followup') {
            $followUp = [
                'symptoms' => ['Fever', 'Headache'],
                'doctorName' => 'Dr. Sarah Johnson',
                'date' => 'Jan 15, 2026',
            ];
        }

        return Inertia::render('Booking/Doctor/PatientStep', [
            'familyMembers' => $familyMembers,
            'previousConsultations' => $previousConsultations,
            'symptoms' => $symptoms,
            'urgencyOptions' => $urgencyOptions,
            'followUpReasonOptions' => $followUpReasonOptions,
            'followUp' => $followUp,
            'savedData' => $savedData,
        ]);
    }

    /**
     * Store patient, appointment type, and concerns
     */
    public function storePatient(Request $request)
    {
        $validated = $request->validate([
            'patientId' => 'required|string',
            'appointmentType' => 'required|in:new,followup',
            'followupReason' => 'nullable|required_if:appointmentType,followup|in:scheduled,new_concern,ongoing_issue',
            'followupNotes' => 'nullable|string|max:1000',
            'quickBookDoctorId' => 'nullable|string',
            'quickBookTime' => 'nullable|string',
            'selectedSymptoms' => 'array',
            'selectedSymptoms.*' => 'string',
            'symptomNotes' => 'nullable|string|max:1000',
            'urgency' => 'required|in:urgent,this_week,specific_date',
        ]);

        // Validate patient ID exists in family members (in production, query database)
        $familyMembers = $this->getFamilyMembers();
        $patientExists = collect($familyMembers)->contains('id', $validated['patientId']);

        if (!$patientExists) {
            return back()->withErrors(['patientId' => 'Invalid patient selection'])->withInput();
        }

        // Check for emergency symptoms
        $emergencyKeywords = [
            'chest pain' => 'cardiac',
            'heart attack' => 'cardiac',
            'can\'t breathe' => 'respiratory',
            'difficulty breathing' => 'respiratory',
            'severe bleeding' => 'trauma',
            'unconscious' => 'neurological',
            'stroke' => 'neurological',
            'seizure' => 'neurological',
            'severe head injury' => 'trauma',
            'suicide' => 'psychiatric',
        ];

        $symptomsText = implode(' ', $validated['selectedSymptoms'] ?? []);
        if (isset($validated['symptomNotes'])) {
            $symptomsText .= ' ' . $validated['symptomNotes'];
        }
        $symptomsText = strtolower($symptomsText);

        foreach ($emergencyKeywords as $keyword => $category) {
            if (str_contains($symptomsText, $keyword)) {
                // Redirect with emergency warning
                return back()->withErrors([
                    'emergency' => 'We detected symptoms that may require immediate medical attention. Please call emergency services (911 or your local emergency number) or visit the nearest emergency room immediately.',
                    'emergency_category' => $category,
                ])->withInput();
            }
        }

        // If quick booking, validate doctor and time exist
        if ($validated['quickBookDoctorId'] && $validated['quickBookTime']) {
            // In production: validate doctor exists and time slot is available
            // For now, just ensure both are provided
            if (empty($validated['quickBookDoctorId']) || empty($validated['quickBookTime'])) {
                return back()->withErrors(['quickBook' => 'Invalid quick booking selection'])->withInput();
            }
        }

        session([
            'guided_doctor_booking' => array_merge(
                session('guided_doctor_booking', []),
                $validated
            ),
        ]);

        // If quick booking from previous appointment, skip to confirm
        if ($validated['quickBookDoctorId'] && $validated['quickBookTime']) {
            return redirect()->route('booking.doctor.confirm');
        }

        return redirect()->route('booking.doctor.doctor-time');
    }

    /**
     * Get family members (mock data - replace with database query in production)
     */
    protected function getFamilyMembers()
    {
        return [
            ['id' => '1', 'name' => 'Sanjana Jaisinghani', 'relationship' => 'Self', 'age' => 28],
            ['id' => '2', 'name' => 'Kriti Jaisinghani', 'relationship' => 'Mother', 'age' => 54],
            ['id' => '3', 'name' => 'Raj Jaisinghani', 'relationship' => 'Father', 'age' => 58],
        ];
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
        $searchQuery = $request->get('search', '');

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

        // Mock doctors data - vary based on selected date
        $allDoctors = [
            [
                'id' => 'd1',
                'name' => 'Dr. Sarah Johnson',
                'avatar' => null,
                'specialization' => 'General Physician',
                'experience_years' => 15,
                'appointment_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'available_dates' => [0, 1, 2, 3, 4], // Available all days
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '10:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
                    ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '5:00 PM', 'available' => true, 'preferred' => false],
                ],
            ],
            [
                'id' => 'd2',
                'name' => 'Dr. Michael Chen',
                'avatar' => null,
                'specialization' => 'Cardiologist',
                'experience_years' => 12,
                'appointment_modes' => ['video'],
                'video_fee' => 1500,
                'in_person_fee' => 0,
                'available_dates' => [0, 2, 4], // Available on days 0, 2, 4
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '10:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
                    ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '5:00 PM', 'available' => true, 'preferred' => false],
                ],
            ],
            [
                'id' => 'd3',
                'name' => 'Dr. Priya Sharma',
                'avatar' => null,
                'specialization' => 'Dermatologist',
                'experience_years' => 10,
                'appointment_modes' => ['in_person'],
                'video_fee' => 0,
                'in_person_fee' => 1800,
                'available_dates' => [0, 1, 2, 3, 4], // Available all days
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '10:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
                    ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '5:00 PM', 'available' => true, 'preferred' => false],
                ],
            ],
            [
                'id' => 'd4',
                'name' => 'Dr. Rajesh Kumar',
                'avatar' => null,
                'specialization' => 'Neurologist',
                'experience_years' => 12,
                'appointment_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'available_dates' => [0, 1, 2, 3, 4], // Available all days
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '10:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
                    ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '5:00 PM', 'available' => true, 'preferred' => false],
                ],
            ],
            [
                'id' => 'd5',
                'name' => 'Dr. Meera Iyer',
                'avatar' => null,
                'specialization' => 'Neurologist',
                'experience_years' => 9,
                'appointment_modes' => ['video'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'available_dates' => [0, 1, 2, 3, 4], // Available all days
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '10:00 AM', 'available' => true, 'preferred' => true],
                    ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
                    ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
                    ['time' => '5:00 PM', 'available' => true, 'preferred' => false],
                ],
            ],
        ];

        // Filter doctors based on selected date
        $selectedDateObj = \Carbon\Carbon::parse($selectedDate);
        $dayIndex = now()->startOfDay()->diffInDays($selectedDateObj->startOfDay());
        $doctors = array_values(array_filter($allDoctors, function ($doctor) use ($dayIndex) {
            return in_array($dayIndex, $doctor['available_dates']);
        }));

        // Apply fuzzy search if query provided
        if (!empty($searchQuery)) {
            $doctors = array_values(array_filter($doctors, function ($doctor) use ($searchQuery) {
                $doctorName = strtolower($doctor['name']);
                $query = strtolower($searchQuery);

                // Exact match
                if (str_contains($doctorName, $query)) {
                    return true;
                }

                // Fuzzy match with Levenshtein distance (2-character tolerance)
                $doctorNameClean = str_replace([' ', '.', 'dr'], '', $doctorName);
                $queryClean = str_replace([' ', '.', 'dr'], '', $query);

                if (strlen($queryClean) >= 3) {
                    $distance = levenshtein($queryClean, $doctorNameClean);
                    if ($distance <= 2) {
                        return true;
                    }
                }

                return false;
            }));
        }

        // Remove the available_dates field before sending to frontend
        $doctors = array_map(function ($doctor) {
            unset($doctor['available_dates']);
            return $doctor;
        }, $doctors);

        // Get patient name for summary
        $patientName = null;
        if (isset($savedData['patientId'])) {
            $familyMembers = $this->getFamilyMembers();
            $patient = collect($familyMembers)->firstWhere('id', $savedData['patientId']);
            $patientName = $patient['name'] ?? null;
        }

        // Format symptoms for summary
        $symptomsText = null;
        if (isset($savedData['selectedSymptoms']) && !empty($savedData['selectedSymptoms'])) {
            // Get symptom names from IDs
            $allSymptoms = [
                ['id' => 's1', 'name' => 'Fever'],
                ['id' => 's2', 'name' => 'Cough'],
                ['id' => 's3', 'name' => 'Headache'],
                ['id' => 's4', 'name' => 'Body ache'],
                ['id' => 's5', 'name' => 'Fatigue'],
                ['id' => 's6', 'name' => 'Sore throat'],
                ['id' => 's7', 'name' => 'Nausea'],
                ['id' => 's8', 'name' => 'Dizziness'],
            ];
            $selectedSymptomNames = collect($allSymptoms)
                ->whereIn('id', $savedData['selectedSymptoms'])
                ->pluck('name')
                ->toArray();
            $symptomsText = implode(', ', $selectedSymptomNames);

            // Add notes if provided
            if (isset($savedData['symptomNotes']) && !empty($savedData['symptomNotes'])) {
                if (!empty($symptomsText)) {
                    $symptomsText .= ' - ' . $savedData['symptomNotes'];
                } else {
                    $symptomsText = $savedData['symptomNotes'];
                }
            }
        } elseif (isset($savedData['symptomNotes']) && !empty($savedData['symptomNotes'])) {
            $symptomsText = $savedData['symptomNotes'];
        }

        return Inertia::render('Booking/Doctor/DoctorTimeStep', [
            'availableDates' => $availableDates,
            'doctors' => $doctors,
            'patientName' => $patientName,
            'appointmentType' => $savedData['appointmentType'] ?? null,
            'followupReason' => $savedData['followupReason'] ?? null,
            'followupNotes' => $savedData['followupNotes'] ?? null,
            'symptoms' => $symptomsText,
            'savedData' => $savedData,
        ]);
    }

    /**
     * Store doctor and time selection
     */
    public function storeDoctorTime(Request $request)
    {
        $validated = $request->validate([
            'selectedDate' => 'required|date|after_or_equal:today',
            'selectedDoctorId' => 'required|string',
            'selectedTime' => 'required|string',
            'appointmentMode' => 'required|in:video,in_person',
        ]);

        $savedData = session('guided_doctor_booking', []);

        // Validate doctor exists and supports appointment mode
        $allDoctors = $this->getAllDoctorsData();
        $selectedDoctor = collect($allDoctors)->firstWhere('id', $validated['selectedDoctorId']);

        if (!$selectedDoctor) {
            return back()->withErrors(['selectedDoctorId' => 'Invalid doctor selection'])->withInput();
        }

        // Validate appointment mode is supported by doctor
        if (!in_array($validated['appointmentMode'], $selectedDoctor['appointment_modes'])) {
            return back()->withErrors([
                'appointmentMode' => "Dr. {$selectedDoctor['name']} does not offer {$validated['appointmentMode']} appointments"
            ])->withInput();
        }

        // Validate time slot is available for this doctor
        $timeSlot = collect($selectedDoctor['slots'])->firstWhere('time', $validated['selectedTime']);
        if (!$timeSlot || !$timeSlot['available']) {
            return back()->withErrors(['selectedTime' => 'This time slot is not available'])->withInput();
        }

        // Check for duplicate booking (mock check - in production, query actual bookings)
        $requestedDateTime = $validated['selectedDate'] . ' ' . $validated['selectedTime'];
        $requestedPatientId = $savedData['patientId'] ?? null;

        // In production: Check database for existing booking
        // $existingBooking = Booking::where('patient_id', $requestedPatientId)
        //     ->where('doctor_id', $validated['selectedDoctorId'])
        //     ->where('date', $validated['selectedDate'])
        //     ->where('time', $validated['selectedTime'])
        //     ->first();
        //
        // if ($existingBooking) {
        //     return back()->withErrors(['duplicate' => 'You already have an appointment at this time'])->withInput();
        // }

        session([
            'guided_doctor_booking' => array_merge(
                session('guided_doctor_booking', []),
                $validated
            ),
        ]);

        return redirect()->route('booking.doctor.confirm');
    }

    /**
     * Get all doctors data (mock - replace with database query in production)
     */
    protected function getAllDoctorsData()
    {
        return [
            [
                'id' => 'd1',
                'name' => 'Dr. Sarah Johnson',
                'specialization' => 'General Physician',
                'appointment_modes' => ['video', 'in_person'],
                'video_fee' => 800,
                'in_person_fee' => 1200,
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true],
                    ['time' => '10:00 AM', 'available' => true],
                    ['time' => '11:00 AM', 'available' => true],
                    ['time' => '2:00 PM', 'available' => true],
                    ['time' => '3:00 PM', 'available' => true],
                    ['time' => '5:00 PM', 'available' => true],
                ],
            ],
            [
                'id' => 'd2',
                'name' => 'Dr. Michael Chen',
                'specialization' => 'Cardiologist',
                'appointment_modes' => ['video'],
                'video_fee' => 1500,
                'in_person_fee' => 0,
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true],
                    ['time' => '10:00 AM', 'available' => true],
                    ['time' => '11:00 AM', 'available' => true],
                ],
            ],
            [
                'id' => 'd3',
                'name' => 'Dr. Priya Sharma',
                'specialization' => 'Dermatologist',
                'appointment_modes' => ['in_person'],
                'video_fee' => 0,
                'in_person_fee' => 1800,
                'slots' => [
                    ['time' => '9:00 AM', 'available' => true],
                    ['time' => '2:00 PM', 'available' => true],
                ],
            ],
        ];
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

        // Calculate fee based on appointment mode
        $fee = $savedData['appointmentMode'] === 'video' ? 800 : 1200;

        // Format datetime
        $datetime = $savedData['selectedDate'] . 'T' . str_replace(' ', '', $savedData['selectedTime']);

        $summary = [
            'doctor' => $doctor,
            'patient' => $patient,
            'datetime' => $datetime,
            'appointmentType' => $savedData['appointmentMode'] === 'video'
                ? 'Video Appointment'
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
