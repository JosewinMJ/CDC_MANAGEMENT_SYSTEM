<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicCorrection;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Company;
use App\Models\DataSyncLog;
use App\Models\FacultyProfile;
use App\Models\Internship;
use App\Models\JobRole;
use App\Models\Notice;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\AuditService;
use App\Services\SpreadsheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminPortalController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $totalStudents = StudentProfile::count();
        $placedStudents = StudentProfile::where('placement_status', 'placed')->count();
        $shortlisted = StudentProfile::where('placement_status', 'shortlisted')->count();
        $avgLpa = round((float)(StudentProfile::where('package_lpa', '>', 0)->avg('package_lpa') ?? 0), 2);
        $maxLpa = round((float)(StudentProfile::max('package_lpa') ?? 0), 2);

        $deptStats = StudentProfile::select('branch', DB::raw('COUNT(*) as total'), DB::raw("SUM(CASE WHEN placement_status='placed' THEN 1 ELSE 0 END) as placed"))
            ->groupBy('branch')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'kpis' => [
                'totalStudents' => $totalStudents,
                'placedStudents' => $placedStudents,
                'shortlistedStudents' => $shortlisted,
                'placementRate' => $totalStudents > 0 ? round(($placedStudents / $totalStudents) * 100, 1) : 0,
                'avgLpa' => $avgLpa,
                'maxLpa' => $maxLpa,
                'totalFaculty' => FacultyProfile::count(),
                'totalCompanies' => Company::count(),
                'totalApplications' => Application::count(),
                'pendingCorrections' => AcademicCorrection::where('status', 'PENDING')->count(),
                'pendingInternships' => Internship::whereIn('status', ['PENDING_GUIDE_REVIEW', 'PENDING_CDC_APPROVAL'])->count(),
            ],
            'departmentBreakdown' => $deptStats,
            'recentAudits' => AuditLog::latest()->limit(10)->get(),
            'recentSyncs' => DataSyncLog::latest()->limit(8)->get(),
        ]);
    }

    public function students(Request $request): JsonResponse
    {
        $q = trim((string)$request->query('q', ''));
        $students = StudentProfile::with(['user:id,name,email,phone,department,is_active', 'assignedGuide:id,name,email'])
            ->when($q !== '', function ($query) use ($q) {
                $query->where('reg_number', 'like', "%{$q}%")
                    ->orWhere('branch', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"));
            })
            ->orderBy('branch')
            ->orderBy('reg_number')
            ->get();

        return response()->json($students);
    }

    public function storeStudent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reg_number' => ['required', 'string', 'max:40', 'unique:student_profiles,reg_number'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'branch' => ['required', 'string', 'max:40'],
            'degree' => ['nullable', 'string', 'max:60'],
            'graduation_year' => ['integer'],
            'current_cgpa' => ['numeric', 'min:0', 'max:10'],
            'active_backlogs' => ['integer', 'min:0'],
            'placement_status' => ['in:unplaced,shortlisted,placed,opted_out'],
            'placed_company' => ['nullable', 'string', 'max:150'],
            'package_lpa' => ['nullable', 'numeric'],
            'assigned_guide_id' => ['nullable', 'exists:users,id'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $profile = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? 'Portal@1234'),
                'role' => 'STUDENT',
                'phone' => $data['phone'] ?? null,
                'department' => strtoupper($data['branch']),
                'must_change_password' => empty($data['password']),
            ]);
            return StudentProfile::create([
                'user_id' => $user->id,
                'reg_number' => $data['reg_number'],
                'branch' => strtoupper($data['branch']),
                'degree' => $data['degree'] ?? 'B.Tech',
                'graduation_year' => $data['graduation_year'] ?? 2027,
                'current_cgpa' => $data['current_cgpa'] ?? 0,
                'active_backlogs' => $data['active_backlogs'] ?? 0,
                'verification_status' => 'VERIFIED',
                'placement_status' => $data['placement_status'] ?? 'unplaced',
                'placed_company' => $data['placed_company'] ?? null,
                'package_lpa' => $data['package_lpa'] ?? null,
                'assigned_guide_id' => $data['assigned_guide_id'] ?? null,
            ]);
        });

        AuditService::log('ADMIN_CREATED_STUDENT', 'StudentProfile', (string)$profile->id, "Created {$profile->reg_number}", null, $request);
        return response()->json($profile->load(['user', 'assignedGuide']), 201);
    }

    public function updateStudent(Request $request, int $id): JsonResponse
    {
        $profile = StudentProfile::with('user')->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'branch' => ['sometimes', 'string', 'max:40'],
            'current_cgpa' => ['sometimes', 'numeric', 'min:0', 'max:10'],
            'active_backlogs' => ['sometimes', 'integer', 'min:0'],
            'verification_status' => ['sometimes', 'in:NOT_UPLOADED,PENDING_VERIFICATION,VERIFIED,REJECTED'],
            'placement_status' => ['sometimes', 'in:unplaced,shortlisted,placed,opted_out'],
            'placed_company' => ['nullable', 'string', 'max:150'],
            'package_lpa' => ['nullable', 'numeric'],
            'assigned_guide_id' => ['nullable', 'exists:users,id'],
        ]);

        if (isset($data['name']) || array_key_exists('phone', $data) || isset($data['branch'])) {
            $profile->user->update([
                'name' => $data['name'] ?? $profile->user->name,
                'phone' => array_key_exists('phone', $data) ? $data['phone'] : $profile->user->phone,
                'department' => isset($data['branch']) ? strtoupper($data['branch']) : $profile->user->department,
            ]);
        }

        $profile->update(collect($data)->except(['name', 'phone'])->toArray());
        if (($data['verification_status'] ?? '') === 'VERIFIED') {
            $profile->update(['verified_by' => $request->user()->name, 'verified_at' => now()]);
        }

        AuditService::log('ADMIN_UPDATED_STUDENT', 'StudentProfile', (string)$profile->id, "Updated {$profile->reg_number}", null, $request);
        return response()->json($profile->fresh(['user', 'assignedGuide']));
    }

    public function deleteStudent(Request $request, int $id): JsonResponse
    {
        $profile = StudentProfile::findOrFail($id);
        $reg = $profile->reg_number;
        $profile->delete();
        AuditService::log('ADMIN_SOFT_DELETED_STUDENT', 'StudentProfile', (string)$id, "Archived {$reg}", null, $request);
        return response()->json(['message' => "Student {$reg} archived."]);
    }

    public function faculty(): JsonResponse
    {
        return response()->json(FacultyProfile::with('user:id,name,email,phone,department,is_active')->orderBy('employee_id')->get());
    }

    public function storeFaculty(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'string', 'max:40', 'unique:faculty_profiles,employee_id'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'department' => ['required', 'string', 'max:80'],
            'designation' => ['nullable', 'string', 'max:100'],
            'coordinator_role' => ['in:tpo_head,dept_coordinator,placement_faculty,faculty_guide,trainer'],
            'assigned_batches' => ['nullable', 'string', 'max:120'],
            'can_manage_drives' => ['boolean'],
        ]);

        $fac = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('Portal@1234'),
                'role' => 'GUIDE',
                'phone' => $data['phone'] ?? null,
                'department' => strtoupper($data['department']),
                'must_change_password' => true,
            ]);
            return FacultyProfile::create([
                'user_id' => $user->id,
                'employee_id' => $data['employee_id'],
                'designation' => $data['designation'] ?? 'Assistant Professor',
                'coordinator_role' => $data['coordinator_role'] ?? 'faculty_guide',
                'assigned_batches' => $data['assigned_batches'] ?? '2027',
                'can_manage_drives' => $data['can_manage_drives'] ?? false,
            ]);
        });

        AuditService::log('ADMIN_CREATED_FACULTY', 'FacultyProfile', (string)$fac->id, "Added {$fac->employee_id}", null, $request);
        return response()->json($fac->load('user'), 201);
    }

    public function storeCompany(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'industry' => ['required', 'string', 'max:100'],
            'tier' => ['in:super_dream,dream,core,startup,mass'],
            'location' => ['nullable', 'string', 'max:120'],
            'hr_name' => ['nullable', 'string', 'max:120'],
            'hr_email' => ['nullable', 'email'],
            'application_deadline' => ['required', 'date'],
            'role_title' => ['required', 'string', 'max:140'],
            'package_lpa' => ['required', 'numeric', 'min:0'],
            'min_cgpa' => ['numeric', 'min:0', 'max:10'],
            'max_backlogs' => ['integer', 'min:0'],
            'allowed_branches' => ['array'],
        ]);

        $company = DB::transaction(function () use ($data) {
            $comp = Company::create([
                'slug_code' => 'comp-' . Str::slug($data['name']) . '-' . rand(100, 999),
                'name' => $data['name'],
                'industry' => $data['industry'],
                'tier' => $data['tier'] ?? 'core',
                'location' => $data['location'] ?? 'Bengaluru',
                'hr_name' => $data['hr_name'] ?? null,
                'hr_email' => $data['hr_email'] ?? null,
                'application_deadline' => $data['application_deadline'],
                'departments' => $data['allowed_branches'] ?? ['CSE', 'IT'],
            ]);

            JobRole::create([
                'company_id' => $comp->id,
                'role_code' => 'role-' . Str::slug($data['name']) . '-' . rand(100, 999),
                'role_title' => $data['role_title'],
                'package_ctc' => $data['package_lpa'] . ' LPA',
                'package_lpa' => $data['package_lpa'],
                'eligibility_criteria' => [
                    'minCgpa' => $data['min_cgpa'] ?? 7.0,
                    'minTenthMarks' => 60,
                    'minTwelfthMarks' => 60,
                    'maxActiveBacklogs' => $data['max_backlogs'] ?? 0,
                    'maxHistoricalBacklogs' => 2,
                    'allowedBranches' => $data['allowed_branches'] ?? ['CSE', 'IT'],
                    'allowedDegrees' => ['B.Tech'],
                    'allowedGraduationYears' => [2027],
                ],
            ]);

            return $comp;
        });

        AuditService::log('ADMIN_CREATED_COMPANY_DRIVE', 'Company', (string)$company->id, "Published {$company->name}", null, $request);
        return response()->json($company->load('roles'), 201);
    }

    public function applications(): JsonResponse
    {
        return response()->json(Application::with(['studentProfile.user:id,name,email', 'company:id,name', 'jobRole:id,role_title,package_ctc,package_lpa'])->latest()->get());
    }

    public function advanceApplicationStage(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:APPLIED,ASSESSMENT_SCHEDULED,SHORTLISTED,INTERVIEW_SCHEDULED,SELECTED,NOT_SELECTED,WAITLISTED'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $app = Application::with(['company', 'jobRole', 'studentProfile'])->findOrFail($id);
        $timeline = $app->timeline ?? [];
        $timeline[] = [
            'stage' => $data['status'],
            'date' => now()->toIso8601String(),
            'completed' => true,
            'remarks' => $data['remarks'] ?? null,
        ];
        $app->update(['status' => $data['status'], 'remarks' => $data['remarks'] ?? null, 'timeline' => $timeline]);

        if ($data['status'] === 'SELECTED') {
            $app->studentProfile->update([
                'placement_status' => 'placed',
                'placed_company' => $app->company->name,
                'package_lpa' => $app->jobRole->package_lpa,
            ]);
        } elseif ($data['status'] === 'SHORTLISTED' && $app->studentProfile->placement_status === 'unplaced') {
            $app->studentProfile->update(['placement_status' => 'shortlisted']);
        }

        AuditService::log('ADMIN_ADVANCED_APPLICATION', 'Application', (string)$app->id, "Moved to {$data['status']}", $data['remarks'] ?? null, $request);
        return response()->json($app->fresh(['studentProfile.user:id,name,email', 'company:id,name', 'jobRole:id,role_title,package_ctc']));
    }

    public function corrections(): JsonResponse
    {
        return response()->json(AcademicCorrection::with('studentProfile.user:id,name,email')->latest()->get());
    }

    public function reviewCorrection(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:APPROVED,REJECTED'],
            'remarks' => ['nullable', 'string', 'max:500'],
        ]);

        $ticket = AcademicCorrection::with('studentProfile')->findOrFail($id);
        $ticket->update([
            'status' => $data['status'],
            'reviewed_by' => $request->user()->name,
            'reviewed_at' => now(),
            'remarks' => $data['remarks'] ?? null,
        ]);

        if ($data['status'] === 'APPROVED' && in_array($ticket->field, ['currentCgpa', 'tenthPercentage', 'twelfthPercentage', 'activeBacklogs'], true)) {
            $col = match ($ticket->field) {
                'currentCgpa' => 'current_cgpa',
                'tenthPercentage' => 'tenth_percentage',
                'twelfthPercentage' => 'twelfth_percentage',
                'activeBacklogs' => 'active_backlogs',
            };
            $ticket->studentProfile->update([$col => (float)$ticket->requested_value]);
        }

        AuditService::log("CORRECTION_{$data['status']}", 'AcademicCorrection', (string)$ticket->id, "{$ticket->field} -> {$ticket->requested_value}", $data['remarks'] ?? null, $request);
        return response()->json($ticket->fresh('studentProfile.user:id,name,email'));
    }

    public function publishNotice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'content' => ['required', 'string'],
            'category' => ['string', 'max:40'],
            'priority' => ['in:Normal,High,Urgent'],
            'target_portal' => ['in:all,student,guide'],
        ]);

        $notice = Notice::create([
            'title' => $data['title'],
            'content' => $data['content'],
            'publisher_name' => $request->user()->name,
            'publisher_role' => 'CDC Administrator',
            'category' => $data['category'] ?? 'General',
            'priority' => $data['priority'] ?? 'Normal',
            'is_important' => ($data['priority'] ?? 'Normal') !== 'Normal',
            'target_portal' => $data['target_portal'] ?? 'all',
            'read_by_student_ids' => [],
        ]);

        AuditService::log('ADMIN_PUBLISHED_NOTICE', 'Notice', (string)$notice->id, $notice->title, null, $request);
        return response()->json($notice, 201);
    }

    public function importSheet(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xls'],
            'scope' => ['in:auto,students,faculty,companies'],
            'default_password' => ['nullable', 'string', 'min:6'],
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        if ($ext === 'txt') {
            $ext = 'csv';
        }
        $res = SpreadsheetService::importSheet(
            $request->input('scope', 'auto'),
            $file->getRealPath(),
            $ext,
            $request->input('default_password') ?: 'Portal@1234',
            $request->user()->email
        );

        AuditService::log('ADMIN_SHEET_IMPORT', $res['detected_scope'], null, "Inserted {$res['inserted']}, Updated {$res['updated']}", null, $request);
        return response()->json($res);
    }

    public function exportSheet(Request $request): Response
    {
        $scope = (string)$request->query('scope', 'students');
        $format = (string)$request->query('format', 'csv');
        $dataset = SpreadsheetService::getExportDataset($scope);

        if ($format === 'excel') {
            $content = SpreadsheetService::buildExcelXml($dataset['title'], $dataset['headers'], $dataset['rows']);
            $fname = $dataset['filename'] . '_' . date('Ymd_His') . '.xls';
            $mime = 'application/vnd.ms-excel; charset=UTF-8';
        } else {
            $content = SpreadsheetService::buildCsv($dataset['headers'], $dataset['rows']);
            $fname = $dataset['filename'] . '_' . date('Ymd_His') . '.csv';
            $mime = 'text/csv; charset=UTF-8';
        }

        DataSyncLog::create([
            'portal_scope' => $scope,
            'direction' => 'export',
            'format' => $format === 'excel' ? 'xls' : 'csv',
            'record_count' => count($dataset['rows']),
            'file_name' => $fname,
            'actor_email' => $request->user()->email,
            'status' => 'success',
        ]);
        AuditService::log('ADMIN_SHEET_EXPORT', $scope, null, "Exported {$fname}", null, $request);

        return response($content, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'attachment; filename="' . $fname . '"',
        ]);
    }

    public function auditLogs(): JsonResponse
    {
        return response()->json([
            'audits' => AuditLog::latest()->limit(60)->get(),
            'syncs' => DataSyncLog::latest()->limit(30)->get(),
        ]);
    }

    public function backupSql(Request $request): Response
    {
        $pdo = DB::connection()->getPdo();
        $tables = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(\PDO::FETCH_NUM);
        $sql = "-- CDC Industrial Laravel Database Backup\n-- Generated: " . now()->toDateTimeString() . "\n\nSET FOREIGN_KEY_CHECKS=0;\n\n";
        foreach ($tables as $t) {
            $tbl = str_replace('`', '', $t[0]);
            $create = $pdo->query("SHOW CREATE TABLE `{$tbl}`")->fetch(\PDO::FETCH_NUM);
            $sql .= "DROP TABLE IF EXISTS `{$tbl}`;\n" . $create[1] . ";\n\n";
            foreach ($pdo->query("SELECT * FROM `{$tbl}`")->fetchAll(\PDO::FETCH_ASSOC) as $r) {
                $cols = array_map(static fn ($c) => '`' . str_replace('`', '', $c) . '`', array_keys($r));
                $vals = array_map(static fn ($v) => $v === null ? 'NULL' : $pdo->quote((string)$v), array_values($r));
                $sql .= "INSERT INTO `{$tbl}` (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $vals) . ");\n";
            }
            $sql .= "\n";
        }
        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        $fname = 'cdc_industrial_backup_' . date('Ymd_His') . '.sql';
        AuditService::log('ADMIN_SQL_BACKUP', 'Database', 'cdc_industrial', "Downloaded {$fname}", null, $request);

        return response($sql, 200, [
            'Content-Type' => 'application/sql; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $fname . '"',
        ]);
    }
}
