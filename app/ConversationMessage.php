<?php

namespace App;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationMessage extends Model
{
    use HasUuids;

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'component_type',
        'component_data',
        'user_selection',
    ];

    protected $casts = [
        'component_data' => 'array',
        'user_selection' => 'array',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(BookingConversation::class, 'conversation_id');
    }
}
