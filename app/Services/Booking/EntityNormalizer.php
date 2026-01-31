<?php

namespace App\Services\Booking;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * EntityNormalizer
 *
 * Post-AI validation and normalization layer.
 * Takes raw AI-extracted entities and:
 * - Normalizes formats (dates, times, modes)
 * - Validates against known data (doctors, modes)
 * - Resolves references (doctor name → ID, patient relation → patient data)
 * - Returns clean, ready-to-merge entities with any warnings
 */
class EntityNormalizer
{
    public function __construct(
        private DoctorService $doctorService,
        private LabService $labService,
    ) {}

    /**
     * Normalize raw AI entities into clean, validated data.
     *
     * @param  array  $rawEntities  Entities from AI response
     * @param  array  $collectedData  Current booking state
     * @return array  ['entities' => [...], 'warnings' => [...]]
     */
    public function normalize(array $rawEntities, array $collectedData = []): array
    {
        $normalized = [];
        $warnings = [];

        // Map AI entity keys to our internal data keys
        $entityMap = [
            'patient_relation' => 'patientRelation',
            'appointment_type' => 'appointmentType',
            'symptoms' => 'symptoms',
            'urgency' => 'urgency',
            'urgency_level' => 'urgency',
            'specific_date' => 'selectedDate',
            'date' => 'selectedDate',
            'time' => 'selectedTime',
            'doctor_id' => 'selectedDoctorId',
            'doctor_name' => 'selectedDoctorName',
            'followup_reason' => 'followup_reason',
            'followup_notes' => 'followup_notes',
            'mode' => 'consultationMode',
            'consultation_mode' => 'consultationMode',
            // Lab-specific entity mappings
            'package_name' => 'selectedPackageName',
            'package_id' => 'selectedPackageId',
            'collection_type' => 'collectionType',
        ];

        foreach ($rawEntities as $key => $value) {
            if (empty($value) && $value !== 0 && $value !== '0') {
                continue;
            }

            $dataKey = $entityMap[$key] ?? $key;

            // Normalize by type
            $result = match ($dataKey) {
                'selectedDate' => $this->normalizeDate($value),
                'selectedTime' => $this->normalizeTime($value),
                'selectedDoctorName' => $this->normalizeDoctorName($value, $rawEntities),
                'selectedDoctorId' => $this->normalizeDoctorId($value),
                'consultationMode' => $this->normalizeMode($value, $collectedData),
                'patientRelation' => $this->normalizePatientRelation($value),
                'urgency' => $this->normalizeUrgency($value),
                'appointmentType' => $this->normalizeAppointmentType($value),
                // Lab-specific normalizers
                'selectedPackageName' => $this->normalizePackageName($value, $rawEntities),
                'selectedPackageId' => $this->normalizePackageId($value),
                'collectionType' => $this->normalizeCollectionType($value),
                default => ['value' => $value, 'warning' => null],
            };

            if ($result['value'] !== null) {
                $normalized[$dataKey] = $result['value'];
            }

            if (!empty($result['warning'])) {
                $warnings[] = $result['warning'];
            }

            // Include any extra data the normalizer produced (e.g., resolved doctor details)
            if (!empty($result['extra'])) {
                foreach ($result['extra'] as $extraKey => $extraValue) {
                    $normalized[$extraKey] = $extraValue;
                }
            }
        }

        // Post-normalization: if we have doctor_id from AI but no doctor_name, resolve it
        if (isset($normalized['selectedDoctorId']) && !isset($normalized['selectedDoctorName'])) {
            $doctor = $this->doctorService->getById($normalized['selectedDoctorId']);
            if ($doctor) {
                $normalized['selectedDoctorName'] = $doctor['name'];
            }
        }

        // Post-normalization: if we have package_id but no package_name, resolve it
        if (isset($normalized['selectedPackageId']) && !isset($normalized['selectedPackageName'])) {
            $package = $this->labService->getPackageById($normalized['selectedPackageId']);
            if ($package) {
                $normalized['selectedPackageName'] = $package['name'];
                $normalized['packageRequiresFasting'] = $package['requires_fasting'];
                $normalized['packageFastingHours'] = $package['fasting_hours'];
            }
        }

        // Post-normalization: validate doctor+mode combination
        $modeWarning = $this->validateDoctorModeCombo($normalized, $collectedData);
        if ($modeWarning) {
            $warnings[] = $modeWarning['warning'];
            if (isset($modeWarning['corrected_mode'])) {
                $normalized['consultationMode'] = $modeWarning['corrected_mode'];
                $normalized['mode_conflict'] = $modeWarning['conflict_info'];
            }
        }

        // Post-normalization: validate doctor+date combination
        $dateWarning = $this->validateDoctorDateCombo($normalized, $collectedData);
        if ($dateWarning) {
            $warnings[] = $dateWarning['warning'];
            if (!empty($dateWarning['conflict_info'])) {
                $normalized['doctor_date_conflict'] = $dateWarning['conflict_info'];
            }
        }

        Log::info('🔧 EntityNormalizer: Result', [
            'raw_keys' => array_keys($rawEntities),
            'normalized_keys' => array_keys($normalized),
            'warnings' => $warnings,
        ]);

        return [
            'entities' => $normalized,
            'warnings' => $warnings,
        ];
    }

