<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Doctor extends Model
{
    protected $fillable = [
        'department_id',
        'name',
        'slug',
        'specialization',
        'qualification',
        'experience_years',
        'bio',
        'avatar_url',
        'rating',
        'reviews_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
            'rating' => 'decimal:1',
            'reviews_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function consultationModes(): HasMany
    {
        return $this->hasMany(DoctorConsultationMode::class);
    }

    public function availabilities(): HasMany
    {
        return $this->hasMany(DoctorAvailability::class);
    }

    public function aliases(): HasMany
    {
        return $this->hasMany(DoctorAlias::class);
    }

    public function timeSlots(): HasMany
    {
        return $this->hasMany(TimeSlot::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
