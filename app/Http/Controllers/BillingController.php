<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\FamilyMember;
use App\Models\LabTestType;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BillingController extends Controller
{
    /**
     * 10 billing status types mapped from real payment_status using deterministic variation.
     */
    private const BILLING_STATUSES = [
        'due', 'paid', 'refunded', 'awaiting_approval', 'claim_pending',
        'copay_due', 'emi', 'disputed', 'covered', 'reimbursed',
    ];

    /**
     * Outstanding statuses (patient still owes money or action pending).
     */
    private const OUTSTANDING_STATUSES = [
        'due', 'copay_due', 'awaiting_approval', 'claim_pending', 'emi',
    ];

    public function index()
    {
        $user = Auth::user() ?? \App\User::first();

        $appointments = Appointment::where('user_id', $user->id)
            ->with(['doctor', 'familyMember', 'labPackage'])
            ->orderByDesc('appointment_date')
            ->orderByDesc('created_at')
            ->get();

        $bills = $appointments->map(fn($appt, $i) => $this->formatBillSummary($appt, $i))->values()->toArray();

        // Compute outstanding stats
        $outstandingBills = collect($bills)->filter(fn($b) => in_array($b['billing_status'], self::OUTSTANDING_STATUSES));

        $stats = [
            'outstanding_count' => $outstandingBills->count(),
            'outstanding_total' => $outstandingBills->sum('due_amount'),
        ];

        // Family members for filter dropdown
        $familyMembers = FamilyMember::where('user_id', $user->id)
            ->select('id', 'name', 'relation')
            ->orderByRaw("CASE WHEN relation = 'self' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->relation === 'self' ? 'You' : $m->name,
                'relation' => $m->relation,
            ])
            ->toArray();

        return Inertia::render('Billing/Index', [
            'user' => $user,
            'bills' => $bills,
            'stats' => $stats,
            'familyMembers' => $familyMembers,
        ]);
    }

    public function show(Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            abort(403);
        }

        $appointment->load(['doctor', 'familyMember', 'labPackage', 'department']);

        return Inertia::render('Billing/Show', [
            'user' => $user,
            'bill' => $this->formatBillDetail($appointment),
        ]);
    }

    /**
     * Map real payment_status to one of 10 billing statuses using deterministic index-based variation.
     */
    private function getBillingStatus(Appointment $appt, int $index): string
    {
        $realStatus = $appt->payment_status ?? 'paid';

        return match ($realStatus) {
            'pending' => match ($index % 4) {
                0 => 'due',
                1 => 'awaiting_approval',
                2 => 'claim_pending',
                3 => 'copay_due',
            },
            'paid' => match ($index % 5) {
                0 => 'paid',
                1 => 'covered',
                2 => 'reimbursed',
                3 => 'emi',
                4 => 'paid',
            },
            'fully_refunded' => 'refunded',
            'partially_refunded' => match ($index % 2) {
                0 => 'disputed',
                1 => 'refunded',
            },
            default => 'paid',
        };
    }

    /**
     * Compute due_amount, insurance_covered, and emi info based on billing status.
     */
    private function computeAmountDetails(string $billingStatus, float $total, int $index): array
    {
        return match ($billingStatus) {
            'due' => [
                'due_amount' => $total,
                'original_amount' => $total,
                'insurance_covered' => 0,
                'emi_current' => null,
                'emi_total' => null,
            ],
            'copay_due' => [
                'due_amount' => round($total * 0.2),
                'original_amount' => $total,
                'insurance_covered' => round($total * 0.8),
                'emi_current' => null,
                'emi_total' => null,
            ],
            'emi' => [
                'due_amount' => round($total / 6),
                'original_amount' => $total,
                'insurance_covered' => 0,
                'emi_current' => ($index % 5) + 1,
                'emi_total' => 6,
                ],
            'awaiting_approval', 'claim_pending' => [
                'due_amount' => $total,
                'original_amount' => $total,
                'insurance_covered' => 0,
                'emi_current' => null,
                'emi_total' => null,
            ],
            'covered' => [
                'due_amount' => 0,
                'original_amount' => $total,
                'insurance_covered' => $total,
                'emi_current' => null,
                'emi_total' => null,
            ],
            'reimbursed' => [
                'due_amount' => 0,
                'original_amount' => $total,
                'insurance_covered' => $total,
                'emi_current' => null,
                'emi_total' => null,
            ],
            default => [ // paid, refunded, disputed
                'due_amount' => 0,
                'original_amount' => $total,
                'insurance_covered' => 0,
                'emi_current' => null,
                'emi_total' => null,
            ],
        };
    }

    private function formatBillSummary(Appointment $appt, int $index): array
    {
        $isDoctor = $appt->appointment_type === 'doctor';

        $title = 'Appointment';
        if ($isDoctor) {
            $title = $appt->doctor?->name ?? 'Doctor Appointment';
        } elseif ($appt->labPackage) {
            $title = $appt->labPackage->name;
        } elseif ($appt->lab_test_ids) {
            $testNames = LabTestType::whereIn('id', $appt->lab_test_ids)->pluck('name')->toArray();
            $title = count($testNames) > 2
                ? $testNames[0] . ' +' . (count($testNames) - 1) . ' more'
                : implode(', ', $testNames);
        } else {
            $title = 'Lab Test';
        }

        $consultationFee = $appt->fee ?? 800;
        $platformFee = 49;
        $total = $consultationFee + $platformFee;

        $billingStatus = $this->getBillingStatus($appt, $index);
        $amountDetails = $this->computeAmountDetails($billingStatus, $total, $index);

        return [
            'id' => $appt->id,
            'invoice_number' => 'INV-' . str_pad($appt->id, 6, '0', STR_PAD_LEFT),
            'appointment_id' => $appt->id,
            'appointment_type' => $appt->appointment_type === 'doctor' ? 'doctor' : 'lab_test',
            'appointment_title' => $title,
            'patient_id' => $appt->family_member_id,
            'patient_name' => $appt->familyMember?->name ?? 'You',
            'date' => $appt->appointment_date->format('Y-m-d'),
            'date_formatted' => $appt->appointment_date->format('D, d M Y'),
            'time' => $appt->appointment_time,
            'amount' => $consultationFee,
            'total' => $total,
            'billing_status' => $billingStatus,
            'due_amount' => $amountDetails['due_amount'],
            'original_amount' => $amountDetails['original_amount'],
            'insurance_covered' => $amountDetails['insurance_covered'],
            'emi_current' => $amountDetails['emi_current'],
            'emi_total' => $amountDetails['emi_total'],
            'payment_method' => 'UPI (PhonePe)',
            'payment_date' => $appt->created_at->format('d M Y, g:i A'),
        ];
    }

    private function formatBillDetail(Appointment $appt): array
    {
        $isDoctor = $appt->appointment_type === 'doctor';
        $consultationFee = $appt->fee ?? 800;
        $platformFee = 49;
        $gst = 0;
        $discount = 0;
        $total = $consultationFee + $platformFee + $gst - $discount;

        $title = 'Appointment';
        $subtitle = '';
        if ($isDoctor) {
            $title = $appt->doctor?->name ?? 'Doctor Appointment';
            $subtitle = $appt->doctor?->specialization ?? '';
        } elseif ($appt->labPackage) {
            $title = $appt->labPackage->name;
            $subtitle = 'Health Package';
        } elseif ($appt->lab_test_ids) {
            $testNames = LabTestType::whereIn('id', $appt->lab_test_ids)->pluck('name')->toArray();
            $title = implode(', ', $testNames);
            $subtitle = count($testNames) . ' test(s)';
        } else {
            $title = 'Lab Test';
        }

        return [
            'id' => $appt->id,
            'invoice_number' => 'INV-' . str_pad($appt->id, 6, '0', STR_PAD_LEFT),
            'appointment_id' => $appt->id,
            'appointment_type' => $appt->appointment_type,
            'appointment_title' => $title,
            'appointment_subtitle' => $subtitle,
            'appointment_date' => $appt->appointment_date->format('D, d M Y'),
            'appointment_time' => $appt->appointment_time,
            'appointment_mode' => $isDoctor
                ? ($appt->consultation_mode === 'video' ? 'Video' : 'In-Person')
                : ($appt->collection_type === 'home' ? 'Home Collection' : 'Lab Visit'),
            'appointment_status' => $appt->status,
            'department' => $appt->department?->name,
            'patient_name' => $appt->familyMember?->name ?? 'You',
            'line_items' => [
                ['label' => $isDoctor ? 'Consultation Fee' : 'Test / Package Fee', 'amount' => $consultationFee],
                ['label' => 'Platform Fee', 'amount' => $platformFee],
                ['label' => 'GST (0%)', 'amount' => $gst],
                ['label' => 'Discount', 'amount' => -$discount],
            ],
            'total' => $total,
            'payment_status' => $appt->payment_status ?? 'paid',
            'payment_method' => 'UPI (PhonePe)',
            'payment_date' => $appt->created_at->format('d M Y, g:i A'),
            'invoice_date' => $appt->created_at->format('d M Y'),
        ];
    }
}
