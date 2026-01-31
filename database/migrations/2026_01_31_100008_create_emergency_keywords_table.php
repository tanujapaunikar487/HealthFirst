<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emergency_keywords', function (Blueprint $table) {
            $table->id();
            $table->string('keyword');
            $table->string('severity')->default('high'); // high, critical
            $table->string('category')->nullable(); // cardiac, respiratory, neurological, trauma, psychiatric
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emergency_keywords');
    }
};
