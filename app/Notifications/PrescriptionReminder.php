<?php

namespace App\Notifications;

use App\Models\HealthRecord;
use Illuminate\Notifications\Messages\MailMessage;

class PrescriptionReminder extends BaseNotification
{
    protected HealthRecord $record;
    protected array $expiringDrugs;

    public function __construct(HealthRecord $record, array $expiringDrugs)
    {
        $this->record = $record;
        $this->expiringDrugs = $expiringDrugs;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $drugNames = implode(', ', array_column($this->expiringDrugs, 'name'));

        return (new MailMessage)
            ->subject('Prescription ending soon')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your prescription medications are ending soon:')
            ->line('**Medications:** ' . $drugNames)
            ->line('**Prescribed by:** ' . $this->record->doctor_name)
            ->line('**Prescription date:** ' . $this->record->record_date->format('d M Y'))
            ->line('Please consult your doctor if you need a refill.')
            ->action('View prescription', url('/health-records'))
            ->line('Thank you for using HealthCare!');
    }

    public function toWhatsApp(object $notifiable): string
    {
        $drugNames = implode(', ', array_column($this->expiringDrugs, 'name'));

        return "Hello {$notifiable->name},\n\n"
            . "Your prescription medications are ending soon:\n"
            . "Medications: {$drugNames}\n"
            . "Prescribed by: {$this->record->doctor_name}\n"
            . "Prescription date: {$this->record->record_date->format('d M Y')}\n\n"
            . "Please consult your doctor if you need a refill.\n\n"
            . "Thank you for using HealthCare!";
    }

    public function toArray(object $notifiable): array
    {
        $drugNames = implode(', ', array_column($this->expiringDrugs, 'name'));

        return [
            'type' => 'prescription_reminder',
            'health_record_id' => $this->record->id,
            'doctor_name' => $this->record->doctor_name,
            'drugs' => $drugNames,
            'record_date' => $this->record->record_date->format('d M Y'),
            'message' => "Your prescription for {$drugNames} is ending soon. Please consult your doctor if you need a refill.",
        ];
    }
}
