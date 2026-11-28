<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Company;
use App\Models\ConsultancyRecord;
use App\Models\Internship;
use App\Models\Mou;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminGovernanceController extends Controller
{
    public function reports(Request $request): JsonResponse
    {
        $year = trim((string)$request->query('academic_year', ''));
        $stuQ = StudentProfile::query()->when($year !== '' && $year !== 'ALL', fn ($q) => $q->where('academic_year', $year));
        $appQ = Application::query()->when($year !== '' && $year !== 'ALL', fn ($q) => $q->where('academic_year', $year));
        $intQ = Internship::query()->when($year !== '' && $year !== 'ALL', fn ($q) => $q->where('academic_year', $year));
        $compQ = Company::query()->when($year !== '' && $year !== 'ALL', fn ($q) => $q->where('academic_year', $year));

        $totalStudents = (clone $stuQ)->count();
        $uniquePlaced = (clone $stuQ)->where('placement_status', 'placed')->count();
        $totalOffers = (clone $appQ)->where('status', 'SELECTED')->count();

        $companyStats = (clone $compQ)->withCount(['roles'])
            ->get()
            ->map(function ($comp) use ($year) {
                $apps = Application::where('company_id', $comp->id)
                    ->when($year !== '' && $year !== 'ALL', fn ($q) => $q->where('academic_year', $year));
                return [
                    'id' => $comp->id,
                    'name' => $comp->name,
                    'tier' => $comp->tier,
                    'deadline' => $comp->application_deadline?->format('Y-m-d'),
                    'rolesCount' => $comp->roles_count,
                    'applicants' => (clone $apps)->count(),
                    'shortlisted' => (clone $apps)->whereIn('status', ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED'])->count(),
                    'selected' => (clone $apps)->where('status', 'SELECTED')->count(),
                ];
            });

        $yearlyStats = StudentProfile::selectRaw("academic_year, COUNT(*) as total, SUM(CASE WHEN placement_status='placed' THEN 1 ELSE 0 END) as placed, ROUND(AVG(NULLIF(package_lpa, 0)), 2) as avg_lpa, MAX(package_lpa) as max_lpa")
            ->groupBy('academic_year')
            ->orderByDesc('academic_year')
            ->get();

        return response()->json([
            'placementSummary' => [
                'totalStudents' => $totalStudents,
                'uniquePlaced' => $uniquePlaced,
                'totalOffers' => $totalOffers,
                'placementRate' => $totalStudents > 0 ? round(($uniquePlaced / $totalStudents) * 100, 1) : 0,
                'highestLpa' => round((float)((clone $stuQ)->max('package_lpa') ?? 0), 2),
                'avgLpa' => round((float)((clone $stuQ)->where('package_lpa', '>', 0)->avg('package_lpa') ?? 0), 2),
            ],
            'internshipSummary' => [
                'total' => (clone $intQ)->count(),
                'approvedOrCompleted' => (clone $intQ)->whereIn('status', ['APPROVED', 'IN_PROGRESS', 'COMPLETED'])->count(),
                'completed' => (clone $intQ)->where('status', 'COMPLETED')->count(),
                'ppoConversions' => (clone $intQ)->where('ppo_converted', true)->count(),
            ],
            'companyStats' => $companyStats,
            'yearlyStats' => $yearlyStats,
        ]);
    }

    public function adminUsers(): JsonResponse
    {
        return response()->json(
            User::where('role', 'like', 'ADMIN%')
                ->select(['id', 'name', 'email', 'role', 'department', 'is_active', 'last_login_at'])
                ->orderBy('id')
                ->get()
        );
    }

    public function createAdminUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'in:ADMIN_SUPER,ADMIN_PLACEMENT,ADMIN_INTERNSHIP,ADMIN_STAFF'],
            'department' => ['nullable', 'string', 'max:120'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'department' => $data['department'] ?? 'Career Development Centre',
            'password' => Hash::make($data['password']),
            'is_active' => true,
        ]);

        AuditService::log('ADMIN_CREATED_STAFF', 'User', (string)$user->id, "Created {$user->role}: {$user->email}", null, $request);
        return response()->json($user, 201);
    }

    public function updateAdminUser(Request $request, int $id): JsonResponse
    {
        $user = User::where('role', 'like', 'ADMIN%')->findOrFail($id);
        $data = $request->validate([
            'role' => ['sometimes', 'in:ADMIN_SUPER,ADMIN_PLACEMENT,ADMIN_INTERNSHIP,ADMIN_STAFF'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $user->update($data);
        AuditService::log('ADMIN_UPDATED_STAFF_ROLE', 'User', (string)$user->id, "Updated permissions for {$user->email}", null, $request);
        return response()->json($user);
    }

    public function mous(): JsonResponse
    {
        return response()->json(Mou::orderByDesc('agreement_date')->get());
    }

    public function storeMou(Request $request): JsonResponse
    {
        $data = $request->validate([
            'organization_name' => ['required', 'string', 'max:180'],
            'agreement_date' => ['required', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'contact_person' => ['nullable', 'string', 'max:120'],
            'contact_email' => ['nullable', 'email'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
            'collaboration_type' => ['required', 'string', 'max:100'],
            'agreement_doc_name' => ['nullable', 'string', 'max:255'],
            'status' => ['in:Active,Pending Renewal,Expired,Terminated'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string'],
        ]);
        $mou = Mou::create($data);
        AuditService::log('CREATED_MOU_RECORD', 'Mou', (string)$mou->id, $mou->organization_name, null, $request);
        return response()->json($mou, 201);
    }

    public function updateMou(Request $request, int $id): JsonResponse
    {
        $mou = Mou::findOrFail($id);
        $data = $request->validate([
            'status' => ['sometimes', 'in:Active,Pending Renewal,Expired,Terminated'],
            'expiry_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);
        $mou->update($data);
        return response()->json($mou);
    }

    public function deleteMou(int $id): JsonResponse
    {
        Mou::findOrFail($id)->delete();
        return response()->json(['deleted' => true]);
    }

    public function consultancies(): JsonResponse
    {
        return response()->json(ConsultancyRecord::latest()->get());
    }

    public function storeConsultancy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'industry_partner' => ['required', 'string', 'max:180'],
            'project_title' => ['required', 'string', 'max:200'],
            'project_details' => ['nullable', 'string'],
            'faculty_coordinator' => ['required', 'string', 'max:120'],
            'duration' => ['nullable', 'string', 'max:80'],
            'supporting_doc_name' => ['nullable', 'string', 'max:255'],
            'status' => ['in:Proposed,Ongoing,Completed,On Hold'],
            'academic_year' => ['nullable', 'string', 'max:20'],
        ]);
        $rec = ConsultancyRecord::create($data);
        AuditService::log('CREATED_CONSULTANCY_RECORD', 'ConsultancyRecord', (string)$rec->id, $rec->project_title, null, $request);
        return response()->json($rec, 201);
    }

    public function updateConsultancy(Request $request, int $id): JsonResponse
    {
        $rec = ConsultancyRecord::findOrFail($id);
        $data = $request->validate(['status' => ['required', 'in:Proposed,Ongoing,Completed,On Hold']]);
        $rec->update($data);
        return response()->json($rec);
    }

    public function deleteConsultancy(int $id): JsonResponse
    {
        ConsultancyRecord::findOrFail($id)->delete();
        return response()->json(['deleted' => true]);
    }
}
