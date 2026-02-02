<?php

namespace App\Http\Controllers;

use App\Models\FamilyMember;
use App\Models\HealthRecord;
use App\Models\InsuranceClaim;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
                $status = $this->computeStatus($r->category, $r->metadata);

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

    private function computeStatus(string $category, ?array $metadata): ?array
    {
        return match ($category) {
            'lab_report' => $this->labReportStatus($metadata),
            'prescription' => $this->prescriptionStatus($metadata),
            'medication_active' => ['label' => 'Active', 'variant' => 'info'],
            'medication_past' => $this->pastMedicationStatus($metadata),
            'consultation_notes', 'procedure_notes', 'er_visit', 'other_visit' => $this->visitStatus($metadata),
            'discharge_summary' => ['label' => 'Completed', 'variant' => 'success'],
            'referral' => $this->referralStatus($metadata),
            'vaccination' => $this->vaccinationStatus($metadata),
            'medical_certificate' => $this->certificateStatus($metadata),
            'invoice' => $this->invoiceStatus($metadata),
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
            return ['label' => 'Needs Attention', 'variant' => 'destructive'];
        }
        if ($hasBorderline) {
            return ['label' => 'Borderline', 'variant' => 'warning'];
        }

        return ['label' => 'Normal', 'variant' => 'success'];
    }

    private function prescriptionStatus(?array $metadata): array
    {
        $validUntil = $metadata['valid_until'] ?? null;
        if ($validUntil && Carbon::parse($validUntil)->isFuture()) {
            return ['label' => 'Active', 'variant' => 'info'];
        }

        return ['label' => 'Completed', 'variant' => 'secondary'];
    }

    private function pastMedicationStatus(?array $metadata): array
    {
        $reason = strtolower($metadata['reason_stopped'] ?? '');
        if (str_contains($reason, 'discontinu')) {
            return ['label' => 'Discontinued', 'variant' => 'destructive'];
        }

        return ['label' => 'Completed', 'variant' => 'secondary'];
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
}
