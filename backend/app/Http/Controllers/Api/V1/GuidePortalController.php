<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use App\Models\JobRole;
use App\Models\MentoringRemark;
use App\Models\Notice;
use App\Models\StudentDocument;
use App\Models\StudentProfile;
use App\Services\AuditService;
use App\Services\EligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuidePortalController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $mentees = StudentProfile::query()
            ->select([
                'id', 'user_id', 'assigned_guide_id', 'reg_number', 'degree', 'programme', 'branch',
                'semester', 'graduation_year', 'current_cgpa', 'tenth_percentage', 'twelfth_percentage',
                'active_backlogs', 'historical_backlogs', 'placement_status', 'verification_status', 'academic_year',
            ])
            ->with([
                'user:id,name,email,phone,department',
                'assignedGuide:id,name',
                'documents:id,student_profile_id,name,category,verification_status',
            ])
            ->when(!$user->isAdmin(), fn ($q) => $q->where('assigned_guide_id', $user->id))
            ->get();

        $pendingInternships = Internship::with('studentProfile:id,user_id,reg_number', 'studentProfile.user:id,name,email')
            ->when(!$user->isAdmin(), fn ($q) => $q->where('faculty_guide_id', $user->id))
            ->where('status', 'PENDING_GUIDE_REVIEW')
            ->get();

        $pendingDocs = StudentDocument::with('studentProfile:id,reg_number,user_id', 'studentProfile.user:id,name')
            ->when(!$user->isAdmin(), fn ($q) => $q->assignedToGuide($user->id))
            ->where('verification_status', 'PENDING_VERIFICATION')
            ->get();

        return response()->json([
            'menteeCount' => $mentees->count(),
            'pendingInternshipReviews' => $pendingInternships->count(),
            'pendingDocumentReviews' => $pendingDocs->count(),
            'mentees' => $mentees,
            'internships' => $pendingInternships,
            'documents' => $pendingDocs,
        ]);
    }

    public function studentDetail(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $profile = StudentProfile::with([
            'user:id,name,email,phone,department,avatar_url',
            'assignedGuide:id,name,email',
            'documents',
            'applications.company:id,name',
            'applications.jobRole:id,role_title,package_ctc',
            'internships.facultyGuide:id,name',
            'corrections',
            'mentoringRemarks' => fn ($q) => $q->latest(),
        ])
            ->when(!$user->isAdmin(), fn ($q) => $q->where('assigned_guide_id', $user->id))
            ->findOrFail($id);

        $eligibility = JobRole::with('company:id,name,application_deadline')
            ->get()
            ->map(function ($role) use ($profile) {
                $eval = EligibilityService::evaluate($profile, $role);
                return [
                    'roleId' => $role->id,
                    'companyName' => $role->company?->name ?? 'Company',
                    'roleTitle' => $role->role_title,
                    'packageCtc' => $role->package_ctc,
                    'overallStatus' => $eval['overallStatus'],
                    'summaryReason' => $eval['summaryReason'],
                ];
            })
            ->values();

        return response()->json([
            'student' => $profile,
            'eligibility' => $eligibility,
        ]);
    }

    public function storeRemark(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'remark' => ['required', 'string', 'max:2000'],
            'category' => ['in:mentoring,profile_update_request,progress'],
            'is_confidential' => ['boolean'],
        ]);

        $user = $request->user();
        $profile = StudentProfile::query()
            ->when(!$user->isAdmin(), fn ($q) => $q->where('assigned_guide_id', $user->id))
            ->findOrFail($id);

        $entry = MentoringRemark::create([
            'student_profile_id' => $profile->id,
            'author_user_id' => $user->id,
            'author_name' => $user->name,
            'author_role' => $user->role,
            'category' => $data['category'] ?? 'mentoring',
            'remark' => $data['remark'],
            'is_confidential' => $data['is_confidential'] ?? true,
        ]);

        AuditService::log(
            'ADDED_MENTORING_REMARK',
            'StudentProfile',
            (string)$profile->id,
            ($entry->is_confidential ? 'Confidential note' : 'Student update request') . " for {$profile->reg_number}",
            null,
            $request
        );

        return response()->json($entry, 201);
    }

    public function internships(Request $request): JsonResponse
    {
        $user = $request->user();
        $list = Internship::with(['studentProfile:id,user_id,reg_number', 'studentProfile.user:id,name,email', 'facultyGuide:id,name'])
            ->when(!$user->isAdmin(), fn ($q) => $q->where('faculty_guide_id', $user->id))
            ->latest()
            ->get();

        return response()->json($list);
    }

    public function reviewInternship(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'in:GUIDE,ADMIN_INTERNSHIP,ADMIN_SUPER'],
            'decision' => ['required', 'in:APPROVED,REJECTED,CHANGES_REQUESTED'],
            'remarks' => ['nullable', 'required_if:decision,CHANGES_REQUESTED', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $guideReview = $data['role'] === 'GUIDE';
        abort_if(!$guideReview && !$user->isAdmin(), 403, 'Coordinator approval requires the CDC Admin role.');
        abort_if(!$guideReview && $data['decision'] === 'CHANGES_REQUESTED', 422, 'Only a guide review can request changes.');

        return DB::transaction(function () use ($id, $request, $data, $user, $guideReview): JsonResponse {
            $internship = Internship::query()->lockForUpdate()->findOrFail($id);
            abort_if($guideReview && !$user->isAdmin() && (int) $internship->faculty_guide_id !== (int) $user->id, 403,
                'Only the assigned faculty guide or an administrator can review this submission.');
            abort_if($guideReview && $internship->status !== 'PENDING_GUIDE_REVIEW', 409,
                'This submission is no longer awaiting guide review. Refresh the queue to see its current status.');

            abort_if(!$guideReview && !in_array($internship->status, ['GUIDE_APPROVED', 'PENDING_CDC_APPROVAL'], true),
                409, 'Coordinator review requires guide approval and a pending final decision.');
            $outcome = $data['decision'];
            $approved = $outcome === 'APPROVED';
            $steps = $internship->steps ?? [];
            $targetStep = $guideReview ? 2 : 3;
            $index = array_search($targetStep, array_map(fn ($step) => (int) $step['stepNumber'], $steps), true);
            if ($index === false) {
                $index = count($steps);
                $steps[] = [
                    'stepNumber' => $targetStep,
                    'stepName' => $guideReview ? 'Faculty Guide Review' : 'CDC Coordinator Verification',
                    'assignedRole' => $data['role'],
                ];
            }
            $steps[$index]['decision'] = $approved ? 'APPROVED' : 'REJECTED';
            $steps[$index]['decisionDate'] = now()->toIso8601String();
            $steps[$index]['remarks'] = $data['remarks'] ?? null;
            $steps[$index]['responsibleUserName'] = $user->name;
            if ($outcome === 'CHANGES_REQUESTED') {
                // Preserve the existing internship status and step contract used by the other portals.
                $steps[$index]['reviewOutcome'] = $outcome;
            }

            if (!$guideReview && $approved) {
                foreach ($steps as $stepIndex => $step) {
                    if ((int) $step['stepNumber'] === 4) {
                        $steps[$stepIndex]['decision'] = 'APPROVED';
                        $steps[$stepIndex]['decisionDate'] = now()->toIso8601String();
                        $steps[$stepIndex]['responsibleUserName'] = $user->name;
                    }
                }
            }

            $status = !$approved ? 'REJECTED' : ($guideReview ? 'PENDING_CDC_APPROVAL' : 'APPROVED');
            $internship->update(['steps' => $steps, 'status' => $status]);
            AuditService::log("INTERNSHIP_{$outcome}", 'Internship', (string) $internship->id,
                "{$data['role']} marked {$status}", $data['remarks'] ?? null, $request);

            return response()->json($internship->fresh(['studentProfile:id,user_id,reg_number', 'studentProfile.user:id,name,email', 'facultyGuide:id,name']));
        });
    }

    public function verifyDocument(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:VERIFIED,REJECTED'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($id, $data, $request, $user): JsonResponse {
            $doc = StudentDocument::query()
                ->when(!$user->isAdmin(), fn ($q) => $q->assignedToGuide($user->id))
                ->lockForUpdate()
                ->findOrFail($id);
            abort_if(!$user->isAdmin() && $doc->verification_status !== 'PENDING_VERIFICATION', 409,
                'This document has already been reviewed. Refresh the queue to see its current status.');

            $doc->update([
                'verification_status' => $data['status'],
                'verified_by' => $user->name,
                'verified_date' => now(),
                'rejection_reason' => $data['status'] === 'REJECTED' ? ($data['remarks'] ?? 'Invalid document') : null,
            ]);
            if ($doc->internship_id) {
                $internship = Internship::lockForUpdate()->findOrFail($doc->internship_id);
                $documents = $internship->documents ?? [];
                foreach ($documents as $index => $attachment) {
                    if ((string) ($attachment['id'] ?? '') === (string) $doc->id) {
                        $documents[$index]['verificationStatus'] = $doc->verification_status;
                        $documents[$index]['rejectionReason'] = $doc->rejection_reason;
                    }
                }
                $internship->update(['documents' => $documents]);
            }
            AuditService::log("DOCUMENT_{$data['status']}", 'StudentDocument', (string) $doc->id, $doc->name,
                $data['remarks'] ?? null, $request);

            return response()->json($doc);
        });
    }

    public function publishNotice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'content' => ['required', 'string'],
            'priority' => ['in:Normal,High,Urgent'],
            'target_student_profile_id' => ['nullable', 'integer'],
        ]);

        $user = $request->user();
        $targetStudentId = $data['target_student_profile_id'] ?? null;
        if (!empty($targetStudentId) && !$user->isAdmin()) {
            StudentProfile::where('id', $targetStudentId)
                ->where('assigned_guide_id', $user->id)
                ->firstOrFail();
        }

        $notice = Notice::create([
            'title' => $data['title'],
            'content' => $data['content'],
            'publisher_name' => $user->name,
            'publisher_role' => 'Faculty Guide',
            'category' => 'Guide Instructions',
            'priority' => $data['priority'] ?? 'Normal',
            'is_important' => ($data['priority'] ?? 'Normal') !== 'Normal',
            'target_portal' => 'student',
            'target_student_profile_id' => $targetStudentId,
            'target_guide_user_id' => (!$targetStudentId && !$user->isAdmin()) ? $user->id : null,
            'read_by_student_ids' => [],
        ]);

        AuditService::log('GUIDE_PUBLISHED_NOTICE', 'Notice', (string)$notice->id, $notice->title, null, $request);
        return response()->json($notice, 201);
    }

    public function myNotices(Request $request): JsonResponse
    {
        $user = $request->user();
        $assignedCount = StudentProfile::where('assigned_guide_id', $user->id)->count();
        $list = Notice::where('publisher_name', $user->name)
            ->latest()
            ->get()
            ->map(function ($n) use ($assignedCount) {
                $n->read_count = count($n->read_by_student_ids ?? []);
                $n->target_count = $n->target_student_profile_id ? 1 : $assignedCount;
                return $n;
            });
        return response()->json($list);
    }
}
