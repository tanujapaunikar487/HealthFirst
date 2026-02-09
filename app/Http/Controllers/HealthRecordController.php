<?php

namespace App\Http\Controllers;

use App\Models\FamilyMember;
use App\Models\HealthRecord;
use App\Models\InsuranceClaim;
use App\Services\AI\AIService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class HealthRecordController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user() ?? \App\User::first();

        $abnormalCount = 0;

        $records = HealthRecord::where('user_id', $user->id)
            ->orderByDesc('record_date')
            ->get()
            ->map(function ($r) use (&$abnormalCount) {
                $status = $this->computeStatus($r->category, $r->metadata, $r->record_date);

                if ($status && $status['label'] === 'Needs Attention') {
                    $abnormalCount++;
                }

                return [
                    'id' => $r->id,
                    'appointment_id' => $r->appointment_id,
                    'family_member_id' => $r->family_member_id,
                    'category' => $r->category,
                    'title' => $r->title,
                    'description' => $r->description,
                    'doctor_name' => $r->doctor_name,
                    'department_name' => $r->department_name,
                    'record_date' => $r->record_date->format('Y-m-d'),
                    'record_date_formatted' => $r->record_date->format('d M Y'),
                    'metadata' => $r->metadata,
                    'file_url' => $r->file_url,
                    'file_type' => $r->file_type,
                    'status' => $status,
                    'insurance_claim_id' => $r->category === 'invoice' && $r->appointment_id
                        ? InsuranceClaim::where('appointment_id', $r->appointment_id)->value('id')
                        : null,
                ];
            });

        // Filter out guests from family member dropdown
        $familyMembers = FamilyMember::where('user_id', $user->id)
            ->where('is_guest', false)
            ->get(['id', 'name', 'relation', 'age', 'gender', 'blood_group']);

        $preSelectedRecordId = $request->query('record') ? (int) $request->query('record') : null;
        $preSelectedMemberId = $request->query('member_id') ? (int) $request->query('member_id') : null;

        return Inertia::render('HealthRecords/Index', [
            'user' => $user,
            'records' => $records,
            'familyMembers' => $familyMembers,
            'abnormalCount' => $abnormalCount,
            'preSelectedRecordId' => $preSelectedRecordId,
            'preSelectedMemberId' => $preSelectedMemberId,
        ]);
    }

    private function computeStatus(string $category, ?array $metadata, ?Carbon $recordDate = null): ?array
    {
        return match ($category) {
            'lab_report' => $this->labReportStatus($metadata),
            'prescription' => $this->prescriptionStatus($metadata, $recordDate),
            'consultation_notes', 'procedure_notes', 'er_visit', 'other_visit' => $this->visitStatus($metadata),
            'discharge_summary' => ['label' => 'Completed', 'variant' => 'success'],
            'referral' => $this->referralStatus($metadata),
            'vaccination' => $this->vaccinationStatus($metadata),
            'medical_certificate' => $this->certificateStatus($metadata),
            default => null,
        };
    }

    private function labReportStatus(?array $metadata): array
    {
        $results = $metadata['results'] ?? [];
        $hasAbnormal = false;
        $hasBorderline = false;

        foreach ($results as $result) {
            $status = strtolower($result['status'] ?? 'normal');
            if (in_array($status, ['abnormal', 'high'])) {
                $hasAbnormal = true;
            } elseif (in_array($status, ['borderline', 'low'])) {
                $hasBorderline = true;
            }
        }

        if ($hasAbnormal) {
            return ['label' => 'Needs Attention', 'variant' => 'warning'];
        }
        if ($hasBorderline) {
            return ['label' => 'Borderline', 'variant' => 'warning'];
        }

        return ['label' => 'Normal', 'variant' => 'success'];
    }

    private function prescriptionStatus(?array $metadata, ?Carbon $recordDate = null): array
    {
        // Check if any medication in the prescription is still active based on duration
        $drugs = $metadata['drugs'] ?? [];
        $startDate = $recordDate ?? ($metadata['date'] ? Carbon::parse($metadata['date']) : null);

        if ($startDate && !empty($drugs)) {
            foreach ($drugs as $drug) {
                $duration = $this->parseDuration($drug['duration'] ?? '');
                if ($duration > 0) {
                    $endDate = $startDate->copy()->addDays($duration);
                    if ($endDate->isFuture() || $endDate->isToday()) {
                        return ['label' => 'Active', 'variant' => 'info'];
                    }
                }
            }
        }

        // Also check valid_until if set (fallback)
        $validUntil = $metadata['valid_until'] ?? null;
        if ($validUntil && Carbon::parse($validUntil)->isFuture()) {
            return ['label' => 'Active', 'variant' => 'info'];
        }

        return ['label' => 'Past', 'variant' => 'secondary'];
    }

    private function parseDuration(string $duration): int
    {
        // Parse strings like "30 days", "2 weeks", "1 month"
        if (preg_match('/(\d+)\s*(day|week|month)/i', $duration, $matches)) {
            $num = (int) $matches[1];
            $unit = strtolower($matches[2]);
            return match ($unit) {
                'day', 'days' => $num,
                'week', 'weeks' => $num * 7,
                'month', 'months' => $num * 30,
                default => 0,
            };
        }
        return 0;
    }

    private function visitStatus(?array $metadata): array
    {
        $followUp = $metadata['follow_up'] ?? null;
        if ($followUp && trim($followUp) !== '') {
            return ['label' => 'Follow-up Required', 'variant' => 'warning'];
        }

        return ['label' => 'Completed', 'variant' => 'success'];
    }

    private function referralStatus(?array $metadata): array
    {
        $priority = strtolower($metadata['priority'] ?? '');
        if ($priority === 'urgent') {
            return ['label' => 'Urgent', 'variant' => 'destructive'];
        }

        return ['label' => 'Pending', 'variant' => 'warning'];
    }

    private function vaccinationStatus(?array $metadata): array
    {
        $doseNumber = $metadata['dose_number'] ?? 0;
        $totalDoses = $metadata['total_doses'] ?? 1;

        if ($doseNumber >= $totalDoses) {
            return ['label' => 'Complete', 'variant' => 'success'];
        }

        return ['label' => 'In Progress', 'variant' => 'info'];
    }

    private function certificateStatus(?array $metadata): array
    {
        $validUntil = $metadata['valid_until'] ?? null;
        if ($validUntil && Carbon::parse($validUntil)->isFuture()) {
            return ['label' => 'Valid', 'variant' => 'success'];
        }
        if ($validUntil) {
            return ['label' => 'Expired', 'variant' => 'destructive'];
        }

        return ['label' => 'Valid', 'variant' => 'success'];
    }

    private function invoiceStatus(?array $metadata): array
    {
        $paymentStatus = strtolower($metadata['payment_status'] ?? 'pending');

        return match ($paymentStatus) {
            'paid' => ['label' => 'Paid', 'variant' => 'success'],
            'due' => ['label' => 'Due', 'variant' => 'destructive'],
            default => ['label' => 'Pending', 'variant' => 'warning'],
        };
    }

    public function show(HealthRecord $record)
    {
        $user = Auth::user() ?? \App\User::first();

        // Ensure the record belongs to this user
        if ($record->user_id !== $user->id) {
            abort(403);
        }

        $status = $this->computeStatus($record->category, $record->metadata, $record->record_date);

        // Load family member for MRN/PRN access
        $record->load('familyMember');

        $recordData = [
            'id' => $record->id,
            'appointment_id' => $record->appointment_id,
            'family_member_id' => $record->family_member_id,
            'category' => $record->category,
            'title' => $record->title,
            'description' => $record->description,
            'doctor_name' => $record->doctor_name,
            'department_name' => $record->department_name,
            // New overview fields
            'patient_mrn' => $record->familyMember?->mrn ?? null,
            'patient_prn' => $record->familyMember?->prn ?? null,
            'visit_type' => $record->metadata['visit_type'] ?? null,
            'visit_number' => $record->metadata['opd_number'] ?? $record->metadata['ipd_number'] ?? null,
            'facility_name' => $record->metadata['facility_name'] ?? null,
            'verified_status' => $record->metadata['verified'] ?? null,
            'record_date' => $record->record_date->format('Y-m-d'),
            'record_date_formatted' => $record->record_date->format('d M Y'),
            'metadata' => $record->metadata,
            'file_url' => $record->file_url,
            'file_type' => $record->file_type,
            'status' => $status,
            'insurance_claim_id' => $record->category === 'invoice' && $record->appointment_id
                ? InsuranceClaim::where('appointment_id', $record->appointment_id)->value('id')
                : null,
        ];

        $familyMember = null;
        if ($record->family_member_id) {
            $familyMember = FamilyMember::find($record->family_member_id, ['id', 'name', 'relation', 'age', 'gender', 'blood_group']);
        }

        return Inertia::render('HealthRecords/Show', [
            'user' => $user,
            'record' => $recordData,
            'familyMember' => $familyMember,
        ]);
    }

    /**
     * Generate an AI summary for a health record.
     */
    public function generateSummary(HealthRecord $record, AIService $aiService)
    {
        $user = Auth::user() ?? \App\User::first();

        // Ensure the record belongs to this user
        if ($record->user_id !== $user->id) {
            abort(403);
        }

        try {
            // Check if AI is enabled
            if (!$aiService->isEnabled()) {
                return response()->json([
                    'success' => false,
                    'error' => 'AI service is currently unavailable.',
                ], 503);
            }

            // Check if we have a cached summary
            $cachedSummary = $record->metadata['ai_summary'] ?? null;
            $summaryGeneratedAt = $record->metadata['ai_summary_generated_at'] ?? null;

            // Use cached summary if it's less than 24 hours old
            if ($cachedSummary && $summaryGeneratedAt) {
                $generatedAt = Carbon::parse($summaryGeneratedAt);
                if ($generatedAt->diffInHours(now()) < 24) {
                    return response()->json([
                        'success' => true,
                        'summary' => $cachedSummary,
                        'cached' => true,
                        'generated_at' => $summaryGeneratedAt,
                    ]);
                }
            }

            // Compute status for context
            $status = $this->computeStatus($record->category, $record->metadata, $record->record_date);

            // Generate new summary
            $summary = $aiService->generateHealthRecordSummary(
                $record->category,
                $record->title,
                $record->metadata,
                $status
            );

            // Cache the summary in metadata
            $metadata = $record->metadata ?? [];
            $metadata['ai_summary'] = $summary;
            $metadata['ai_summary_generated_at'] = now()->toIso8601String();
            $record->metadata = $metadata;
            $record->save();

            Log::info('AI summary generated for health record', [
                'record_id' => $record->id,
                'category' => $record->category,
            ]);

            return response()->json([
                'success' => true,
                'summary' => $summary,
                'cached' => false,
                'generated_at' => $metadata['ai_summary_generated_at'],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to generate AI summary', [
                'record_id' => $record->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unable to generate summary at this time. Please try again later.',
            ], 500);
        }
    }
}
