<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('family_members', function (Blueprint $table) {
            $table->string('patient_id')->nullable()->unique()->after('avatar_url');
            $table->date('date_of_birth')->nullable()->after('age');
            $table->string('phone')->nullable()->after('gender');
            $table->string('address_line_1')->nullable()->after('phone');
            $table->string('address_line_2')->nullable()->after('address_line_1');
            $table->string('city')->nullable()->after('address_line_2');
            $table->string('state')->nullable()->after('city');
            $table->string('pincode')->nullable()->after('state');
            $table->foreignId('primary_doctor_id')->nullable()->constrained('doctors')->nullOnDelete()->after('pincode');
            $table->json('medical_conditions')->nullable()->after('primary_doctor_id');
            $table->json('allergies')->nullable()->after('medical_conditions');
            $table->string('emergency_contact_name')->nullable()->after('allergies');
            $table->string('emergency_contact_relation')->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_relation');
        });
    }

    public function down(): void
    {
        Schema::table('family_members', function (Blueprint $table) {
            $table->dropForeign(['primary_doctor_id']);
            $table->dropColumn([
                'patient_id',
                'date_of_birth',
                'phone',
                'address_line_1',
                'address_line_2',
                'city',
                'state',
                'pincode',
                'primary_doctor_id',
                'medical_conditions',
                'allergies',
                'emergency_contact_name',
                'emergency_contact_relation',
                'emergency_contact_phone',
            ]);
        });
    }
};
