<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class FamilyMemberAdded extends BaseNotification
{
    public function __construct(
        protected object $member
    ) {}

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Family member added')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('A new family member has been added to your HealthCare account.')
            ->line('**Name:** '.$this->member->name)
            ->line('**Relation:** '.ucfirst($this->member->relation))
            ->line('You can now book appointments and manage health records for this family member.')
            ->action('View Family Members', url('/family-members'))
            ->line('Thank you for using HealthCare.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        return "Hello {$notifiable->name}, {$this->member->name} ({$this->member->relation}) has been added to your HealthCare account. You can now book appointments and manage health records for them. View: ".url('/family-members');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'family_member_added',
            'member_id' => $this->member->id,
            'member_name' => $this->member->name,
            'relation' => $this->member->relation,
            'message' => $this->member->name.' has been added to your family members.',
        ];
    }

    public function toBillingNotification(object $notifiable): array
    {
        return [
            'type' => 'member_added',
            'title' => 'Family Member Added',
            'message' => $this->member->name.' ('.ucfirst($this->member->relation).') has been added to your family members.',
            'appointment_id' => null,
            'data' => [
                'family_member_id' => $this->member->id,
                'member_name' => $this->member->name,
                'relation' => $this->member->relation,
            ],
        ];
    }
}
