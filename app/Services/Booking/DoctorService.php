<?php

namespace App\Services\Booking;

use App\Models\Doctor;
use App\Models\DoctorAlias;
use App\Models\DoctorAvailability;
use App\Models\DoctorConsultationMode;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * DoctorService
 *
 * Centralized doctor data and availability logic.
 * Queries the database for all doctor information.
 */
class DoctorService
{
    /**
     * Get all doctors as associative array keyed by ID.
     */
    public function getAll(): array
    {
        return Doctor::with(['consultationModes', 'availabilities'])
            ->where('is_active', true)
            ->get()
            ->keyBy('id')
            ->map(fn(Doctor $d) => $this->toArray($d))
            ->toArray();
    }

    /**
     * Get all doctors as a flat indexed array (for frontend lists).
     */
    public function getAllAsList(): array
    {
        return array_values($this->getAll());
    }

    /**
     * Get doctor by ID.
     */
    public function getById(int $id): ?array
    {
        $doctor = Doctor::with(['consultationModes', 'availabilities'])->find($id);
        return $doctor ? $this->toArray($doctor) : null;
    }

    /**
     * Find doctor ID by name (case-insensitive partial match).
     */
    public function findByName(string $name): ?int
    {
        $nameLower = strtolower(trim($name));

        // Check canonical names first
        $doctor = Doctor::where('is_active', true)
            ->get()
            ->first(function (Doctor $d) use ($nameLower) {
                $doctorNameLower = strtolower($d->name);
                return stripos($doctorNameLower, $nameLower) !== false
                    || stripos($nameLower, $doctorNameLower) !== false;
            });

        if ($doctor) {
            return $doctor->id;
        }

        // Check aliases
        $alias = DoctorAlias::all()
            ->first(function ($a) use ($nameLower) {
                $aliasLower = strtolower($a->alias);
                return stripos($aliasLower, $nameLower) !== false
                    || stripos($nameLower, $aliasLower) !== false;
            });

        if ($alias) {
            return $alias->doctor_id;
        }

        Log::warning('DoctorService: name not matched', [
            'search' => $name,
            'available' => Doctor::where('is_active', true)->pluck('name')->toArray(),
        ]);

        return null;
    }

    /**
     * Get days-off array for a doctor (day_of_week values where is_available=false).
     */
    public function getDaysOff(int $id): array
    {
        return DoctorAvailability::where('doctor_id', $id)
            ->where('is_available', false)
            ->pluck('day_of_week')
            ->toArray();
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
        return DoctorConsultationMode::where('doctor_id', $id)
            ->pluck('mode')
            ->toArray();
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
     * Returns the only mode if single-mode doctor, or the is_default one.
     */
    public function getDefaultMode(int $id): string
    {
        $modes = DoctorConsultationMode::where('doctor_id', $id)->get();

        if ($modes->count() === 1) {
            return $modes->first()->mode;
        }

        $default = $modes->firstWhere('is_default', true);
        return $default ? $default->mode : 'video';
    }

    /**
     * Get fee for a specific doctor and mode.
     */
    public function getFee(int $id, string $mode): int
    {
        $consultationMode = DoctorConsultationMode::where('doctor_id', $id)
            ->where('mode', $mode)
            ->first();

        return $consultationMode ? $consultationMode->fee : 0;
    }

    /**
     * Format doctor list for the AI prompt.
     */
    public function formatForPrompt(): string
    {
        $doctors = Doctor::with(['consultationModes', 'availabilities'])
            ->where('is_active', true)
            ->get();

        $lines = [];

        foreach ($doctors as $doctor) {
            $modes = [];
            foreach ($doctor->consultationModes as $cm) {
                $label = $cm->mode === 'video' ? 'video' : 'in-person';
                $modes[] = "{$label}(₹{$cm->fee})";
            }
            $modesStr = implode(', ', $modes);

            $daysOff = $doctor->availabilities
                ->where('is_available', false)
                ->pluck('day_of_week')
                ->toArray();
            $dayNames = array_map(fn($d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][$d], $daysOff);
            $offStr = implode(', ', $dayNames);

            $lines[] = "{$doctor->id}. {$doctor->name} | {$doctor->specialization} | {$doctor->experience_years}y | {$modesStr} | Off: {$offStr}";
        }

        return implode("\n", $lines);
    }

    /**
     * Filter doctors available on a given date.
     */
    public function getAvailableOnDate(string $date): array
    {
        $dayOfWeek = Carbon::parse($date)->dayOfWeek;

        return Doctor::with(['consultationModes', 'availabilities'])
            ->where('is_active', true)
            ->whereHas('availabilities', function ($q) use ($dayOfWeek) {
                $q->where('day_of_week', $dayOfWeek)->where('is_available', true);
            })
            ->get()
            ->map(fn(Doctor $d) => $this->toArray($d))
            ->values()
            ->toArray();
    }

    /**
     * Filter doctors matching a search query (name or specialization).
     */
    public function search(string $query): array
    {
        $queryLower = strtolower(trim($query));

        return Doctor::with(['consultationModes', 'availabilities'])
            ->where('is_active', true)
            ->where(function ($q) use ($queryLower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$queryLower}%"])
                  ->orWhereRaw('LOWER(specialization) LIKE ?', ["%{$queryLower}%"]);
            })
            ->get()
            ->map(fn(Doctor $d) => $this->toArray($d))
            ->values()
            ->toArray();
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
        return Doctor::where('is_active', true)->pluck('id')->toArray();
    }

    /**
     * Convert a Doctor model to the array format expected by the rest of the system.
     */
    private function toArray(Doctor $doctor): array
    {
        $modes = $doctor->consultationModes->pluck('mode')->toArray();
        $videoFee = $doctor->consultationModes->firstWhere('mode', 'video')?->fee ?? 0;
        $inPersonFee = $doctor->consultationModes->firstWhere('mode', 'in_person')?->fee ?? 0;

        return [
            'id' => $doctor->id,
            'name' => $doctor->name,
            'avatar' => $doctor->avatar_url,
            'specialization' => $doctor->specialization,
            'qualification' => $doctor->qualification,
            'experience_years' => $doctor->experience_years,
            'bio' => $doctor->bio,
            'rating' => (float) $doctor->rating,
            'reviews_count' => $doctor->reviews_count,
            'consultation_modes' => $modes,
            'video_fee' => $videoFee,
            'in_person_fee' => $inPersonFee,
        ];
    }
}
