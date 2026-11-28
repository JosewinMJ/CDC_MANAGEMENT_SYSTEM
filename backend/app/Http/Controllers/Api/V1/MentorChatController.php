<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MentorMessage;
use App\Models\StudentProfile;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MentorChatController extends Controller
{
    public function studentMessages(Request $request): JsonResponse
    {
        $profile = StudentProfile::with('assignedGuide:id,name,email,phone,department')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (!$profile->assigned_guide_id) {
            return response()->json([
                'guide' => null,
                'messages' => [],
            ]);
        }

        MentorMessage::where('student_profile_id', $profile->id)
            ->where('guide_user_id', $profile->assigned_guide_id)
            ->where('sender_role', 'GUIDE')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = MentorMessage::where('student_profile_id', $profile->id)
            ->where('guide_user_id', $profile->assigned_guide_id)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        return response()->json([
            'guide' => $profile->assignedGuide,
            'messages' => $messages,
        ]);
    }

    public function studentSend(Request $request): JsonResponse
    {
        $data = $request->validate(['message' => ['required', 'string', 'max:2000']]);
        $user = $request->user();
        $profile = StudentProfile::where('user_id', $user->id)->firstOrFail();

        abort_if(!$profile->assigned_guide_id, 422, 'No faculty guide is currently assigned to your profile.');

        $msg = MentorMessage::create([
            'student_profile_id' => $profile->id,
            'guide_user_id' => $profile->assigned_guide_id,
            'sender_user_id' => $user->id,
            'sender_role' => 'STUDENT',
            'sender_name' => $user->name,
            'message' => trim($data['message']),
        ]);

        AuditService::log('SENT_MENTOR_CHAT', 'MentorMessage', (string)$msg->id, "Student messaged guide #{$profile->assigned_guide_id}", null, $request);
        return response()->json($msg, 201);
    }

    public function guideThreads(Request $request): JsonResponse
    {
        $user = $request->user();
        $mentees = StudentProfile::with('user:id,name,email,avatar_url')
            ->when(!$user->isAdmin(), fn ($q) => $q->where('assigned_guide_id', $user->id))
            ->orderBy('reg_number')
            ->get()
            ->map(function ($m) use ($user) {
                $guideId = $m->assigned_guide_id ?: $user->id;
                $last = MentorMessage::where('student_profile_id', $m->id)
                    ->where('guide_user_id', $guideId)
                    ->latest('id')
                    ->first();
                $unread = MentorMessage::where('student_profile_id', $m->id)
                    ->where('guide_user_id', $guideId)
                    ->where('sender_role', 'STUDENT')
                    ->whereNull('read_at')
                    ->count();

                return [
                    'studentProfileId' => $m->id,
                    'regNumber' => $m->reg_number,
                    'name' => $m->user?->name ?? 'Student',
                    'email' => $m->user?->email ?? '',
                    'branch' => $m->branch,
                    'unreadCount' => $unread,
                    'lastMessage' => $last?->message,
                    'lastSenderRole' => $last?->sender_role,
                    'lastMessageAt' => $last?->created_at?->toIso8601String(),
                ];
            });

        return response()->json($mentees);
    }

    public function guideMessages(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $profile = StudentProfile::with('user:id,name,email')
            ->when(!$user->isAdmin(), fn ($q) => $q->where('assigned_guide_id', $user->id))
            ->findOrFail($id);

        $guideId = $profile->assigned_guide_id ?: $user->id;

        MentorMessage::where('student_profile_id', $profile->id)
            ->where('guide_user_id', $guideId)
            ->where('sender_role', 'STUDENT')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = MentorMessage::where('student_profile_id', $profile->id)
            ->where('guide_user_id', $guideId)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        return response()->json([
            'student' => $profile,
            'messages' => $messages,
        ]);
    }

    public function guideSend(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['message' => ['required', 'string', 'max:2000']]);
        $user = $request->user();
        $profile = StudentProfile::query()
            ->when(!$user->isAdmin(), fn ($q) => $q->where('assigned_guide_id', $user->id))
            ->findOrFail($id);

        $guideId = $profile->assigned_guide_id ?: $user->id;

        $msg = MentorMessage::create([
            'student_profile_id' => $profile->id,
            'guide_user_id' => $guideId,
            'sender_user_id' => $user->id,
            'sender_role' => 'GUIDE',
            'sender_name' => $user->name,
            'message' => trim($data['message']),
        ]);

        AuditService::log('SENT_STUDENT_CHAT', 'MentorMessage', (string)$msg->id, "Guide messaged student {$profile->reg_number}", null, $request);
        return response()->json($msg, 201);
    }
}
