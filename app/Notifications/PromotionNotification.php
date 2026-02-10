<?php

namespace App\Notifications;

use App\Models\Promotion;
use Illuminate\Notifications\Messages\MailMessage;

class PromotionNotification extends BaseNotification
{
    protected Promotion $promotion;

    public function __construct(Promotion $promotion)
    {
        $this->promotion = $promotion;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject($this->promotion->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line($this->promotion->description);

        if ($this->promotion->button_href) {
            $message->action(
                $this->promotion->button_text ?? 'Learn more',
                url($this->promotion->button_href)
            );
        }

        $message->line('Thank you for using HealthCare!');

        return $message;
    }

    public function toWhatsApp(object $notifiable): string
    {
        $text = "Hello {$notifiable->name},\n\n"
            ."{$this->promotion->title}\n\n"
            ."{$this->promotion->description}\n\n";

        if ($this->promotion->button_href) {
            $buttonText = $this->promotion->button_text ?? 'Learn more';
            $text .= "{$buttonText}: ".url($this->promotion->button_href)."\n\n";
        }

        $text .= 'Thank you for using HealthCare!';

        return $text;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'promotion',
            'promotion_id' => $this->promotion->id,
            'title' => $this->promotion->title,
            'description' => $this->promotion->description,
            'button_text' => $this->promotion->button_text,
            'button_href' => $this->promotion->button_href,
            'message' => $this->promotion->title.': '.$this->promotion->description,
        ];
    }
}
