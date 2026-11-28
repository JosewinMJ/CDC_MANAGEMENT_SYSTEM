<?php

namespace App\Services;

use App\Models\JobRole;
use App\Models\StudentProfile;

class EligibilityService
{
    /**
     * Evaluate a student profile against a job role's eligibility criteria.
     */
    public static function evaluate(StudentProfile $profile, JobRole $role): array
    {
        $c = $role->eligibility_criteria ?? [];
        $codingSolved = (int)($profile->coding_stats['totalSolved'] ?? 0);
        $allowedBranches = $c['allowedBranches'] ?? [];
        $allowedDegrees = $c['allowedDegrees'] ?? [];
        $allowedYears = array_map('intval', $c['allowedGraduationYears'] ?? []);
        $maxHistorical = $c['maxHistoricalBacklogs'] ?? null;

        $checks = [
            'cgpa' => [
                'studentValue' => $profile->current_cgpa,
                'requiredValue' => ($c['minCgpa'] ?? 0) . ' minimum',
                'passed' => $profile->current_cgpa >= ($c['minCgpa'] ?? 0),
                'reason' => $profile->current_cgpa >= ($c['minCgpa'] ?? 0)
                    ? null
                    : "CGPA {$profile->current_cgpa} is below required " . ($c['minCgpa'] ?? 0),
            ],
            'tenthMarks' => [
                'studentValue' => $profile->tenth_percentage . '%',
                'requiredValue' => ($c['minTenthMarks'] ?? 0) . '% minimum',
                'passed' => $profile->tenth_percentage >= ($c['minTenthMarks'] ?? 0),
                'reason' => $profile->tenth_percentage >= ($c['minTenthMarks'] ?? 0)
                    ? null
                    : "10th marks {$profile->tenth_percentage}% below " . ($c['minTenthMarks'] ?? 0) . '%',
            ],
            'twelfthMarks' => [
                'studentValue' => $profile->twelfth_percentage . '%',
                'requiredValue' => ($c['minTwelfthMarks'] ?? 0) . '% minimum',
                'passed' => $profile->twelfth_percentage >= ($c['minTwelfthMarks'] ?? 0),
                'reason' => $profile->twelfth_percentage >= ($c['minTwelfthMarks'] ?? 0)
                    ? null
                    : "12th marks {$profile->twelfth_percentage}% below " . ($c['minTwelfthMarks'] ?? 0) . '%',
            ],
            'activeBacklogs' => [
                'studentValue' => $profile->active_backlogs,
                'requiredValue' => ($c['maxActiveBacklogs'] ?? 0) . ' max',
                'passed' => $profile->active_backlogs <= ($c['maxActiveBacklogs'] ?? 0),
                'reason' => $profile->active_backlogs <= ($c['maxActiveBacklogs'] ?? 0)
                    ? null
                    : "Active backlogs ({$profile->active_backlogs}) exceed max " . ($c['maxActiveBacklogs'] ?? 0),
            ],
            'branch' => [
                'studentValue' => $profile->branch,
                'requiredValue' => empty($allowedBranches) ? 'ALL' : implode(', ', $allowedBranches),
                'passed' => empty($allowedBranches) || in_array($profile->branch, $allowedBranches, true),
                'reason' => (empty($allowedBranches) || in_array($profile->branch, $allowedBranches, true))
                    ? null
                    : "Branch {$profile->branch} not in allowed streams",
            ],
            'codingPractice' => [
                'studentValue' => "{$codingSolved} solved",
                'requiredValue' => ($c['minCodingProblemsSolved'] ?? 0) . ' minimum',
                'passed' => $codingSolved >= ($c['minCodingProblemsSolved'] ?? 0),
                'reason' => $codingSolved >= ($c['minCodingProblemsSolved'] ?? 0)
                    ? null
                    : "Solve at least " . ($c['minCodingProblemsSolved'] ?? 0) . " LeetCode problems",
            ],
            'academicVerification' => [
                'studentValue' => $profile->verification_status,
                'requiredValue' => 'VERIFIED',
                'passed' => $profile->verification_status === 'VERIFIED',
                'reason' => $profile->verification_status === 'VERIFIED'
                    ? null
                    : 'Official academic verification is still pending',
            ],
        ];

        $extraPassed = true;
        $extraReasons = [];
        if ($maxHistorical !== null && $profile->historical_backlogs > (int)$maxHistorical) {
            $extraPassed = false;
            $extraReasons[] = "Historical backlogs ({$profile->historical_backlogs}) exceed limit ({$maxHistorical})";
        }
        if (!empty($allowedDegrees) && !in_array($profile->degree, $allowedDegrees, true)) {
            $extraPassed = false;
            $extraReasons[] = "Degree {$profile->degree} not eligible";
        }
        if (!empty($allowedYears) && !in_array((int)$profile->graduation_year, $allowedYears, true)) {
            $extraPassed = false;
            $extraReasons[] = "Graduation year {$profile->graduation_year} not eligible";
        }

        $allPassed = collect($checks)->every(fn ($x) => $x['passed']) && $extraPassed;
        $overall = $profile->verification_status !== 'VERIFIED'
            ? 'PENDING_VERIFICATION'
            : ($allPassed ? 'ELIGIBLE' : 'NOT_ELIGIBLE');

        $failedReasons = collect($checks)
            ->pluck('reason')
            ->filter()
            ->merge($extraReasons)
            ->values()
            ->all();

        return [
            'overallStatus' => $overall,
            'criteriaBreakdown' => $checks,
            'summaryReason' => $overall === 'ELIGIBLE' ? null : implode('; ', $failedReasons),
        ];
    }
}
