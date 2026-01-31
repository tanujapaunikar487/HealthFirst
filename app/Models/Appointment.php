<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'family_member_id',
        'doctor_id',
        'department_id',
        'appointment_type',
        'consultation_mode',
        'appointment_date',
        'appointment_time',
        'status',
        'symptoms',
        'notes',
        'fee',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
            'symptoms' => 'array',
            'fee' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\User::class);
    }

    public function familyMember(): BelongsTo
    {
        return $this->belongsTo(FamilyMember::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
