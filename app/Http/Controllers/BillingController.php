<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\FamilyMember;
use App\Models\InsuranceClaim;
use App\Models\LabTestType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Razorpay\Api\Api;

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
     * Create a Razorpay order for billing payment.
     */
    public function createOrder(Request $request, Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $amount = (int) $validated['amount'];

        try {
            $key = config('razorpay.key');
            $secret = config('razorpay.secret');

            $isMockMode = empty($key) || empty($secret) ||
                str_contains($key, 'your_key_here') ||
                str_contains($secret, 'your_secret_here');

            if ($isMockMode) {
                $orderId = 'order_mock_' . uniqid();

                return response()->json([
                    'order_id' => $orderId,
                    'amount' => $amount,
                    'currency' => 'INR',
                    'key' => 'rzp_test_mock',
                    'mock_mode' => true,
                ]);
            }

            $razorpay = new Api($key, $secret);

            $order = $razorpay->order->create([
                'amount' => $amount * 100,
                'currency' => 'INR',
                'receipt' => 'bill_' . $appointment->id,
                'notes' => [
                    'appointment_id' => $appointment->id,
                    'invoice_number' => 'INV-' . str_pad($appointment->id, 6, '0', STR_PAD_LEFT),
                ],
            ]);

            return response()->json([
                'order_id' => $order->id,
                'amount' => $amount,
                'currency' => 'INR',
                'key' => $key,
            ]);
        } catch (\Exception $e) {
            Log::error('Billing Razorpay order creation failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create payment order'], 500);
        }
    }

    /**
     * Verify Razorpay payment for billing.
     */
    public function verifyPayment(Request $request, Appointment $appointment)
    {
        $user = Auth::user() ?? \App\User::first();

        if ($appointment->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'razorpay_payment_id' => 'required|string',
            'razorpay_order_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        try {
            $key = config('razorpay.key');
            $secret = config('razorpay.secret');

            $isMockMode = empty($key) || empty($secret) ||
                str_contains($key, 'your_key_here') ||
                str_contains($secret, 'your_secret_here');

            if (!$isMockMode) {
                $razorpay = new Api($key, $secret);
                $razorpay->utility->verifyPaymentSignature([
                    'razorpay_order_id' => $validated['razorpay_order_id'],
                    'razorpay_payment_id' => $validated['razorpay_payment_id'],
                    'razorpay_signature' => $validated['razorpay_signature'],
                ]);
            }

            // Update appointment payment status
            $appointment->payment_status = 'paid';
            $appointment->save();

            return response()->json([
                'success' => true,
                'message' => 'Payment successful',
            ]);
        } catch (\Exception $e) {
            Log::error('Billing payment verification failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Payment verification failed'], 400);
        }
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
            'is_overdue' => in_array($billingStatus, ['due', 'copay_due'])
                && $appt->appointment_date->copy()->addDays(30)->isPast(),
            'days_overdue' => in_array($billingStatus, ['due', 'copay_due'])
                ? max(0, (int) $appt->appointment_date->copy()->addDays(7)->diffInDays(now(), false))
                : 0,
            'insurance_claim_id' => in_array($billingStatus, ['claim_pending', 'awaiting_approval', 'covered', 'copay_due', 'reimbursed'])
                ? InsuranceClaim::where('appointment_id', $appt->id)->value('id')
                : null,
        ];
    }

    private function formatBillDetail(Appointment $appt): array
    {
        $isDoctor = $appt->appointment_type === 'doctor';
        $consultationFee = $appt->fee ?? 800;
        $platformFee = 49;
        $subtotal = $consultationFee + $platformFee;
        $discount = 0;
        $tax = 0;

        $title = 'Appointment';
        $subtitle = '';
        $serviceType = 'Consultation';
        if ($isDoctor) {
            $title = $appt->doctor?->name ?? 'Doctor Appointment';
            $subtitle = $appt->doctor?->specialization ?? '';
            $serviceType = 'Consultation';
        } elseif ($appt->labPackage) {
            $title = $appt->labPackage->name;
            $subtitle = 'Health Package';
            $serviceType = 'Health Package';
        } elseif ($appt->lab_test_ids) {
            $testNames = LabTestType::whereIn('id', $appt->lab_test_ids)->pluck('name')->toArray();
            $title = implode(', ', $testNames);
            $subtitle = count($testNames) . ' test(s)';
            $serviceType = 'Lab Test';
        } else {
            $title = 'Lab Test';
            $serviceType = 'Lab Test';
        }

        $billingStatus = $this->getBillingStatus($appt, $appt->id);
        $amountDetails = $this->computeAmountDetails($billingStatus, $subtotal, $appt->id);
        $insuranceDeduction = $amountDetails['insurance_covered'];
        $total = $subtotal + $tax - $discount - $insuranceDeduction;
        if ($total < 0) $total = 0;

        // Line items with qty/unit_price
        $lineItems = [
            ['label' => $isDoctor ? 'Consultation Fee' : 'Test / Package Fee', 'qty' => 1, 'unit_price' => $consultationFee, 'total' => $consultationFee],
            ['label' => 'Platform Fee', 'qty' => 1, 'unit_price' => $platformFee, 'total' => $platformFee],
        ];

        // Due date: 7 days after appointment for due/copay_due
        $dueDate = null;
        if (in_array($billingStatus, ['due', 'copay_due'])) {
            $dueDate = $appt->appointment_date->copy()->addDays(7)->format('D, d M Y');
        }

        // Payment info (for paid statuses)
        $paymentInfo = null;
        if (in_array($billingStatus, ['paid', 'covered', 'reimbursed'])) {
            $paymentInfo = [
                'method' => 'UPI (PhonePe)',
                'transaction_id' => 'TXN' . str_pad($appt->id * 7919, 12, '0', STR_PAD_LEFT),
                'paid_at' => $appt->created_at->format('d M Y, g:i A'),
                'receipt_number' => 'RCP-' . str_pad($appt->id, 6, '0', STR_PAD_LEFT),
            ];
        }

        // Insurance details (for insurance-related statuses)
        $insuranceDetails = null;
        if (in_array($billingStatus, ['claim_pending', 'awaiting_approval', 'covered', 'copay_due', 'reimbursed'])) {
            $claim = InsuranceClaim::where('user_id', $appt->user_id)
                ->with('insuranceProvider')
                ->first();

            $insuranceDetails = [
                'provider_name' => $claim?->insuranceProvider?->name ?? 'Star Health Insurance',
                'policy_number' => $claim?->policy_number ?? 'SH-2025-789456',
                'claim_id' => 'CLM-' . str_pad($appt->id * 31, 8, '0', STR_PAD_LEFT),
                'insurance_claim_id' => $claim?->id,
                'claim_status' => match ($billingStatus) {
                    'awaiting_approval' => 'Under Review',
                    'claim_pending' => 'Submitted',
                    'covered' => 'Approved',
                    'copay_due' => 'Partially Approved',
                    'reimbursed' => 'Reimbursed',
                    default => 'Pending',
                },
                'covered_amount' => $amountDetails['insurance_covered'],
                'copay_amount' => $amountDetails['due_amount'],
                'pre_auth_status' => in_array($billingStatus, ['covered', 'reimbursed']) ? 'Approved' : 'Pending',
            ];
        }

        // EMI details
        $emiDetails = null;
        if ($billingStatus === 'emi') {
            $planMonths = 6;
            $monthlyAmount = round($subtotal / $planMonths);
            $paidInstallments = $amountDetails['emi_current'] ?? 1;
            $emiDetails = [
                'total_amount' => $subtotal,
                'plan_months' => $planMonths,
                'monthly_amount' => $monthlyAmount,
                'paid_installments' => $paidInstallments,
                'total_installments' => $planMonths,
                'next_due_date' => Carbon::today()->addDays(15)->format('D, d M Y'),
                'remaining_balance' => $monthlyAmount * ($planMonths - $paidInstallments),
            ];
        }

        // Dispute details
        $disputeDetails = null;
        if ($billingStatus === 'disputed') {
            $disputeDetails = [
                'dispute_id' => 'DSP-' . str_pad($appt->id * 47, 8, '0', STR_PAD_LEFT),
                'raised_on' => $appt->created_at->copy()->addDays(3)->format('d M Y'),
                'reason' => 'Incorrect charges applied',
                'status' => 'Under Review',
                'resolution_notes' => null,
            ];
        }

        // Activity log
        $activity = $this->buildActivityLog($appt, $billingStatus);

        return [
            'id' => $appt->id,
            'invoice_number' => 'INV-' . str_pad($appt->id, 6, '0', STR_PAD_LEFT),
            'appointment_id' => $appt->id,
            'appointment_type' => $isDoctor ? 'doctor' : 'lab_test',
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

            // Billing status
            'billing_status' => $billingStatus,
            'due_amount' => $amountDetails['due_amount'],
            'original_amount' => $amountDetails['original_amount'],
            'insurance_covered' => $amountDetails['insurance_covered'],
            'emi_current' => $amountDetails['emi_current'],
            'emi_total' => $amountDetails['emi_total'],

            // Overview
            'generated_date' => $appt->created_at->format('d M Y'),
            'due_date' => $dueDate,
            'reference_number' => ($isDoctor ? 'OPD-' : 'LAB-') . str_pad($appt->id, 6, '0', STR_PAD_LEFT),

            // Service details
            'service_type' => $serviceType,
            'doctor_name' => $isDoctor ? ($appt->doctor?->name ?? null) : null,
            'doctor_specialization' => $isDoctor ? ($appt->doctor?->specialization ?? null) : null,
            'service_date' => $appt->appointment_date->format('D, d M Y'),

            // Charges
            'line_items' => $lineItems,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'insurance_deduction' => $insuranceDeduction,
            'total' => $amountDetails['due_amount'] > 0 ? $amountDetails['due_amount'] : $subtotal,

            // Sections
            'payment_info' => $paymentInfo,
            'insurance_details' => $insuranceDetails,
            'emi_details' => $emiDetails,
            'dispute_details' => $disputeDetails,
            'activity_log' => $activity,

            // Overdue
            'is_overdue' => in_array($billingStatus, ['due', 'copay_due'])
                && $appt->appointment_date->copy()->addDays(30)->isPast(),
            'days_overdue' => in_array($billingStatus, ['due', 'copay_due'])
                ? max(0, (int) $appt->appointment_date->copy()->addDays(7)->diffInDays(now(), false))
                : 0,

            // Legacy (keep for download)
            'payment_method' => 'UPI (PhonePe)',
            'payment_date' => $appt->created_at->format('d M Y, g:i A'),
            'invoice_date' => $appt->created_at->format('d M Y'),
        ];
    }

    private function buildActivityLog(Appointment $appt, string $billingStatus): array
    {
        $log = [];
        $created = $appt->created_at;

        $log[] = ['event' => 'Bill generated', 'date' => $created->format('d M Y, g:i A'), 'icon' => 'file'];

        if (in_array($billingStatus, ['claim_pending', 'awaiting_approval', 'covered', 'copay_due', 'reimbursed'])) {
            $log[] = ['event' => 'Insurance claim submitted', 'date' => $created->copy()->addHours(1)->format('d M Y, g:i A'), 'icon' => 'shield'];
        }

        if (in_array($billingStatus, ['awaiting_approval'])) {
            $log[] = ['event' => 'Claim under review', 'date' => $created->copy()->addDays(1)->format('d M Y, g:i A'), 'icon' => 'clock'];
        }

        if (in_array($billingStatus, ['covered', 'reimbursed'])) {
            $log[] = ['event' => 'Insurance claim approved', 'date' => $created->copy()->addDays(2)->format('d M Y, g:i A'), 'icon' => 'check'];
        }

        if (in_array($billingStatus, ['paid', 'covered', 'reimbursed', 'emi'])) {
            $log[] = ['event' => 'Payment successful', 'date' => $created->copy()->addMinutes(5)->format('d M Y, g:i A'), 'icon' => 'check'];
            $log[] = ['event' => 'Invoice sent to email', 'date' => $created->copy()->addMinutes(10)->format('d M Y, g:i A'), 'icon' => 'mail'];
        }

        if ($billingStatus === 'disputed') {
            $log[] = ['event' => 'Payment successful', 'date' => $created->copy()->addMinutes(5)->format('d M Y, g:i A'), 'icon' => 'check'];
            $log[] = ['event' => 'Dispute raised', 'date' => $created->copy()->addDays(3)->format('d M Y, g:i A'), 'icon' => 'alert'];
        }

        if ($billingStatus === 'refunded') {
            $log[] = ['event' => 'Payment successful', 'date' => $created->copy()->addMinutes(5)->format('d M Y, g:i A'), 'icon' => 'check'];
            $log[] = ['event' => 'Refund initiated', 'date' => $created->copy()->addDays(1)->format('d M Y, g:i A'), 'icon' => 'rotate'];
            $log[] = ['event' => 'Refund completed', 'date' => $created->copy()->addDays(3)->format('d M Y, g:i A'), 'icon' => 'check'];
        }

        return $log;
    }
}