    /**
     * Normalize date to YYYY-MM-DD format. Detect past dates and out-of-range dates.
     */
    private function normalizeDate($value): array
    {
        if (!is_string($value) || empty(trim($value))) {
            return ['value' => null, 'warning' => 'Empty date value'];
        }

        try {
            $parsed = Carbon::parse($value);
            $today = Carbon::today();

            // If parsed date is in the past, try adjusting the year
            if ($parsed->isPast() && $parsed->diffInDays($today) > 1) {
                $originalParsed = $parsed->copy();
                $parsed = $parsed->year($today->year);

                // If still in the past after setting to current year, try next year
                if ($parsed->isPast() && $parsed->diffInDays($today) > 1) {
                    $parsed = $parsed->addYear();
                }

                // If the adjusted date is far in the future (> 14 days),
                // the user likely meant a genuinely past date (e.g. "5th dec" in January)
                $daysFromNow = $today->diffInDays($parsed);
                if ($daysFromNow > 14) {
                    Log::info('⚠️ EntityNormalizer: Past date detected', [
                        'input' => $value,
                        'original_parsed' => $originalParsed->format('Y-m-d'),
                        'adjusted' => $parsed->format('Y-m-d'),
                        'days_from_now' => $daysFromNow,
                    ]);

                    return [
                        'value' => null,
                        'warning' => 'past_date',
                        'extra' => [
                            'past_date_warning' => [
                                'requested_date' => $originalParsed->format('M j'),
                                'message' => "{$originalParsed->format('M j')} has already passed. Please pick a date within the next week.",
                            ],
                        ],
                    ];
                }
            }

            // Check if date is too far in the future (> 14 days)
            $daysFromNow = $today->diffInDays($parsed);
            if ($daysFromNow > 14) {
                return [
                    'value' => null,
                    'warning' => 'date_too_far',
                    'extra' => [
                        'past_date_warning' => [
                            'requested_date' => $parsed->format('M j, Y'),
                            'message' => "{$parsed->format('M j, Y')} is too far out. Please pick a date within the next week.",
                        ],
                    ],
                ];
            }

            return ['value' => $parsed->format('Y-m-d'), 'warning' => null];
        } catch (\Exception $e) {
            Log::warning('⚠️ EntityNormalizer: Date parse failed', ['value' => $value]);
            return ['value' => null, 'warning' => "Could not parse date: {$value}"];
        }
    }

