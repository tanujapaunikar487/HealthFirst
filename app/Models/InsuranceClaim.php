<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InsuranceClaim extends Model
{
    protected $fillable = [
        'user_id',
        'insurance_provider_id',
        'insurance_policy_id',
        'family_member_id',
        'appointment_id',
        'policy_number',
        'claim_amount',
        'status',
        'description',
        'treatment_name',
        'procedure_type',
        'rejection_reason',
        'claim_date',
        'stay_details',
        'financial',
        'documents',
        'timeline',
    ];

    protected function casts(): array
    {
        return [
            'claim_amount' => 'integer',
            'claim_date' => 'date',
            'stay_details' => 'array',
            'financial' => 'array',
            'documents' => 'array',
            'timeline' => 'array',
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

    public function insurancePolicy(): BelongsTo
    {
        return $this->belongsTo(InsurancePolicy::class);
    }

    public function familyMember(): BelongsTo
    {
        return $this->belongsTo(FamilyMember::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
