<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use App\Models\Notice;
use App\Models\StudentDocument;
use App\Models\StudentProfile;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuidePortalController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $mentees = StudentProfile::with('user:id,name,email,phone,department')
            ->when(!$user->isAdmin(), fn ($q) => $q->where('assigned_guide_id', $user->id))
            ->get();

        $pendingInternships = Internship::with('studentProfile.user:id,name,email')
            ->when(!$user->isAdmin(), fn ($q) => $q->where('faculty_guide_id', $user->id))
            ->where('status', 'PENDING_GUIDE_REVIEW')
            ->get();

        $pendingDocs = StudentDocument::with('studentProfile.user:id,name')
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

    public function internships(Request $request): JsonResponse
    {
        $user = $request->user();
        $list = Internship::with(['studentProfile.user:id,name,email', 'facultyGuide:id,name'])
            ->when(!$user->isAdmin(), fn ($q) => $q->where('faculty_guide_id', $user->id))
            ->latest()
            ->get();

        return response()->json($list);
    }

    public function reviewInternship(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'in:GUIDE,ADMIN_INTERNSHIP,ADMIN_SUPER'],
            'decision' => ['required', 'in:APPROVED,REJECTED'],
            'remarks' => ['nullable', 'string', 'max:500'],
        ]);

        $internship = Internship::findOrFail($id);
        $user = $request->user();

        if ($data['role'] === 'GUIDE' && !$user->isAdmin() && (int)$internship->faculty_guide_id !== (int)$user->id) {
            return response()->json(['message' => 'Forbidden: Only the assigned faculty guide or Admin can review.'], 403);
        }
        if (str_starts_with($data['role'], 'ADMIN') && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden: Coordinator/Final approval requires CDC Admin role.'], 403);
        }

        $steps = $internship->steps ?? [];
        $targetStep = $data['role'] === 'GUIDE' ? 2 : 3;
        foreach ($steps as &$step) {
            if ((int)$step['stepNumber'] === $targetStep) {
                $step['decision'] = $data['decision'];
                $step['decisionDate'] = now()->toIso8601String();
                $step['remarks'] = $data['remarks'] ?? null;
                $step['responsibleUserName'] = $user->name;
            }
            if ($data['role'] !== 'GUIDE' && (int)$step['stepNumber'] === 4 && $data['decision'] === 'APPROVED') {
                $step['decision'] = 'APPROVED';
                $step['decisionDate'] = now()->toIso8601String();
                $step['responsibleUserName'] = $user->name;
            }
        }

        $newStatus = $data['decision'] === 'REJECTED'
            ? 'REJECTED'
            : ($data['role'] === 'GUIDE' ? 'PENDING_CDC_APPROVAL' : 'APPROVED');

        $internship->update(['steps' => $steps, 'status' => $newStatus]);
        AuditService::log("INTERNSHIP_{$data['decision']}", 'Internship', (string)$internship->id, "{$data['role']} marked {$newStatus}", $data['remarks'] ?? null, $request);

        return response()->json($internship->fresh(['studentProfile.user:id,name,email', 'facultyGuide:id,name']));
    }

    public function verifyDocument(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:VERIFIED,REJECTED'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $doc = StudentDocument::findOrFail($id);
        $doc->update([
            'verification_status' => $data['status'],
            'verified_by' => $request->user()->name,
            'verified_date' => now(),
            'rejection_reason' => $data['status'] === 'REJECTED' ? ($data['remarks'] ?? 'Invalid document') : null,
        ]);

        AuditService::log("DOCUMENT_{$data['status']}", 'StudentDocument', (string)$doc->id, $doc->name, $data['remarks'] ?? null, $request);
        return response()->json($doc);
    }

    public function publishNotice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'content' => ['required', 'string'],
            'priority' => ['in:Normal,High,Urgent'],
        ]);

        $notice = Notice::create([
            'title' => $data['title'],
            'content' => $data['content'],
            'publisher_name' => $request->user()->name,
            'publisher_role' => 'Faculty Guide',
            'category' => 'Guide Instructions',
            'priority' => $data['priority'] ?? 'Normal',
            'is_important' => ($data['priority'] ?? 'Normal') !== 'Normal',
            'target_portal' => 'student',
            'read_by_student_ids' => [],
        ]);

        AuditService::log('GUIDE_PUBLISHED_NOTICE', 'Notice', (string)$notice->id, $notice->title, null, $request);
        return response()->json($notice, 201);
    }
}