    /**
     * Normalize time to 24-hour HH:MM format.
     */
    private function normalizeTime($value): array
    {
        if (!is_string($value) || empty(trim($value))) {
            return ['value' => null, 'warning' => 'Empty time value'];
        }

        $value = trim($value);

        // Already in HH:MM 24-hour format
        if (preg_match('/^(\d{1,2}):(\d{2})$/', $value, $m)) {
            $hours = (int) $m[1];
            if ($hours >= 0 && $hours <= 23) {
                return ['value' => sprintf('%02d:%s', $hours, $m[2]), 'warning' => null];
            }
        }

        // 12-hour format: "3:00 PM", "10:30 AM"
        if (preg_match('/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i', $value, $m)) {
            $hours = (int) $m[1];
            $minutes = $m[2];
            $period = strtoupper($m[3]);
            if ($period === 'PM' && $hours !== 12) $hours += 12;
            if ($period === 'AM' && $hours === 12) $hours = 0;
            return ['value' => sprintf('%02d:%s', $hours, $minutes), 'warning' => null];
        }

        // Just a number: "3" → "15:00" (assume PM for clinic hours), "10" → "10:00"
        if (preg_match('/^(\d{1,2})$/', $value, $m)) {
            $hours = (int) $m[1];
            // Assume PM for single digits 1-6 (clinic hours)
            if ($hours >= 1 && $hours <= 6) {
                $hours += 12;
            }
            if ($hours >= 0 && $hours <= 23) {
                return ['value' => sprintf('%02d:00', $hours), 'warning' => null];
            }
        }

        // "3 PM", "10 AM"
        if (preg_match('/^(\d{1,2})\s*(AM|PM)$/i', $value, $m)) {
            $hours = (int) $m[1];
            $period = strtoupper($m[2]);
            if ($period === 'PM' && $hours !== 12) $hours += 12;
            if ($period === 'AM' && $hours === 12) $hours = 0;
            return ['value' => sprintf('%02d:00', $hours), 'warning' => null];
        }

        Log::warning('⚠️ EntityNormalizer: Time format not recognized', ['value' => $value]);
        return ['value' => $value, 'warning' => "Unusual time format: {$value}"];
    }

    /**
     * Normalize doctor name — resolve to full name and ID from our doctor list.
     */
    private function normalizeDoctorName($value, array $allEntities): array
    {
        if (!is_string($value) || empty(trim($value))) {
            return ['value' => null, 'warning' => null];
        }

        $doctorId = $this->doctorService->findByName($value);

        if ($doctorId) {
            $doctor = $this->doctorService->getById($doctorId);
            return [
                'value' => $doctor['name'], // Use canonical name
                'warning' => null,
                'extra' => [
                    'selectedDoctorId' => $doctorId,
                    'selectedDoctorSpecialization' => $doctor['specialization'] ?? '',
                    'selectedDoctorAvatar' => $doctor['avatar'] ?? '',
                    'doctorSearchQuery' => $value, // Keep original for search filtering
                ],
            ];
        }

        // Doctor not found in our list — store as search query
        return [
            'value' => $value,
            'warning' => "Doctor '{$value}' not found in our system",
            'extra' => [
                'doctorSearchQuery' => $value,
            ],
        ];
    }

    /**
     * Normalize doctor ID — verify it exists.
     */
    private function normalizeDoctorId($value): array
    {
        $id = is_numeric($value) ? (int) $value : null;

        if ($id && $this->doctorService->getById($id)) {
            return ['value' => $id, 'warning' => null];
        }

        if ($id) {
            Log::warning('⚠️ EntityNormalizer: Invalid doctor ID', ['id' => $value]);
            return ['value' => null, 'warning' => "Doctor ID {$value} does not exist"];
        }

        return ['value' => null, 'warning' => null];
    }

