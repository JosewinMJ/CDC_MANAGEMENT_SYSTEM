<?php

namespace Tests\Feature;

use App\Models\AcademicCorrection;
use App\Models\Internship;
use App\Models\JobRole;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        ])->assertOk()->json('token');

        $guideToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'k.ramanathan@vit.ac.in',
            'password' => 'Portal@1234',
        ])->assertOk()->json('token');

        $adminToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'cdc.admin@vit.ac.in',
            'password' => 'Admin@1234',
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
        ])->json('token');

        $role = JobRole::where('role_code', 'role-infy-sp')->firstOrFail();
        $this->withToken($studentToken)
            ->postJson('/api/v1/eligibility/evaluate', ['roleId' => $role->id])
            ->assertOk()
            ->assertJsonPath('overallStatus', 'ELIGIBLE');

        $guideToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'k.ramanathan@vit.ac.in',
            'password' => 'Portal@1234',
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

    public function test_daily_coding_challenge_workflow_and_password_change(): void
    {
        $adminToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'cdc.admin@vit.ac.in',
            'password' => 'Admin@1234',
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
}
