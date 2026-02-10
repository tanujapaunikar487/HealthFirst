<?php

namespace App\Console\Commands;

use App\Models\InsurancePolicy;
use App\Notifications\PolicyExpiring;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendPolicyExpiringReminders extends Command
{
    protected $signature = 'notifications:policy-expiring';

    protected $description = 'Send reminders for insurance policies expiring within 60 days';

    public function handle(): void
    {
        $policies = InsurancePolicy::where('status', 'active')
            ->whereBetween('end_date', [Carbon::now(), Carbon::now()->addDays(60)])
            ->whereNull('expiry_reminder_sent_at')
            ->get();

        $service = app(NotificationService::class);
        $count = 0;

        foreach ($policies as $policy) {
            $user = $policy->user;
            if (! $user) {
                continue;
            }

            $service->send($user, new PolicyExpiring($policy), 'insurance');
            $policy->update(['expiry_reminder_sent_at' => now()]);
            $count++;
        }

        $this->info("Sent {$count} policy expiring reminders.");
    }
}
