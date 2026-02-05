<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class RefundInitiated extends BaseNotification
{
    public function __construct(
        protected object $appointment,
        protected float $refundAmount
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Refund initiated')
            ->greeting('Refund initiated')
            ->line("A refund of ₹{$this->refundAmount} has been initiated to your original payment method.")
            ->line("**Original appointment:** {$this->appointment->type} with {$this->appointment->doctor_name}")
            ->line("**Date:** {$this->appointment->date_formatted}")
            ->line('**Estimated timeline:** 5-7 business days')
            ->line('You will receive the amount in your account shortly.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        return "Refund of ₹{$this->refundAmount} initiated for your cancelled {$this->appointment->type} with {$this->appointment->doctor_name} on {$this->appointment->date_formatted}. You will receive the amount in 5-7 business days.";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'refund_initiated',
            'category' => 'billing',
            'title' => 'Refund initiated',
            'message' => "Refund of ₹{$this->refundAmount} has been initiated.",
            'appointment_id' => $this->appointment->id ?? null,
            'refund_amount' => $this->refundAmount,
            'original_amount' => $this->appointment->fee,
            'url' => route('billing.show', $this->appointment->id ?? 1),
        ];
    }
}
