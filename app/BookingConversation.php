<?php

namespace App;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingConversation extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'type',
        'status',
        'current_step',
        'collected_data',
    ];

    protected $casts = [
        'collected_data' => 'array',
    ];

    protected $appends = [
        'progress',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ConversationMessage::class, 'conversation_id')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc');
    }

    public function addMessage(string $role, string $content, ?string $componentType = null, ?array $componentData = null): ConversationMessage
    {
        return $this->messages()->create([
            'role' => $role,
            'content' => $content,
            'component_type' => $componentType,
            'component_data' => $componentData,
        ]);
    }

    public function updateCollectedData(array $data): void
    {
        $this->collected_data = array_merge($this->collected_data ?? [], $data);
        $this->save();
    }

    public function getCurrentStep(): ?string
    {
        return $this->current_step;
    }

    public function setCurrentStep(string $step): void
    {
        $this->current_step = $step;
        $this->save();
    }

    /**
     * Get progress information using the state machine
     */
    public function getProgressAttribute(): array
    {
        $stateMachine = new \App\Services\Booking\BookingStateMachine($this->collected_data ?? []);

        return [
            'percentage' => $stateMachine->getCompletenessPercentage(),
            'current_state' => $stateMachine->getCurrentState(),
            'missing_fields' => $stateMachine->getMissingFields(),
        ];
    }
}
