<?php

namespace App\Listeners;

use Database\Seeders\HospitalSeeder;
use Illuminate\Auth\Events\Registered;

class SeedNewUserData
{
    public function handle(Registered $event): void
    {
        HospitalSeeder::seedForUser($event->user);
    }
}
