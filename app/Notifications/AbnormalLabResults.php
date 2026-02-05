<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class AbnormalLabResults extends BaseNotification
{
    public function __construct(
        protected object $record,
        protected array $abnormalItems
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        $abnormalList = implode(', ', $this->abnormalItems);

        return (new MailMessage)
            ->subject('Important: Abnormal lab results')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your lab results for **' . $this->record->title . '** show some abnormal values that require attention.')
            ->line('**Abnormal values:** ' . $abnormalList)
            ->line('Test: ' . $this->record->category)
            ->line('Doctor: ' . $this->record->doctor_name)
            ->line('Date: ' . $this->record->date)
            ->line('We strongly recommend scheduling a follow-up appointment with your doctor to discuss these results.')
            ->action('View Results', url('/health-records/' . $this->record->id))
            ->line('Thank you for using HealthCare.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        $abnormalList = implode(', ', $this->abnormalItems);
        return "IMPORTANT: {$notifiable->name}, your lab results for {$this->record->title} show abnormal values ({$abnormalList}). Please schedule a follow-up with Dr. {$this->record->doctor_name}. View results: " . url('/health-records/' . $this->record->id);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'abnormal_lab_results',
            'record_id' => $this->record->id,
            'title' => $this->record->title,
            'category' => $this->record->category,
            'doctor_name' => $this->record->doctor_name,
            'date' => $this->record->date,
            'abnormal_items' => $this->abnormalItems,
            'message' => 'Your lab results for ' . $this->record->title . ' show some abnormal values that require attention.',
        ];
    }
}
