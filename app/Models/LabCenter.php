<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabCenter extends Model
{
    protected $fillable = [
        'name',
        'address',
        'city',
        'rating',
        'distance_km',
        'opening_time',
        'closing_time',
        'home_collection_available',
        'home_collection_fee',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:1',
            'distance_km' => 'decimal:1',
            'home_collection_available' => 'boolean',
            'home_collection_fee' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
