<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabPackage extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'original_price',
        'test_ids',
        'tests_count',
        'age_range',
        'duration_hours',
        'preparation_notes',
        'requires_fasting',
        'fasting_hours',
        'is_popular',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'original_price' => 'integer',
            'test_ids' => 'array',
            'tests_count' => 'integer',
            'requires_fasting' => 'boolean',
            'fasting_hours' => 'integer',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
