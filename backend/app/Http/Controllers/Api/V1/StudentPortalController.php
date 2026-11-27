<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicCorrection;
use App\Models\Application;
use App\Models\Company;
use App\Models\Internship;
use App\Models\JobRole;
use App\Models\Notice;
use App\Models\StudentProfile;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = StudentProfile::with(['user', 'assignedGuide', 'documents'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        return response()->json([
            'id' => (string)$profile->id,
            'regNumber' => $profile->reg_number,
            'fullName' => $profile->user->name,
            'email' => $profile->user->email,
            'phone' => $profile->user->phone ?? '',
            'dob' => $profile->dob?->format('Y-m-d') ?? '',
            'gender' => $profile->gender ?? '',
            'address' => $profile->address ?? '',
            'avatarUrl' => $profile->user->avatar_url ?? '',
            'academicYear' => $profile->academic_year,
            'assignedGuideId' => $profile->assigned_guide_id ? (string)$profile->assigned_guide_id : '',
            'assignedGuideName' => $profile->assignedGuide?->name ?? 'Unassigned',
            'assignedGuideEmail' => $profile->assignedGuide?->email ?? '',
            'parentContact' => $profile->parent_contact ?? [],
            'leetcodeUsername' => $profile->leetcode_username,
            'codingStats' => $profile->coding_stats ?? [],
            'academicRecord' => [
                'degree' => $profile->degree,
                'programme' => $profile->programme,
                'department' => $profile->user->department ?? $profile->branch,
                'branch' => $profile->branch,
                'academicYear' => $profile->academic_year,
                'graduationYear' => (int)$profile->graduation_year,
                'tenthPercentage' => (float)$profile->tenth_percentage,
                'twelfthPercentage' => (float)$profile->twelfth_percentage,
                'currentCgpa' => (float)$profile->current_cgpa,
                'activeBacklogs' => (int)$profile->active_backlogs,
                'historicalBacklogs' => (int)$profile->historical_backlogs,
                'semesterResults' => $profile->semester_results ?? [],
                'verificationStatus' => $profile->verification_status,
                'verifiedBy' => $profile->verified_by,
                'verifiedAt' => $profile->verified_at?->toIso8601String(),
                'placementStatus' => $profile->placement_status,
                'placedCompany' => $profile->placed_company,
                'packageLpa' => $profile->package_lpa,
            ],
            'skills' => $profile->skills ?? [
                'technicalSkills' => [],
                'nonTechnicalSkills' => [],
                'programmingLanguages' => [],
                'toolsAndTechnologies' => [],
                'projects' => [],
                'certifications' => [],
                'achievements' => [],
            ],
            'documents' => $profile->documents,
        ]);
    }

    public function updatePersonal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        if (array_key_exists('phone', $data)) {
            $user->update(['phone' => $data['phone']]);
        }
        $profile = StudentProfile::where('user_id', $user->id)->firstOrFail();
        if (array_key_exists('address', $data)) {
            $profile->update(['address' => $data['address']]);
        }

        AuditService::log('UPDATED_PERSONAL_PROFILE', 'StudentProfile', (string)$profile->id, 'Student updated contact info', null, $request);
        return $this->me($request);
    }

    public function requestCorrection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'field' => ['required', 'string', 'max:80'],
            'currentValue' => ['required', 'string', 'max:255'],
            'requestedValue' => ['required', 'string', 'max:255'],
            'reason' => ['required', 'string', 'max:1000'],
            'supportingDocName' => ['nullable', 'string', 'max:255'],
        ]);

        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $ticket = AcademicCorrection::create([
            'student_profile_id' => $profile->id,
            'field' => $data['field'],
            'current_value' => $data['currentValue'],
            'requested_value' => $data['requestedValue'],
            'reason' => $data['reason'],
            'supporting_doc_name' => $data['supportingDocName'] ?? null,
            'status' => 'PENDING',
        ]);

        AuditService::log('SUBMITTED_ACADEMIC_CORRECTION', 'AcademicCorrection', (string)$ticket->id, "Requested {$data['field']} change to {$data['requestedValue']}", null, $request);
        return response()->json($ticket, 201);
    }

    public function companies(): JsonResponse
    {
        $companies = Company::with('roles')->orderBy('application_deadline')->get();
        return response()->json($companies);
    }

    public function companyDetail(int $id): JsonResponse
    {
        return response()->json(Company::with('roles')->findOrFail($id));
    }

    public function evaluateEligibility(Request $request): JsonResponse
    {
        $data = $request->validate(['roleId' => ['required']]);
        $role = JobRole::where('id', $data['roleId'])->orWhere('role_code', $data['roleId'])->firstOrFail();
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();

        $c = $role->eligibility_criteria;
        $codingSolved = (int)($profile->coding_stats['totalSolved'] ?? 0);

        $checks = [
            'cgpa' => ['studentValue' => $profile->current_cgpa, 'requiredValue' => ($c['minCgpa'] ?? 0) . ' minimum', 'passed' => $profile->current_cgpa >= ($c['minCgpa'] ?? 0)],
            'tenthMarks' => ['studentValue' => $profile->tenth_percentage . '%', 'requiredValue' => ($c['minTenthMarks'] ?? 0) . '% minimum', 'passed' => $profile->tenth_percentage >= ($c['minTenthMarks'] ?? 0)],
            'twelfthMarks' => ['studentValue' => $profile->twelfth_percentage . '%', 'requiredValue' => ($c['minTwelfthMarks'] ?? 0) . '% minimum', 'passed' => $profile->twelfth_percentage >= ($c['minTwelfthMarks'] ?? 0)],
            'activeBacklogs' => ['studentValue' => $profile->active_backlogs, 'requiredValue' => ($c['maxActiveBacklogs'] ?? 0) . ' max', 'passed' => $profile->active_backlogs <= ($c['maxActiveBacklogs'] ?? 0)],
            'branch' => ['studentValue' => $profile->branch, 'requiredValue' => implode(', ', $c['allowedBranches'] ?? ['ALL']), 'passed' => empty($c['allowedBranches']) || in_array($profile->branch, $c['allowedBranches'], true)],
            'codingPractice' => ['studentValue' => "{$codingSolved} solved", 'requiredValue' => ($c['minCodingProblemsSolved'] ?? 0) . ' minimum', 'passed' => $codingSolved >= ($c['minCodingProblemsSolved'] ?? 0)],
            'academicVerification' => ['studentValue' => $profile->verification_status, 'requiredValue' => 'VERIFIED', 'passed' => $profile->verification_status === 'VERIFIED'],
        ];

        $allPassed = collect($checks)->every(fn ($x) => $x['passed']);
        $overall = $profile->verification_status !== 'VERIFIED' ? 'PENDING_VERIFICATION' : ($allPassed ? 'ELIGIBLE' : 'NOT_ELIGIBLE');

        return response()->json(['overallStatus' => $overall, 'criteriaBreakdown' => $checks]);
    }

    public function myApplications(Request $request): JsonResponse
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $apps = Application::with(['company', 'jobRole'])
            ->where('student_profile_id', $profile->id)
            ->latest()
            ->get();

        return response()->json($apps);
    }

    public function apply(Request $request): JsonResponse
    {
        $data = $request->validate([
            'companyId' => ['required', 'integer'],
            'roleId' => ['required', 'integer'],
        ]);

        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $app = Application::firstOrCreate(
            ['student_profile_id' => $profile->id, 'job_role_id' => $data['roleId']],
            [
                'company_id' => $data['companyId'],
                'status' => 'APPLIED',
                'next_stage' => 'Application Document Verification by CDC',
                'academic_year' => $profile->academic_year,
                'timeline' => [
                    ['stage' => 'APPLIED', 'date' => now()->toIso8601String(), 'completed' => true, 'remarks' => 'Submitted via Student Portal'],
                ],
            ]
        );

        AuditService::log('SUBMITTED_APPLICATION', 'Application', (string)$app->id, "Applied for role #{$data['roleId']}", null, $request);
        return response()->json($app->load(['company', 'jobRole']), 201);
    }

    public function myInternships(Request $request): JsonResponse
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json(
            Internship::with('facultyGuide:id,name,email')->where('student_profile_id', $profile->id)->latest()->get()
        );
    }

    public function registerInternship(Request $request): JsonResponse
    {
        $data = $request->validate([
            'track' => ['required', 'in:TRACK_1_SUMMER,TRACK_2_HYBRID,TRACK_3_SEMESTER'],
            'semester' => ['nullable', 'string', 'max:40'],
            'companyName' => ['required', 'string', 'max:160'],
            'companyContactNumber' => ['nullable', 'string', 'max:40'],
            'companyAddress' => ['nullable', 'string', 'max:255'],
            'jobRole' => ['required', 'string', 'max:120'],
            'isStipend' => ['boolean'],
            'stipendAmount' => ['nullable', 'integer'],
            'mode' => ['in:Online,Offline,Hybrid'],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date'],
            'durationWeeks' => ['required', 'integer', 'min:1'],
            'workProfile' => ['nullable', 'string'],
        ]);

        $profile = StudentProfile::with(['user', 'assignedGuide'])->where('user_id', $request->user()->id)->firstOrFail();
        $internship = Internship::create([
            'student_profile_id' => $profile->id,
            'track' => $data['track'],
            'semester' => $data['semester'] ?? null,
            'company_name' => $data['companyName'],
            'company_contact_number' => $data['companyContactNumber'] ?? null,
            'company_address' => $data['companyAddress'] ?? null,
            'job_role' => $data['jobRole'],
            'is_stipend' => $data['isStipend'] ?? false,
            'stipend_amount' => $data['stipendAmount'] ?? null,
            'mode' => $data['mode'] ?? 'Hybrid',
            'start_date' => $data['startDate'],
            'end_date' => $data['endDate'],
            'duration_weeks' => $data['durationWeeks'],
            'work_profile' => $data['workProfile'] ?? '',
            'faculty_guide_id' => $profile->assigned_guide_id,
            'status' => 'PENDING_GUIDE_REVIEW',
            'academic_year' => $profile->academic_year,
            'steps' => [
                ['stepNumber' => 1, 'stepName' => 'Student Submission', 'assignedRole' => 'STUDENT', 'decision' => 'SUBMITTED', 'responsibleUserName' => $profile->user->name, 'decisionDate' => now()->toIso8601String()],
                ['stepNumber' => 2, 'stepName' => 'Faculty Guide Review', 'assignedRole' => 'GUIDE', 'decision' => 'PENDING', 'responsibleUserName' => $profile->assignedGuide?->name ?? 'Faculty Guide'],
                ['stepNumber' => 3, 'stepName' => 'CDC Coordinator Verification', 'assignedRole' => 'ADMIN_INTERNSHIP', 'decision' => 'PENDING', 'responsibleUserName' => 'CDC Internship Coordinator'],
                ['stepNumber' => 4, 'stepName' => 'Final Approval', 'assignedRole' => 'ADMIN_SUPER', 'decision' => 'PENDING', 'responsibleUserName' => 'CDC Administration'],
            ],
        ]);

        AuditService::log('REGISTERED_INTERNSHIP', 'Internship', (string)$internship->id, "Registered {$data['track']} at {$data['companyName']}", null, $request);
        return response()->json($internship, 201);
    }

    public function notices(Request $request): JsonResponse
    {
        $role = $request->user()->role;
        $scope = $role === 'STUDENT' ? ['all', 'student'] : ($role === 'GUIDE' ? ['all', 'guide'] : ['all', 'student', 'guide']);
        return response()->json(Notice::whereIn('target_portal', $scope)->latest()->get());
    }
}
