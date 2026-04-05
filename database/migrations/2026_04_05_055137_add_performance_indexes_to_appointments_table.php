<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['user_id', 'status', 'appointment_date'], 'appt_user_status_date');
            $table->index(['user_id', 'payment_status'], 'appt_user_payment');
            $table->index(['user_id', 'family_member_id', 'status', 'appointment_date'], 'appt_user_family_status_date');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('appt_user_status_date');
            $table->dropIndex('appt_user_payment');
            $table->dropIndex('appt_user_family_status_date');
        });
    }
};
