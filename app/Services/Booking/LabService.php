<?php

namespace App\Services\Booking;

use App\Models\LabCenter;
use App\Models\LabPackage;
use App\Models\LabTestType;
use Illuminate\Support\Facades\Log;

/**
 * LabService
 *
 * Centralized lab data and package logic.
 * Queries the database for all lab information.
 */
class LabService
{
    /**
     * Get all active packages as arrays.
     */
    public function getAllPackages(): array
    {
        return LabPackage::where('is_active', true)
            ->orderByDesc('is_popular')
            ->orderBy('price')
            ->get()
            ->map(fn(LabPackage $p) => $this->packageToArray($p))
            ->toArray();
    }

    /**
     * Get package by ID.
     */
    public function getPackageById(int $id): ?array
    {
        $package = LabPackage::find($id);
        return $package ? $this->packageToArray($package) : null;
    }

    /**
     * Find package ID by name (case-insensitive partial match).
     */
    public function findPackageByName(string $name): ?int
    {
        $nameLower = strtolower(trim($name));

        $package = LabPackage::where('is_active', true)
            ->get()
            ->first(function (LabPackage $p) use ($nameLower) {
                $pkgNameLower = strtolower($p->name);
                return stripos($pkgNameLower, $nameLower) !== false
                    || stripos($nameLower, $pkgNameLower) !== false;
            });

        if ($package) {
            return $package->id;
        }

        // Try matching by slug
        $package = LabPackage::where('is_active', true)
            ->where('slug', 'like', "%{$nameLower}%")
            ->first();

        if ($package) {
            return $package->id;
        }

        Log::warning('LabService: package name not matched', [
            'search' => $name,
            'available' => LabPackage::where('is_active', true)->pluck('name')->toArray(),
        ]);

        return null;
    }

    /**
     * Get all active lab centers.
     */
    public function getAllCenters(): array
    {
        return LabCenter::where('is_active', true)
            ->orderBy('distance_km')
            ->get()
            ->map(fn(LabCenter $c) => $this->centerToArray($c))
            ->toArray();
    }

    /**
     * Get center by ID.
     */
    public function getCenterById(int $id): ?array
    {
        $center = LabCenter::find($id);
        return $center ? $this->centerToArray($center) : null;
    }

    /**
     * Get location options formatted for EmbeddedLocationSelector.
     */
    public function getLocationOptions(): array
    {
        $locations = [];

        // Home collection option (use first center with home collection)
        $homeCenter = LabCenter::where('is_active', true)
            ->where('home_collection_available', true)
            ->first();

        if ($homeCenter) {
            $locations[] = [
                'id' => 'home',
                'type' => 'home',
                'label' => 'Home Collection',
                'description' => 'Sample collected at your doorstep',
                'address' => 'Your registered address',
                'distance_km' => null,
                'fee' => $homeCenter->home_collection_fee ?? 0,
            ];
        }

        // Lab center options
        $centers = LabCenter::where('is_active', true)
            ->orderBy('distance_km')
            ->get();

        foreach ($centers as $center) {
            $locations[] = [
                'id' => 'center_' . $center->id,
                'type' => 'center',
                'label' => $center->name,
                'description' => $center->address,
                'address' => $center->address,
                'distance_km' => $center->distance_km,
                'fee' => 0,
            ];
        }

        return $locations;
    }

    /**
     * Calculate total fee for a package or test(s) + collection type.
     */
    public function calculateFee(?int $packageId, string $collectionType, ?array $testIds = null): int
    {
        $itemPrice = 0;
        if ($packageId) {
            $package = LabPackage::find($packageId);
            $itemPrice = $package ? $package->price : 0;
        } elseif (!empty($testIds)) {
            $itemPrice = LabTestType::whereIn('id', $testIds)->where('is_active', true)->sum('price');
        }

        $collectionFee = 0;
        if ($collectionType === 'home') {
            $center = LabCenter::where('home_collection_available', true)->first();
            $collectionFee = $center ? $center->home_collection_fee : 0;
        }

        return $itemPrice + $collectionFee;
    }

