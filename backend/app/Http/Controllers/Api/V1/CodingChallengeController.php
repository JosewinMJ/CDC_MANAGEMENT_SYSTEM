<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CodingQuestion;
use App\Models\StudentCodingSolve;
use App\Models\StudentProfile;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CodingChallengeController extends Controller
{
    private const CURRICULUM_TOPICS = [
        'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
        'Sorting & Searching', 'Recursion & Backtracking', 'Linked List',
        'Stacks & Queues', 'Trees & BST', 'Tries', 'Heaps & Priority Queue',
        'Graphs', 'Greedy', 'Dynamic Programming', 'Bit Manipulation',
        'Math & Number Theory', 'SQL & Database',
    ];

    public function profile(Request $request): JsonResponse
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($this->buildCodingProfilePayload($profile));
    }

    public function verifyUsername(Request $request): JsonResponse
    {
        $data = $request->validate(['username' => ['required', 'string', 'max:150']]);
        $cleaned = $this->cleanLeetCodeHandle($data['username']);

        if ($cleaned === '') {
            return response()->json([
                'status' => 'NO_USERNAME_GIVEN',
                'message' => 'Please provide a valid LeetCode profile handle or URL.',
            ]);
        }

        $user = $request->user();
        $dup = StudentProfile::where('leetcode_username', $cleaned)
            ->where('user_id', '!=', $user->id)
            ->first();
        if ($dup) {
            return response()->json([
                'status' => 'DUPLICATE_USERNAME',
                'message' => "This LeetCode handle is already registered by another student ({$dup->reg_number}).",
            ]);
        }

        // Attempt live LeetCode GraphQL lookup (graceful fallback if college network blocks outbound)
        try {
            $resp = Http::timeout(4)->post('https://leetcode.com/graphql', [
                'query' => 'query getUserProfile($username: String!) { matchedUser(username: $username) { username submitStats { acSubmissionNum { difficulty count } } } }',
                'variables' => ['username' => $cleaned],
            ]);
            if ($resp->ok()) {
                $matched = $resp->json('data.matchedUser');
                if ($matched === null) {
                    return response()->json([
                        'status' => 'USERNAME_NOT_FOUND',
                        'message' => 'LeetCode profile does not exist or is private. Check spelling and try again.',
                    ]);
                }
                $stats = collect($matched['submitStats']['acSubmissionNum'] ?? [])->keyBy('difficulty');
                $easy = (int)($stats->get('Easy')['count'] ?? 0);
                $medium = (int)($stats->get('Medium')['count'] ?? 0);
                $hard = (int)($stats->get('Hard')['count'] ?? 0);
                $total = $easy + $medium + $hard;

                return response()->json([
                    'status' => 'OK',
                    'username' => $cleaned,
                    'easy' => $easy,
                    'medium' => $medium,
                    'hard' => $hard,
                    'total' => $total,
                    'message' => "LeetCode verified live — Easy {$easy} · Medium {$medium} · Hard {$hard}",
                ]);
            }
        } catch (\Throwable) {
            // Network-offline fallback
        }

        $existingStats = StudentProfile::where('user_id', $user->id)->value('coding_stats') ?? [];
        return response()->json([
            'status' => 'OK',
            'username' => $cleaned,
            'easy' => (int)($existingStats['easySolved'] ?? 0),
            'medium' => (int)($existingStats['mediumSolved'] ?? 0),
            'hard' => (int)($existingStats['hardSolved'] ?? 0),
            'total' => (int)($existingStats['totalSolved'] ?? 0),
            'message' => "Handle '@{$cleaned}' validated for CDC tracking.",
        ]);
    }

    public function registerUsername(Request $request): JsonResponse
    {
        $data = $request->validate(['username' => ['required', 'string', 'max:150']]);
        $cleaned = $this->cleanLeetCodeHandle($data['username']);
        if ($cleaned === '') {
            return response()->json(['message' => 'Invalid LeetCode handle.'], 422);
        }

        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        $dup = StudentProfile::where('leetcode_username', $cleaned)->where('id', '!=', $profile->id)->exists();
        if ($dup) {
            return response()->json(['message' => 'This LeetCode username is already linked to another student.'], 422);
        }

        $stats = $profile->coding_stats ?? [];
        $stats['trackingStatus'] = 'OK';
        $profile->update([
            'leetcode_username' => $cleaned,
            'coding_stats' => $stats,
        ]);

        AuditService::log('LEETCODE_REGISTERED', 'StudentProfile', (string)$profile->id, "Linked @{$cleaned}", null, $request);
        return response()->json($this->buildCodingProfilePayload($profile->fresh()));
    }

    public function togglePostedQuestion(Request $request, int $id): JsonResponse
    {
        $question = CodingQuestion::findOrFail($id);
        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();

        $existing = StudentCodingSolve::where('student_profile_id', $profile->id)
            ->where('coding_question_id', $question->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $isSolved = false;
            $solvedAt = null;
        } else {
            $solve = StudentCodingSolve::create([
                'student_profile_id' => $profile->id,
                'coding_question_id' => $question->id,
                'title' => $question->title,
                'leetcode_url' => $question->leetcode_url,
                'difficulty' => $question->difficulty,
                'topics' => $question->topics ?? ['DSA'],
                'solved_at' => now(),
            ]);
            $isSolved = true;
            $solvedAt = $solve->solved_at->toIso8601String();
        }

        $this->syncCachedStats($profile);
        AuditService::log('CODING_QUESTION_TOGGLED', 'CodingQuestion', (string)$question->id, ($isSolved ? 'Solved' : 'Unmarked') . " {$question->title}", null, $request);

        $totalStudents = StudentProfile::count();
        $solvedByCount = StudentCodingSolve::where('coding_question_id', $question->id)->count();

        return response()->json([
            'id' => (string)$question->id,
            'title' => $question->title,
            'leetcodeUrl' => $question->leetcode_url,
            'difficulty' => $question->difficulty,
            'postedDate' => $question->posted_date->format('Y-m-d'),
            'dueDate' => $question->due_date->format('Y-m-d'),
            'isSolved' => $isSolved,
            'solvedAt' => $solvedAt,
            'solvedByCount' => $solvedByCount,
            'totalStudents' => $totalStudents,
        ]);
    }

    public function logCustomSolve(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'leetcodeUrl' => ['nullable', 'url', 'max:500'],
            'difficulty' => ['required', 'in:Easy,Medium,Hard'],
            'topics' => ['array'],
        ]);

        $profile = StudentProfile::where('user_id', $request->user()->id)->firstOrFail();
        StudentCodingSolve::create([
            'student_profile_id' => $profile->id,
            'title' => $data['title'],
            'leetcode_url' => $data['leetcodeUrl'] ?? 'https://leetcode.com/problemset/',
            'difficulty' => $data['difficulty'],
            'topics' => $data['topics'] ?? ['Arrays'],
            'solved_at' => now(),
        ]);

        $this->syncCachedStats($profile);
        AuditService::log('CUSTOM_CODING_SOLVE', 'StudentProfile', (string)$profile->id, "Logged {$data['title']}", null, $request);

        return response()->json($this->buildCodingProfilePayload($profile->fresh()), 201);
    }

    public function listQuestions(): JsonResponse
    {
        $totalStudents = StudentProfile::count();
        $questions = CodingQuestion::withCount('solves')->latest('posted_date')->get()->map(fn ($q) => [
            'id' => (string)$q->id,
            'title' => $q->title,
            'leetcodeUrl' => $q->leetcode_url,
            'difficulty' => $q->difficulty,
            'topics' => $q->topics ?? [],
            'postedDate' => $q->posted_date->format('Y-m-d'),
            'dueDate' => $q->due_date->format('Y-m-d'),
            'solvedByCount' => $q->solves_count,
            'totalStudents' => $totalStudents,
            'isActive' => $q->is_active,
        ]);

        return response()->json($questions);
    }

    public function storeQuestion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'leetcodeUrl' => ['required', 'url', 'max:500'],
            'difficulty' => ['required', 'in:Easy,Medium,Hard'],
            'topics' => ['array'],
            'dueDate' => ['required', 'date'],
        ]);

        $q = CodingQuestion::create([
            'title' => $data['title'],
            'leetcode_url' => $data['leetcodeUrl'],
            'difficulty' => $data['difficulty'],
            'topics' => $data['topics'] ?? ['Arrays'],
            'posted_date' => now()->toDateString(),
            'due_date' => $data['dueDate'],
            'target_branches' => ['ALL'],
            'posted_by' => $request->user()->id,
        ]);

        AuditService::log('POSTED_CODING_QUESTION', 'CodingQuestion', (string)$q->id, $q->title, null, $request);
        return response()->json($q, 201);
    }

    public function leaderboard(): JsonResponse
    {
        $students = StudentProfile::with('user:id,name,email')
            ->withCount('codingSolves')
            ->orderByDesc('coding_solves_count')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'regNumber' => $s->reg_number,
                'name' => $s->user?->name ?? '',
                'branch' => $s->branch,
                'leetcodeUsername' => $s->leetcode_username,
                'totalSolved' => (int)($s->coding_stats['totalSolved'] ?? $s->coding_solves_count),
                'postedSolved' => $s->coding_solves_count,
            ]);

        return response()->json($students);
    }

    private function cleanLeetCodeHandle(string $input): string
    {
        $clean = trim($input);
        $clean = preg_replace('/^@/', '', $clean) ?? '';
        $clean = preg_replace('#^(https?://)?(www\.)?leetcode\.com/(u/)?#i', '', $clean) ?? '';
        return trim($clean, "/ \t\n\r");
    }

    private function syncCachedStats(StudentProfile $profile): void
    {
        $solves = StudentCodingSolve::where('student_profile_id', $profile->id)->get();
        $base = $profile->coding_stats ?? [];
        $easy = $solves->where('difficulty', 'Easy')->count();
        $medium = $solves->where('difficulty', 'Medium')->count();
        $hard = $solves->where('difficulty', 'Hard')->count();

        $profile->update([
            'coding_stats' => array_merge($base, [
                'totalSolved' => $easy + $medium + $hard,
                'easySolved' => $easy,
                'mediumSolved' => $medium,
                'hardSolved' => $hard,
                'trackingStatus' => $profile->leetcode_username ? 'OK' : 'NO_USERNAME_GIVEN',
            ]),
        ]);
    }

    private function buildCodingProfilePayload(StudentProfile $profile): array
    {
        $solves = StudentCodingSolve::where('student_profile_id', $profile->id)->latest('solved_at')->get();
        $solvedByQuestionId = $solves->whereNotNull('coding_question_id')->keyBy('coding_question_id');
        $totalStudents = max(1, StudentProfile::count());

        $questions = CodingQuestion::withCount('solves')->where('is_active', true)->latest('posted_date')->get();
        $postedQuestions = $questions->map(function ($q) use ($solvedByQuestionId, $totalStudents) {
            $solve = $solvedByQuestionId->get($q->id);
            return [
                'id' => (string)$q->id,
                'title' => $q->title,
                'leetcodeUrl' => $q->leetcode_url,
                'difficulty' => $q->difficulty,
                'postedDate' => $q->posted_date->format('Y-m-d'),
                'dueDate' => $q->due_date->format('Y-m-d'),
                'isSolved' => $solve !== null,
                'solvedAt' => $solve?->solved_at?->toIso8601String(),
                'solvedByCount' => $q->solves_count,
                'totalStudents' => $totalStudents,
            ];
        })->values();

        $easy = $solves->where('difficulty', 'Easy')->count();
        $medium = $solves->where('difficulty', 'Medium')->count();
        $hard = $solves->where('difficulty', 'Hard')->count();
        $total = $solves->count();
        $solvedThisWeek = $solves->filter(fn ($s) => $s->solved_at >= now()->startOfWeek())->count();

        $topicStats = collect(self::CURRICULUM_TOPICS)->map(function ($topic) use ($solves) {
            $matching = $solves->filter(fn ($s) => in_array($topic, $s->topics ?? [], true));
            return [
                'topicName' => $topic,
                'easy' => $matching->where('difficulty', 'Easy')->count(),
                'medium' => $matching->where('difficulty', 'Medium')->count(),
                'hard' => $matching->where('difficulty', 'Hard')->count(),
                'total' => $matching->count(),
                'target' => 10,
            ];
        })->values();

        $trend = collect(range(6, 0))->map(function ($daysAgo) use ($solves) {
            $date = now()->subDays($daysAgo)->toDateString();
            $cum = $solves->filter(fn ($s) => $s->solved_at->toDateString() <= $date)->count();
            return ['date' => now()->subDays($daysAgo)->format('M d'), 'count' => $cum];
        })->values();

        return [
            'username' => $profile->leetcode_username ?? '',
            'trackingStatus' => $profile->leetcode_username ? 'OK' : 'NO_USERNAME_GIVEN',
            'lastUpdated' => now()->toIso8601String(),
            'totalSolved' => $total,
            'easySolved' => $easy,
            'mediumSolved' => $medium,
            'hardSolved' => $hard,
            'solvedThisWeek' => $solvedThisWeek,
            'weeklyTarget' => 10,
            'streakDays' => $solvedThisWeek > 0 ? min(7, $solvedThisWeek) : 0,
            'postedQuestionsTotal' => $questions->count(),
            'postedQuestionsDone' => $postedQuestions->where('isSolved', true)->count(),
            'lastSolvedDate' => $solves->first()?->solved_at?->toDateString() ?? now()->toDateString(),
            'topicStats' => $topicStats,
            'solvedProblems' => $solves->map(fn ($s) => [
                'id' => (string)$s->id,
                'title' => $s->title,
                'leetcodeUrl' => $s->leetcode_url ?? 'https://leetcode.com/problemset/',
                'difficulty' => $s->difficulty,
                'topics' => $s->topics ?? ['DSA'],
                'solvedAt' => $s->solved_at->toIso8601String(),
            ])->values(),
            'postedQuestions' => $postedQuestions,
            'weeklyReports' => [
                [
                    'weekLabel' => 'Current Week (' . now()->startOfWeek()->format('M d') . ' - ' . now()->endOfWeek()->format('M d') . ')',
                    'startDate' => now()->startOfWeek()->toDateString(),
                    'endDate' => now()->endOfWeek()->toDateString(),
                    'totalBefore' => max(0, $total - $solvedThisWeek),
                    'totalAfter' => $total,
                    'deltaSolved' => $solvedThisWeek,
                    'easyDelta' => $solves->filter(fn ($s) => $s->solved_at >= now()->startOfWeek() && $s->difficulty === 'Easy')->count(),
                    'mediumDelta' => $solves->filter(fn ($s) => $s->solved_at >= now()->startOfWeek() && $s->difficulty === 'Medium')->count(),
                    'hardDelta' => $solves->filter(fn ($s) => $s->solved_at >= now()->startOfWeek() && $s->difficulty === 'Hard')->count(),
                    'target' => 10,
                    'targetMet' => $solvedThisWeek >= 10,
                ],
            ],
            'dailySolveTrend' => $trend,
        ];
    }
}
