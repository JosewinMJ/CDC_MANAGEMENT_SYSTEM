<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('coding_questions', function (Blueprint $table) {
            $table->id();
            $table->string('title', 180);
            $table->string('leetcode_url', 500);
            $table->enum('difficulty', ['Easy', 'Medium', 'Hard'])->default('Easy');
            $table->json('topics')->nullable();
            $table->date('posted_date');
            $table->date('due_date');
            $table->json('target_branches')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('student_coding_solves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('coding_question_id')->nullable()->constrained('coding_questions')->cascadeOnDelete();
            $table->string('title', 180);
            $table->string('leetcode_url', 500)->nullable();
            $table->enum('difficulty', ['Easy', 'Medium', 'Hard'])->default('Easy');
            $table->json('topics')->nullable();
            $table->timestamp('solved_at');
            $table->timestamps();
            $table->unique(['student_profile_id', 'coding_question_id'], 'uq_student_coding_q');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_coding_solves');
        Schema::dropIfExists('coding_questions');
    }
};
