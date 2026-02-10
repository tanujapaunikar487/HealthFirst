<?php

namespace Tests\Feature\Examples;

use App\Models\FamilyMember;
use App\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

/**
 * Example test demonstrating OTP verification flow for linking family members
 *
 * NOTE: This is a template/example test. Skip it until OTP endpoints are implemented.
 */
test('user can send OTP to link existing patient', function () {
    $this->markTestSkipped('Example test - implement OTP endpoints first');

    Notification::fake();

    $user = User::factory()->create();
    $existingPatient = FamilyMember::factory()->create([
        'phone' => '+919876543210',
        'linked_user_id' => null, // Not linked yet
    ]);

    $response = $this->actingAs($user)
        ->postJson('/family-members/send-otp', [
            'member_id' => $existingPatient->id,
            'contact_method' => 'phone',
        ]);

    $response->assertOk()
        ->assertJson([
            'otp_sent' => true,
            'sent_to' => '*******3210',
        ]);

    // Verify OTP was cached
    expect(Cache::has("otp:{$existingPatient->id}:phone"))->toBeTrue();
});

test('user can verify OTP and link family member', function () {
    $this->markTestSkipped('Example test - implement OTP endpoints first');

    $user = User::factory()->create();
    $existingPatient = FamilyMember::factory()->create([
        'phone' => '+919876543210',
        'linked_user_id' => null,
    ]);

    // Store OTP in cache
    $otp = '123456';
    Cache::put("otp:{$existingPatient->id}:phone", $otp, 300);

    $response = $this->actingAs($user)
        ->postJson('/family-members/verify-otp', [
            'member_id' => $existingPatient->id,
            'contact_method' => 'phone',
            'otp' => $otp,
        ]);

    $response->assertOk()
        ->assertJson([
            'verified' => true,
        ]);
});

test('linking family member fails with wrong OTP', function () {
    $this->markTestSkipped('Example test - implement OTP endpoints first');

    $user = User::factory()->create();
    $existingPatient = FamilyMember::factory()->create();

    Cache::put("otp:{$existingPatient->id}:phone", '123456', 300);

    $response = $this->actingAs($user)
        ->postJson('/family-members/verify-otp', [
            'member_id' => $existingPatient->id,
            'contact_method' => 'phone',
            'otp' => '999999', // Wrong OTP
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'verified' => false,
            'error' => 'Invalid OTP',
        ]);
});

test('OTP expires after 5 minutes', function () {
    $this->markTestSkipped('Example test - implement OTP endpoints first');

    $user = User::factory()->create();
    $existingPatient = FamilyMember::factory()->create();

    // Store OTP that has expired
    Cache::put("otp:{$existingPatient->id}:phone", '123456', -10);

    $response = $this->actingAs($user)
        ->postJson('/family-members/verify-otp', [
            'member_id' => $existingPatient->id,
            'contact_method' => 'phone',
            'otp' => '123456',
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'verified' => false,
            'error' => 'OTP expired',
        ]);
});

test('user cannot link already linked family member', function () {
    $this->markTestSkipped('Example test - implement OTP endpoints first');

    $user = User::factory()->create();
    $anotherUser = User::factory()->create();

    $linkedPatient = FamilyMember::factory()->create([
        'linked_user_id' => $anotherUser->id, // Already linked
    ]);

    $response = $this->actingAs($user)
        ->postJson('/family-members/send-otp', [
            'member_id' => $linkedPatient->id,
            'contact_method' => 'phone',
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'error' => 'This member is already linked to another account',
        ]);
});
