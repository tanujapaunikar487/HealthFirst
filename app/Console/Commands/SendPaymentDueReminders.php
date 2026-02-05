<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Notifications\PaymentDue;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendPaymentDueReminders extends Command
{
    protected $signature = 'notifications:payment-due';
    protected $description = 'Send reminders for overdue payments';

    public function handle(): void
    {
        $appointments = Appointment::where('payment_status', 'pending')
            ->where('appointment_date', '<', Carbon::now()->subDays(7))
            ->whereNull('payment_reminder_sent_at')
            ->get();

        $service = app(NotificationService::class);
        $count = 0;

        foreach ($appointments as $appointment) {
            $user = $appointment->user;
            if (!$user) continue;

            $service->send($user, new PaymentDue($appointment), 'billing');
            $appointment->update(['payment_reminder_sent_at' => now()]);
            $count++;
        }

        $this->info("Sent {$count} payment due reminders.");
    }
}
