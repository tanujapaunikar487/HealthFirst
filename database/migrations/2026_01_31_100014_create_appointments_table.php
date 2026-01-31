<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('family_member_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('appointment_type'); // doctor, lab
            $table->string('consultation_mode')->nullable(); // video, in_person
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->string('status')->default('completed'); // scheduled, completed, cancelled, no_show
            $table->json('symptoms')->nullable();
            $table->text('notes')->nullable();
            $table->integer('fee')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
