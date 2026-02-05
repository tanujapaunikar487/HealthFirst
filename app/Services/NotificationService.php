<?php

namespace App\Services;

use App\Channels\SmsChannel;
use App\Channels\WhatsAppChannel;
use App\Models\BillingNotification;
use App\Notifications\BaseNotification;
use App\User;
use Illuminate\Notifications\Notification;

class NotificationService
{
    private array $defaultPrefs = [
        'channels' => ['email' => true, 'sms' => false, 'whatsapp' => false],
        'categories' => [
            'appointments' => true,
            'health_alerts' => true,
            'billing' => true,
            'insurance' => true,
            'promotions' => false,
        ],
    ];

    public function send(User $user, Notification $notification, string $category, ?string $subPreference = null): void
    {
        $prefs = $user->getSetting('notifications', $this->defaultPrefs);

        if (!($prefs['categories'][$category] ?? true)) {
            return;
        }

        if ($subPreference) {
            $subPrefs = $prefs[$category] ?? [];
            if (!($subPrefs[$subPreference] ?? true)) {
                return;
            }
        }

        $channels = ['database'];

        if ($prefs['channels']['email'] ?? true) {
            $channels[] = 'mail';
        }
        if ($prefs['channels']['sms'] ?? false) {
            $channels[] = SmsChannel::class;
        }
        if ($prefs['channels']['whatsapp'] ?? false) {
            $channels[] = WhatsAppChannel::class;
        }

        $notification->setChannels($channels);
        $user->notify($notification);

        // Also write to billing_notifications for the in-app bell UI
        if ($notification instanceof BaseNotification) {
            $this->createBillingNotification($user, $notification, $channels);
        }
    }

    private function createBillingNotification(User $user, BaseNotification $notification, array $channels): void
    {
        try {
            $billingData = $notification->toBillingNotification($user);

            BillingNotification::create([
                'user_id' => $user->id,
                'appointment_id' => $billingData['appointment_id'] ?? null,
                'type' => $billingData['type'],
                'title' => $billingData['title'],
                'message' => $billingData['message'],
                'channels' => $this->mapChannelsForDisplay($channels),
                'data' => !empty($billingData['data']) ? $billingData['data'] : null,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to create billing notification: ' . $e->getMessage());
        }
    }

    private function mapChannelsForDisplay(array $channels): array
    {
        $map = [
            'database' => 'push',
            'mail' => 'email',
            SmsChannel::class => 'sms',
            WhatsAppChannel::class => 'whatsapp',
        ];

        return array_values(array_map(
            fn ($ch) => $map[$ch] ?? $ch,
            $channels
        ));
    }
}
