<?php

namespace App\Services;

use App\Mail\OtpMail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
     * Verify a verification token (phone or email)
     *
     * @param string $token The token to verify
     * @return array|null Array with 'type' and 'value' if valid, null otherwise
     */
    public function verifyToken(string $token): ?array
    {
        // Try phone token first
        $phone = Cache::get("verification_token:$token");

        if ($phone) {
            Cache::forget("verification_token:$token");

            Log::info('Verification token validated', [
                'phone' => $phone,
            ]);

            return ['type' => 'phone', 'value' => $phone];
        }

        // Try email token
        $email = Cache::get("verification_token:email:$token");

        if ($email) {
            Cache::forget("verification_token:email:$token");

            Log::info('Email verification token validated', [
                'email' => $email,
            ]);

            return ['type' => 'email', 'value' => $email];
        }

        Log::warning('Verification token validation failed');

        return null;
    }

    /**
     * Generate a 6-digit OTP for email and store it in cache
     *
     * @param string $email The email address to generate OTP for
     * @return string The generated OTP
     */
    public function generateForEmail(string $email): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put("otp:email:$email", $otp, now()->addMinutes(5));

        Log::info('OTP generated for email', [
            'email' => $email,
            'expires_at' => now()->addMinutes(5)->toIso8601String(),
        ]);

        return $otp;
    }

    /**
     * Send OTP via email
     *
     * @param string $email The email address
     * @param string $otp The OTP to send
     * @return bool True if send successful
     */
    public function sendEmail(string $email, string $otp): bool
    {
        try {
            Mail::to($email)->send(new OtpMail($otp));

            Log::info("📧 OTP sent via email", [
                'email' => $email,
                'otp' => $otp,
                'expires_at' => now()->addMinutes(5)->toIso8601String(),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send OTP email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Verify an OTP for an email address
     *
     * @param string $email The email address
     * @param string $otp The OTP to verify
     * @return bool True if verification successful
     */
    public function verifyEmail(string $email, string $otp): bool
    {
        $cachedOtp = Cache::get("otp:email:$email");

        if ($cachedOtp === $otp) {
            Cache::forget("otp:email:$email");

            Log::info('Email OTP verified successfully', [
                'email' => $email,
            ]);

            return true;
        }

        Log::warning('Email OTP verification failed', [
            'email' => $email,
        ]);

        return false;
    }

    /**
     * Generate a verification token for email
     *
     * @param string $email The email address
     * @return string The verification token
     */
    public function generateVerificationTokenForEmail(string $email): string
    {
        $token = bin2hex(random_bytes(32));
        Cache::put("verification_token:email:$token", $email, now()->addMinutes(15));

        Log::info('Verification token generated for email', [
            'email' => $email,
            'expires_at' => now()->addMinutes(15)->toIso8601String(),
        ]);

        return $token;
    }
}
