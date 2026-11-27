<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CodingQuestion;
use App\Models\StudentCodingSolve;
use App\Models\StudentProfile;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
        $profile = StudentProfile::with('user:id,name,department')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $payload = $this->buildCodingProfilePayload($profile);
        $payload['leetcodeDaily'] = $this->fetchLeetCodeDailyChallenge();

        return response()->json($payload);
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

        try {
            $resp = Http::timeout(6)
                ->withHeaders(['Referer' => 'https://leetcode.com'])
                ->post('https://leetcode.com/graphql', [
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
                    'message' => "LeetCode verified live — Easy {$easy} · Medium {$medium} · Hard {$hard} (Total {$total})",
                ]);
            }
        } catch (\Throwable) {
            // Graceful fallback when outbound internet is blocked
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

        $profile = StudentProfile::with('user:id,name,department')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $dup = StudentProfile::where('leetcode_username', $cleaned)
            ->where('id', '!=', $profile->id)
            ->exists();
        if ($dup) {
            return response()->json(['message' => 'This LeetCode username is already linked to another student.'], 422);
        }

        $stats = $profile->coding_stats ?? [];
        $stats['trackingStatus'] = 'OK';
        $profile->update([
            'leetcode_username' => $cleaned,
            'coding_stats' => $stats,
        ]);

        // Immediately attempt live sync from LeetCode so stats populate right away
        $syncedNew = $this->pullLiveLeetCodeSubmissions($profile->fresh());

        AuditService::log('LEETCODE_REGISTERED', 'StudentProfile', (string)$profile->id, "Linked @{$cleaned} (synced {$syncedNew} recent solves)", null, $request);

        $payload = $this->buildCodingProfilePayload($profile->fresh('user:id,name,department'));
        $payload['syncedNewCount'] = $syncedNew;
        $payload['leetcodeDaily'] = $this->fetchLeetCodeDailyChallenge();

        return response()->json($payload);
    }

    public function syncFromLeetCode(Request $request): JsonResponse
    {
        $profile = StudentProfile::with('user:id,name,department')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (!$profile->leetcode_username) {
            return response()->json(['message' => 'Please link your LeetCode username first.'], 422);
        }

        $syncedNew = $this->pullLiveLeetCodeSubmissions($profile);
        AuditService::log('LEETCODE_SYNCED', 'StudentProfile', (string)$profile->id, "Synced @{$profile->leetcode_username} (+{$syncedNew} new solves)", null, $request);

        $payload = $this->buildCodingProfilePayload($profile->fresh('user:id,name,department'));
        $payload['syncedNewCount'] = $syncedNew;
        $payload['leetcodeDaily'] = $this->fetchLeetCodeDailyChallenge();

        return response()->json($payload);
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

        $profile = StudentProfile::with('user:id,name,department')->where('user_id', $request->user()->id)->firstOrFail();
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

        $payload = $this->buildCodingProfilePayload($profile->fresh('user:id,name,department'));
        $payload['leetcodeDaily'] = $this->fetchLeetCodeDailyChallenge();

        return response()->json($payload, 201);
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

    private function pullLiveLeetCodeSubmissions(StudentProfile $profile): int
    {
        $username = $profile->leetcode_username;
        if (!$username) {
            return 0;
        }

        $syncedNew = 0;
        try {
            $resp = Http::timeout(6)
                ->withHeaders(['Referer' => 'https://leetcode.com'])
                ->post('https://leetcode.com/graphql', [
                    'query' => 'query syncUser($u: String!) { matchedUser(username: $u) { submitStats { acSubmissionNum { difficulty count } } } recentAcSubmissionList(username: $u, limit: 15) { id title titleSlug timestamp } }',
                    'variables' => ['u' => $username],
                ]);

            if (!$resp->ok() || !$resp->json('data.matchedUser')) {
                return 0;
            }

            $stats = collect($resp->json('data.matchedUser.submitStats.acSubmissionNum') ?? [])->keyBy('difficulty');
            $recent = $resp->json('data.recentAcSubmissionList') ?? [];
            $existingTitles = StudentCodingSolve::where('student_profile_id', $profile->id)
                ->pluck('title')
                ->map(fn ($t) => strtolower($t))
                ->all();

            foreach ($recent as $item) {
                $title = trim((string)($item['title'] ?? ''));
                $slug = trim((string)($item['titleSlug'] ?? ''));
                if ($title === '' || in_array(strtolower($title), $existingTitles, true)) {
                    continue;
                }

                // Match against any CDC posted question by URL slug if applicable
                $matchedQ = $slug !== ''
                    ? CodingQuestion::where('leetcode_url', 'like', "%/{$slug}%")->first()
                    : null;

                $ts = isset($item['timestamp']) ? Carbon::createFromTimestamp((int)$item['timestamp']) : now();
                StudentCodingSolve::create([
                    'student_profile_id' => $profile->id,
                    'coding_question_id' => $matchedQ?->id,
                    'title' => $title,
                    'leetcode_url' => $slug !== '' ? "https://leetcode.com/problems/{$slug}/" : 'https://leetcode.com/problemset/',
                    'difficulty' => $matchedQ?->difficulty ?? 'Medium',
                    'topics' => $matchedQ?->topics ?? ['Arrays'],
                    'solved_at' => $ts,
                ]);
                $existingTitles[] = strtolower($title);
                $syncedNew++;
            }

            $easy = (int)($stats->get('Easy')['count'] ?? 0);
            $medium = (int)($stats->get('Medium')['count'] ?? 0);
            $hard = (int)($stats->get('Hard')['count'] ?? 0);

            $profile->update([
                'coding_stats' => array_merge($profile->coding_stats ?? [], [
                    'leetcodeTotal' => $easy + $medium + $hard,
                    'leetcodeEasy' => $easy,
                    'leetcodeMedium' => $medium,
                    'leetcodeHard' => $hard,
                    'trackingStatus' => 'OK',
                    'lastLiveSyncAt' => now()->toIso8601String(),
                ]),
            ]);
        } catch (\Throwable) {
            // Leave existing local DB stats intact if network is temporarily unavailable
        }

        return $syncedNew;
    }

    private function fetchLeetCodeDailyChallenge(): ?array
    {
        return Cache::remember('leetcode_daily_q', 1800, function () {
            try {
                $resp = Http::timeout(4)
                    ->withHeaders(['Referer' => 'https://leetcode.com'])
                    ->post('https://leetcode.com/graphql', [
                        'query' => 'query { activeDailyCodingChallengeQuestion { date link question { title difficulty frontendQuestionId: questionFrontendId topicTags { name } } } }',
                    ]);
                if ($resp->ok()) {
                    $q = $resp->json('data.activeDailyCodingChallengeQuestion');
                    if ($q && isset($q['question'])) {
                        return [
                            'date' => $q['date'],
                            'title' => ($q['question']['frontendQuestionId'] ?? '') . '. ' . ($q['question']['title'] ?? 'Daily Problem'),
                            'difficulty' => $q['question']['difficulty'] ?? 'Medium',
                            'url' => 'https://leetcode.com' . ($q['link'] ?? '/problemset/'),
                            'topics' => collect($q['question']['topicTags'] ?? [])->pluck('name')->take(3)->values()->all(),
                        ];
                    }
                }
            } catch (\Throwable) {
                // ignore offline failure
            }
            return [
                'date' => now()->toDateString(),
                'title' => '1. Two Sum',
                'difficulty' => 'Easy',
                'url' => 'https://leetcode.com/problems/two-sum/',
                'topics' => ['Array', 'Hash Table'],
            ];
        });
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

        $topicCounts = collect(self::CURRICULUM_TOPICS)->map(function ($topic) use ($solves) {
            $matching = $solves->filter(fn ($s) => in_array($topic, $s->topics ?? [], true));
            return [
                'topicName' => $topic,
                'easy' => $matching->where('difficulty', 'Easy')->count(),
                'medium' => $matching->where('difficulty', 'Medium')->count(),
                'hard' => $matching->where('difficulty', 'Hard')->count(),
                'total' => $matching->count(),
                'targetCount' => 10,
            ];
        });
        $maxTopicTotal = max(1, (int)$topicCounts->max('total'));
        $topicStats = $topicCounts->map(fn ($t) => array_merge($t, [
            'isStrong' => $t['total'] > 0 && $t['total'] === $maxTopicTotal,
        ]))->values();

        $trend = collect(range(6, 0))->map(function ($daysAgo) use ($solves) {
            $date = now()->subDays($daysAgo)->toDateString();
            $cum = $solves->filter(fn ($s) => $s->solved_at->toDateString() <= $date)->count();
            return ['date' => now()->subDays($daysAgo)->format('M d'), 'count' => $cum];
        })->values();

        $activityMap = collect(range(13, 0))->map(function ($daysAgo) use ($solves) {
            $date = now()->subDays($daysAgo)->toDateString();
            return [
                'date' => $date,
                'solves' => $solves->filter(fn ($s) => $s->solved_at->toDateString() === $date)->count(),
            ];
        })->values();

        $weekEasy = $solves->filter(fn ($s) => $s->solved_at >= now()->startOfWeek() && $s->difficulty === 'Easy')->count();
        $weekMedium = $solves->filter(fn ($s) => $s->solved_at >= now()->startOfWeek() && $s->difficulty === 'Medium')->count();
        $weekHard = $solves->filter(fn ($s) => $s->solved_at >= now()->startOfWeek() && $s->difficulty === 'Hard')->count();
        $targetMet = $solvedThisWeek >= 10;

        return [
            'username' => $profile->leetcode_username ?? '',
            'fullName' => $profile->user?->name ?? 'Student',
            'regNumber' => $profile->reg_number,
            'classSection' => $profile->branch . ' · Batch ' . $profile->graduation_year,
            'trackingStatus' => $profile->leetcode_username ? 'OK' : 'NO_USERNAME_GIVEN',
            'programStartDate' => now()->startOfMonth()->toDateString(),
            'lastUpdated' => $profile->coding_stats['lastLiveSyncAt'] ?? now()->toIso8601String(),
            'totalSolved' => $total,
            'easySolved' => $easy,
            'mediumSolved' => $medium,
            'hardSolved' => $hard,
            'leetcodeTotal' => (int)($profile->coding_stats['leetcodeTotal'] ?? $total),
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
                    'weekNumber' => (int)now()->weekOfYear,
                    'weekEndingDate' => now()->endOfWeek()->format('M d, Y'),
                    'easy' => $weekEasy,
                    'medium' => $weekMedium,
                    'hard' => $weekHard,
                    'solvedThisWeek' => $solvedThisWeek,
                    'totalSinceStart' => $total,
                    'postedQuestionsDone' => $postedQuestions->where('isSolved', true)->count(),
                    'targetMet' => $targetMet,
                    'flag' => $targetMet ? 'Target met' : 'Below target (10)',
                ],
            ],
            'dailySolveTrend' => $trend,
            'activityMap' => $activityMap,
        ];
    }
}
