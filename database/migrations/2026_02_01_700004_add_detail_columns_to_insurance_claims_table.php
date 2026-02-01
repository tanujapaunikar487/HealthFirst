<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_claims', function (Blueprint $table) {
            $table->string('procedure_type')->nullable()->after('treatment_name');
            $table->string('rejection_reason')->nullable()->after('status');
            $table->json('stay_details')->nullable()->after('claim_date');
            $table->json('financial')->nullable()->after('stay_details');
            $table->json('documents')->nullable()->after('financial');
            $table->json('timeline')->nullable()->after('documents');
        });
    }

    public function down(): void
    {
        Schema::table('insurance_claims', function (Blueprint $table) {
            $table->dropColumn(['procedure_type', 'rejection_reason', 'stay_details', 'financial', 'documents', 'timeline']);
        });
    }
};
