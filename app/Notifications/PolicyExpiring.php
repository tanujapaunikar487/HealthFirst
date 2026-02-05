<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Notifications\Messages\MailMessage;

class PolicyExpiring extends BaseNotification
{
    public function __construct(
        protected object $policy
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        $daysRemaining = Carbon::parse($this->policy->end_date)->diffInDays(now());

        return (new MailMessage)
            ->subject('Insurance policy expiring soon')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your insurance policy is expiring soon.')
            ->line('**Policy number:** ' . $this->policy->policy_number)
            ->line('**Provider:** ' . $this->policy->provider_name)
            ->line('**Plan:** ' . $this->policy->plan_name)
            ->line('**Expiry date:** ' . Carbon::parse($this->policy->end_date)->format('d M Y'))
            ->line('**Days remaining:** ' . $daysRemaining)
            ->line('Please contact your insurance provider to renew your policy to avoid any interruption in coverage.')
            ->action('View Policy', url('/insurance/policies/' . $this->policy->id))
            ->line('Thank you for using HealthCare.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        $daysRemaining = Carbon::parse($this->policy->end_date)->diffInDays(now());
        return "Hello {$notifiable->name}, your insurance policy #{$this->policy->policy_number} ({$this->policy->plan_name}) is expiring in {$daysRemaining} days on " . Carbon::parse($this->policy->end_date)->format('d M Y') . ". Please renew to avoid coverage interruption. View policy: " . url('/insurance/policies/' . $this->policy->id);
    }

    public function toArray(object $notifiable): array
    {
        $daysRemaining = Carbon::parse($this->policy->end_date)->diffInDays(now());

        return [
            'type' => 'policy_expiring',
            'policy_id' => $this->policy->id,
            'policy_number' => $this->policy->policy_number,
            'provider_name' => $this->policy->provider_name,
            'plan_name' => $this->policy->plan_name,
            'end_date' => $this->policy->end_date,
            'days_remaining' => $daysRemaining,
            'message' => 'Your insurance policy #' . $this->policy->policy_number . ' is expiring in ' . $daysRemaining . ' days.',
        ];
    }

    public function toBillingNotification(object $notifiable): array
    {
        $daysRemaining = Carbon::parse($this->policy->end_date)->diffInDays(now());

        return [
            'type' => 'policy_expiring_soon',
            'title' => 'Policy Expiring Soon',
            'message' => 'Your ' . $this->policy->plan_name . ' policy expires in ' . $daysRemaining . ' days. Renew to avoid coverage gaps.',
            'appointment_id' => null,
            'data' => [
                'insurance_policy_id' => $this->policy->id,
                'policy_name' => $this->policy->plan_name,
                'expiry_date' => $this->policy->end_date,
            ],
        ];
    }
}
