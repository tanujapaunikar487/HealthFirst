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
        'lab_package_id',
        'lab_test_ids',
        'appointment_type',
        'consultation_mode',
        'collection_type',
        'lab_center_id',
        'user_address_id',
        'appointment_date',
        'appointment_time',
        'status',
        'symptoms',
        'notes',
        'video_meeting_url',
        'fee',
        'payment_status',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
            'symptoms' => 'array',
            'lab_test_ids' => 'array',
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

    public function labPackage(): BelongsTo
    {
        return $this->belongsTo(LabPackage::class);
    }

    public function labCenter(): BelongsTo
    {
        return $this->belongsTo(LabCenter::class);
    }

    public function userAddress(): BelongsTo
    {
        return $this->belongsTo(UserAddress::class);
    }

    public function healthRecords(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(HealthRecord::class);
    }
}
