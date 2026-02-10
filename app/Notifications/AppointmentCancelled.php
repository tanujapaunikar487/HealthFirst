<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class AppointmentCancelled extends BaseNotification
{
    protected $appointment;

    public function __construct($appointment)
    {
        $this->appointment = $appointment;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Appointment cancelled')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your appointment has been cancelled.')
            ->line('**Doctor:** '.$this->appointment->doctor_name)
            ->line('**Date:** '.$this->appointment->date_formatted)
            ->line('**Time:** '.$this->appointment->time_formatted);

        if (! empty($this->appointment->cancellation_reason)) {
            $message->line('**Reason:** '.$this->appointment->cancellation_reason);
        }

        $message->line('A refund of ₹'.number_format($this->appointment->fee, 2).' will be processed within 5-7 business days.')
            ->action('View details', url('/appointments/'.$this->appointment->id))
            ->line('If you have any questions, please contact our support team.');

        return $message;
    }

    public function toWhatsApp(object $notifiable): string
    {
        $text = "Hello {$notifiable->name},\n\n"
            ."Your appointment has been cancelled.\n\n"
            ."Doctor: {$this->appointment->doctor_name}\n"
            ."Date: {$this->appointment->date_formatted}\n"
            ."Time: {$this->appointment->time_formatted}\n";

        if (! empty($this->appointment->cancellation_reason)) {
            $text .= "Reason: {$this->appointment->cancellation_reason}\n";
        }

        $text .= "\nA refund of ₹".number_format($this->appointment->fee, 2)." will be processed within 5-7 business days.\n\n"
            .'If you have any questions, please contact our support team.';

        return $text;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'appointment_cancelled',
            'appointment_id' => $this->appointment->id,
            'doctor_name' => $this->appointment->doctor_name,
            'date' => $this->appointment->date_formatted,
            'time' => $this->appointment->time_formatted,
            'cancellation_reason' => $this->appointment->cancellation_reason ?? null,
            'refund_amount' => $this->appointment->fee,
            'message' => "Your appointment with {$this->appointment->doctor_name} on {$this->appointment->date_formatted} has been cancelled. Refund will be processed within 5-7 business days.",
        ];
    }
}
