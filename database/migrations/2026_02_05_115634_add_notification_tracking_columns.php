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
        Schema::table('promotions', function (Blueprint $table) {
            $table->timestamp('notification_sent_at')->nullable();
        });

        Schema::table('health_records', function (Blueprint $table) {
            $table->timestamp('prescription_reminder_sent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn('notification_sent_at');
        });

        Schema::table('health_records', function (Blueprint $table) {
            $table->dropColumn('prescription_reminder_sent_at');
        });
    }
};
