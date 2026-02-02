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
        Schema::table('family_members', function (Blueprint $table) {
            $table->string('email')->nullable()->after('phone');
            $table->string('verified_email')->nullable()->after('verified_phone');
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('family_members', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropColumn(['email', 'verified_email']);
        });
    }
};
