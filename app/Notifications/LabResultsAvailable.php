<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class LabResultsAvailable extends BaseNotification
{
    public function __construct(
        protected object $record
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Lab results available')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your lab results for **' . $this->record->title . '** are now available.')
            ->line('Test: ' . $this->record->category)
            ->line('Doctor: ' . $this->record->doctor_name)
            ->line('Date: ' . $this->record->date)
            ->action('View Results', url('/health-records/' . $this->record->id))
            ->line('Thank you for using HealthCare.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        return "Hello {$notifiable->name}, your lab results for {$this->record->title} are now available. Doctor: {$this->record->doctor_name}. View them in the HealthCare app: " . url('/health-records/' . $this->record->id);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lab_results_available',
            'record_id' => $this->record->id,
            'title' => $this->record->title,
            'category' => $this->record->category,
            'doctor_name' => $this->record->doctor_name,
            'date' => $this->record->date,
            'message' => 'Your lab results for ' . $this->record->title . ' are now available.',
        ];
    }

    public function toBillingNotification(object $notifiable): array
    {
        return [
            'type' => 'lab_results_ready',
            'title' => 'Lab Results Ready',
            'message' => 'Your lab results for ' . $this->record->title . ' are now available.',
            'appointment_id' => null,
            'data' => [
                'health_record_id' => $this->record->id,
                'test_name' => $this->record->title,
                'doctor_name' => $this->record->doctor_name,
            ],
        ];
    }
}
