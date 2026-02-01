<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_claims', function (Blueprint $table) {
            $table->foreignId('insurance_policy_id')->nullable()->constrained()->nullOnDelete()->after('insurance_provider_id');
            $table->foreignId('family_member_id')->nullable()->constrained()->nullOnDelete()->after('insurance_policy_id');
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete()->after('family_member_id');
            $table->string('treatment_name')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('insurance_claims', function (Blueprint $table) {
            $table->dropForeign(['insurance_policy_id']);
            $table->dropForeign(['family_member_id']);
            $table->dropForeign(['appointment_id']);
            $table->dropColumn(['insurance_policy_id', 'family_member_id', 'appointment_id', 'treatment_name']);
        });
    }
};
