<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class GuidedLabController extends Controller
{
    /**
     * Show patient and test selection step
     */
    public function patientTest()
    {
        $savedData = session('guided_lab_booking', []);

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

        // Mock urgency options
        $urgencyOptions = [
            [
                'value' => 'urgent',
                'label' => 'Urgent - Today',
                'description' => 'Only today\'s slots',
                'packagesCount' => 3,
            ],
            [
                'value' => 'this_week',
                'label' => 'This Week',
                'description' => 'Next 7 days',
                'packagesCount' => 8,
            ],
            [
                'value' => 'specific_date',
                'label' => 'Specific date',
                'description' => 'Choose your date',
                'packagesCount' => null, // Full flexibility
            ],
        ];

        return Inertia::render('Booking/Lab/PatientTestStep', [
            'familyMembers' => $familyMembers,
            'urgencyOptions' => $urgencyOptions,
            'savedData' => $savedData,
        ]);
    }

    /**
     * Store patient and test selection
     */
    public function storePatientTest(Request $request)
    {
        $validated = $request->validate([
            'patientId' => 'required|string',
            'selectedTestTypes' => 'array',
            'selectedTestTypes.*' => 'string',
            'testNotes' => 'nullable|string|max:1000',
            'urgency' => 'required|string|in:urgent,this_week,specific_date',
        ]);

        session([
            'guided_lab_booking' => array_merge(
                session('guided_lab_booking', []),
                $validated
            ),
        ]);

        return redirect()->route('booking.lab.packages-schedule');
    }

    /**
     * Show packages and schedule selection step
     */
    public function packagesSchedule(Request $request)
    {
        $savedData = session('guided_lab_booking', []);

        if (!isset($savedData['patientId'])) {
            return redirect()->route('booking.lab.patient-test');
        }

        $selectedDate = $request->get('date', now()->toDateString());
        $searchQuery = $request->get('search', '');

        // Mock packages data
        $packages = [
            [
                'id' => 'p1',
                'name' => 'Complete Health Checkup',
                'description' => 'Comprehensive tests for overall health assessment',
                'duration_hours' => '2-3',
                'tests_count' => 72,
                'age_range' => '18-60',
                'price' => 4999,
                'original_price' => 5999,
                'is_recommended' => true,
                'requires_fasting' => true,
                'fasting_hours' => 10,
            ],
            [
                'id' => 'p2',
                'name' => 'Diabetes Screening Package',
                'description' => 'Blood sugar, HbA1c, and related tests',
                'duration_hours' => '1-2',
                'tests_count' => 24,
                'age_range' => '25+',
                'price' => 1499,
                'original_price' => 1999,
                'is_recommended' => false,
                'requires_fasting' => true,
                'fasting_hours' => 8,
            ],
            [
                'id' => 'p3',
                'name' => 'Basic Health Panel',
                'description' => 'Essential tests for routine health monitoring',
                'duration_hours' => '1',
                'tests_count' => 40,
                'age_range' => '18+',
                'price' => 2499,
                'original_price' => 2999,
                'is_recommended' => false,
                'requires_fasting' => false,
                'fasting_hours' => null,
            ],
        ];

        // Mock location options
        $locations = [
            [
                'type' => 'home',
                'label' => 'Home Collection',
                'description' => 'Sample collected at your home',
                'address' => '123, Palm Grove, Koregaon Park',
                'distance' => '2.5 km away',
                'fee' => 250,
            ],
            [
                'type' => 'center',
                'label' => 'Visit Center',
                'description' => 'Visit our diagnostic center',
                'address' => '456 Health Street, Mumbai',
                'distance' => '1.2 km away',
                'fee' => 0,
            ],
        ];

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

        // Mock time slots (morning slots preferred for fasting tests)
        $timeSlots = [
            ['time' => '6:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '7:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '8:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '9:00 AM', 'available' => true, 'preferred' => false],
            ['time' => '10:00 AM', 'available' => false, 'preferred' => false],
            ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
            ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
            ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
            ['time' => '4:00 PM', 'available' => false, 'preferred' => false],
        ];

        // Apply fuzzy search if query provided
        if (!empty($searchQuery)) {
            $packages = array_values(array_filter($packages, function ($package) use ($searchQuery) {
                $packageName = strtolower($package['name']);
                $query = strtolower($searchQuery);

                // Exact match
                if (str_contains($packageName, $query)) {
                    return true;
                }

                // Fuzzy match with Levenshtein distance (3-character tolerance for package names)
                if (strlen($query) >= 4) {
                    $distance = levenshtein($query, $packageName);
                    if ($distance <= 3) {
                        return true;
                    }
                }

                return false;
            }));
        }

        // Get patient name for summary
        $patientName = null;
        if (isset($savedData['patientId'])) {
            $familyMembers = $this->getFamilyMembers();
            $patient = collect($familyMembers)->firstWhere('id', $savedData['patientId']);
            $patientName = $patient['name'] ?? null;
        }

        // Format test types for summary
        $testTypesText = null;
        if (isset($savedData['selectedTestTypes']) && !empty($savedData['selectedTestTypes'])) {
            // Get test type names from IDs
            $allTestTypes = [
                ['id' => 'annual_checkup', 'name' => 'Annual checkup'],
                ['id' => 'diabetes_screening', 'name' => 'Diabetes screening'],
                ['id' => 'heart_health', 'name' => 'Heart health check'],
                ['id' => 'thyroid_profile', 'name' => 'Thyroid profile'],
                ['id' => 'kidney_function', 'name' => 'Kidney function'],
                ['id' => 'liver_function', 'name' => 'Liver function'],
                ['id' => 'lipid_profile', 'name' => 'Lipid profile'],
            ];
            $selectedTestNames = collect($allTestTypes)
                ->whereIn('id', $savedData['selectedTestTypes'])
                ->pluck('name')
                ->toArray();
            $testTypesText = implode(', ', $selectedTestNames);

            // Add notes if provided
            if (isset($savedData['testNotes']) && !empty($savedData['testNotes'])) {
                if (!empty($testTypesText)) {
                    $testTypesText .= ' - ' . $savedData['testNotes'];
                } else {
                    $testTypesText = $savedData['testNotes'];
                }
            }
        } elseif (isset($savedData['testNotes']) && !empty($savedData['testNotes'])) {
            $testTypesText = $savedData['testNotes'];
        }

        return Inertia::render('Booking/Lab/PackagesScheduleStep', [
            'packages' => $packages,
            'locations' => $locations,
            'availableDates' => $availableDates,
            'timeSlots' => $timeSlots,
            'patientName' => $patientName,
            'testTypes' => $testTypesText,
            'savedData' => $savedData,
        ]);
    }

    /**
     * Store packages and schedule selection
     */
    public function storePackagesSchedule(Request $request)
    {
        $validated = $request->validate([
            'selectedPackageId' => 'required|string',
            'selectedLocation' => 'required|in:home,center',
            'selectedDate' => 'required|date',
            'selectedTime' => 'required|string',
        ]);

        $savedData = session('guided_lab_booking', []);

        // Check for duplicate booking (mock check - in production, query actual bookings)
        // For demo purposes, simulate checking previous lab bookings
        $requestedDateTime = $validated['selectedDate'] . ' ' . $validated['selectedTime'];
        $requestedPatientId = $savedData['patientId'] ?? null;

        // Mock existing bookings check
        // In production: $existingBooking = LabBooking::where('patient_id', $requestedPatientId)
        //     ->where('date', $validated['selectedDate'])
        //     ->where('time', $validated['selectedTime'])
        //     ->first();

        // For now, we'll skip actual duplicate check in guided flow
        // but the logic structure is here for production implementation

        session([
            'guided_lab_booking' => array_merge(
                session('guided_lab_booking', []),
                $validated
            ),
        ]);

        return redirect()->route('booking.lab.confirm');
    }

    /**
     * Show confirmation step
     */
    public function confirm()
    {
        $savedData = session('guided_lab_booking', []);

        if (!isset($savedData['selectedPackageId'])) {
            return redirect()->route('booking.lab.packages-schedule');
        }

        // Mock package data
        $packageName = match ($savedData['selectedPackageId']) {
            'p1' => 'Complete Health Checkup',
            'p2' => 'Diabetes Screening Package',
            'p3' => 'Basic Health Panel',
            default => 'Basic Health Checkup',
        };

        // Mock patient data
        $patient = [
            'id' => $savedData['patientId'],
            'name' => 'Kriti Jaisinghani',
            'avatar' => null,
        ];

        // Calculate fee (package price + location fee)
        $packagePrice = match ($savedData['selectedPackageId']) {
            'p1' => 4999,
            'p2' => 1499,
            'p3' => 2499,
            default => 4999,
        };
        $locationFee = $savedData['selectedLocation'] === 'home' ? 250 : 0;
        $totalFee = $packagePrice + $locationFee;

        // Format datetime
        $datetime = $savedData['selectedDate'] . 'T' . str_replace(' ', '', $savedData['selectedTime']);

        // Collection type and address
        $collection = $savedData['selectedLocation'] === 'home' ? 'Home Collection' : 'Visit Center';
        $address = $savedData['selectedLocation'] === 'home'
            ? '123, Palm Grove, Koregaon Park'
            : '456 Health Street, Mumbai';

        // Mock preparation instructions
        $requiresFasting = in_array($savedData['selectedPackageId'], ['p1', 'p2']);
        $prepInstructions = $requiresFasting
            ? [
                'Fasting for 10-12 hours required',
                'Water is allowed',
                'Avoid alcohol 24 hours before',
                'Continue regular medications unless advised otherwise',
            ]
            : [];

        $summary = [
            'package' => [
                'id' => $savedData['selectedPackageId'],
                'name' => $packageName,
            ],
            'patient' => $patient,
            'datetime' => $datetime,
            'collection' => $collection,
            'address' => $address,
            'fee' => $totalFee,
            'prepInstructions' => $prepInstructions,
        ];

        return Inertia::render('Booking/Lab/ConfirmStep', [
            'summary' => $summary,
        ]);
    }

    /**
     * Process payment and create booking
     */
    public function processPayment(Request $request)
    {
        $savedData = session('guided_lab_booking', []);

        // In production, create booking record and initiate payment
        // For now, redirect to mock confirmation

        // Clear session data
        session()->forget('guided_lab_booking');

        return redirect()->route('booking.confirmation', ['booking' => 'LAB-' . time()]);
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
}
