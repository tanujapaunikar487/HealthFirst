<?php

namespace App\Services\Booking;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * DoctorService
 *
 * Centralized doctor data and availability logic.
 * In production, this would query the database.
 * Currently uses mock data matching the existing booking system.
 */
class DoctorService
{
    /**
     * All doctor records (mock data).
     * Single source of truth — replaces duplicated arrays across the orchestrator.
     */
    protected array $doctors = [
        1 => [
            'id' => 1,
            'name' => 'Dr. Sarah Johnson',
            'avatar' => '/assets/avatars/doctor1.jpg',
            'specialization' => 'General Physician',
            'experience_years' => 12,
            'consultation_modes' => ['video', 'in_person'],
            'video_fee' => 800,
            'in_person_fee' => 1200,
        ],
        2 => [
            'id' => 2,
            'name' => 'Dr. Emily Chen',
            'avatar' => '/assets/avatars/doctor2.jpg',
            'specialization' => 'Cardiologist',
            'experience_years' => 18,
            'consultation_modes' => ['video', 'in_person'],
            'video_fee' => 1200,
            'in_person_fee' => 1500,
        ],
        3 => [
            'id' => 3,
            'name' => 'Dr. Rajesh Kumar',
            'avatar' => '/assets/avatars/doctor3.jpg',
            'specialization' => 'Pediatrician',
            'experience_years' => 10,
            'consultation_modes' => ['video', 'in_person'],
            'video_fee' => 700,
            'in_person_fee' => 1000,
        ],
        4 => [
            'id' => 4,
            'name' => 'Dr. Anita Deshmukh',
            'avatar' => '/assets/avatars/doctor4.jpg',
            'specialization' => 'Dermatologist',
            'experience_years' => 15,
            'consultation_modes' => ['video', 'in_person'],
            'video_fee' => 1000,
            'in_person_fee' => 1500,
        ],
        5 => [
            'id' => 5,
            'name' => 'Dr. Vikram Patel',
            'avatar' => '/assets/avatars/doctor5.jpg',
            'specialization' => 'Orthopedist',
            'experience_years' => 20,
            'consultation_modes' => ['in_person'],
            'video_fee' => 0,
            'in_person_fee' => 1800,
        ],
    ];

    /**
     * Days-off per doctor (0=Sunday … 6=Saturday).
     */
    protected array $daysOff = [
        1 => [0],       // Dr. Sarah Johnson: off Sunday
        2 => [0, 6],    // Dr. Emily Chen: off Sunday, Saturday
        3 => [0, 3],    // Dr. Rajesh Kumar: off Sunday, Wednesday
        4 => [0, 6],    // Dr. Anita Deshmukh: off Sunday, Saturday
        5 => [0, 2, 4], // Dr. Vikram Patel: off Sunday, Tuesday, Thursday
    ];

    /**
     * Name aliases that map to existing doctor IDs.
     */
    protected array $nameAliases = [
        'Dr. Meera Iyer' => 3, // Alternative name for Dr. Rajesh Kumar
    ];

    /**
     * Get all doctors.
     */
    public function getAll(): array
    {
        return $this->doctors;
    }

    /**
     * Get all doctors as a flat indexed array (for frontend lists).
     */
    public function getAllAsList(): array
    {
        return array_values($this->doctors);
    }

    /**
     * Get doctor by ID.
     */
    public function getById(int $id): ?array
    {
        return $this->doctors[$id] ?? null;
    }

    /**
     * Find doctor ID by name (case-insensitive partial match).
     */
    public function findByName(string $name): ?int
    {
        $nameLower = strtolower(trim($name));

        // Check canonical names first
        foreach ($this->doctors as $id => $doctor) {
            $doctorNameLower = strtolower($doctor['name']);
            if (
                stripos($doctorNameLower, $nameLower) !== false
                || stripos($nameLower, $doctorNameLower) !== false
            ) {
                return $id;
            }
        }

        // Check aliases
        foreach ($this->nameAliases as $alias => $id) {
            $aliasLower = strtolower($alias);
            if (
                stripos($aliasLower, $nameLower) !== false
                || stripos($nameLower, $aliasLower) !== false
            ) {
                return $id;
            }
        }

        Log::warning('⚠️ DoctorService: name not matched', [
            'search' => $name,
            'available' => array_column($this->doctors, 'name'),
        ]);

        return null;
    }

    /**
     * Get days-off array for a doctor.
     */
    public function getDaysOff(int $id): array
    {
        return $this->daysOff[$id] ?? [0];
    }

    /**
     * Check if a doctor is available on a specific date.
     */
    public function isAvailableOn(int $id, string $date): bool
    {
        $dayOfWeek = Carbon::parse($date)->dayOfWeek;
        $daysOff = $this->getDaysOff($id);

        return !in_array($dayOfWeek, $daysOff);
    }

