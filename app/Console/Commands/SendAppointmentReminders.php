<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Notifications\AppointmentReminder;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendAppointmentReminders extends Command
{
    protected $signature = 'notifications:appointment-reminders';

    protected $description = 'Send reminders for appointments happening in the next 24 hours';

    public function handle(): void
    {
        $now = Carbon::now();
        $tomorrow = $now->copy()->addHours(24);

        $appointments = Appointment::where('status', 'confirmed')
            ->whereNull('reminder_sent_at')
            ->whereBetween('appointment_date', [$now->toDateString(), $tomorrow->toDateString()])
            ->get();

        $service = app(NotificationService::class);
        $count = 0;

        foreach ($appointments as $appointment) {
            $user = $appointment->user;
            if (! $user) {
                continue;
            }

            $service->send($user, new AppointmentReminder($appointment), 'appointments');
            $appointment->update(['reminder_sent_at' => now()]);
            $count++;
        }

        $this->info("Sent {$count} appointment reminders.");
    }
}
