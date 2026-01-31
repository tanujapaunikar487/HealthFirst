<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_consultation_modes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->string('mode'); // video, in_person
            $table->integer('fee')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['doctor_id', 'mode']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_consultation_modes');
    }
};
