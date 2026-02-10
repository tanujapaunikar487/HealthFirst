<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class AppointmentReminder extends BaseNotification
{
    protected $appointment;

    public function __construct($appointment)
    {
        $this->appointment = $appointment;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $timeRemaining = $this->getTimeRemaining();

        $message = (new MailMessage)
            ->subject('Appointment reminder')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('This is a reminder about your upcoming appointment.')
            ->line('**Doctor:** '.$this->appointment->doctor_name)
            ->line('**Date:** '.$this->appointment->date_formatted)
            ->line('**Time:** '.$this->appointment->time_formatted)
            ->line('**Mode:** '.ucfirst($this->appointment->mode));

        if (! empty($this->appointment->location)) {
            $message->line('**Location:** '.$this->appointment->location);
        }

        $message->line('**Time remaining:** '.$timeRemaining)
            ->action('View appointment', url('/appointments/'.$this->appointment->id))
            ->line('Thank you for using HealthCare!');

        return $message;
    }

    public function toWhatsApp(object $notifiable): string
    {
        $timeRemaining = $this->getTimeRemaining();

        $text = "Hello {$notifiable->name},\n\n"
            ."This is a reminder about your upcoming appointment.\n\n"
            ."Doctor: {$this->appointment->doctor_name}\n"
            ."Date: {$this->appointment->date_formatted}\n"
            ."Time: {$this->appointment->time_formatted}\n"
            .'Mode: '.ucfirst($this->appointment->mode)."\n";

        if (! empty($this->appointment->location)) {
            $text .= "Location: {$this->appointment->location}\n";
        }

        $text .= "Time remaining: {$timeRemaining}\n\n"
            .'Thank you for using HealthCare!';

        return $text;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'appointment_reminder',
            'appointment_id' => $this->appointment->id,
            'doctor_name' => $this->appointment->doctor_name,
            'date' => $this->appointment->date_formatted,
            'time' => $this->appointment->time_formatted,
            'mode' => $this->appointment->mode,
            'location' => $this->appointment->location ?? null,
            'time_remaining' => $this->getTimeRemaining(),
            'message' => "Reminder: Your appointment with {$this->appointment->doctor_name} is scheduled for {$this->appointment->date_formatted} at {$this->appointment->time_formatted}.",
        ];
    }

    protected function getTimeRemaining(): string
    {
        // Assuming appointment has a datetime field or we can construct it
        // This is a helper method to calculate time remaining
        // You can adjust the logic based on your actual appointment model structure

        $appointmentDateTime = new \DateTime($this->appointment->date.' '.$this->appointment->time);
        $now = new \DateTime;
        $diff = $now->diff($appointmentDateTime);

        if ($diff->days > 0) {
            return $diff->days.' day'.($diff->days > 1 ? 's' : '');
        } elseif ($diff->h > 0) {
            return $diff->h.' hour'.($diff->h > 1 ? 's' : '');
        } else {
            return $diff->i.' minute'.($diff->i > 1 ? 's' : '');
        }
    }
}
