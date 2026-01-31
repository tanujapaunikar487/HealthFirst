<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_centers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->string('city');
            $table->decimal('rating', 2, 1)->default(4.0);
            $table->decimal('distance_km', 4, 1)->nullable();
            $table->time('opening_time')->default('06:00');
            $table->time('closing_time')->default('18:00');
            $table->boolean('home_collection_available')->default(true);
            $table->integer('home_collection_fee')->default(250);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_centers');
    }
};
