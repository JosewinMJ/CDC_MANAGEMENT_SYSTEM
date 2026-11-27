<?php

use App\Http\Controllers\Api\V1\AdminPortalController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CodingChallengeController;
use App\Http\Controllers\Api\V1\GuidePortalController;
use App\Http\Controllers\Api\V1\StudentPortalController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public Authentication
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Authenticated Cross-Portal Routes (Sanctum Token Required)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

        // Shared Read Feeds
        Route::get('/companies', [StudentPortalController::class, 'companies']);
        Route::get('/companies/{id}', [StudentPortalController::class, 'companyDetail']);
        Route::get('/notices', [StudentPortalController::class, 'notices']);

        // Student Portal Scope
        Route::middleware('role:STUDENT,ADMIN')->group(function () {
            Route::get('/students/me', [StudentPortalController::class, 'me']);
            Route::patch('/students/me/personal', [StudentPortalController::class, 'updatePersonal']);
            Route::post('/students/me/academic-correction', [StudentPortalController::class, 'requestCorrection']);
            Route::post('/eligibility/evaluate', [StudentPortalController::class, 'evaluateEligibility']);
            Route::get('/applications/my-applications', [StudentPortalController::class, 'myApplications']);
            Route::post('/applications', [StudentPortalController::class, 'apply']);
            Route::get('/internships/my-internships', [StudentPortalController::class, 'myInternships']);
            Route::post('/internships/register', [StudentPortalController::class, 'registerInternship']);
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
            Route::get('/guide/internships', [GuidePortalController::class, 'internships']);
            Route::post('/internships/{id}/review', [GuidePortalController::class, 'reviewInternship']);
            Route::patch('/documents/{id}/verification', [GuidePortalController::class, 'verifyDocument']);
            Route::post('/guide/notices', [GuidePortalController::class, 'publishNotice']);
            Route::get('/coding-challenge/questions', [CodingChallengeController::class, 'listQuestions']);
            Route::post('/coding-challenge/questions', [CodingChallengeController::class, 'storeQuestion']);
            Route::get('/coding-challenge/leaderboard', [CodingChallengeController::class, 'leaderboard']);
        });

        // Admin-Only Master Governance Scope (Strict RBAC)
        Route::middleware('role:ADMIN')->prefix('admin')->group(function () {
            Route::get('/dashboard', [AdminPortalController::class, 'dashboard']);
            Route::get('/students', [AdminPortalController::class, 'students']);
            Route::post('/students', [AdminPortalController::class, 'storeStudent']);
            Route::patch('/students/{id}', [AdminPortalController::class, 'updateStudent']);
            Route::delete('/students/{id}', [AdminPortalController::class, 'deleteStudent']);
            Route::get('/faculty', [AdminPortalController::class, 'faculty']);
            Route::post('/faculty', [AdminPortalController::class, 'storeFaculty']);
            Route::post('/companies', [AdminPortalController::class, 'storeCompany']);
            Route::get('/applications', [AdminPortalController::class, 'applications']);
            Route::patch('/applications/{id}/stage', [AdminPortalController::class, 'advanceApplicationStage']);
            Route::get('/corrections', [AdminPortalController::class, 'corrections']);
            Route::patch('/corrections/{id}', [AdminPortalController::class, 'reviewCorrection']);
            Route::post('/notices', [AdminPortalController::class, 'publishNotice']);
            Route::post('/data-exchange/import', [AdminPortalController::class, 'importSheet']);
            Route::get('/data-exchange/export', [AdminPortalController::class, 'exportSheet']);
            Route::get('/audit-logs', [AdminPortalController::class, 'auditLogs']);
            Route::get('/backup-sql', [AdminPortalController::class, 'backupSql']);
        });
    });
});
