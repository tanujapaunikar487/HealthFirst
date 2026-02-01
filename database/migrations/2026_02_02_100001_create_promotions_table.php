<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('button_text')->default('Book Now');
            $table->string('button_href')->default('/booking');
            $table->string('image_url')->nullable();
            $table->string('bg_gradient')->default('linear-gradient(to bottom right, #00184D 0%, #0242B3 83.86%)');
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
