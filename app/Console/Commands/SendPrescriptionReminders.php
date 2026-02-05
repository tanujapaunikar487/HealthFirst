<?php

namespace App\Console\Commands;

use App\Models\HealthRecord;
use App\Notifications\PrescriptionReminder;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendPrescriptionReminders extends Command
{
    protected $signature = 'notifications:prescription-reminders';
    protected $description = 'Send reminders for prescriptions expiring within 3 days';

    public function handle(): void
    {
        $records = HealthRecord::where('category', 'prescription')
            ->whereNull('prescription_reminder_sent_at')
            ->whereNotNull('metadata')
            ->get();

        $service = app(NotificationService::class);
        $count = 0;

        foreach ($records as $record) {
            $user = $record->user;
            if (!$user) continue;

            $expiringDrugs = $this->getExpiringDrugs($record);
            if (empty($expiringDrugs)) continue;

            $service->send($user, new PrescriptionReminder($record, $expiringDrugs), 'health_alerts', 'medication_reminders');
            $record->update(['prescription_reminder_sent_at' => now()]);
            $count++;
        }

        $this->info("Sent {$count} prescription reminders.");
    }

    private function getExpiringDrugs(HealthRecord $record): array
    {
        $metadata = $record->metadata;
        $drugs = $metadata['drugs'] ?? [];
        $startDate = $record->record_date ?? ($metadata['date'] ? Carbon::parse($metadata['date']) : null);

        if (!$startDate || empty($drugs)) {
            return [];
        }

        $expiring = [];
        $now = Carbon::now();
        $threshold = $now->copy()->addDays(3);

        foreach ($drugs as $drug) {
            $duration = $this->parseDuration($drug['duration'] ?? '');
            if ($duration <= 0) continue;

            $endDate = $startDate->copy()->addDays($duration);

            // Drug is expiring within 3 days (still active but ending soon)
            if ($endDate->isAfter($now) && $endDate->lte($threshold)) {
                $expiring[] = $drug;
            }
        }

        return $expiring;
    }

    private function parseDuration(string $duration): int
    {
        if (preg_match('/(\d+)\s*(day|week|month)/i', $duration, $matches)) {
            $num = (int) $matches[1];
            $unit = strtolower($matches[2]);
            return match ($unit) {
                'day', 'days' => $num,
                'week', 'weeks' => $num * 7,
                'month', 'months' => $num * 30,
                default => 0,
            };
        }
        return 0;
    }
}
