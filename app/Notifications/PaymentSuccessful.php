<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class PaymentSuccessful extends BaseNotification
{
    public function __construct(
        protected object $appointment
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Payment successful')
            ->greeting('Payment confirmed')
            ->line("Your payment of ₹{$this->appointment->fee} has been successfully processed.")
            ->line("**Transaction ID:** {$this->appointment->payment_id}")
            ->line("**Appointment:** {$this->appointment->type} with {$this->appointment->doctor_name}")
            ->line("**Date:** {$this->appointment->date_formatted}")
            ->line('Thank you for using HealthCare.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        return "Payment successful! ₹{$this->appointment->fee} paid for your {$this->appointment->type} with {$this->appointment->doctor_name} on {$this->appointment->date_formatted}. Transaction ID: {$this->appointment->payment_id}";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payment_successful',
            'category' => 'billing',
            'title' => 'Payment successful',
            'message' => "Your payment of ₹{$this->appointment->fee} has been processed.",
            'appointment_id' => $this->appointment->id ?? null,
            'amount' => $this->appointment->fee,
            'payment_id' => $this->appointment->payment_id,
            'url' => route('billing.show', $this->appointment->id ?? 1),
        ];
    }
}
