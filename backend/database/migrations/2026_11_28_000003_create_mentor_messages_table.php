<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mentor_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('guide_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('sender_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('sender_role', ['STUDENT', 'GUIDE']);
            $table->string('sender_name', 120);
            $table->text('message');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['student_profile_id', 'guide_user_id', 'created_at'], 'idx_mentor_msg_thread');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_messages');
    }
};
