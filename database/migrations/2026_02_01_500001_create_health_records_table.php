<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('family_member_id')->nullable()->constrained('family_members')->nullOnDelete();
            $table->string('category'); // consultation_notes, prescription, lab_report, imaging_report, referral, discharge_summary, invoice, uploaded_document
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('doctor_name')->nullable();
            $table->string('department_name')->nullable();
            $table->date('record_date');
            $table->json('metadata')->nullable();
            $table->string('file_url')->nullable();
            $table->string('file_type')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'record_date']);
            $table->index('appointment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_records');
    }
};