    /**
     * Search packages by keyword. Matches against name, description, slug.
     * Returns matching packages sorted by relevance score.
     */
    public function searchPackages(string $query): array
    {
        $queryLower = strtolower(trim($query));
        $keywords = preg_split('/\s+/', $queryLower);

        $packages = LabPackage::where('is_active', true)->get();
        $scored = [];

        // Common search aliases mapped to package slugs
        $aliases = [
            'diabetes' => ['diabetes-screening'],
            'sugar' => ['diabetes-screening'],
            'hba1c' => ['diabetes-screening'],
            'heart' => ['heart-health'],
            'cardiac' => ['heart-health'],
            'cholesterol' => ['heart-health'],
            'women' => ['womens-health'],
            'female' => ['womens-health'],
            'senior' => ['senior-citizen-health'],
            'elderly' => ['senior-citizen-health'],
            'full body' => ['complete-health-checkup'],
            'complete' => ['complete-health-checkup'],
            'comprehensive' => ['complete-health-checkup'],
            'basic' => ['basic-health-panel'],
            'routine' => ['basic-health-panel'],
            'general' => ['basic-health-panel', 'complete-health-checkup'],
            'blood' => ['basic-health-panel', 'complete-health-checkup'],
            'checkup' => ['complete-health-checkup', 'basic-health-panel'],
            'health' => ['complete-health-checkup', 'basic-health-panel'],
        ];

        foreach ($packages as $pkg) {
            $score = 0;
            $nameLower = strtolower($pkg->name);
            $descLower = strtolower($pkg->description ?? '');
            $slugLower = strtolower($pkg->slug);

            // Exact query match in name
            if (stripos($nameLower, $queryLower) !== false) {
                $score += 10;
            }

            // Keyword matching
            foreach ($keywords as $kw) {
                if (strlen($kw) < 3) continue;
                if (stripos($nameLower, $kw) !== false) $score += 5;
                if (stripos($descLower, $kw) !== false) $score += 2;
                if (stripos($slugLower, $kw) !== false) $score += 3;
            }

            // Alias matching
            foreach ($aliases as $alias => $slugs) {
                if (stripos($queryLower, $alias) !== false && in_array($pkg->slug, $slugs)) {
                    $score += 8;
                }
            }

            if ($score > 0) {
                $scored[] = ['package' => $this->packageToArray($pkg), 'score' => $score];
            }
        }

        usort($scored, fn($a, $b) => $b['score'] - $a['score']);

        return array_map(fn($s) => $s['package'], $scored);
    }

    /**
     * Get individual test by ID.
     */
    public function getTestById(int $id): ?array
    {
        $test = LabTestType::find($id);
        return $test ? $this->testToArray($test) : null;
    }

