<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InsurancePolicy extends Model
{
    protected $fillable = [
        'user_id',
        'insurance_provider_id',
        'policy_number',
        'plan_name',
        'plan_type',
        'sum_insured',
        'premium_amount',
        'start_date',
        'end_date',
        'members',
        'metadata',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sum_insured' => 'integer',
            'premium_amount' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'members' => 'array',
            'metadata' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function getIsExpiringSoonAttribute(): bool
    {
        return $this->end_date->isFuture() && $this->end_date->diffInDays(now()) <= 60;
    }

    public function getMemberCountAttribute(): int
    {
        return count($this->members ?? []);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\User::class);
    }

    public function insuranceProvider(): BelongsTo
    {
        return $this->belongsTo(InsuranceProvider::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(InsuranceClaim::class);
    }
}
