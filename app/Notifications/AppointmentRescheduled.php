<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class AppointmentRescheduled extends BaseNotification
{
    protected $appointment;
    protected $oldDate;
    protected $oldTime;

    public function __construct($appointment, $oldDate, $oldTime)
    {
        $this->appointment = $appointment;
        $this->oldDate = $oldDate;
        $this->oldTime = $oldTime;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Appointment rescheduled')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your appointment has been rescheduled.')
            ->line('**Doctor:** ' . $this->appointment->doctor_name)
            ->line('**Previous date:** ' . $this->oldDate . ' at ' . $this->oldTime)
            ->line('**New date:** ' . $this->appointment->date_formatted . ' at ' . $this->appointment->time_formatted)
            ->line('**Mode:** ' . ucfirst($this->appointment->mode))
            ->action('View appointment', url('/appointments/' . $this->appointment->id))
            ->line('Thank you for using HealthCare!');
    }

    public function toWhatsApp(object $notifiable): string
    {
        return "Hello {$notifiable->name},\n\n"
            . "Your appointment has been rescheduled.\n\n"
            . "Doctor: {$this->appointment->doctor_name}\n"
            . "Previous date: {$this->oldDate} at {$this->oldTime}\n"
            . "New date: {$this->appointment->date_formatted} at {$this->appointment->time_formatted}\n"
            . "Mode: " . ucfirst($this->appointment->mode) . "\n\n"
            . "Thank you for using HealthCare!";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'appointment_rescheduled',
            'appointment_id' => $this->appointment->id,
            'doctor_name' => $this->appointment->doctor_name,
            'old_date' => $this->oldDate,
            'old_time' => $this->oldTime,
            'new_date' => $this->appointment->date_formatted,
            'new_time' => $this->appointment->time_formatted,
            'mode' => $this->appointment->mode,
            'message' => "Your appointment with {$this->appointment->doctor_name} has been rescheduled from {$this->oldDate} at {$this->oldTime} to {$this->appointment->date_formatted} at {$this->appointment->time_formatted}.",
        ];
    }
}
