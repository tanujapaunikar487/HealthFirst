<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('provider'); // 'google', 'apple'
            $table->string('provider_id'); // Unique ID from the provider
            $table->string('provider_email')->nullable(); // Email from provider (may differ from user email)
            $table->string('provider_name')->nullable(); // Name from provider
            $table->string('avatar_url')->nullable(); // Profile picture URL
            $table->text('access_token')->nullable(); // For future API calls if needed
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['provider', 'provider_id']); // Each social account can only link to one user
            $table->index(['user_id', 'provider']); // Fast lookup for user's connected accounts
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
