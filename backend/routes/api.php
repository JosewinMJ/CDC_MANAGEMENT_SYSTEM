<?php

use App\Http\Controllers\Api\V1\AdminGovernanceController;
use App\Http\Controllers\Api\V1\AdminPortalController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CodingChallengeController;
use App\Http\Controllers\Api\V1\GuidePortalController;
use App\Http\Controllers\Api\V1\MentorChatController;
use App\Http\Controllers\Api\V1\StudentPortalController;
use App\Http\Controllers\Api\V1\StudentDocumentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public Authentication
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/direct-session', [AuthController::class, 'directSession']);

    // Authenticated Cross-Portal Routes (Sanctum Token Required)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::post('/auth/change-pattern', [AuthController::class, 'changePattern']);

        Route::middleware('role:STUDENT,GUIDE,ADMIN')->get('/documents/{document}/file', [StudentDocumentController::class, 'download']);

        // Shared Read Feeds
        Route::get('/companies', [StudentPortalController::class, 'companies']);
        Route::get('/companies/{id}', [StudentPortalController::class, 'companyDetail']);
        Route::get('/notices', [StudentPortalController::class, 'notices']);
        Route::post('/notices/{id}/read', [StudentPortalController::class, 'markNoticeRead']);
        Route::post('/notices/read-all', [StudentPortalController::class, 'markAllNoticesRead']);
        Route::get('/calendar/events', [StudentPortalController::class, 'calendarEvents']);
        Route::post('/calendar/events', [StudentPortalController::class, 'addCalendarEvent']);

        // Student Portal Scope
        Route::middleware('role:STUDENT,ADMIN')->group(function () {
            Route::get('/students/me/documents', [StudentDocumentController::class, 'index']);
            Route::post('/students/me/documents', [StudentDocumentController::class, 'store']);
            Route::delete('/students/me/documents/{id}', [StudentDocumentController::class, 'destroy']);
            Route::post('/internships/{id}/resubmit', [StudentPortalController::class, 'resubmit']);
            Route::get('/students/me', [StudentPortalController::class, 'me']);
            Route::patch('/students/me/personal', [StudentPortalController::class, 'updatePersonal']);
            Route::patch('/students/me/skills', [StudentPortalController::class, 'updateSkills']);
            Route::patch('/students/me/parent-contact', [StudentPortalController::class, 'updateParentContact']);
            Route::get('/students/me/academic-correction', [StudentPortalController::class, 'myCorrections']);
            Route::post('/students/me/academic-correction', [StudentPortalController::class, 'requestCorrection']);
            Route::get('/interviews', [StudentPortalController::class, 'interviews']);
            Route::get('/parent-alerts', [StudentPortalController::class, 'parentAlerts']);
            Route::post('/parent-alerts/verify-otp', [StudentPortalController::class, 'verifyParentOtp']);
            Route::post('/eligibility/evaluate', [StudentPortalController::class, 'evaluateEligibility']);
            Route::get('/applications/my-applications', [StudentPortalController::class, 'myApplications']);
            Route::post('/applications', [StudentPortalController::class, 'apply']);
            Route::get('/internships/my-internships', [StudentPortalController::class, 'myInternships']);
            Route::post('/internships/register', [StudentPortalController::class, 'registerInternship']);
            Route::get('/internships/opportunities', [StudentPortalController::class, 'internshipOpportunities']);
            Route::post('/internships/{id}/completion', [StudentPortalController::class, 'submitCompletion']);
            Route::get('/students/me/mentoring-requests', [StudentPortalController::class, 'mentoringRequests']);
            Route::get('/chat/messages', [MentorChatController::class, 'studentMessages']);
            Route::post('/chat/messages', [MentorChatController::class, 'studentSend']);
            Route::get('/coding-challenge/profile', [CodingChallengeController::class, 'profile']);
            Route::post('/coding-challenge/verify-username', [CodingChallengeController::class, 'verifyUsername']);
            Route::post('/coding-challenge/register-username', [CodingChallengeController::class, 'registerUsername']);
            Route::post('/coding-challenge/sync-leetcode', [CodingChallengeController::class, 'syncFromLeetCode']);
            Route::post('/coding-challenge/posted-questions/{id}/toggle', [CodingChallengeController::class, 'togglePostedQuestion']);
            Route::post('/coding-challenge/log-solve', [CodingChallengeController::class, 'logCustomSolve']);
        });

        // Guide / Faculty Portal Scope
        Route::middleware('role:GUIDE,ADMIN')->group(function () {
            Route::get('/guide/dashboard', [GuidePortalController::class, 'dashboard']);
            Route::get('/guide/students/{id}', [GuidePortalController::class, 'studentDetail']);
            Route::post('/guide/students/{id}/remarks', [GuidePortalController::class, 'storeRemark']);
            Route::get('/guide/internships', [GuidePortalController::class, 'internships']);
            Route::post('/internships/{id}/review', [GuidePortalController::class, 'reviewInternship']);
            Route::patch('/documents/{id}/verification', [GuidePortalController::class, 'verifyDocument']);
            Route::get('/guide/notices', [GuidePortalController::class, 'myNotices']);
            Route::post('/guide/notices', [GuidePortalController::class, 'publishNotice']);
            Route::get('/guide/chat/threads', [MentorChatController::class, 'guideThreads']);
            Route::get('/guide/students/{id}/chat', [MentorChatController::class, 'guideMessages']);
            Route::post('/guide/students/{id}/chat', [MentorChatController::class, 'guideSend']);
            Route::get('/coding-challenge/questions', [CodingChallengeController::class, 'listQuestions']);
            Route::post('/coding-challenge/questions', [CodingChallengeController::class, 'storeQuestion']);
            Route::get('/coding-challenge/leaderboard', [CodingChallengeController::class, 'leaderboard']);
        });

        // Admin-Only Master Governance Scope (Strict RBAC)
        Route::middleware('role:ADMIN')->prefix('admin')->group(function () {
            Route::get('/dashboard', [AdminPortalController::class, 'dashboard']);
            Route::get('/reports', [AdminGovernanceController::class, 'reports']);
            Route::get('/students', [AdminPortalController::class, 'students']);
            Route::post('/students', [AdminPortalController::class, 'storeStudent']);
            Route::patch('/students/{id}', [AdminPortalController::class, 'updateStudent']);
            Route::delete('/students/{id}', [AdminPortalController::class, 'deleteStudent']);
            Route::get('/faculty', [AdminPortalController::class, 'faculty']);
            Route::post('/faculty', [AdminPortalController::class, 'storeFaculty']);
            Route::patch('/faculty/{id}', [AdminPortalController::class, 'updateFaculty']);
            Route::post('/companies', [AdminPortalController::class, 'storeCompany']);
            Route::patch('/companies/{id}', [AdminPortalController::class, 'updateCompany']);
            Route::post('/companies/{id}/roles', [AdminPortalController::class, 'addCompanyRole']);
            Route::patch('/job-roles/{id}', [AdminPortalController::class, 'updateJobRole']);
            Route::get('/companies/{id}/eligibility-summary', [AdminPortalController::class, 'companyEligibilitySummary']);
            Route::patch('/internships/{id}/ppo', [AdminPortalController::class, 'markInternshipPpo']);
            Route::get('/applications', [AdminPortalController::class, 'applications']);
            Route::patch('/applications/{id}/stage', [AdminPortalController::class, 'advanceApplicationStage']);
            Route::get('/corrections', [AdminPortalController::class, 'corrections']);
            Route::patch('/corrections/{id}', [AdminPortalController::class, 'reviewCorrection']);
            Route::get('/notices', [AdminPortalController::class, 'notices']);
            Route::post('/notices', [AdminPortalController::class, 'publishNotice']);
            Route::get('/mous', [AdminGovernanceController::class, 'mous']);
            Route::post('/mous', [AdminGovernanceController::class, 'storeMou']);
            Route::patch('/mous/{id}', [AdminGovernanceController::class, 'updateMou']);
            Route::delete('/mous/{id}', [AdminGovernanceController::class, 'deleteMou']);
            Route::get('/consultancies', [AdminGovernanceController::class, 'consultancies']);
            Route::post('/consultancies', [AdminGovernanceController::class, 'storeConsultancy']);
            Route::patch('/consultancies/{id}', [AdminGovernanceController::class, 'updateConsultancy']);
            Route::delete('/consultancies/{id}', [AdminGovernanceController::class, 'deleteConsultancy']);
            Route::post('/data-exchange/import', [AdminPortalController::class, 'importSheet']);
            Route::get('/data-exchange/export', [AdminPortalController::class, 'exportSheet']);
            Route::get('/audit-logs', [AdminPortalController::class, 'auditLogs']);
            Route::get('/backup-sql', [AdminPortalController::class, 'backupSql']);
        });

        // Super Admin Role & Staff Management Scope
        Route::middleware('role:ADMIN_SUPER')->prefix('admin')->group(function () {
            Route::get('/users', [AdminGovernanceController::class, 'adminUsers']);
            Route::post('/users', [AdminGovernanceController::class, 'createAdminUser']);
            Route::patch('/users/{id}', [AdminGovernanceController::class, 'updateAdminUser']);
        });
    });
});
