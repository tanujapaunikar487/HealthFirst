<?php

namespace App\Http\Controllers;

use App\Models\FamilyMember;
use App\Models\LabCenter;
use App\Models\LabPackage;
use App\Models\LabTestType;
use App\Models\UserAddress;
use App\Services\Booking\LabService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GuidedLabController extends Controller
{
    // ─── Step 1: Patient Selection ───────────────────────────────────

    public function patient()
    {
        $savedData = session('guided_lab_booking', []);
        $user = Auth::user() ?? \App\User::first();

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

        return Inertia::render('Booking/Lab/PatientStep', [
            'familyMembers' => $familyMembers,
            'savedData' => $savedData,
        ]);
    }

    public function storePatient(Request $request)
    {
        $validated = $request->validate([
            'patientId' => 'required|string',
        ]);

        session([
            'guided_lab_booking' => array_merge(
                session('guided_lab_booking', []),
                $validated
            ),
        ]);

        return redirect()->route('booking.lab.test-search');
    }

    // ─── Step 2: Test / Package Search ───────────────────────────────

    public function testSearch()
    {
        $savedData = session('guided_lab_booking', []);

        if (!isset($savedData['patientId'])) {
            return redirect()->route('booking.lab.patient');
        }

        return Inertia::render('Booking/Lab/TestSearchStep', [
            'savedData' => $savedData,
        ]);
    }

    public function storeTestSearch(Request $request)
    {
        $validated = $request->validate([
            'selectedPackageId' => 'nullable|integer',
            'selectedPackageName' => 'nullable|string',
            'selectedTestIds' => 'nullable|array',
            'selectedTestIds.*' => 'integer',
            'selectedTestNames' => 'nullable|array',
            'selectedTestNames.*' => 'string',
            'searchQuery' => 'nullable|string',
        ]);

        if (empty($validated['selectedPackageId']) && empty($validated['selectedTestIds'])) {
            return back()->withErrors(['selection' => 'Please select a package or at least one test']);
        }

        session([
            'guided_lab_booking' => array_merge(
                session('guided_lab_booking', []),
                $validated
            ),
        ]);

        return redirect()->route('booking.lab.schedule');
    }

    /**
     * AJAX: Search packages and individual tests by keyword.
     */
    public function searchTests(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:200',
        ]);

        $labService = app(LabService::class);
        $query = $validated['query'];

        $packages = $labService->searchPackages($query);
        $tests = $labService->searchTests($query);

        // Collect all test IDs from packages to resolve names in one query
        $allTestIds = [];
        foreach ($packages as $p) {
            if (!empty($p['test_ids'])) {
                $allTestIds = array_merge($allTestIds, $p['test_ids']);
            }
        }
        $testNameMap = [];
        if (!empty($allTestIds)) {
            $testNameMap = LabTestType::whereIn('id', array_unique($allTestIds))
                ->where('is_active', true)
                ->pluck('name', 'id')
                ->toArray();
        }

        $formattedPackages = array_map(function ($p) use ($testNameMap) {
            $includedTestNames = [];
            if (!empty($p['test_ids'])) {
                foreach ($p['test_ids'] as $tid) {
                    if (isset($testNameMap[$tid])) {
                        $includedTestNames[] = $testNameMap[$tid];
                    }
                }
            }
            return [
                'id' => (string) $p['id'],
                'name' => $p['name'],
                'description' => $p['description'] ?? '',
                'duration_hours' => $p['duration_hours'] ?? null,
                'tests_count' => $p['tests_count'] ?? 0,
                'age_range' => $p['age_range'] ?? null,
                'price' => $p['price'],
                'original_price' => $p['original_price'] ?? $p['price'],
                'is_recommended' => $p['is_recommended'] ?? false,
                'preparation_notes' => $p['preparation_notes'] ?? null,
                'requires_fasting' => $p['requires_fasting'] ?? false,
                'fasting_hours' => $p['fasting_hours'] ?? null,
                'included_test_names' => $includedTestNames,
            ];
        }, $packages);

        $formattedTests = array_map(fn($t) => [
            'id' => (string) $t['id'],
            'name' => $t['name'],
            'description' => $t['description'] ?? '',
            'category' => $t['category'] ?? '',
            'price' => $t['price'],
            'turnaround_hours' => $t['turnaround_hours'] ?? null,
            'requires_fasting' => $t['requires_fasting'] ?? false,
            'fasting_hours' => $t['fasting_hours'] ?? null,
        ], $tests);

        // Detect if query looks like symptoms rather than test names
        $symptomKeywords = [
            'nausea', 'nauseated', 'vomiting', 'headache', 'fatigue', 'tired',
            'weakness', 'fever', 'pain', 'weight', 'hair loss', 'hair fall',
            'urination', 'acne', 'skin', 'pale', 'anemia', 'swelling',
            'numbness', 'tingling', 'dizziness', 'dizzy', 'thirst', 'itching',
            'breathless', 'feel', 'suffering', 'symptom', 'problem', 'ache',
        ];
        $queryLower = strtolower($query);
        $isSymptomQuery = false;
        foreach ($symptomKeywords as $symptom) {
            if (stripos($queryLower, $symptom) !== false) {
                $isSymptomQuery = true;
                break;
            }
        }

        return response()->json([
            'packages' => $formattedPackages,
            'individual_tests' => $formattedTests,
            'query' => $query,
            'isSymptomQuery' => $isSymptomQuery,
        ]);
    }

    // ─── Step 3: Schedule (Urgency + Location + Date/Time) ──────────

    public function schedule(Request $request)
    {
        $savedData = session('guided_lab_booking', []);

        if (!isset($savedData['patientId'])) {
            return redirect()->route('booking.lab.patient');
        }

        $hasPackage = !empty($savedData['selectedPackageId']);
        $hasTests = !empty($savedData['selectedTestIds']);

        if (!$hasPackage && !$hasTests) {
            return redirect()->route('booking.lab.test-search');
        }

        // Fasting info for FastingAlert
        $requiresFasting = false;
        $fastingHours = null;

        if ($hasPackage) {
            $pkg = LabPackage::find($savedData['selectedPackageId']);
            if ($pkg) {
                $requiresFasting = (bool) $pkg->requires_fasting;
                $fastingHours = $pkg->fasting_hours;
            }
        } elseif ($hasTests) {
            $tests = LabTestType::whereIn('id', $savedData['selectedTestIds'])->where('is_active', true)->get();
            $maxFasting = $tests->where('requires_fasting', true)->max('fasting_hours');
            if ($maxFasting) {
                $requiresFasting = true;
                $fastingHours = $maxFasting;
            }
        }

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

        // Available dates (next 14 days)
        $availableDates = [];
        for ($i = 0; $i < 14; $i++) {
            $date = now()->addDays($i);
            $availableDates[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : $date->format('D')),
                'sublabel' => $date->format('M d'),
            ];
        }

        // Lab time slots
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

        // User addresses for home collection
        $user = Auth::user() ?? \App\User::first();
        $userAddresses = UserAddress::where('user_id', $user->id)
            ->where('is_active', true)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'label' => $a->label,
                'address' => $a->getFullAddress(),
                'is_default' => (bool) $a->is_default,
            ])
            ->toArray();

        // Lab centers for hospital visit
        $labCenters = LabCenter::where('is_active', true)
            ->orderBy('distance_km')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'address' => $c->address,
                'city' => $c->city,
                'rating' => (float) $c->rating,
                'distance_km' => $c->distance_km,
            ])
            ->toArray();

        return Inertia::render('Booking/Lab/ScheduleStep', [
            'locations' => $locations,
            'availableDates' => $availableDates,
            'timeSlots' => $timeSlots,
            'userAddresses' => $userAddresses,
            'labCenters' => $labCenters,
            'savedData' => $savedData,
            'requiresFasting' => $requiresFasting,
            'fastingHours' => $fastingHours,
        ]);
    }

    public function storeSchedule(Request $request)
    {
        $validated = $request->validate([
            'selectedLocation' => 'required|in:home,center',
            'selectedDate' => 'required|date|after_or_equal:today|before_or_equal:' . now()->addDays(14)->format('Y-m-d'),
            'selectedTime' => 'required|string',
            'selectedAddressId' => 'nullable|integer|exists:user_addresses,id',
            'selectedCenterId' => 'nullable|integer|exists:lab_centers,id',
        ]);

        // Validate that home collection has an address and center visit has a center
        if ($validated['selectedLocation'] === 'home' && empty($validated['selectedAddressId'])) {
            return back()->withErrors(['selectedAddressId' => 'Please select an address for home collection'])->withInput();
        }
        if ($validated['selectedLocation'] === 'center' && empty($validated['selectedCenterId'])) {
            return back()->withErrors(['selectedCenterId' => 'Please select a lab center'])->withInput();
        }

        session([
            'guided_lab_booking' => array_merge(
                session('guided_lab_booking', []),
                $validated
            ),
        ]);

        return redirect()->route('booking.lab.confirm');
    }

    // ─── Step 4: Confirm ─────────────────────────────────────────────

    public function confirm()
    {
        $savedData = session('guided_lab_booking', []);

        $hasPackage = !empty($savedData['selectedPackageId']);
        $hasTests = !empty($savedData['selectedTestIds']);

        if (!$hasPackage && !$hasTests) {
            return redirect()->route('booking.lab.test-search');
        }

        $user = Auth::user() ?? \App\User::first();

        $patient = FamilyMember::where('user_id', $user->id)
            ->where('id', $savedData['patientId'])
            ->first();

        $itemPrice = 0;
        $itemName = 'Unknown';
        $isTests = false;
        $prepInstructions = [];

        if ($hasTests) {
            $isTests = true;
            $testIds = $savedData['selectedTestIds'];
            $testNames = $savedData['selectedTestNames'] ?? [];
            $tests = LabTestType::whereIn('id', $testIds)->where('is_active', true)->get();
            $itemPrice = $tests->sum('price');
            $itemName = !empty($testNames) ? implode(', ', $testNames) : $tests->pluck('name')->implode(', ');

            $maxFasting = $tests->where('requires_fasting', true)->max('fasting_hours');
            if ($maxFasting) {
                $prepInstructions = [
                    "Fasting for {$maxFasting}-" . ($maxFasting + 2) . " hours required",
                    'Water is allowed',
                    'Avoid alcohol 24 hours before',
                    'Continue regular medications unless advised otherwise',
                ];
            }
        } elseif ($hasPackage) {
            $packageId = (int) $savedData['selectedPackageId'];
            $package = LabPackage::find($packageId);
            $itemPrice = $package?->price ?? 0;
            $itemName = $package?->name ?? 'Unknown Package';

            if ($package?->requires_fasting) {
                $prepInstructions = [
                    "Fasting for {$package->fasting_hours}-" . ($package->fasting_hours + 2) . " hours required",
                    'Water is allowed',
                    'Avoid alcohol 24 hours before',
                    'Continue regular medications unless advised otherwise',
                ];
            }
        }

        $locationFee = 0;
        $collection = 'Visit Center';
        $address = 'Address not available';

        if (($savedData['selectedLocation'] ?? '') === 'home') {
            $homeCenter = LabCenter::where('home_collection_available', true)->first();
            $locationFee = $homeCenter?->home_collection_fee ?? 250;
            $collection = 'Home Collection';

            // Resolve actual address
            if (!empty($savedData['selectedAddressId'])) {
                $userAddress = UserAddress::find($savedData['selectedAddressId']);
                $address = $userAddress ? $userAddress->getFullAddress() : 'Address not available';
            }
        } else {
            // Resolve center details
            if (!empty($savedData['selectedCenterId'])) {
                $selectedCenter = LabCenter::find($savedData['selectedCenterId']);
                $collection = 'Visit Center — ' . ($selectedCenter?->name ?? 'Unknown');
                $address = $selectedCenter?->address ?? 'Address not available';
            } else {
                $fallbackCenter = LabCenter::where('is_active', true)->first();
                $address = $fallbackCenter?->address ?? 'Address not available';
            }
        }

        $totalFee = $itemPrice + $locationFee;

        $datetime = $savedData['selectedDate'] . 'T' . str_replace(' ', '', $savedData['selectedTime']);

        $summary = [
            'package' => [
                'id' => $savedData['selectedPackageId'] ?? null,
                'name' => $itemName,
                'isTests' => $isTests,
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
     * AJAX: Add a new user address.
     */
    public function addAddress(Request $request)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:50',
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'pincode' => 'required|string|max:10',
        ]);

        $user = Auth::user() ?? \App\User::first();

        $addr = UserAddress::create([
            'user_id' => $user->id,
            'label' => $validated['label'],
            'address_line_1' => $validated['address_line_1'],
            'address_line_2' => $validated['address_line_2'] ?? null,
            'city' => $validated['city'],
            'state' => $validated['state'],
            'pincode' => $validated['pincode'],
            'is_default' => false,
            'is_active' => true,
        ]);

        return response()->json([
            'id' => $addr->id,
            'label' => $addr->label,
            'address' => $addr->getFullAddress(),
            'is_default' => false,
        ]);
    }

    public function processPayment(Request $request)
    {
        session()->forget('guided_lab_booking');

        return redirect()->route('booking.confirmation', ['booking' => 'LAB-' . time()]);
    }
}
