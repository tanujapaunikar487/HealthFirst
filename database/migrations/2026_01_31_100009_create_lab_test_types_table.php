<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_test_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('category'); // blood, urine, imaging, cardiac, hormonal
            $table->integer('price')->default(0);
            $table->text('preparation_instructions')->nullable();
            $table->integer('turnaround_hours')->default(24);
            $table->boolean('requires_fasting')->default(false);
            $table->integer('fasting_hours')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_types');
    }
};