    /**
     * Normalize consultation mode.
     */
    private function normalizeMode($value, array $collectedData): array
    {
        $modeMap = [
            'video' => 'video',
            'online' => 'video',
            'virtual' => 'video',
            'telemedicine' => 'video',
            'telehealth' => 'video',
            'in_person' => 'in_person',
            'in-person' => 'in_person',
            'physical' => 'in_person',
            'clinic' => 'in_person',
            'office' => 'in_person',
            'hospital' => 'in_person',
            'face to face' => 'in_person',
            'face-to-face' => 'in_person',
        ];

        $normalized = $modeMap[strtolower(trim($value))] ?? null;

        if (!$normalized) {
            return ['value' => null, 'warning' => "Unknown consultation mode: {$value}"];
        }

        return ['value' => $normalized, 'warning' => null];
    }

    /**
     * Normalize patient relation.
     */
    private function normalizePatientRelation($value): array
    {
        $relationMap = [
            'self' => 'self',
            'myself' => 'self',
            'me' => 'self',
            'father' => 'father',
            'dad' => 'father',
            'mother' => 'mother',
            'mom' => 'mother',
            'son' => 'son',
            'daughter' => 'daughter',
            'spouse' => 'spouse',
            'wife' => 'spouse',
            'husband' => 'spouse',
            'child' => 'child',
            'kid' => 'child',
        ];

        $normalized = $relationMap[strtolower(trim($value))] ?? $value;

        return ['value' => $normalized, 'warning' => null];
    }

    /**
     * Normalize urgency level.
     */
    private function normalizeUrgency($value): array
    {
        $urgencyMap = [
            'urgent' => 'urgent',
            'asap' => 'urgent',
            'emergency' => 'urgent',
            'today' => 'urgent',
            'immediately' => 'urgent',
            'this_week' => 'this_week',
            'this week' => 'this_week',
            'soon' => 'this_week',
            'normal' => 'this_week',
            'flexible' => 'flexible',
            'whenever' => 'flexible',
            'no rush' => 'flexible',
            'anytime' => 'flexible',
        ];

        $normalized = $urgencyMap[strtolower(trim($value))] ?? $value;

        return ['value' => $normalized, 'warning' => null];
    }

    /**
     * Normalize appointment type.
     */
    private function normalizeAppointmentType($value): array
    {
        $typeMap = [
            'new' => 'new',
            'new appointment' => 'new',
            'first visit' => 'new',
            'followup' => 'followup',
            'follow-up' => 'followup',
            'follow up' => 'followup',
            'revisit' => 'followup',
            'check back' => 'followup',
            'return visit' => 'followup',
        ];

        $normalized = $typeMap[strtolower(trim($value))] ?? $value;

        return ['value' => $normalized, 'warning' => null];
    }

    /**
     * Normalize package name — resolve to package ID + metadata from our package list.
     */
    private function normalizePackageName($value, array $allEntities): array
    {
        if (!is_string($value) || empty(trim($value))) {
            return ['value' => null, 'warning' => null];
        }

        $packageId = $this->labService->findPackageByName($value);

        if ($packageId) {
            $package = $this->labService->getPackageById($packageId);
            return [
                'value' => $package['name'],
                'warning' => null,
                'extra' => [
                    'selectedPackageId' => $packageId,
                    'packageRequiresFasting' => $package['requires_fasting'],
                    'packageFastingHours' => $package['fasting_hours'],
                ],
            ];
        }

        return [
            'value' => $value,
            'warning' => "Package '{$value}' not found in our system",
            'extra' => [
                'packageSearchQuery' => $value,
            ],
        ];
    }

    /**
     * Normalize package ID — verify it exists.
     */
    private function normalizePackageId($value): array
    {
        $id = is_numeric($value) ? (int) $value : null;

        if ($id && $this->labService->getPackageById($id)) {
            return ['value' => $id, 'warning' => null];
        }

        if ($id) {
            Log::warning('⚠️ EntityNormalizer: Invalid package ID', ['id' => $value]);
            return ['value' => null, 'warning' => "Package ID {$value} does not exist"];
        }

        return ['value' => null, 'warning' => null];
    }

