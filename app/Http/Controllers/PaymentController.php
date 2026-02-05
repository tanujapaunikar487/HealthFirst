<?php

namespace App\Http\Controllers;

use App\BookingConversation;
use App\Models\Appointment;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Razorpay\Api\Api;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use App\Notifications\AppointmentConfirmed;
use App\Notifications\PaymentSuccessful;

class PaymentController extends Controller
{
    protected $razorpay;
    protected $isMockMode;

    public function __construct()
    {
        // Check if we're in mock mode (credentials not set or contain placeholder values)
        $key = config('razorpay.key');
        $secret = config('razorpay.secret');

        $this->isMockMode = empty($key) || empty($secret) ||
                            str_contains($key, 'your_key_here') ||
                            str_contains($secret, 'your_secret_here');

        if (!$this->isMockMode) {
            $this->razorpay = new Api($key, $secret);
        }
    }

    /**
     * Create a Razorpay order for the booking
     */
    public function createOrder(Request $request, BookingConversation $conversation)
    {
        try {
            // Get the booking amount from collected_data
            $amount = $this->getBookingAmount($conversation);

            if ($this->isMockMode) {
                // Mock mode - generate fake order
                $orderId = 'order_mock_' . uniqid();

                // Store order ID in conversation
                $conversation->collected_data = array_merge($conversation->collected_data, [
                    'razorpay_order_id' => $orderId,
                    'mock_payment' => true,
                ]);
                $conversation->save();

                return response()->json([
                    'order_id' => $orderId,
                    'amount' => $amount,
                    'currency' => 'INR',
                    'key' => 'rzp_test_mock',
                    'mock_mode' => true,
                ]);
            }

            // Real Razorpay mode
            $order = $this->razorpay->order->create([
                'amount' => $amount * 100, // Amount in paise
                'currency' => 'INR',
                'receipt' => 'booking_' . $conversation->id,
                'notes' => [
                    'conversation_id' => $conversation->id,
                    'booking_type' => $conversation->collected_data['booking_type'] ?? '',
                ],
            ]);

            // Store order ID in conversation
            $conversation->collected_data = array_merge($conversation->collected_data, [
                'razorpay_order_id' => $order->id,
            ]);
            $conversation->save();

            return response()->json([
                'order_id' => $order->id,
                'amount' => $amount,
                'currency' => 'INR',
                'key' => config('razorpay.key'),
            ]);
        } catch (\Exception $e) {
            Log::error('Razorpay order creation failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create payment order'], 500);
        }
    }

    /**
     * Verify payment and process booking
     */
    public function verifyPayment(Request $request, BookingConversation $conversation)
    {
        $validated = $request->validate([
            'razorpay_payment_id' => 'required|string',
            'razorpay_order_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        try {
            // Check if this is a mock payment
            $isMockPayment = $conversation->collected_data['mock_payment'] ?? false;

            if (!$isMockPayment) {
                // Real Razorpay payment - verify signature
                $attributes = [
                    'razorpay_order_id' => $validated['razorpay_order_id'],
                    'razorpay_payment_id' => $validated['razorpay_payment_id'],
                    'razorpay_signature' => $validated['razorpay_signature'],
                ];

                $this->razorpay->utility->verifyPaymentSignature($attributes);
            }

            // Payment verified successfully (or mock payment)
            // Update conversation with payment details
            $conversation->collected_data = array_merge($conversation->collected_data, [
                'payment_id' => $validated['razorpay_payment_id'],
                'payment_status' => 'paid',
                'current_step' => 'completed',
            ]);
            $conversation->status = 'completed';
            $conversation->save();

            // Create actual booking record
            $bookingId = $this->createBooking($conversation);

            // Send notifications
            $user = Auth::user() ?? \App\User::first();
            $appointment = Appointment::find($bookingId);
            if ($appointment) {
                app(NotificationService::class)->send($user, new AppointmentConfirmed($appointment), 'appointments');
                app(NotificationService::class)->send($user, new PaymentSuccessful($appointment), 'billing');
            }

            return response()->json([
                'success' => true,
                'redirect' => route('booking.confirmation', ['booking' => $bookingId]),
            ]);
        } catch (\Exception $e) {
            Log::error('Payment verification failed: ' . $e->getMessage());

            // Mark payment as failed
            $conversation->collected_data = array_merge($conversation->collected_data, [
                'payment_status' => 'failed',
            ]);
            $conversation->save();

            return response()->json([
                'success' => false,
                'error' => 'Payment verification failed',
            ], 400);
        }
    }

    /**
     * Get booking amount based on conversation data
     */
    protected function getBookingAmount(BookingConversation $conversation): int
    {
        $data = $conversation->collected_data;

        // For doctor appointments
        if ($data['booking_type'] === 'doctor') {
            if (isset($data['mode'])) {
                return $data['mode'] === 'video' ? 800 : 1200;
            }
            return 800; // Default
        }

        // For lab tests
        if ($data['booking_type'] === 'lab_test') {
            // Get package price from collected_data or default
            return $data['package_price'] ?? 4999;
        }

        return 0;
    }

    /**
     * Create actual booking record
     */
    protected function createBooking(BookingConversation $conversation): string
    {
        $data = $conversation->collected_data;
        $user = Auth::user() ?? \App\User::first();
        $isDoctor = ($data['booking_type'] ?? 'doctor') === 'doctor';

        $appointmentData = [
            'user_id' => $user->id,
            'family_member_id' => $data['selectedPatientId'] ?? null,
            'appointment_type' => $isDoctor ? 'doctor' : 'lab_test',
            'appointment_date' => $data['selectedDate'] ?? now()->toDateString(),
            'appointment_time' => $data['selectedTime'] ?? '09:00 AM',
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'fee' => $data['fee'] ?? $this->getBookingAmount($conversation),
        ];

        if ($isDoctor) {
            $doctorId = $data['selectedDoctorId'] ?? null;
            $doctor = $doctorId ? Doctor::find($doctorId) : null;
            $appointmentData['doctor_id'] = $doctorId;
            $appointmentData['department_id'] = $doctor?->department_id;
            $appointmentData['consultation_mode'] = $data['consultationMode'] ?? 'video';
            $appointmentData['symptoms'] = $data['symptoms'] ?? [];
        } else {
            $appointmentData['lab_package_id'] = $data['selectedPackageId'] ?? null;
            $appointmentData['lab_test_ids'] = $data['selectedTestIds'] ?? null;
            $appointmentData['collection_type'] = $data['collectionType'] ?? null;
            $appointmentData['lab_center_id'] = $data['selectedCenterId'] ?? null;
            $appointmentData['user_address_id'] = $data['selectedAddressId'] ?? null;
        }

        $appointment = Appointment::create($appointmentData);

        // Store appointment ID in conversation for reference
        $conversation->collected_data = array_merge($conversation->collected_data, [
            'booking_id' => (string) $appointment->id,
        ]);
        $conversation->save();

        return (string) $appointment->id;
    }
}
