<?php

namespace App;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        // Profile fields
        'phone',
        'date_of_birth',
        'gender',
        'avatar_path',
        // Address
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'pincode',
        // Emergency contact
        'emergency_contact_type',
        'emergency_contact_member_id',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        // Consent timestamps
        'terms_accepted_at',
        'privacy_accepted_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'avatar_url',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'terms_accepted_at' => 'datetime',
            'privacy_accepted_at' => 'datetime',
        ];
    }

    /**
     * Get the URL for the user's avatar.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar_path
            ? Storage::url($this->avatar_path)
            : null;
    }

    /**
     * Get the emergency contact family member.
     */
    public function emergencyContactMember(): BelongsTo
    {
        return $this->belongsTo(\App\Models\FamilyMember::class, 'emergency_contact_member_id');
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

    public function settings(): HasMany
    {
        return $this->hasMany(\App\Models\UserSetting::class);
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(\App\Models\SocialAccount::class);
    }

    /**
     * Check if user has a specific social provider linked.
     */
    public function hasSocialProvider(string $provider): bool
    {
        return $this->socialAccounts()->where('provider', $provider)->exists();
    }

    /**
     * Check if user can sign in without password (has at least one social account).
     */
    public function canSignInWithSocial(): bool
    {
        return $this->socialAccounts()->exists();
    }

    public function getSetting(string $category, $default = null)
    {
        $setting = $this->settings()->where('category', $category)->first();

        return $setting ? $setting->settings : $default;
    }

    public function setSetting(string $category, array $data): void
    {
        $this->settings()->updateOrCreate(
            ['category' => $category],
            ['settings' => $data]
        );
    }
}
