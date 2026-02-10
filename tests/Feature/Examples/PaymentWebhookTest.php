<?php

namespace Tests\Feature\Examples;

use App\Models\Appointment;
use App\User;

/**
 * Example test demonstrating how to test Razorpay webhook handling
 *
 * NOTE: This is a template/example test. Skip it until webhook endpoints are implemented.
 */
test('razorpay payment webhook updates appointment status', function () {
    $this->markTestSkipped('Example test - implement webhook endpoints first');

    // Arrange: Create test data
    $user = User::factory()->create();
    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending_payment',
        'payment_id' => null,
    ]);

    // Act: Send webhook request
    $response = $this->postJson('/api/webhooks/razorpay', [
        'event' => 'payment.captured',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_123456789',
                    'order_id' => $appointment->razorpay_order_id,
                    'status' => 'captured',
                    'amount' => 50000, // ₹500 in paise
                ],
            ],
        ],
    ]);

    // Assert: Check response and database
    $response->assertOk();

    $appointment->refresh();
    expect($appointment->status)->toBe('confirmed')
        ->and($appointment->payment_id)->toBe('pay_123456789')
        ->and($appointment->payment_status)->toBe('paid');
});

test('razorpay payment failure webhook updates appointment', function () {
    $this->markTestSkipped('Example test - implement webhook endpoints first');

    $user = User::factory()->create();
    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending_payment',
    ]);

    $response = $this->postJson('/api/webhooks/razorpay', [
        'event' => 'payment.failed',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_123456789',
                    'order_id' => $appointment->razorpay_order_id,
                    'status' => 'failed',
                    'error_reason' => 'Card declined',
                ],
            ],
        ],
    ]);

    $response->assertOk();

    $appointment->refresh();
    expect($appointment->status)->toBe('payment_failed')
        ->and($appointment->payment_status)->toBe('failed');
});

test('appointment cancellation creates refund', function () {
    $this->markTestSkipped('Example test - implement webhook endpoints first');

    $user = User::factory()->create();
    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'status' => 'confirmed',
        'payment_id' => 'pay_123456789',
        'payment_status' => 'paid',
        'amount' => 500,
    ]);

    // Mock Razorpay client
    // $this->mock(Razorpay\Api\Api::class, function ($mock) {
    //     $mock->shouldReceive('refund->create')->once();
    // });

    $response = $this->actingAs($user)
        ->postJson("/appointments/{$appointment->id}/cancel", [
            'reason' => 'Cannot attend',
        ]);

    $response->assertOk();

    $appointment->refresh();
    expect($appointment->status)->toBe('cancelled')
        ->and($appointment->refund_status)->toBe('initiated');
});
