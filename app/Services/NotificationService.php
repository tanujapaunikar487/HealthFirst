<?php

namespace App\Services;

use App\Channels\SmsChannel;
use App\Channels\WhatsAppChannel;
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
    }
}
