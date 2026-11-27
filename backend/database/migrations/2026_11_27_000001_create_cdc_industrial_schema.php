<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', [
                'STUDENT',
                'GUIDE',
                'ADMIN_SUPER',
                'ADMIN_PLACEMENT',
                'ADMIN_INTERNSHIP',
                'ADMIN_STAFF',
            ])->default('STUDENT')->after('email');
            $table->string('phone', 30)->nullable()->after('role');
            $table->string('department', 120)->nullable()->after('phone');
            $table->string('avatar_url', 500)->nullable()->after('department');
            $table->boolean('is_active')->default(true)->after('avatar_url');
            $table->boolean('must_change_password')->default(false)->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('must_change_password');
        });

        // Isolated Faculty / Guide Database Table
        Schema::create('faculty_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('employee_id', 40)->unique();
            $table->string('designation', 100)->default('Assistant Professor');
            $table->enum('coordinator_role', ['tpo_head', 'dept_coordinator', 'placement_faculty', 'faculty_guide', 'trainer'])->default('faculty_guide');
            $table->string('assigned_batches', 120)->nullable();
            $table->boolean('can_manage_drives')->default(false);
            $table->boolean('can_verify_students')->default(true);
            $table->boolean('portal_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Isolated Student Database Table
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('reg_number', 40)->unique();
            $table->date('dob')->nullable();
            $table->string('gender', 30)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('academic_year', 20)->default('2026-2027');
            $table->foreignId('assigned_guide_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('degree', 60)->default('B.Tech');
            $table->string('programme', 120)->default('B.Tech Computer Science and Engineering');
            $table->string('branch', 40)->default('CSE');
            $table->string('specialization', 120)->nullable();
            $table->year('graduation_year')->default(2027);
            $table->unsignedTinyInteger('semester')->default(7);
            $table->decimal('tenth_percentage', 5, 2)->default(0.00);
            $table->decimal('twelfth_percentage', 5, 2)->default(0.00);
            $table->decimal('current_cgpa', 4, 2)->default(0.00);
            $table->unsignedTinyInteger('active_backlogs')->default(0);
            $table->unsignedTinyInteger('historical_backlogs')->default(0);
            $table->json('semester_results')->nullable();
            $table->enum('verification_status', ['NOT_UPLOADED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'])->default('PENDING_VERIFICATION');
            $table->string('verified_by', 120)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->enum('placement_status', ['unplaced', 'shortlisted', 'placed', 'opted_out'])->default('unplaced');
            $table->string('placed_company', 150)->nullable();
            $table->decimal('package_lpa', 6, 2)->nullable();
            $table->json('skills')->nullable();
            $table->json('parent_contact')->nullable();
            $table->string('leetcode_username', 80)->nullable();
            $table->json('coding_stats')->nullable();
            $table->boolean('portal_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['branch', 'graduation_year']);
            $table->index('placement_status');
        });

        Schema::create('academic_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->string('field', 80);
            $table->string('current_value', 255);
            $table->string('requested_value', 255);
            $table->text('reason');
            $table->string('supporting_doc_name', 255)->nullable();
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->string('reviewed_by', 120)->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->string('name', 200);
            $table->string('category', 60);
            $table->string('file_url', 500);
            $table->string('file_size', 40)->default('1.0 MB');
            $table->enum('verification_status', ['NOT_UPLOADED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'])->default('PENDING_VERIFICATION');
            $table->string('verified_by', 120)->nullable();
            $table->timestamp('verified_date')->nullable();
            $table->string('rejection_reason', 255)->nullable();
            $table->string('track', 40)->nullable();
            $table->timestamps();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('slug_code', 60)->unique();
            $table->string('name', 160);
            $table->string('industry', 100)->default('Technology');
            $table->enum('tier', ['super_dream', 'dream', 'core', 'startup', 'mass'])->default('core');
            $table->string('logo_url', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('website', 255)->nullable();
            $table->string('hr_name', 120)->nullable();
            $table->string('hr_email', 150)->nullable();
            $table->string('hr_phone', 40)->nullable();
            $table->string('location', 120)->nullable();
            $table->date('application_deadline');
            $table->json('recruitment_schedule')->nullable();
            $table->text('instructions')->nullable();
            $table->json('departments')->nullable();
            $table->string('academic_year', 20)->default('2026-2027');
            $table->boolean('is_verified')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('job_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('role_code', 60)->unique();
            $table->string('role_title', 140);
            $table->string('package_ctc', 60);
            $table->decimal('package_lpa', 6, 2)->default(0.00);
            $table->string('stipend', 60)->nullable();
            $table->enum('job_type', ['Full-time', 'Internship', 'Internship + Full-time'])->default('Full-time');
            $table->string('work_location', 120)->default('Bengaluru');
            $table->string('bond_period', 60)->nullable();
            $table->text('description')->nullable();
            $table->json('required_skills')->nullable();
            $table->json('eligibility_criteria');
            $table->enum('status', ['open', 'upcoming', 'closed', 'completed'])->default('open');
            $table->timestamps();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('job_role_id')->constrained('job_roles')->cascadeOnDelete();
            $table->enum('status', [
                'APPLIED',
                'ASSESSMENT_SCHEDULED',
                'SHORTLISTED',
                'INTERVIEW_SCHEDULED',
                'SELECTED',
                'NOT_SELECTED',
                'WAITLISTED',
            ])->default('APPLIED');
            $table->string('next_stage', 160)->nullable();
            $table->json('timeline')->nullable();
            $table->string('remarks', 255)->nullable();
            $table->string('academic_year', 20)->default('2026-2027');
            $table->timestamps();
            $table->unique(['student_profile_id', 'job_role_id']);
        });

        Schema::create('internships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->enum('track', ['TRACK_1_SUMMER', 'TRACK_2_HYBRID', 'TRACK_3_SEMESTER']);
            $table->string('semester', 40)->nullable();
            $table->string('company_name', 160);
            $table->string('company_contact_number', 40)->nullable();
            $table->string('company_address', 255)->nullable();
            $table->string('job_role', 120);
            $table->boolean('is_stipend')->default(false);
            $table->unsignedInteger('stipend_amount')->nullable();
            $table->string('stipend_currency', 10)->default('₹');
            $table->enum('mode', ['Online', 'Offline', 'Hybrid'])->default('Hybrid');
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedSmallInteger('duration_weeks')->default(8);
            $table->text('work_profile')->nullable();
            $table->foreignId('faculty_guide_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', [
                'NOT_STARTED',
                'SUBMITTED',
                'PENDING_GUIDE_REVIEW',
                'GUIDE_APPROVED',
                'PENDING_CDC_APPROVAL',
                'APPROVED',
                'REJECTED',
                'IN_PROGRESS',
                'COMPLETED',
            ])->default('PENDING_GUIDE_REVIEW');
            $table->json('steps')->nullable();
            $table->json('documents')->nullable();
            $table->string('academic_year', 20)->default('2026-2027');
            $table->timestamps();
        });

        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('content');
            $table->string('publisher_name', 120);
            $table->string('publisher_role', 60);
            $table->string('category', 40)->default('General');
            $table->enum('priority', ['Normal', 'High', 'Urgent'])->default('Normal');
            $table->boolean('is_important')->default(false);
            $table->enum('target_portal', ['all', 'student', 'guide'])->default('all');
            $table->json('target_branches')->nullable();
            $table->json('read_by_student_ids')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('academic_year', 20)->default('2026-2027');
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('actor_user_id')->nullable();
            $table->string('actor_name', 120)->nullable();
            $table->string('actor_role', 40)->default('SYSTEM');
            $table->string('action', 80);
            $table->string('entity_type', 60);
            $table->string('entity_id', 80)->nullable();
            $table->text('details')->nullable();
            $table->text('remarks')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('academic_year', 20)->default('2026-2027');
            $table->timestamps();
            $table->index(['entity_type', 'created_at']);
        });

        Schema::create('data_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('portal_scope', 40);
            $table->enum('direction', ['import', 'export']);
            $table->string('format', 20);
            $table->unsignedInteger('record_count')->default(0);
            $table->string('file_name', 255);
            $table->string('actor_email', 150)->nullable();
            $table->enum('status', ['success', 'partial', 'failed'])->default('success');
            $table->string('summary', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_sync_logs');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notices');
        Schema::dropIfExists('internships');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('job_roles');
        Schema::dropIfExists('companies');
        Schema::dropIfExists('student_documents');
        Schema::dropIfExists('academic_corrections');
        Schema::dropIfExists('student_profiles');
        Schema::dropIfExists('faculty_profiles');
    }
};
