<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('knowledge_base_resources', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('category')->index(); // e.g., 'booking', 'services', 'doctors', 'lab_tests', 'policies'
            $table->text('summary')->nullable(); // Short summary for search results
            $table->longText('content'); // Full content
            $table->json('tags')->nullable(); // Searchable tags
            $table->json('metadata')->nullable(); // Additional metadata (author, source, etc.)
            $table->boolean('is_active')->default(true)->index();
            $table->integer('priority')->default(0)->index(); // Higher priority resources shown first
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            // Full-text search indexes (only for MySQL)
            if (DB::getDriverName() !== 'sqlite') {
                $table->fullText(['title', 'summary', 'content']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_base_resources');
    }
};
