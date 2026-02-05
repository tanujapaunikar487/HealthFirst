<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('notifications:appointment-reminders')->hourly();
Schedule::command('notifications:payment-due')->daily();
Schedule::command('notifications:policy-expiring')->daily();
Schedule::command('notifications:prescription-reminders')->daily();
Schedule::command('notifications:promotions')->daily();
