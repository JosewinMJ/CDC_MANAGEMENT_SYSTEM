<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mentoring_remarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('author_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('author_name', 120);
            $table->string('author_role', 40);
            $table->enum('category', ['mentoring', 'profile_update_request', 'progress'])->default('mentoring');
            $table->text('remark');
            $table->boolean('is_confidential')->default(true);
            $table->boolean('resolved')->default(false);
            $table->timestamps();
        });

        Schema::create('mous', function (Blueprint $table) {
            $table->id();
            $table->string('organization_name', 180);
            $table->date('agreement_date');
            $table->date('expiry_date')->nullable();
            $table->string('contact_person', 120)->nullable();
            $table->string('contact_email', 150)->nullable();
            $table->string('contact_phone', 40)->nullable();
            $table->string('collaboration_type', 100)->default('Placements & Internships');
            $table->string('agreement_doc_name', 255)->nullable();
            $table->enum('status', ['Active', 'Pending Renewal', 'Expired', 'Terminated'])->default('Active');
            $table->string('academic_year', 20)->default('2026-2027');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('consultancy_records', function (Blueprint $table) {
            $table->id();
            $table->string('industry_partner', 180);
            $table->string('project_title', 200);
            $table->text('project_details')->nullable();
            $table->string('faculty_coordinator', 120);
            $table->foreignId('faculty_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('duration', 80)->nullable();
            $table->string('supporting_doc_name', 255)->nullable();
            $table->enum('status', ['Proposed', 'Ongoing', 'Completed', 'On Hold'])->default('Ongoing');
            $table->string('academic_year', 20)->default('2026-2027');
            $table->timestamps();
        });

        Schema::table('notices', function (Blueprint $table) {
            $table->unsignedBigInteger('target_student_profile_id')->nullable()->after('target_branches');
            $table->string('target_academic_year', 20)->nullable()->after('target_student_profile_id');
            $table->string('attachment_name', 255)->nullable()->after('target_academic_year');
        });

        Schema::table('internships', function (Blueprint $table) {
            $table->boolean('ppo_converted')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('internships', function (Blueprint $table) {
            $table->dropColumn('ppo_converted');
        });
        Schema::table('notices', function (Blueprint $table) {
            $table->dropColumn(['target_student_profile_id', 'target_academic_year', 'attachment_name']);
        });
        Schema::dropIfExists('consultancy_records');
        Schema::dropIfExists('mous');
        Schema::dropIfExists('mentoring_remarks');
    }
};
