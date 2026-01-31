<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabTestType extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'price',
        'preparation_instructions',
        'turnaround_hours',
        'requires_fasting',
        'fasting_hours',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'turnaround_hours' => 'integer',
            'requires_fasting' => 'boolean',
            'fasting_hours' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
