<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class PaymentDue extends BaseNotification
{
    public function __construct(
        protected object $appointment
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Payment reminder')
            ->greeting('Payment reminder')
            ->line("You have a pending payment of ₹{$this->appointment->fee}.")
            ->line("**Appointment:** {$this->appointment->type} with {$this->appointment->doctor_name}")
            ->line("**Date:** {$this->appointment->date_formatted}");

        if (isset($this->appointment->days_overdue) && $this->appointment->days_overdue > 0) {
            $message->line("**Overdue by:** {$this->appointment->days_overdue} " .
                ($this->appointment->days_overdue === 1 ? 'day' : 'days'));
        }

        return $message
            ->action('Pay now', route('billing.show', $this->appointment->id ?? 1))
            ->line('Please complete your payment at the earliest.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        $message = "Payment reminder: ₹{$this->appointment->fee} due for your {$this->appointment->type} with {$this->appointment->doctor_name} on {$this->appointment->date_formatted}.";

        if (isset($this->appointment->days_overdue) && $this->appointment->days_overdue > 0) {
            $message .= " Overdue by {$this->appointment->days_overdue} " .
                ($this->appointment->days_overdue === 1 ? 'day' : 'days') . '.';
        }

        return $message . ' Please pay now.';
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payment_due',
            'category' => 'billing',
            'title' => 'Payment reminder',
            'message' => "Payment of ₹{$this->appointment->fee} is pending.",
            'appointment_id' => $this->appointment->id ?? null,
            'amount' => $this->appointment->fee,
            'days_overdue' => $this->appointment->days_overdue ?? 0,
            'url' => route('billing.show', $this->appointment->id ?? 1),
        ];
    }

    public function toBillingNotification(object $notifiable): array
    {
        return [
            'type' => 'payment_due_reminder',
            'title' => 'Payment Due Reminder',
            'message' => "Payment of ₹{$this->appointment->fee} is pending.",
            'appointment_id' => $this->appointment->id ?? null,
            'data' => [
                'amount' => $this->appointment->fee,
                'days_overdue' => $this->appointment->days_overdue ?? 0,
            ],
        ];
    }
}
