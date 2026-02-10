<?php

namespace App\Console\Commands;

use App\Models\Promotion;
use App\Notifications\PromotionNotification;
use App\Services\NotificationService;
use App\User;
use Illuminate\Console\Command;

class SendPromotionNotifications extends Command
{
    protected $signature = 'notifications:promotions';

    protected $description = 'Send notifications for new active promotions to opted-in users';

    public function handle(): void
    {
        $promotions = Promotion::active()
            ->whereNull('notification_sent_at')
            ->get();

        if ($promotions->isEmpty()) {
            $this->info('No new promotions to send.');

            return;
        }

        $service = app(NotificationService::class);
        $count = 0;

        foreach ($promotions as $promotion) {
            $users = User::all();

            foreach ($users as $user) {
                $service->send($user, new PromotionNotification($promotion), 'promotions');
                $count++;
            }

            $promotion->update(['notification_sent_at' => now()]);
        }

        $this->info("Sent {$count} promotion notifications.");
    }
}
