<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('family_members', function (Blueprint $table) {
            // Add is_guest flag to differentiate between guests and family members
            $table->boolean('is_guest')->default(false)->after('relation');

            // Add verified_phone for phone verification tracking
            $table->string('verified_phone')->nullable()->after('phone');

            // Add linked_at timestamp to track when member was linked to user
            $table->timestamp('linked_at')->nullable()->after('updated_at');

            // Add unique constraint on phone to prevent duplicates
            // This enables automatic duplicate detection during lookup
            $table->unique('phone', 'family_members_phone_unique');
        });
    }

    public function down(): void
    {
        Schema::table('family_members', function (Blueprint $table) {
            // Drop unique constraint first
            $table->dropUnique('family_members_phone_unique');

            // Drop columns
            $table->dropColumn(['is_guest', 'verified_phone', 'linked_at']);
        });
    }
};