    /**
     * Normalize collection type — map natural language to 'home' or 'center'.
     */
    private function normalizeCollectionType($value): array
    {
        $collectionMap = [
            'home' => 'home',
            'at home' => 'home',
            'doorstep' => 'home',
            'home collection' => 'home',
            'home visit' => 'home',
            'center' => 'center',
            'centre' => 'center',
            'lab' => 'center',
            'visit' => 'center',
            'visit center' => 'center',
            'visit centre' => 'center',
            'walk-in' => 'center',
            'walk in' => 'center',
            'in-person' => 'center',
        ];

        $normalized = $collectionMap[strtolower(trim($value))] ?? null;

        if (!$normalized) {
            return ['value' => null, 'warning' => "Unknown collection type: {$value}"];
        }

        return ['value' => $normalized, 'warning' => null];
    }

    /**
     * Validate doctor + mode combination.
     * If the selected mode isn't supported, auto-correct and warn.
     */
    private function validateDoctorModeCombo(array $normalized, array $collectedData): ?array
    {
        $mode = $normalized['consultationMode'] ?? null;
        $doctorId = $normalized['selectedDoctorId'] ?? ($collectedData['selectedDoctorId'] ?? null);

        if (!$mode || !$doctorId) {
            return null;
        }

        if ($this->doctorService->supportsMode($doctorId, $mode)) {
            return null;
        }

        $doctor = $this->doctorService->getById($doctorId);
        $doctorName = $doctor['name'] ?? 'this doctor';
        $supportedModes = $this->doctorService->getSupportedModes($doctorId);

        if (count($supportedModes) === 1) {
            $onlyMode = $supportedModes[0];
            $onlyModeLabel = $onlyMode === 'video' ? 'video appointments' : 'in-person visits';
            $requestedLabel = $mode === 'video' ? 'video consultations' : 'in-person visits';

            return [
                'warning' => "{$doctorName} only offers {$onlyModeLabel}",
                'corrected_mode' => $onlyMode,
                'conflict_info' => [
                    'doctor_name' => $doctorName,
                    'requested_mode' => $mode,
                    'available_mode' => $onlyMode,
                    'message' => "{$doctorName} only offers {$onlyModeLabel}. I've updated the consultation mode. If you'd prefer {$requestedLabel}, you can change the doctor.",
                ],
            ];
        }

        return [
            'warning' => "Mode '{$mode}' not supported by {$doctorName}",
        ];
    }

    /**
     * Validate doctor + date combination.
     * Check if the doctor is available on the selected date.
     */
    private function validateDoctorDateCombo(array $normalized, array $collectedData): ?array
    {
        $date = $normalized['selectedDate'] ?? ($collectedData['selectedDate'] ?? null);
        $doctorId = $normalized['selectedDoctorId'] ?? ($collectedData['selectedDoctorId'] ?? null);

        if (!$date || !$doctorId) {
            return null;
        }

        $availability = $this->doctorService->checkAvailability($doctorId, $date);

        if ($availability['available']) {
            return null;
        }

        $doctor = $this->doctorService->getById($doctorId);
        $cleanName = preg_replace('/^Dr\.?\s*/i', '', $doctor['name'] ?? '');
        $dateFormatted = Carbon::parse($date)->format('M j');

        return [
            'warning' => "Dr. {$cleanName} isn't available on {$dateFormatted}",
            'conflict_info' => [
                'searched_doctor' => $doctor['name'] ?? '',
                'doctor_id' => $doctorId,
                'date' => $dateFormatted,
                'available_dates' => $availability['available_dates_this_week'] ?? [],
                'next_available_date' => $availability['next_available_date'] ?? null,
                'alternative_doctors' => $availability['alternative_doctors'] ?? [],
                'message' => "Dr. {$cleanName} isn't available on {$dateFormatted}. They're available on: " . implode(', ', array_map(
                    fn($d) => Carbon::parse($d)->format('D, M j'),
                    $availability['available_dates_this_week'] ?? []
                )),
            ],
        ];
    }
}
