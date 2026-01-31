<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->integer('price');
            $table->integer('original_price')->nullable();
            $table->json('test_ids')->nullable(); // Array of lab_test_type IDs
            $table->integer('tests_count')->default(0);
            $table->string('age_range')->nullable();
            $table->string('duration_hours')->nullable();
            $table->text('preparation_notes')->nullable();
            $table->boolean('requires_fasting')->default(false);
            $table->integer('fasting_hours')->nullable();
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_packages');
    }
};
