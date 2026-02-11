<?php

namespace App\Listeners;

use Database\Seeders\HospitalSeeder;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Log;

class SeedNewUserData
{
    public function handle(Registered $event): void
    {
        try {
            HospitalSeeder::seedForUser($event->user);
        } catch (\Throwable $e) {
            Log::error('Failed to seed demo data for new user', [
                'user_id' => $event->user->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