    /**
     * Get a doctor's available dates within a date range (default: next 7 days).
     */
    public function getAvailableDates(int $id, int $days = 7): array
    {
        $daysOff = $this->getDaysOff($id);
        $dates = [];

        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::today()->addDays($i);
            if (!in_array($date->dayOfWeek, $daysOff)) {
                $dates[] = $date->format('Y-m-d');
            }
        }

        return $dates;
    }

    /**
     * Get supported consultation modes for a doctor.
     */
    public function getSupportedModes(int $id): array
    {
        $doctor = $this->getById($id);
        return $doctor ? ($doctor['consultation_modes'] ?? []) : [];
    }

    /**
     * Check if a doctor supports a specific mode.
     */
    public function supportsMode(int $id, string $mode): bool
    {
        return in_array($mode, $this->getSupportedModes($id));
    }

    /**
     * Get the default mode for a doctor.
     * Returns the only mode if single-mode doctor, or 'video' as fallback.
     */
    public function getDefaultMode(int $id): string
    {
        $modes = $this->getSupportedModes($id);

        if (count($modes) === 1) {
            return $modes[0];
        }

        return 'video';
    }

    /**
     * Get fee for a specific doctor and mode.
     */
    public function getFee(int $id, string $mode): int
    {
        $doctor = $this->getById($id);
        if (!$doctor) {
            return 0;
        }

        return match ($mode) {
            'video' => $doctor['video_fee'] ?? 0,
            'in_person' => $doctor['in_person_fee'] ?? 0,
            default => 0,
        };
    }

    /**
     * Format doctor list for the AI prompt.
     * Provides all information the AI needs to resolve doctor references.
     */
    public function formatForPrompt(): string
    {
        $lines = [];

        foreach ($this->doctors as $id => $doctor) {
            $modes = [];
            foreach ($doctor['consultation_modes'] as $mode) {
                $fee = $mode === 'video' ? $doctor['video_fee'] : $doctor['in_person_fee'];
                $label = $mode === 'video' ? 'video' : 'in-person';
                $modes[] = "{$label}(₹{$fee})";
            }
            $modesStr = implode(', ', $modes);

            $daysOff = $this->getDaysOff($id);
            $dayNames = array_map(fn($d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][$d], $daysOff);
            $offStr = implode(', ', $dayNames);

            $lines[] = "{$id}. {$doctor['name']} | {$doctor['specialization']} | {$doctor['experience_years']}y | {$modesStr} | Off: {$offStr}";
        }

        return implode("\n", $lines);
    }

    /**
     * Filter doctors available on a given date.
     */
    public function getAvailableOnDate(string $date): array
    {
        $dayOfWeek = Carbon::parse($date)->dayOfWeek;

        return array_values(array_filter($this->doctors, function ($doctor) use ($dayOfWeek) {
            $daysOff = $this->getDaysOff($doctor['id']);
            return !in_array($dayOfWeek, $daysOff);
        }));
    }

    /**
     * Filter doctors matching a search query (name or specialization).
     */
    public function search(string $query): array
    {
        $queryLower = strtolower(trim($query));

        return array_values(array_filter($this->doctors, function ($doctor) use ($queryLower) {
            return stripos(strtolower($doctor['name']), $queryLower) !== false
                || stripos(strtolower($doctor['specialization'] ?? ''), $queryLower) !== false;
        }));
    }

    /**
     * Check availability and return conflict info if not available.
     */
    public function checkAvailability(int $id, string $date): array
    {
        if ($this->isAvailableOn($id, $date)) {
            return ['available' => true];
        }

        $doctor = $this->getById($id);
        $dateObj = Carbon::parse($date);

        // Find next available date
        $nextAvailable = null;
        $daysOff = $this->getDaysOff($id);
        for ($i = 1; $i <= 14; $i++) {
            $checkDate = $dateObj->copy()->addDays($i);
            if (!in_array($checkDate->dayOfWeek, $daysOff)) {
                $nextAvailable = $checkDate->format('Y-m-d');
                break;
            }
        }

        // Find alternative doctors available on the requested date
        $alternatives = $this->getAvailableOnDate($date);

        return [
            'available' => false,
            'doctor_name' => $doctor['name'] ?? 'Unknown',
            'next_available_date' => $nextAvailable,
            'available_dates_this_week' => $this->getAvailableDates($id),
            'alternative_doctors' => $alternatives,
        ];
    }

    /**
     * Get all doctor IDs.
     */
    public function getAllIds(): array
    {
        return array_keys($this->doctors);
    }
}
