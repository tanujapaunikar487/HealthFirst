<?php

namespace App\Http\Controllers;

use App\Models\FamilyMember;
use App\Models\LabCenter;
use App\Models\LabPackage;
use App\Models\LabTestType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GuidedLabController extends Controller
{
    /**
     * Show patient and test selection step
     */
    public function patientTest()
    {
        $savedData = session('guided_lab_booking', []);
        $user = Auth::user();

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

        // Urgency options
        $urgencyOptions = [
            [
                'value' => 'urgent',
                'label' => 'Urgent - Today',
                'description' => 'Only today\'s slots',
                'packagesCount' => LabPackage::where('is_active', true)->count(),
            ],
            [
                'value' => 'this_week',
                'label' => 'This Week',
                'description' => 'Next 7 days',
                'packagesCount' => LabPackage::where('is_active', true)->count(),
            ],
            [
                'value' => 'specific_date',
                'label' => 'Specific date',
                'description' => 'Choose your date',
                'packagesCount' => null,
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

        // Packages from database
        $packagesQuery = LabPackage::where('is_active', true);

        if (!empty($searchQuery)) {
            $search = strtolower($searchQuery);
            $packagesQuery->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"]);
        }

        $packages = $packagesQuery->get()->map(fn($p) => [
            'id' => 'p' . $p->id,
            'name' => $p->name,
            'description' => $p->description,
            'duration_hours' => $p->duration_hours,
            'tests_count' => $p->tests_count,
            'age_range' => $p->age_range,
            'price' => $p->price,
            'original_price' => $p->original_price,
            'is_recommended' => $p->is_popular,
            'requires_fasting' => $p->requires_fasting,
            'fasting_hours' => $p->fasting_hours,
        ])->toArray();

        // Locations from database
        $locations = LabCenter::where('is_active', true)
            ->get()
            ->flatMap(function ($center) {
                $items = [];
                if ($center->home_collection_available) {
                    $items[] = [
                        'type' => 'home',
                        'label' => 'Home Collection',
                        'description' => 'Sample collected at your home',
                        'address' => $center->address,
                        'distance' => $center->distance_km . ' km away',
                        'fee' => $center->home_collection_fee,
                    ];
                }
                $items[] = [
                    'type' => 'center',
                    'label' => 'Visit Center',
                    'description' => $center->name,
                    'address' => $center->address,
                    'distance' => $center->distance_km . ' km away',
                    'fee' => 0,
                ];
                return $items;
            })
            ->unique('type')
            ->values()
            ->toArray();

        // Available dates (next 5 days)
        $availableDates = [];
        for ($i = 0; $i < 5; $i++) {
            $date = now()->addDays($i);
            $availableDates[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D')),
                'sublabel' => $date->format('M d'),
            ];
        }

        // Lab time slots (morning preferred for fasting)
        $timeSlots = [
            ['time' => '6:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '7:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '8:00 AM', 'available' => true, 'preferred' => true],
            ['time' => '9:00 AM', 'available' => true, 'preferred' => false],
            ['time' => '10:00 AM', 'available' => true, 'preferred' => false],
            ['time' => '11:00 AM', 'available' => true, 'preferred' => false],
            ['time' => '2:00 PM', 'available' => true, 'preferred' => false],
            ['time' => '3:00 PM', 'available' => true, 'preferred' => false],
            ['time' => '4:00 PM', 'available' => true, 'preferred' => false],
        ];

        // Get patient name for summary
        $user = Auth::user();
        $patientName = null;
        if (isset($savedData['patientId'])) {
            $patient = FamilyMember::where('user_id', $user->id)
                ->where('id', $savedData['patientId'])
                ->first();
            $patientName = $patient?->name;
        }

        // Format test types for summary
        $testTypesText = null;
        if (isset($savedData['selectedTestTypes']) && !empty($savedData['selectedTestTypes'])) {
            $selectedTestNames = LabTestType::whereIn('slug', $savedData['selectedTestTypes'])
                ->pluck('name')
                ->toArray();
            $testTypesText = implode(', ', $selectedTestNames);

            if (isset($savedData['testNotes']) && !empty($savedData['testNotes'])) {
                $testTypesText .= (!empty($testTypesText) ? ' - ' : '') . $savedData['testNotes'];
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

        $user = Auth::user();

        // Get package from database
        $packageId = (int) str_replace('p', '', $savedData['selectedPackageId']);
        $package = LabPackage::find($packageId);

        // Get patient from database
        $patient = FamilyMember::where('user_id', $user->id)
            ->where('id', $savedData['patientId'])
            ->first();

        // Calculate fee
        $packagePrice = $package?->price ?? 0;
        $locationFee = 0;
        if ($savedData['selectedLocation'] === 'home') {
            $center = LabCenter::where('home_collection_available', true)->first();
            $locationFee = $center?->home_collection_fee ?? 250;
        }
        $totalFee = $packagePrice + $locationFee;

        // Format datetime
        $datetime = $savedData['selectedDate'] . 'T' . str_replace(' ', '', $savedData['selectedTime']);

        // Collection type and address
        $collection = $savedData['selectedLocation'] === 'home' ? 'Home Collection' : 'Visit Center';
        $center = LabCenter::where('is_active', true)->first();
        $address = $center?->address ?? 'Address not available';

        // Preparation instructions
        $prepInstructions = [];
        if ($package?->requires_fasting) {
            $prepInstructions = [
                "Fasting for {$package->fasting_hours}-" . ($package->fasting_hours + 2) . " hours required",
                'Water is allowed',
                'Avoid alcohol 24 hours before',
                'Continue regular medications unless advised otherwise',
            ];
        }

        $summary = [
            'package' => [
                'id' => $savedData['selectedPackageId'],
                'name' => $package?->name ?? 'Unknown Package',
            ],
            'patient' => [
                'id' => $savedData['patientId'],
                'name' => $patient?->name ?? 'Unknown',
                'avatar' => $patient?->avatar_url,
            ],
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

        // Clear session data
        session()->forget('guided_lab_booking');

        return redirect()->route('booking.confirmation', ['booking' => 'LAB-' . time()]);
    }
}
