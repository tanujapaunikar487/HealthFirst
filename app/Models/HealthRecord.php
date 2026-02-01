<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthRecord extends Model
{
    protected $fillable = [
        'user_id',
        'appointment_id',
        'family_member_id',
        'category',
        'title',
        'description',
        'doctor_name',
        'department_name',
        'record_date',
        'metadata',
        'file_url',
        'file_type',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'record_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\User::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function familyMember(): BelongsTo
    {
        return $this->belongsTo(FamilyMember::class);
    }

    public function scopeForCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}
