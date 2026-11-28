<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicCorrection;
use App\Models\Application;
use App\Models\CalendarEvent;
use App\Models\Company;
use App\Models\Internship;
use App\Models\Interview;
use App\Models\JobRole;
use App\Models\MentoringRemark;
use App\Models\Notice;
use App\Models\ParentAlert;
use App\Models\StudentProfile;
use App\Services\AuditService;
use App\Services\EligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
            'parentContact' => array_merge([
                'name' => '',
                'relationship' => 'Father',
                'phone' => '',
                'email' => '',
                'preferredChannel' => 'WhatsApp',
                'isVerified' => false,
                'consentGiven' => false,
            ], $profile->parent_contact ?? []),
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
                'correctionPending' => $profile->corrections()->where('status', 'PENDING')->exists(),
                'placementStatus' => $profile->placement_status,
                'placedCompany' => $profile->placed_company,
                'packageLpa' => $profile->package_lpa,
            ],
            'skills' => array_merge([
                'technicalSkills' => [],
                'nonTechnicalSkills' => [],
                'programmingLanguages' => [],
                'toolsAndTechnologies' => [],
                'projects' => [],
                'certifications' => [],
                'achievements' => [],
            ], $profile->skills ?? []),
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

        return response()->json(EligibilityService::evaluate($profile, $role));
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
            'offer' => ['sometimes', ...StudentDocumentController::FILE_RULES],
            'joining' => ['sometimes', ...StudentDocumentController::FILE_RULES],
            'supporting' => ['sometimes', ...StudentDocumentController::FILE_RULES],
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
        $paths = [];
        try {
            return DB::transaction(function () use ($profile, $data, $request, &$paths) {
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

                $this->attachEvidence($internship, $profile, $request, $paths);
                AuditService::log('REGISTERED_INTERNSHIP', 'Internship', (string)$internship->id, "Registered {$data['track']} at {$data['companyName']}", null, $request);
                return response()->json($internship, 201);
            });
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($paths);
            throw $error;
        }
    }

    private function attachEvidence(Internship $internship, StudentProfile $profile, Request $request, array &$paths): void
    {
        $documents = $internship->documents ?? [];
        foreach (['offer' => 'Offer Letter', 'joining' => 'Joining Letter', 'supporting' => 'Other'] as $field => $category) {
            if (!$request->hasFile($field)) continue;
            $doc = StudentDocumentController::saveUpload($profile, $request->file($field), $category, $paths, $internship);
            $documents[] = [
                'id' => (string) $doc->id, 'name' => $doc->name, 'category' => $category,
                'fileUrl' => $doc->file_url, 'fileSize' => $doc->file_size, 'uploadDate' => now()->toDateString(),
                'verificationStatus' => $doc->verification_status,
            ];
        }
        $internship->update(['documents' => $documents]);
    }

    public function resubmit(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'workProfile' => 'required|string|max:10000',
            'supporting' => ['sometimes', ...StudentDocumentController::FILE_RULES],
        ]);
        $profile = $request->user()->studentProfile()->firstOrFail();
        $paths = [];
        try {
            return DB::transaction(function () use ($id, $profile, $data, $request, &$paths) {
                $internship = $profile->internships()->lockForUpdate()->findOrFail($id);
                $steps = $internship->steps ?? [];
                $index = array_search(2, array_column($steps, 'stepNumber'));
                abort_unless($internship->status === 'REJECTED' && $index !== false
                    && ($steps[$index]['reviewOutcome'] ?? null) === 'CHANGES_REQUESTED', 409, 'This submission is not awaiting changes.');
                unset($steps[$index]['reviewOutcome'], $steps[$index]['decisionDate'], $steps[$index]['remarks']);
                $steps[$index]['decision'] = 'PENDING';
                $internship->update(['steps' => $steps, 'work_profile' => $data['workProfile'], 'status' => 'PENDING_GUIDE_REVIEW']);
                $this->attachEvidence($internship, $profile, $request, $paths);
                AuditService::log('INTERNSHIP_RESUBMITTED', 'Internship', (string) $id, 'Returned to guide review', null, $request);
                return response()->json($internship->fresh());
            });
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($paths);
            throw $error;
        }
    }

    public function internshipOpportunities(): JsonResponse
    {
        $companies = Company::with(['roles' => fn ($q) => $q->whereIn('job_type', ['Internship', 'Internship + Full-time'])->where('status', 'open')])
            ->whereHas('roles', fn ($q) => $q->whereIn('job_type', ['Internship', 'Internship + Full-time'])->where('status', 'open'))
            ->orderBy('application_deadline')
            ->get();

        return response()->json($companies);
    }

    public function submitCompletion(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'certificate' => ['required', ...StudentDocumentController::FILE_RULES],
            'report' => ['required', ...StudentDocumentController::FILE_RULES],
        ]);

        $profile = $request->user()->studentProfile()->firstOrFail();
        $paths = [];
        try {
            return DB::transaction(function () use ($id, $profile, $request, &$paths) {
                $internship = $profile->internships()->lockForUpdate()->findOrFail($id);
                abort_unless(
                    in_array($internship->status, ['APPROVED', 'IN_PROGRESS'], true),
                    409,
                    'Completion evidence can only be submitted for approved or in-progress internships.'
                );

                $documents = $internship->documents ?? [];
                foreach (['certificate' => 'Completion Certificate', 'report' => 'Internship Report'] as $field => $category) {
                    $doc = StudentDocumentController::saveUpload($profile, $request->file($field), $category, $paths, $internship);
                    $documents[] = [
                        'id' => (string) $doc->id,
                        'name' => $doc->name,
                        'category' => $category,
                        'fileUrl' => $doc->file_url,
                        'fileSize' => $doc->file_size,
                        'uploadDate' => now()->toDateString(),
                        'verificationStatus' => $doc->verification_status,
                    ];
                }

                $internship->update([
                    'documents' => $documents,
                    'status' => 'COMPLETED',
                ]);

                AuditService::log(
                    'INTERNSHIP_COMPLETED',
                    'Internship',
                    (string)$internship->id,
                    'Submitted completion certificate & final report',
                    null,
                    $request
                );

                return response()->json($internship->fresh('facultyGuide:id,name,email'));
            });
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($paths);
            throw $error;
        }
    }

    public function mentoringRequests(Request $request): JsonResponse
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json(
            MentoringRemark::where('student_profile_id', $profile->id)
                ->where('is_confidential', false)
                ->latest()
                ->get()
        );
    }

    public function notices(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role;
        $scope = $role === 'STUDENT' ? ['all', 'student'] : ($role === 'GUIDE' ? ['all', 'guide'] : ['all', 'student', 'guide']);

        $query = Notice::whereIn('target_portal', $scope)
            ->where(fn ($q) => $q->whereNull('expiry_date')->orWhereDate('expiry_date', '>=', now()->toDateString()));

        if ($role === 'STUDENT') {
            $profile = StudentProfile::where('user_id', $user->id)->first();
            if ($profile) {
                $query->where(fn ($q) => $q->whereNull('target_student_profile_id')->orWhere('target_student_profile_id', $profile->id));
                $query->where(fn ($q) => $q->whereNull('target_guide_user_id')->orWhere('target_guide_user_id', $profile->assigned_guide_id));
                $query->where(fn ($q) => $q->whereNull('target_academic_year')->orWhere('target_academic_year', $profile->academic_year));
                $list = $query->latest()->get()->filter(function ($n) use ($profile) {
                    $branches = $n->target_branches ?? [];
                    return empty($branches) || in_array('ALL', $branches, true) || in_array($profile->branch, $branches, true);
                })->values();
                return response()->json($list);
            }
        }

        return response()->json($query->latest()->get());
    }

    public function markNoticeRead(Request $request, int $id): JsonResponse
    {
        $notice = Notice::findOrFail($id);
        $profile = StudentProfile::where('user_id', $request->user()->id)->first();
        $studentKey = $profile ? (string)$profile->id : (string)$request->user()->id;
        $readers = $notice->read_by_student_ids ?? [];
        if (!in_array($studentKey, $readers, true)) {
            $readers[] = $studentKey;
            $notice->update(['read_by_student_ids' => $readers]);
        }
        return response()->json($notice);
    }

    public function markAllNoticesRead(Request $request): JsonResponse
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->first();
        $studentKey = $profile ? (string)$profile->id : (string)$request->user()->id;
        Notice::whereIn('target_portal', ['all', 'student'])
            ->when($profile, function ($q) use ($profile) {
                $q->where(fn ($sub) => $sub->whereNull('target_student_profile_id')->orWhere('target_student_profile_id', $profile->id))
                    ->where(fn ($sub) => $sub->whereNull('target_guide_user_id')->orWhere('target_guide_user_id', $profile->assigned_guide_id));
            })
            ->get()
            ->each(function ($notice) use ($studentKey) {
                $readers = $notice->read_by_student_ids ?? [];
                if (!in_array($studentKey, $readers, true)) {
                    $readers[] = $studentKey;
                    $notice->update(['read_by_student_ids' => $readers]);
                }
            });
        return response()->json(['ok' => true]);
    }

    public function myCorrections(Request $request): JsonResponse
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($profile->corrections()->latest()->get());
    }

    public function updateSkills(Request $request): JsonResponse
    {
        $data = $request->validate(['skills' => ['required', 'array']]);
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $profile->update(['skills' => $data['skills']]);
        AuditService::log('UPDATED_SKILLS', 'StudentProfile', (string)$profile->id, 'Updated skills & projects', null, $request);
        return response()->json($profile->skills);
    }

    public function interviews(Request $request): JsonResponse
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $rows = Interview::with('company:id,name,logo_url')
            ->where('student_profile_id', $profile->id)
            ->orderBy('scheduled_date')
            ->get()
            ->map(fn ($i) => [
                'id' => (string)$i->id,
                'studentId' => (string)$i->student_profile_id,
                'companyId' => (string)$i->company_id,
                'companyName' => $i->company?->name ?? 'Company',
                'companyLogo' => $i->company?->logo_url ?? "https://ui-avatars.com/api/?name=" . urlencode($i->company?->name ?? 'C') . "&background=142B4A&color=fff",
                'roleTitle' => $i->role_title,
                'roundName' => $i->round_name,
                'scheduledDate' => $i->scheduled_date->format('Y-m-d'),
                'scheduledTime' => $i->scheduled_time,
                'venueOrLink' => $i->venue_or_link,
                'isOnline' => $i->is_online,
                'instructions' => $i->instructions ?? '',
                'status' => $i->status,
                'academicYear' => $i->academic_year,
            ]);
        return response()->json($rows);
    }

    public function calendarEvents(): JsonResponse
    {
        $rows = CalendarEvent::orderBy('date')->get()->map(fn ($e) => [
            'id' => (string)$e->id,
            'title' => $e->title,
            'date' => $e->date->format('Y-m-d'),
            'time' => $e->time,
            'type' => $e->type,
            'companyName' => $e->company_name,
            'venueOrLink' => $e->venue_or_link,
            'status' => $e->status,
            'actionUrl' => $e->action_url,
            'actionLabel' => $e->action_label,
            'academicYear' => $e->academic_year,
        ]);
        return response()->json($rows);
    }

    public function addCalendarEvent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'date' => ['required', 'date'],
            'time' => ['nullable', 'string', 'max:40'],
            'type' => ['nullable', 'string', 'max:50'],
            'companyName' => ['nullable', 'string', 'max:150'],
            'venueOrLink' => ['nullable', 'string', 'max:255'],
        ]);
        $ev = CalendarEvent::create([
            'title' => $data['title'],
            'date' => $data['date'],
            'time' => $data['time'] ?? null,
            'type' => $data['type'] ?? 'cdc_event',
            'company_name' => $data['companyName'] ?? null,
            'venue_or_link' => $data['venueOrLink'] ?? null,
            'created_by' => $request->user()->id,
        ]);
        return response()->json($ev, 201);
    }

    public function parentAlerts(Request $request): JsonResponse
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $rows = ParentAlert::where('student_profile_id', $profile->id)
            ->orderBy('scheduled_date')
            ->get()
            ->map(fn ($a) => [
                'id' => (string)$a->id,
                'studentId' => (string)$a->student_profile_id,
                'companyId' => (string)($a->company_id ?? ''),
                'companyName' => $a->company_name,
                'applicationDeadline' => $a->application_deadline->format('Y-m-d'),
                'alertType' => $a->alert_type,
                'recipientMaskedPhone' => $a->recipient_masked_phone,
                'channel' => $a->channel,
                'scheduledDate' => $a->scheduled_date->format('Y-m-d'),
                'sentDate' => $a->sent_date?->toIso8601String(),
                'deliveryStatus' => $a->delivery_status,
                'sampleMessage' => $a->sample_message,
                'academicYear' => $a->academic_year,
            ]);
        return response()->json($rows);
    }

    public function updateParentContact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'relationship' => ['sometimes', 'in:Father,Mother,Guardian'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'email' => ['nullable', 'email'],
            'preferredChannel' => ['sometimes', 'in:WhatsApp,SMS,Email'],
            'consentGiven' => ['sometimes', 'boolean'],
        ]);
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $current = $profile->parent_contact ?? [];
        $phoneChanged = isset($data['phone']) && $data['phone'] !== ($current['phone'] ?? '');
        $updated = array_merge($current, $data, $phoneChanged ? ['isVerified' => false] : []);
        $profile->update(['parent_contact' => $updated]);
        AuditService::log('UPDATED_PARENT_CONTACT', 'StudentProfile', (string)$profile->id, 'Updated guardian contact', null, $request);
        return response()->json($updated);
    }

    public function verifyParentOtp(Request $request): JsonResponse
    {
        $data = $request->validate(['otp' => ['required', 'string', 'size:6']]);
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $contact = array_merge($profile->parent_contact ?? [], [
            'isVerified' => true,
            'lastVerifiedAt' => now()->toIso8601String(),
        ]);
        $profile->update(['parent_contact' => $contact]);
        AuditService::log('VERIFIED_PARENT_OTP', 'StudentProfile', (string)$profile->id, 'Verified guardian phone via OTP', null, $request);
        return response()->json(['success' => true, 'message' => 'Parent contact successfully verified via OTP.', 'parentContact' => $contact]);
    }
}
