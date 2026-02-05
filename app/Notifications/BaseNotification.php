<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

abstract class BaseNotification extends Notification
{
    use Queueable;

    protected array $channels = ['database'];

    public function setChannels(array $channels): self
    {
        $this->channels = $channels;
        return $this;
    }

    public function via(object $notifiable): array
    {
        return $this->channels;
    }

    public function toSms(object $notifiable): string
    {
        return $this->toWhatsApp($notifiable);
    }

    abstract public function toWhatsApp(object $notifiable): string;

    /**
     * Get the data for creating a BillingNotification record (in-app bell UI).
     * Override in subclasses when toArray() type/keys don't match the frontend contract.
     */
    public function toBillingNotification(object $notifiable): array
    {
        $arrayData = $this->toArray($notifiable);

        $type = $arrayData['type'] ?? 'general';
        $message = $arrayData['message'] ?? '';
        $title = $arrayData['title'] ?? $this->generateTitle($type);
        $appointmentId = $arrayData['appointment_id'] ?? null;

        $data = collect($arrayData)->except([
            'type', 'title', 'message', 'appointment_id', 'category', 'url',
        ])->toArray();

        return [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'appointment_id' => $appointmentId,
            'data' => $data,
        ];
    }

    protected function generateTitle(string $type): string
    {
        return ucwords(str_replace('_', ' ', $type));
    }
}
