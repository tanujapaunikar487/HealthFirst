<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class AppointmentCheckedIn extends BaseNotification
{
    protected $appointment;

    public function __construct($appointment)
    {
        $this->appointment = $appointment;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Check-in confirmed')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('You have successfully checked in for your appointment.')
            ->line('**Doctor:** ' . $this->appointment->doctor_name)
            ->line('**Date:** ' . $this->appointment->date_formatted)
            ->line('**Time:** ' . $this->appointment->time_formatted)
            ->line('**Mode:** ' . ucfirst($this->appointment->mode))
            ->line('Please arrive on time or be ready for your ' . ($this->appointment->mode === 'video' ? 'video call' : 'appointment') . '.')
            ->action('View appointment', url('/appointments/' . $this->appointment->id))
            ->line('Thank you for using HealthCare!');
    }

    public function toWhatsApp(object $notifiable): string
    {
        return "Hello {$notifiable->name},\n\n"
            . "You have successfully checked in for your appointment.\n\n"
            . "Doctor: {$this->appointment->doctor_name}\n"
            . "Date: {$this->appointment->date_formatted}\n"
            . "Time: {$this->appointment->time_formatted}\n"
            . "Mode: " . ucfirst($this->appointment->mode) . "\n\n"
            . "Please arrive on time or be ready for your " . ($this->appointment->mode === 'video' ? 'video call' : 'appointment') . ".\n\n"
            . "Thank you for using HealthCare!";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'appointment_checked_in',
            'appointment_id' => $this->appointment->id,
            'doctor_name' => $this->appointment->doctor_name,
            'date' => $this->appointment->date_formatted,
            'time' => $this->appointment->time_formatted,
            'mode' => $this->appointment->mode,
            'message' => "You have successfully checked in for your appointment with {$this->appointment->doctor_name} on {$this->appointment->date_formatted} at {$this->appointment->time_formatted}.",
        ];
    }
}
