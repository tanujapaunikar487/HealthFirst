<?php

namespace App;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function billingNotifications(): HasMany
    {
        return $this->hasMany(\App\Models\BillingNotification::class);
    }

    public function healthRecords(): HasMany
    {
        return $this->hasMany(\App\Models\HealthRecord::class);
    }

    public function familyMembers(): HasMany
    {
        return $this->hasMany(\App\Models\FamilyMember::class);
    }
}
