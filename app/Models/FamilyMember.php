<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FamilyMember extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'relation',
        'age',
        'date_of_birth',
        'gender',
        'blood_group',
        'avatar_url',
        'patient_id',
        'phone',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'pincode',
        'primary_doctor_id',
        'medical_conditions',
        'allergies',
        'emergency_contact_name',
        'emergency_contact_relation',
        'emergency_contact_phone',
    ];

    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'date_of_birth' => 'date',
            'medical_conditions' => 'array',
            'allergies' => 'array',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (FamilyMember $member) {
            if (!$member->patient_id) {
                $lastId = static::max('id') ?? 0;
                $member->patient_id = 'PT-' . str_pad($lastId + 1, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function getComputedAgeAttribute(): ?int
    {
        if ($this->date_of_birth) {
            return $this->date_of_birth->age;
        }
        return $this->attributes['age'] ?? null;
    }

    public function getFullAddressAttribute(): ?string
    {
        if (!$this->address_line_1) {
            return null;
        }
        return collect([
            $this->address_line_1,
            $this->address_line_2,
            $this->city,
            $this->state,
            $this->pincode,
        ])->filter()->implode(', ');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\User::class);
    }

    public function primaryDoctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'primary_doctor_id');
    }

    public function healthRecords(): HasMany
    {
        return $this->hasMany(HealthRecord::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
