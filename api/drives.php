<?php
/**
 * CDC API - Shared Placement Drives & Portal Notices Feed
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$token = api_require_token(['student_portal', 'faculty_portal']);
$target = $token['portal_name'] === 'student_portal' ? 'student' : 'faculty';

$drives = Database::fetchAll("
    SELECT d.id, c.company_name, c.tier, d.drive_title, d.job_role, d.package_lpa,
           d.eligible_departments, d.min_cgpa, d.max_backlogs, d.batch_year,
           d.drive_date, d.application_deadline, d.drive_mode, d.status
    FROM placement_drives d
    INNER JOIN companies c ON c.id = d.company_id
    WHERE d.status IN ('open', 'upcoming')
    ORDER BY d.drive_date ASC
");

$notices = Database::fetchAll(
    "SELECT id, title, body, target_portal, priority, is_pinned, expires_at, created_at
     FROM notices
     WHERE target_portal IN ('all', ?) AND (expires_at IS NULL OR expires_at >= CURDATE())
     ORDER BY is_pinned DESC, created_at DESC",
    [$target]
);

api_json(200, [
    'portal' => $token['portal_name'],
    'drives' => $drives,
    'notices' => $notices,
]);
