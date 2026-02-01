<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('lab_package_id')->nullable()->after('department_id')->constrained('lab_packages')->nullOnDelete();
            $table->json('lab_test_ids')->nullable()->after('lab_package_id');
            $table->string('collection_type')->nullable()->after('consultation_mode');
            $table->foreignId('lab_center_id')->nullable()->after('collection_type')->constrained('lab_centers')->nullOnDelete();
            $table->foreignId('user_address_id')->nullable()->after('lab_center_id')->constrained('user_addresses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['lab_package_id']);
            $table->dropForeign(['lab_center_id']);
            $table->dropForeign(['user_address_id']);
            $table->dropColumn(['lab_package_id', 'lab_test_ids', 'collection_type', 'lab_center_id', 'user_address_id']);
        });
    }
};
