<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class AppointmentConfirmed extends BaseNotification
{
    protected $appointment;

    public function __construct($appointment)
    {
        $this->appointment = $appointment;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Appointment confirmed')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your appointment has been confirmed.')
            ->line('**Doctor:** ' . $this->appointment->doctor_name)
            ->line('**Date:** ' . $this->appointment->date_formatted)
            ->line('**Time:** ' . $this->appointment->time_formatted)
            ->line('**Mode:** ' . ucfirst($this->appointment->mode))
            ->line('**Fee:** ₹' . number_format($this->appointment->fee, 2))
            ->action('View appointment', url('/appointments/' . $this->appointment->id))
            ->line('Thank you for using HealthCare!');
    }

    public function toWhatsApp(object $notifiable): string
    {
        return "Hello {$notifiable->name},\n\n"
            . "Your appointment has been confirmed.\n\n"
            . "Doctor: {$this->appointment->doctor_name}\n"
            . "Date: {$this->appointment->date_formatted}\n"
            . "Time: {$this->appointment->time_formatted}\n"
            . "Mode: " . ucfirst($this->appointment->mode) . "\n"
            . "Fee: ₹" . number_format($this->appointment->fee, 2) . "\n\n"
            . "Thank you for using HealthCare!";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'appointment_confirmed',
            'appointment_id' => $this->appointment->id,
            'doctor_name' => $this->appointment->doctor_name,
            'date' => $this->appointment->date_formatted,
            'time' => $this->appointment->time_formatted,
            'mode' => $this->appointment->mode,
            'fee' => $this->appointment->fee,
            'message' => "Your appointment with {$this->appointment->doctor_name} has been confirmed for {$this->appointment->date_formatted} at {$this->appointment->time_formatted}.",
        ];
    }
}
