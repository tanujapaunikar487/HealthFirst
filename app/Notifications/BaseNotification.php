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
}
