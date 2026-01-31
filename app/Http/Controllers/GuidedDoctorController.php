<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\EmergencyKeyword;
use App\Models\FamilyMember;
use App\Models\Symptom;
use App\Models\TimeSlot;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GuidedDoctorController extends Controller
{
    /**
     * Show concerns step (merged with patient selection)
     */
    public function patient()
    {
        $savedData = session('guided_doctor_booking', []);
        $user = Auth::user() ?? \App\User::first();

        // Family members from database
        $familyMembers = FamilyMember::where('user_id', $user->id)
            ->get()
            ->map(fn($m) => [
                'id' => (string) $m->id,
                'name' => $m->name,
                'avatar' => $m->avatar_url,
                'relationship' => ucfirst($m->relation),
                'age' => $m->age,
            ])
            ->toArray();

        // Previous appointments from database
        $previousConsultations = Appointment::where('user_id', $user->id)
            ->where('appointment_type', 'doctor')
            ->where('status', 'completed')
            ->with(['doctor.consultationModes'])
            ->orderByDesc('appointment_date')
            ->limit(5)
            ->get()
            ->map(function ($appt) {
                $doctor = $appt->doctor;
                $slots = $doctor
                    ? TimeSlot::where('doctor_id', $doctor->id)
                        ->whereDate('date', Carbon::today())
                        ->where('is_booked', false)
                        ->limit(6)
                        ->get()
                        ->map(fn($s) => [
                            'time' => Carbon::parse($s->start_time)->format('g:i A'),
                            'available' => true,
                            'preferred' => $s->is_preferred,
                        ])
                        ->toArray()
                    : [];

                return [
                    'id' => (string) $appt->id,
                    'patientId' => (string) $appt->family_member_id,
                    'doctor' => $doctor ? [
                        'id' => 'd' . $doctor->id,
                        'name' => $doctor->name,
                        'avatar' => $doctor->avatar_url,
                        'specialization' => $doctor->specialization,
                        'experience_years' => $doctor->experience_years,
                        'appointment_modes' => $doctor->consultationModes->pluck('mode')->toArray(),
                        'video_fee' => $doctor->consultationModes->firstWhere('mode', 'video')?->fee ?? 0,
                        'in_person_fee' => $doctor->consultationModes->firstWhere('mode', 'in_person')?->fee ?? 0,
                    ] : null,
                    'date' => $appt->appointment_date->format('Y-m-d'),
                    'symptoms' => $appt->symptoms ?? [],
                    'slots' => $slots,
                ];
            })
            ->toArray();

        // Symptoms from database
        $symptoms = Symptom::where('is_active', true)
            ->get()
            ->map(fn($s) => [
                'id' => 's' . $s->id,
                'name' => $s->name,
            ])
            ->toArray();

        // Follow-up reason options
        $followUpReasonOptions = [
            ['value' => 'scheduled', 'label' => 'Scheduled follow-up', 'description' => 'Doctor asked me to come back'],
            ['value' => 'new_concern', 'label' => 'New concern', 'description' => 'Something changed since last visit'],
            ['value' => 'ongoing_issue', 'label' => 'Ongoing issue', 'description' => "Symptoms haven't improved"],
        ];

        // Follow-up data from last appointment
        $followUp = null;
        if (isset($savedData['appointmentType']) && $savedData['appointmentType'] === 'followup') {
            $lastAppt = Appointment::where('user_id', $user->id)
                ->where('appointment_type', 'doctor')
                ->where('status', 'completed')
                ->with('doctor')
                ->orderByDesc('appointment_date')
                ->first();

            if ($lastAppt) {
                $followUp = [
                    'symptoms' => $lastAppt->symptoms ?? [],
                    'doctorName' => $lastAppt->doctor?->name ?? 'Unknown',
                    'date' => $lastAppt->appointment_date->format('M j, Y'),
                ];
            }
        }

        return Inertia::render('Booking/Doctor/PatientStep', [
            'familyMembers' => $familyMembers,
            'previousConsultations' => $previousConsultations,
            'symptoms' => $symptoms,
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
        ]);

        // Validate patient ID exists in family members
        $user = Auth::user() ?? \App\User::first();
        $patientExists = FamilyMember::where('user_id', $user->id)
            ->where('id', $validated['patientId'])
            ->exists();

        if (!$patientExists) {
            return back()->withErrors(['patientId' => 'Invalid patient selection'])->withInput();
        }

        // Check for emergency symptoms from database
        $emergencyKeywords = EmergencyKeyword::all()
            ->pluck('category', 'keyword')
            ->toArray();

        $symptomsText = implode(' ', $validated['selectedSymptoms'] ?? []);
        if (isset($validated['symptomNotes'])) {
            $symptomsText .= ' ' . $validated['symptomNotes'];
        }
        $symptomsText = strtolower($symptomsText);

        foreach ($emergencyKeywords as $keyword => $category) {
            if (str_contains($symptomsText, $keyword)) {
                return back()->withErrors([
                    'emergency' => 'We detected symptoms that may require immediate medical attention. Please call emergency services (911 or your local emergency number) or visit the nearest emergency room immediately.',
                    'emergency_category' => $category,
                ])->withInput();
            }
        }

        // If quick booking, validate doctor and time exist
        if ($validated['quickBookDoctorId'] && $validated['quickBookTime']) {
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
     * Show doctor and time selection step
     */
    public function doctorTime(Request $request)
    {
        $savedData = session('guided_doctor_booking', []);

        if (!isset($savedData['patientId'])) {
            return redirect()->route('booking.doctor.patient');
        }

        $selectedDate = $request->get('date', now()->toDateString());

        // Available dates (next 7 days) with doctor counts
        $availableDates = [];
        for ($i = 0; $i < 7; $i++) {
            $date = now()->addDays($i);
            $dayOfWeek = $date->dayOfWeek;
            $doctorCount = Doctor::where('is_active', true)
                ->whereHas('availabilities', fn($q) => $q->where('day_of_week', $dayOfWeek)->where('is_available', true))
                ->count();
            $availableDates[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D')),
                'sublabel' => $date->format('M d'),
                'doctorCount' => $doctorCount,
            ];
        }

        // Doctors available on selected date from database
        $dayOfWeek = Carbon::parse($selectedDate)->dayOfWeek;

        $doctorsQuery = Doctor::with(['consultationModes'])
            ->where('is_active', true)
            ->whereHas('availabilities', fn($q) => $q->where('day_of_week', $dayOfWeek)->where('is_available', true));

        // Apply search filter
        $searchQuery = $request->get('search', '');
        if (!empty($searchQuery)) {
            $search = strtolower($searchQuery);
            $doctorsQuery->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(specialization) LIKE ?', ["%{$search}%"]);
            });
        }

        $doctors = $doctorsQuery->get()->map(function ($doctor) use ($selectedDate) {
            $slots = TimeSlot::where('doctor_id', $doctor->id)
                ->whereDate('date', $selectedDate)
                ->where('is_booked', false)
                ->orderBy('start_time')
                ->get()
                ->map(fn($s) => [
                    'time' => Carbon::parse($s->start_time)->format('g:i A'),
                    'available' => true,
                    'preferred' => $s->is_preferred,
                ])
                ->toArray();

            return [
                'id' => 'd' . $doctor->id,
                'name' => $doctor->name,
                'avatar' => $doctor->avatar_url,
                'specialization' => $doctor->specialization,
                'experience_years' => $doctor->experience_years,
                'appointment_modes' => $doctor->consultationModes->pluck('mode')->toArray(),
                'video_fee' => $doctor->consultationModes->firstWhere('mode', 'video')?->fee ?? 0,
                'in_person_fee' => $doctor->consultationModes->firstWhere('mode', 'in_person')?->fee ?? 0,
                'slots' => $slots,
            ];
        })->toArray();

        // Get patient name for summary
        $user = Auth::user() ?? \App\User::first();
        $patientName = null;
        if (isset($savedData['patientId'])) {
            $patient = FamilyMember::where('user_id', $user->id)
                ->where('id', $savedData['patientId'])
                ->first();
            $patientName = $patient?->name;
        }

        // Format symptoms for summary
        $symptomsText = null;
        if (isset($savedData['selectedSymptoms']) && !empty($savedData['selectedSymptoms'])) {
            $symptomIds = array_map(fn($s) => (int) str_replace('s', '', $s), $savedData['selectedSymptoms']);
            $selectedSymptomNames = Symptom::whereIn('id', $symptomIds)->pluck('name')->toArray();
            $symptomsText = implode(', ', $selectedSymptomNames);

            if (isset($savedData['symptomNotes']) && !empty($savedData['symptomNotes'])) {
                $symptomsText .= (!empty($symptomsText) ? ' - ' : '') . $savedData['symptomNotes'];
            }
        } elseif (isset($savedData['symptomNotes']) && !empty($savedData['symptomNotes'])) {
            $symptomsText = $savedData['symptomNotes'];
        }

        // Urgency options with dynamic doctor count
        $urgencyOptions = [
            [
                'value' => 'urgent',
                'label' => 'Urgent - Today',
                'description' => "Only today's slots",
                'doctorCount' => Doctor::where('is_active', true)
                    ->whereHas('availabilities', fn($q) => $q->where('day_of_week', Carbon::today()->dayOfWeek)->where('is_available', true))
                    ->count(),
            ],
            [
                'value' => 'this_week',
                'label' => 'This Week',
                'description' => 'Next 7 days',
                'doctorCount' => Doctor::where('is_active', true)->count(),
            ],
            [
                'value' => 'specific_date',
                'label' => 'Specific date',
                'description' => 'Choose your date',
            ],
        ];

        return Inertia::render('Booking/Doctor/DoctorTimeStep', [
            'availableDates' => $availableDates,
            'doctors' => $doctors,
            'urgencyOptions' => $urgencyOptions,
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
            'urgency' => 'required|in:urgent,this_week,specific_date',
            'selectedDate' => 'required|date|after_or_equal:today|before_or_equal:' . now()->addDays(14)->format('Y-m-d'),
            'selectedDoctorId' => 'required|string',
            'selectedTime' => 'required|string',
            'appointmentMode' => 'required|in:video,in_person',
        ]);

        // Extract numeric doctor ID
        $doctorId = (int) str_replace('d', '', $validated['selectedDoctorId']);
        $doctor = Doctor::with('consultationModes')->find($doctorId);

        if (!$doctor) {
            return back()->withErrors(['selectedDoctorId' => 'Invalid doctor selection'])->withInput();
        }

        // Validate appointment mode is supported
        $supportedModes = $doctor->consultationModes->pluck('mode')->toArray();
        if (!in_array($validated['appointmentMode'], $supportedModes)) {
            return back()->withErrors([
                'appointmentMode' => "{$doctor->name} does not offer {$validated['appointmentMode']} appointments"
            ])->withInput();
        }

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

        $user = Auth::user() ?? \App\User::first();

        // Get doctor from database
        $doctorId = (int) str_replace('d', '', $savedData['selectedDoctorId']);
        $doctor = Doctor::with('consultationModes')->find($doctorId);

        // Get patient from database
        $patient = FamilyMember::where('user_id', $user->id)
            ->where('id', $savedData['patientId'])
            ->first();

        // Calculate fee
        $fee = $doctor?->consultationModes
            ->firstWhere('mode', $savedData['appointmentMode'] ?? 'video')
            ?->fee ?? 0;

        // Format datetime
        $datetime = $savedData['selectedDate'] . 'T' . str_replace(' ', '', $savedData['selectedTime']);

        $summary = [
            'doctor' => [
                'id' => $savedData['selectedDoctorId'],
                'name' => $doctor?->name ?? 'Unknown',
                'avatar' => $doctor?->avatar_url,
            ],
            'patient' => [
                'id' => $savedData['patientId'],
                'name' => $patient?->name ?? 'Unknown',
                'avatar' => $patient?->avatar_url,
            ],
            'datetime' => $datetime,
            'appointmentType' => ($savedData['appointmentMode'] ?? 'video') === 'video'
                ? 'Video Appointment'
                : 'In-Person Visit',
            'fee' => $fee,
        ];

        return Inertia::render('Booking/Doctor/ConfirmStep', [
            'summary' => $summary,
        ]);
    }

    /**
     * Add a new family member (AJAX endpoint)
     */
    public function addFamilyMember(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'relation' => 'required|string|in:mother,father,brother,sister,son,daughter,spouse,grandmother,grandfather,friend,other',
            'age' => 'nullable|integer|min:0|max:120',
            'gender' => 'nullable|string|in:male,female,other',
        ]);

        $user = Auth::user() ?? \App\User::first();

        $member = FamilyMember::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'relation' => $validated['relation'],
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
        ]);

        return response()->json([
            'id' => (string) $member->id,
            'name' => $member->name,
            'avatar' => null,
            'relationship' => ucfirst($member->relation),
        ]);
    }

    /**
     * Process payment and create booking
     */
    public function processPayment(Request $request)
    {
        $savedData = session('guided_doctor_booking', []);

        // Clear session data
        session()->forget('guided_doctor_booking');

        return redirect()->route('booking.confirmation', ['booking' => 'DOC-' . time()]);
    }
}
