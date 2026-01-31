<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorConsultationMode extends Model
{
    protected $fillable = [
        'doctor_id',
        'mode',
        'fee',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'fee' => 'integer',
            'is_default' => 'boolean',
        ];
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }
}
