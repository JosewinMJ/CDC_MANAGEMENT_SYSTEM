<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('role_title', 140);
            $table->string('round_name', 120);
            $table->date('scheduled_date');
            $table->string('scheduled_time', 40);
            $table->string('venue_or_link', 255);
            $table->boolean('is_online')->default(false);
            $table->text('instructions')->nullable();
            $table->enum('status', ['Scheduled', 'Completed', 'Cancelled'])->default('Scheduled');
            $table->string('academic_year', 20)->default('2026-2027');
            $table->timestamps();
        });

        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->string('title', 180);
            $table->date('date');
            $table->string('time', 40)->nullable();
            $table->string('type', 50)->default('cdc_event');
            $table->string('company_name', 150)->nullable();
            $table->string('venue_or_link', 255)->nullable();
            $table->string('status', 60)->nullable();
            $table->string('action_url', 255)->nullable();
            $table->string('action_label', 80)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('academic_year', 20)->default('2026-2027');
            $table->timestamps();
        });

        Schema::create('parent_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->string('company_name', 160);
            $table->date('application_deadline');
            $table->string('alert_type', 80);
            $table->string('recipient_masked_phone', 40);
            $table->enum('channel', ['WhatsApp', 'SMS', 'Email'])->default('WhatsApp');
            $table->date('scheduled_date');
            $table->timestamp('sent_date')->nullable();
            $table->enum('delivery_status', ['SCHEDULED', 'SENT', 'DELIVERED', 'FAILED'])->default('SCHEDULED');
            $table->text('sample_message');
            $table->string('academic_year', 20)->default('2026-2027');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_alerts');
        Schema::dropIfExists('calendar_events');
        Schema::dropIfExists('interviews');
    }
};
