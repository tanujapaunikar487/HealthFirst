<?php

namespace App\Services\Booking;

use App\Models\LabCenter;
use App\Models\LabPackage;
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
     * Calculate total fee for a package + collection type.
     */
    public function calculateFee(?int $packageId, string $collectionType): int
    {
        $packagePrice = 0;
        if ($packageId) {
            $package = LabPackage::find($packageId);
            $packagePrice = $package ? $package->price : 0;
        }

        $collectionFee = 0;
        if ($collectionType === 'home') {
            $center = LabCenter::where('home_collection_available', true)->first();
            $collectionFee = $center ? $center->home_collection_fee : 0;
        }

        return $packagePrice + $collectionFee;
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
