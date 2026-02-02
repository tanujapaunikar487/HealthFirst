<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class OtpService
{
    /**
     * Generate a 6-digit OTP and store it in cache
     *
     * @param string $phone The phone number to generate OTP for
     * @return string The generated OTP
     */
    public function generate(string $phone): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put("otp:$phone", $otp, now()->addMinutes(5));

        Log::info('OTP generated', [
            'phone' => $phone,
            'expires_at' => now()->addMinutes(5)->toIso8601String(),
        ]);

        return $otp;
    }

    /**
     * Verify an OTP for a phone number
     *
     * @param string $phone The phone number
     * @param string $otp The OTP to verify
     * @return bool True if verification successful
     */
    public function verify(string $phone, string $otp): bool
    {
        $cachedOtp = Cache::get("otp:$phone");

        if ($cachedOtp === $otp) {
            Cache::forget("otp:$phone");

            Log::info('OTP verified successfully', [
                'phone' => $phone,
            ]);

            return true;
        }

        Log::warning('OTP verification failed', [
            'phone' => $phone,
        ]);

        return false;
    }

    /**
     * Send OTP via SMS (mock mode - logs to Laravel log)
     *
     * @param string $phone The phone number
     * @param string $otp The OTP to send
     * @return bool True if send successful
     */
    public function send(string $phone, string $otp): bool
    {
        // Mock mode: Log OTP to Laravel log
        Log::info("📱 OTP Verification", [
            'phone' => $phone,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(5)->toIso8601String(),
        ]);

        // For development: Also log to console in JSON format
        if (app()->environment('local')) {
            error_log(json_encode([
                'type' => 'OTP',
                'phone' => $phone,
                'code' => $otp,
            ]));
        }

        return true;
    }

    /**
     * Generate a verification token
     *
     * @param string $phone The phone number
     * @return string The verification token
     */
    public function generateVerificationToken(string $phone): string
    {
        $token = bin2hex(random_bytes(32));
        Cache::put("verification_token:$token", $phone, now()->addMinutes(15));

        Log::info('Verification token generated', [
            'phone' => $phone,
            'expires_at' => now()->addMinutes(15)->toIso8601String(),
        ]);

        return $token;
    }

    /**
     * Verify a verification token
     *
     * @param string $token The token to verify
     * @return string|null The phone number if valid, null otherwise
     */
    public function verifyToken(string $token): ?string
    {
        $phone = Cache::get("verification_token:$token");

        if ($phone) {
            Cache::forget("verification_token:$token");

            Log::info('Verification token validated', [
                'phone' => $phone,
            ]);

            return $phone;
        }

        Log::warning('Verification token validation failed');

        return null;
    }
}
