<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InsuranceClaim extends Model
{
    protected $fillable = [
        'user_id',
        'insurance_provider_id',
        'policy_number',
        'claim_amount',
        'status',
        'description',
        'claim_date',
    ];

    protected function casts(): array
    {
        return [
            'claim_amount' => 'integer',
            'claim_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\User::class);
    }

    public function insuranceProvider(): BelongsTo
    {
        return $this->belongsTo(InsuranceProvider::class);
    }
}
