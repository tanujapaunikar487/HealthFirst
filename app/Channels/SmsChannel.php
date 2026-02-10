<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Twilio\Rest\Client;

class SmsChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $message = $notification->toSms($notifiable);
        $phone = $notifiable->phone;

        if (! $phone || ! $message) {
            return;
        }

        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.sms_from');

        if (! $sid || ! $token || ! $from || $sid === 'your_twilio_sid') {
            \Log::info("[SMS] To: {$phone} | {$message}");

            return;
        }

        $client = new Client($sid, $token);
        $client->messages->create($phone, [
            'from' => $from,
            'body' => $message,
        ]);
    }
}
