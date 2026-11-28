<?php

namespace Tests\Feature;

use App\Models\AcademicCorrection;
use App\Models\Internship;
use App\Models\JobRole;
use App\Models\StudentProfile;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CdcIndustrialApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_rbac_blocks_student_and_guide_from_admin_master_edits(): void
    {
        $studentToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-1-2-5-8',
        ])->assertOk()->json('token');

        $guideToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'k.ramanathan@vit.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-3-6-7-8',
        ])->assertOk()->json('token');

        $adminToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'cdc.admin@vit.ac.in',
            'password' => 'Admin@1234',
            'pattern' => '0-4-8-5-2',
        ])->assertOk()->json('token');

        // Student & Guide cannot access Admin Master Student DB
        $this->withToken($studentToken)->getJson('/api/v1/admin/students')->assertStatus(403);
        auth()->forgetGuards();
        $this->withToken($guideToken)->postJson('/api/v1/admin/students', [])->assertStatus(403);
        auth()->forgetGuards();

        // Admin CAN access & create students
        $this->withToken($adminToken)->getJson('/api/v1/admin/dashboard')->assertOk();
        $this->withToken($adminToken)->postJson('/api/v1/admin/students', [
            'reg_number' => '21BCE9001',
            'name' => 'Industrial Test Student',
            'email' => 'ind.test@vitstudent.ac.in',
            'branch' => 'CSE',
            'current_cgpa' => 8.9,
        ])->assertStatus(201);
    }

    public function test_student_eligibility_and_guide_internship_workflow_and_admin_export(): void
    {
        $studentToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-1-2-5-8',
        ])->json('token');

        $role = JobRole::where('role_code', 'role-infy-sp')->firstOrFail();
        $this->withToken($studentToken)
            ->postJson('/api/v1/eligibility/evaluate', ['roleId' => $role->id])
            ->assertOk()
            ->assertJsonPath('overallStatus', 'ELIGIBLE');

        $guideToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'k.ramanathan@vit.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-3-6-7-8',
        ])->json('token');

        auth()->forgetGuards();
        $internship = Internship::firstOrFail();
        $this->withToken($guideToken)
            ->postJson("/api/v1/internships/{$internship->id}/review", [
                'role' => 'GUIDE',
                'decision' => 'APPROVED',
                'remarks' => 'Verified by Guide',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'PENDING_CDC_APPROVAL');

        $adminToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'cdc.admin@vit.ac.in',
            'password' => 'Admin@1234',
            'pattern' => '0-4-8-5-2',
        ])->json('token');

        auth()->forgetGuards();
        $corr = AcademicCorrection::firstOrFail();
        $this->withToken($adminToken)
            ->patchJson("/api/v1/admin/corrections/{$corr->id}", ['status' => 'APPROVED'])
            ->assertOk()
            ->assertJsonPath('status', 'APPROVED');

        $this->withToken($adminToken)
            ->get('/api/v1/admin/data-exchange/export?scope=students&format=csv')
            ->assertOk();
    }

    public function test_guide_can_verify_only_assigned_students_documents(): void
    {
        $guide = User::where('email', 'k.ramanathan@vit.ac.in')->firstOrFail();
        $otherStudent = StudentProfile::where('assigned_guide_id', '!=', $guide->id)->firstOrFail();
        $otherDocument = $otherStudent->documents()->create([
            'name' => 'Another guide’s document',
            'category' => 'Resume',
            'file_url' => '/uploads/other-resume.pdf',
        ]);
        $student = StudentProfile::where('assigned_guide_id', $guide->id)->firstOrFail();
        $document = $student->documents()->create([
            'name' => 'Assigned student resume',
            'category' => 'Resume',
            'file_url' => '/uploads/assigned-resume.pdf',
        ]);

        Sanctum::actingAs($guide);
        $this->getJson('/api/v1/guide/dashboard')
            ->assertOk()
            ->assertJsonPath('documents.0.id', $document->id)
            ->assertJsonCount(1, 'documents');

        $this->patchJson("/api/v1/documents/{$otherDocument->id}/verification", ['status' => 'VERIFIED'])
            ->assertNotFound();
        $this->patchJson("/api/v1/documents/{$document->id}/verification", ['status' => 'VERIFIED'])
            ->assertOk()
            ->assertJsonPath('verification_status', 'VERIFIED');
        $this->patchJson("/api/v1/documents/{$document->id}/verification", ['status' => 'REJECTED'])
            ->assertConflict();
    }

    public function test_guide_can_record_a_change_request_once_using_the_shared_review_contract(): void
    {
        $internship = Internship::firstOrFail();
        $guide = User::findOrFail($internship->faculty_guide_id);
        $endpoint = "/api/v1/internships/{$internship->id}/review";
        Sanctum::actingAs($guide);

        $this->postJson($endpoint, ['role' => 'GUIDE', 'decision' => 'CHANGES_REQUESTED'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('remarks');

        $this->postJson($endpoint, [
            'role' => 'GUIDE', 'decision' => 'CHANGES_REQUESTED', 'remarks' => 'Please add your start date.',
        ])->assertOk()
            ->assertJsonPath('status', 'REJECTED')
            ->assertJsonPath('steps.1.decision', 'REJECTED')
            ->assertJsonPath('steps.1.reviewOutcome', 'CHANGES_REQUESTED')
            ->assertJsonPath('steps.1.remarks', 'Please add your start date.');

        $this->postJson($endpoint, ['role' => 'GUIDE', 'decision' => 'APPROVED'])
            ->assertConflict();
    }

    public function test_uploaded_evidence_and_revision_cross_all_three_portals(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        $student = User::where('email', 'sneha.r2023@vitstudent.ac.in')->firstOrFail();
        $guide = User::findOrFail($student->studentProfile->assigned_guide_id);
        $admin = User::where('email', 'cdc.admin@vit.ac.in')->firstOrFail();
        $pdf = fn () => \Illuminate\Http\UploadedFile::fake()->createWithContent('offer.pdf', "%PDF-1.4\nTest evidence");

        Sanctum::actingAs($student);
        $profileDocument = $this->post('/api/v1/students/me/documents', ['file' => $pdf(), 'category' => 'Resume'])
            ->assertCreated()->json('id');
        $internship = $this->post('/api/v1/internships/register', [
            'track' => 'TRACK_1_SUMMER', 'companyName' => 'Example Co', 'jobRole' => 'Intern',
            'startDate' => '2027-01-01', 'endDate' => '2027-02-01', 'durationWeeks' => 4, 'offer' => $pdf(),
        ])->assertCreated()->json();
        $id = $internship['id'];
        $file = $internship['documents'][0]['id'];
        $url = "/api/v1/internships/{$id}/review";
        Sanctum::actingAs($admin);
        $this->postJson($url, ['role' => 'ADMIN_INTERNSHIP', 'decision' => 'APPROVED'])->assertConflict();
        $otherGuide = User::where('role', 'GUIDE')->where('id', '!=', $guide->id)->firstOrFail();
        $student->studentProfile()->update(['assigned_guide_id' => $otherGuide->id]);
        Sanctum::actingAs($otherGuide);
        $this->get("/api/v1/documents/{$file}/file")->assertNotFound();
        $this->patchJson("/api/v1/documents/{$file}/verification", ['status' => 'VERIFIED'])->assertNotFound();
        Sanctum::actingAs($guide);
        $this->get("/api/v1/documents/{$file}/file")->assertDownload('offer.pdf');
        $this->patchJson("/api/v1/documents/{$file}/verification", ['status' => 'VERIFIED'])->assertOk();
        $this->getJson('/api/v1/guide/internships')->assertJsonFragment(['verificationStatus' => 'VERIFIED']);
        $student->studentProfile()->update(['assigned_guide_id' => $guide->id]);
        $this->patchJson("/api/v1/documents/{$profileDocument}/verification", ['status' => 'VERIFIED'])->assertOk();
        $this->postJson($url, ['role' => 'GUIDE', 'decision' => 'CHANGES_REQUESTED', 'remarks' => 'Clarify duties.'])->assertOk();
        Sanctum::actingAs($student);
        $this->getJson('/api/v1/students/me/documents')->assertJsonFragment(['verification_status' => 'VERIFIED']);
        $this->post("/api/v1/internships/{$id}/resubmit", ['workProfile' => 'Updated duties', 'supporting' => $pdf()])
            ->assertOk()->assertJsonPath('status', 'PENDING_GUIDE_REVIEW')->assertJsonCount(2, 'documents');
        $this->postJson("/api/v1/internships/{$id}/resubmit", ['workProfile' => 'Duplicate'])->assertConflict();
        Sanctum::actingAs($guide);
        $this->postJson($url, ['role' => 'GUIDE', 'decision' => 'APPROVED'])->assertOk();
        Sanctum::actingAs($admin);
        $this->postJson($url, ['role' => 'ADMIN_INTERNSHIP', 'decision' => 'APPROVED'])->assertOk()->assertJsonPath('status', 'APPROVED');
        $this->postJson($url, ['role' => 'ADMIN_INTERNSHIP', 'decision' => 'REJECTED'])->assertConflict();
    }

    public function test_daily_coding_challenge_workflow_and_password_change(): void
    {
        $adminToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'cdc.admin@vit.ac.in',
            'password' => 'Admin@1234',
            'pattern' => '0-4-8-5-2',
        ])->assertOk()->json('token');

        auth()->forgetGuards();
        $created = $this->withToken($adminToken)
            ->postJson('/api/v1/coding-challenge/questions', [
                'title' => '200. Number of Islands',
                'leetcodeUrl' => 'https://leetcode.com/problems/number-of-islands/',
                'difficulty' => 'Medium',
                'topics' => ['Graphs'],
                'dueDate' => now()->addDays(5)->toDateString(),
            ])
            ->assertStatus(201)
            ->json();

        $studentToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-1-2-5-8',
        ])->assertOk()->json('token');

        auth()->forgetGuards();
        $this->withToken($studentToken)
            ->postJson("/api/v1/coding-challenge/posted-questions/{$created['id']}/toggle")
            ->assertOk()
            ->assertJsonPath('isSolved', true);

        auth()->forgetGuards();
        $this->withToken($studentToken)
            ->getJson('/api/v1/coding-challenge/profile')
            ->assertOk()
            ->assertJsonPath('username', 'sneha_dev');

        auth()->forgetGuards();
        $this->withToken($studentToken)
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'Portal@1234',
                'new_password' => 'SnehaNew@2027',
                'new_password_confirmation' => 'SnehaNew@2027',
            ])
            ->assertOk();
    }

    public function test_unified_mysql_interviews_calendar_parent_alerts_and_skills(): void
    {
        $studentToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-1-2-5-8',
        ])->assertOk()->json('token');

        auth()->forgetGuards();
        $this->withToken($studentToken)->getJson('/api/v1/interviews')->assertOk()->assertJsonCount(1);
        $this->withToken($studentToken)->getJson('/api/v1/calendar/events')->assertOk()->assertJsonCount(2);
        $this->withToken($studentToken)->getJson('/api/v1/parent-alerts')->assertOk()->assertJsonCount(1);
        $this->withToken($studentToken)->postJson('/api/v1/parent-alerts/verify-otp', ['otp' => '123456'])
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_pdf_gap_features_completion_upload_guide_remarks_and_admin_governance(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        $student = User::where('email', 'sneha.r2023@vitstudent.ac.in')->firstOrFail();
        $guide = User::where('email', 'k.ramanathan@vit.ac.in')->firstOrFail();
        $admin = User::where('email', 'cdc.admin@vit.ac.in')->firstOrFail();

        // 1. Guide confidential mentoring remark stays hidden from student routes
        Sanctum::actingAs($guide);
        $this->getJson("/api/v1/guide/students/{$student->studentProfile->id}")
            ->assertOk()
            ->assertJsonPath('student.reg_number', '21BCE1042');
        $this->postJson("/api/v1/guide/students/{$student->studentProfile->id}/remarks", [
            'remark' => 'Confidential mentor note',
            'category' => 'mentoring',
            'is_confidential' => true,
        ])->assertCreated();
        $this->postJson("/api/v1/guide/students/{$student->studentProfile->id}/remarks", [
            'remark' => 'Please upload your updated semester marksheet',
            'category' => 'profile_update_request',
            'is_confidential' => false,
        ])->assertCreated();

        Sanctum::actingAs($student);
        $this->getJson('/api/v1/students/me/mentoring-requests')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonMissing(['remark' => 'Confidential mentor note']);

        // 2. Internship opportunities & completion evidence upload
        $this->getJson('/api/v1/internships/opportunities')->assertOk();
        $internship = Internship::where('student_profile_id', $student->studentProfile->id)->firstOrFail();
        $internship->update(['status' => 'APPROVED']);
        $pdf = fn (string $name) => \Illuminate\Http\UploadedFile::fake()->createWithContent($name, "%PDF-1.4\nDone");
        $this->post("/api/v1/internships/{$internship->id}/completion", [
            'certificate' => $pdf('completion.pdf'),
            'report' => $pdf('final_report.pdf'),
        ])->assertOk()->assertJsonPath('status', 'COMPLETED');

        // 3. Admin MOU, Consultancy, Reports & Guide Assignment
        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/admin/reports?academic_year=2026-2027')
            ->assertOk()
            ->assertJsonPath('internshipSummary.completed', 1);
        $this->postJson('/api/v1/admin/mous', [
            'organization_name' => 'TCS Research',
            'agreement_date' => '2026-08-01',
            'collaboration_type' => 'Internships',
        ])->assertCreated();
        $this->postJson('/api/v1/admin/consultancies', [
            'industry_partner' => 'Wipro',
            'project_title' => 'Cloud Audit Automation',
            'faculty_coordinator' => 'Dr. K. Ramanathan',
        ])->assertCreated();
    }

    public function test_mentor_student_two_way_chat_and_portal_isolation(): void
    {
        $student = User::where('email', 'sneha.r2023@vitstudent.ac.in')->firstOrFail();
        $guide = User::where('email', 'k.ramanathan@vit.ac.in')->firstOrFail();
        $otherGuide = User::where('email', 'kavita.nair@cdc.edu')->firstOrFail();

        // Student sends message to assigned mentor
        Sanctum::actingAs($student);
        $this->getJson('/api/v1/chat/messages')
            ->assertOk()
            ->assertJsonPath('guide.id', $guide->id);
        $this->postJson('/api/v1/chat/messages', ['message' => 'Hello mentor, checking my drive shortlist.'])
            ->assertCreated()
            ->assertJsonPath('sender_role', 'STUDENT');

        // Other guide CANNOT read or reply to unassigned student's chat
        Sanctum::actingAs($otherGuide);
        $this->getJson("/api/v1/guide/students/{$student->studentProfile->id}/chat")->assertNotFound();
        $this->postJson("/api/v1/guide/students/{$student->studentProfile->id}/chat", ['message' => 'Intrusion'])->assertNotFound();

        // Assigned guide reads threads, reads messages (marks read), and replies
        Sanctum::actingAs($guide);
        $this->getJson('/api/v1/guide/chat/threads')->assertOk()->assertJsonFragment(['regNumber' => '21BCE1042']);
        $this->getJson("/api/v1/guide/students/{$student->studentProfile->id}/chat")
            ->assertOk()
            ->assertJsonFragment(['message' => 'Hello mentor, checking my drive shortlist.']);
        $this->postJson("/api/v1/guide/students/{$student->studentProfile->id}/chat", ['message' => 'You are shortlisted for Infosys SP.'])
            ->assertCreated()
            ->assertJsonPath('sender_role', 'GUIDE');

        // Assigned guide broadcasts chat + notice to ALL assigned students without leaking to other guides' mentees
        $otherStudent = User::where('email', 'rohan.v@vitstudent.ac.in')->firstOrFail();
        $this->postJson('/api/v1/guide/chat/broadcast', [
            'message' => 'Cohort review meeting at 4 PM today.',
        ])->assertCreated()->assertJsonPath('sentCount', 2);

        $this->postJson('/api/v1/guide/notices', [
            'title' => 'Mentee Weekly Standup',
            'content' => 'Submit internship logs before Friday.',
            'priority' => 'High',
        ])->assertCreated();

        Sanctum::actingAs($student);
        $this->getJson('/api/v1/chat/messages')->assertOk()->assertJsonFragment(['message' => 'Cohort review meeting at 4 PM today.']);
        $this->getJson('/api/v1/notices')->assertOk()->assertJsonFragment(['title' => 'Mentee Weekly Standup']);

        Sanctum::actingAs($otherStudent);
        $this->getJson('/api/v1/chat/messages')->assertOk()->assertJsonMissing(['message' => 'Cohort review meeting at 4 PM today.']);
        $this->getJson('/api/v1/notices')->assertOk()->assertJsonMissing(['title' => 'Mentee Weekly Standup']);
    }

    public function test_unified_pattern_lock_login_routing_and_change_pattern(): void
    {
        // 1. Missing or invalid pattern fails cleanly
        $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
        ])->assertStatus(422);

        // 2. Wrong pattern (Admin pattern for Student account) is rejected
        $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-4-8-5-2',
        ])->assertStatus(401);

        // 3. Matching pattern auto-resolves portal and redirect target
        $studentRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-1-2-5-8',
        ])->assertOk()
            ->assertJsonPath('resolvedPortal', 'student')
            ->assertJsonPath('redirectTo', '/student');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'k.ramanathan@vit.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-3-6-7-8',
        ])->assertOk()
            ->assertJsonPath('resolvedPortal', 'guide')
            ->assertJsonPath('redirectTo', '/guide');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'cdc.admin@vit.ac.in',
            'password' => 'Admin@1234',
            'pattern' => '0-4-8-5-2',
        ])->assertOk()
            ->assertJsonPath('resolvedPortal', 'admin')
            ->assertJsonPath('redirectTo', '/admin');

        // 4. Duplicate dots rejected when updating pattern; valid new pattern works immediately
        $token = $studentRes->json('token');
        $this->withToken($token)->postJson('/api/v1/auth/change-pattern', [
            'current_password' => 'Portal@1234',
            'new_pattern' => '0-1-0-2',
        ])->assertStatus(422);

        $this->withToken($token)->postJson('/api/v1/auth/change-pattern', [
            'current_password' => 'Portal@1234',
            'new_pattern' => '6-4-2-5-8',
        ])->assertOk();

        // Old default pattern no longer unlocks Sneha, new pattern does
        $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '0-1-2-5-8',
        ])->assertStatus(401);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => 'Portal@1234',
            'pattern' => '6-4-2-5-8',
        ])->assertOk()->assertJsonPath('resolvedPortal', 'student');

        // 5. Direct portal session issues scoped token when login wall is disconnected
        foreach (['student', 'guide', 'admin'] as $scope) {
            $this->postJson('/api/v1/auth/direct-session', ['portal' => $scope])
                ->assertOk()
                ->assertJsonPath('resolvedPortal', $scope);
        }
    }
}
