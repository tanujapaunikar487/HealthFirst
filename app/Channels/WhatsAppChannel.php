<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Twilio\Rest\Client;

class WhatsAppChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $message = $notification->toWhatsApp($notifiable);
        $phone = $notifiable->phone;

        if (!$phone || !$message) {
            return;
        }

        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.whatsapp_from');

        if (!$sid || !$token || !$from || $sid === 'your_twilio_sid') {
            \Log::info("[WhatsApp] To: {$phone} | {$message}");
            return;
        }

        $client = new Client($sid, $token);
        $client->messages->create("whatsapp:{$phone}", [
            'from' => $from,
            'body' => $message,
        ]);
    }
}