    /**
     * Search individual lab tests by keyword.
     * Returns matching tests sorted by relevance score.
     */
    public function searchTests(string $query): array
    {
        $queryLower = strtolower(trim($query));
        $keywords = preg_split('/\s+/', $queryLower);

        $tests = LabTestType::where('is_active', true)->get();
        $scored = [];

        $aliases = [
            'sugar' => ['blood-sugar-fasting', 'blood-sugar-pp'],
            'glucose' => ['blood-sugar-fasting', 'blood-sugar-pp'],
            'cbc' => ['complete-blood-count'],
            'blood count' => ['complete-blood-count'],
            'thyroid' => ['thyroid-profile'],
            'tsh' => ['thyroid-profile'],
            'lipid' => ['lipid-profile'],
            'cholesterol' => ['lipid-profile'],
            'liver' => ['liver-function-test'],
            'lft' => ['liver-function-test'],
            'kidney' => ['kidney-function-test'],
            'kft' => ['kidney-function-test'],
            'creatinine' => ['kidney-function-test'],
            'urine' => ['urine-routine'],
            'vitamin d' => ['vitamin-d'],
            'vitamin b12' => ['vitamin-b12'],
            'b12' => ['vitamin-b12'],
            'hba1c' => ['hba1c'],
            'iron' => ['iron-studies'],
            'ferritin' => ['iron-studies'],
            'crp' => ['crp'],
            'esr' => ['esr'],
            'uric acid' => ['uric-acid'],
            'electrolyte' => ['electrolytes'],
        ];

        foreach ($tests as $test) {
            $score = 0;
            $nameLower = strtolower($test->name);
            $descLower = strtolower($test->description ?? '');
            $slugLower = strtolower($test->slug);
            $catLower = strtolower($test->category ?? '');

            if (stripos($nameLower, $queryLower) !== false) {
                $score += 10;
            }

            foreach ($keywords as $kw) {
                if (strlen($kw) < 2) continue;
                if (stripos($nameLower, $kw) !== false) $score += 5;
                if (stripos($descLower, $kw) !== false) $score += 2;
                if (stripos($slugLower, $kw) !== false) $score += 3;
                if (stripos($catLower, $kw) !== false) $score += 3;
            }

            foreach ($aliases as $alias => $slugs) {
                if (stripos($queryLower, $alias) !== false && in_array($test->slug, $slugs)) {
                    $score += 8;
                }
            }

            if ($score > 0) {
                $scored[] = ['test' => $this->testToArray($test), 'score' => $score];
            }
        }

        usort($scored, fn($a, $b) => $b['score'] - $a['score']);

        return array_map(fn($s) => $s['test'], $scored);
    }

    /**
     * Format package list for the AI prompt.
     */
    public function formatForPrompt(): string
    {
        $packages = LabPackage::where('is_active', true)->get();

        $lines = [];
        foreach ($packages as $pkg) {
            $fasting = $pkg->requires_fasting
                ? "Fasting: {$pkg->fasting_hours}h"
                : 'No fasting';
            $popular = $pkg->is_popular ? ' [Popular]' : '';

            $lines[] = "{$pkg->id}. {$pkg->name} | {$pkg->tests_count} tests | ₹{$pkg->price} | {$fasting}{$popular}";
        }

        return implode("\n", $lines);
    }

    /**
     * Convert a LabPackage model to array format.
     */
    private function packageToArray(LabPackage $pkg): array
    {
        return [
            'id' => $pkg->id,
            'name' => $pkg->name,
            'slug' => $pkg->slug,
            'description' => $pkg->description,
            'price' => $pkg->price,
            'original_price' => $pkg->original_price,
            'tests_count' => $pkg->tests_count,
            'age_range' => $pkg->age_range,
            'duration_hours' => $pkg->duration_hours,
            'preparation_notes' => $pkg->preparation_notes,
            'requires_fasting' => (bool) $pkg->requires_fasting,
            'fasting_hours' => $pkg->fasting_hours,
            'is_popular' => (bool) $pkg->is_popular,
            'is_recommended' => (bool) $pkg->is_popular,
        ];
    }

    /**
     * Convert a LabTestType model to array format.
     */
    private function testToArray(LabTestType $test): array
    {
        return [
            'id' => $test->id,
            'name' => $test->name,
            'slug' => $test->slug,
            'description' => $test->description,
            'category' => $test->category,
            'price' => $test->price,
            'turnaround_hours' => $test->turnaround_hours,
            'preparation_instructions' => $test->preparation_instructions,
            'requires_fasting' => (bool) $test->requires_fasting,
            'fasting_hours' => $test->fasting_hours,
        ];
    }

    /**
     * Convert a LabCenter model to array format.
     */
    private function centerToArray(LabCenter $center): array
    {
        return [
            'id' => $center->id,
            'name' => $center->name,
            'address' => $center->address,
            'city' => $center->city,
            'rating' => (float) $center->rating,
            'distance_km' => $center->distance_km,
            'home_collection_available' => (bool) $center->home_collection_available,
            'home_collection_fee' => $center->home_collection_fee,
        ];
    }
}
