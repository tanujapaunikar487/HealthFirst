<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('insurance_provider_id')->constrained()->cascadeOnDelete();
            $table->string('policy_number');
            $table->string('plan_name');
            $table->string('plan_type');
            $table->integer('sum_insured');
            $table->integer('premium_amount')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->json('members')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_policies');
    }
};
