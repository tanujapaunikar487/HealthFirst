<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InsuranceProvider extends Model
{
    protected $fillable = [
        'name',
        'logo_url',
        'plan_types',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'plan_types' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function claims(): HasMany
    {
        return $this->hasMany(InsuranceClaim::class);
    }

    public function policies(): HasMany
    {
        return $this->hasMany(InsurancePolicy::class);
    }
}
