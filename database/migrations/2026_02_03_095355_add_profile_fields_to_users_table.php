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
        Schema::table('users', function (Blueprint $table) {
            // Personal Info
            $table->string('phone')->nullable()->after('email');
            $table->date('date_of_birth')->nullable()->after('phone');
            $table->string('gender')->nullable()->after('date_of_birth'); // male, female, other
            $table->string('avatar_path')->nullable()->after('gender');

            // Address
            $table->string('address_line_1')->nullable()->after('avatar_path');
            $table->string('address_line_2')->nullable()->after('address_line_1');
            $table->string('city')->nullable()->after('address_line_2');
            $table->string('state')->nullable()->after('city');
            $table->string('pincode')->nullable()->after('state');

            // Emergency Contact (dual-mode: family member link OR custom)
            $table->string('emergency_contact_type')->nullable()->after('pincode'); // family_member, custom
            $table->foreignId('emergency_contact_member_id')->nullable()->after('emergency_contact_type')
                ->constrained('family_members')->nullOnDelete();
            $table->string('emergency_contact_name')->nullable()->after('emergency_contact_member_id');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_relation')->nullable()->after('emergency_contact_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['emergency_contact_member_id']);

            // Drop all added columns
            $table->dropColumn([
                'phone',
                'date_of_birth',
                'gender',
                'avatar_path',
                'address_line_1',
                'address_line_2',
                'city',
                'state',
                'pincode',
                'emergency_contact_type',
                'emergency_contact_member_id',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relation',
            ]);
        });
    }
};
