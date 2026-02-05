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
        $drugLines = collect($this->expiringDrugs)->map(function ($drug) {
            $days = $drug['days_remaining'] ?? null;
            $timeLeft = $days !== null
                ? ($days <= 0 ? 'expires today' : "expires in {$days} day" . ($days > 1 ? 's' : ''))
                : 'expiring soon';
            return "• **{$drug['name']}** — {$timeLeft}";
        })->implode("\n");

        return (new MailMessage)
            ->subject('Medication refill needed')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('The following medications are expiring and may need a refill:')
            ->line($drugLines)
            ->line('**Prescribed by:** ' . $this->record->doctor_name)
            ->line('**Prescription date:** ' . $this->record->record_date->format('d M Y'))
            ->line('Please book an appointment with your doctor to get a refill before your medication runs out.')
            ->action('Book appointment', url('/booking'))
            ->line('Thank you for using HealthCare!');
    }

    public function toWhatsApp(object $notifiable): string
    {
        $drugLines = collect($this->expiringDrugs)->map(function ($drug) {
            $days = $drug['days_remaining'] ?? null;
            $timeLeft = $days !== null
                ? ($days <= 0 ? 'expires today' : "expires in {$days} day" . ($days > 1 ? 's' : ''))
                : 'expiring soon';
            return "• {$drug['name']} — {$timeLeft}";
        })->implode("\n");

        return "Hello {$notifiable->name},\n\n"
            . "Medication refill needed:\n{$drugLines}\n\n"
            . "Prescribed by: {$this->record->doctor_name}\n"
            . "Prescription date: {$this->record->record_date->format('d M Y')}\n\n"
            . "Please book an appointment to get a refill before your medication runs out.\n\n"
            . "Thank you for using HealthCare!";
    }

    public function toArray(object $notifiable): array
    {
        $drugNames = implode(', ', array_column($this->expiringDrugs, 'name'));
        $minDays = collect($this->expiringDrugs)->min('days_remaining');

        return [
            'type' => 'prescription_reminder',
            'health_record_id' => $this->record->id,
            'doctor_name' => $this->record->doctor_name,
            'drugs' => $drugNames,
            'days_remaining' => $minDays,
            'record_date' => $this->record->record_date->format('d M Y'),
            'message' => "Your medication ({$drugNames}) is expiring soon. Please consult your doctor for a refill.",
        ];
    }
}
