<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class InsuranceClaimUpdate extends BaseNotification
{
    public function __construct(
        protected object $claim,
        protected string $newStatus
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        $nextSteps = $this->getNextSteps($this->newStatus);

        $mail = (new MailMessage)
            ->subject('Insurance claim update')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your insurance claim has been updated.')
            ->line('**Claim number:** ' . $this->claim->claim_number)
            ->line('**Provider:** ' . $this->claim->provider_name)
            ->line('**Amount:** ₹' . number_format($this->claim->amount, 2))
            ->line('**New status:** ' . ucfirst(str_replace('_', ' ', $this->newStatus)));

        if ($nextSteps) {
            $mail->line('**Next steps:** ' . $nextSteps);
        }

        return $mail
            ->action('View Claim', url('/insurance/claims/' . $this->claim->id))
            ->line('Thank you for using HealthCare.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        $nextSteps = $this->getNextSteps($this->newStatus);
        $message = "Hello {$notifiable->name}, your insurance claim #{$this->claim->claim_number} has been updated to: " . ucfirst(str_replace('_', ' ', $this->newStatus)) . ". Amount: ₹" . number_format($this->claim->amount, 2) . ".";

        if ($nextSteps) {
            $message .= " {$nextSteps}.";
        }

        return $message . " View details: " . url('/insurance/claims/' . $this->claim->id);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'insurance_claim_update',
            'claim_id' => $this->claim->id,
            'claim_number' => $this->claim->claim_number,
            'provider_name' => $this->claim->provider_name,
            'amount' => $this->claim->amount,
            'old_status' => $this->claim->status,
            'new_status' => $this->newStatus,
            'message' => 'Your insurance claim #' . $this->claim->claim_number . ' has been updated.',
        ];
    }

    public function toBillingNotification(object $notifiable): array
    {
        $typeMap = [
            'approved' => 'insurance_claim_approved',
            'rejected' => 'insurance_claim_rejected',
            'settled' => 'insurance_claim_settled',
            'enhancement_required' => 'insurance_enhancement_required',
            'enhancement_approved' => 'insurance_enhancement_approved',
            'partially_approved' => 'insurance_claim_approved',
        ];

        $type = $typeMap[$this->newStatus] ?? 'insurance_claim_approved';
        $statusLabel = ucwords(str_replace('_', ' ', $this->newStatus));

        return [
            'type' => $type,
            'title' => "Insurance Claim {$statusLabel}",
            'message' => 'Your insurance claim #' . $this->claim->claim_number . ' has been updated to: ' . $statusLabel . '.',
            'appointment_id' => $this->claim->appointment_id ?? null,
            'data' => [
                'insurance_claim_id' => $this->claim->id,
                'claim_number' => $this->claim->claim_number,
                'amount' => $this->claim->amount,
            ],
        ];
    }

    protected function getNextSteps(string $status): ?string
    {
        return match ($status) {
            'enhancement_required' => 'Please upload additional documents to support your claim.',
            'approved' => 'The approved amount will be processed within 5-7 business days.',
            'rejected' => 'You can file an appeal if you believe this decision is incorrect.',
            'under_review' => 'Your claim is being reviewed. We will update you within 3-5 business days.',
            'pending_documents' => 'Please upload the required documents to proceed with your claim.',
            'settled' => 'The claim amount has been processed and will be credited to your account.',
            'partially_approved' => 'A portion of your claim has been approved. Check the details for more information.',
            default => null,
        };
    }
}
