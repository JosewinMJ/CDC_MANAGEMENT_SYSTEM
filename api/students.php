<?php
/**
 * CDC API - Student Portal Database Endpoint (Isolated Student Scope)
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$token = api_require_token(['student_portal', 'faculty_portal']);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $roll = trim((string)($_GET['roll_no'] ?? ''));
    if ($roll !== '') {
        $student = Database::fetchOne("SELECT * FROM v_student_portal_db WHERE roll_no = ?", [$roll]);
        if (!$student) {
            api_json(404, ['error' => 'Student not found.']);
        }
        api_json(200, ['portal' => 'student_db', 'data' => $student]);
    }

    $rows = Database::fetchAll("SELECT * FROM v_student_portal_db ORDER BY department, roll_no");
    api_json(200, ['portal' => 'student_db', 'count' => count($rows), 'data' => $rows]);
}

if ($method !== 'GET') {
    AuditLogger::log('API_WRITE_BLOCKED', 'students', null, "Blocked {$method} attempt by {$token['portal_name']} (Admin-only edit policy)", 'system', null, $token['portal_name']);
    api_json(403, ['error' => 'Read-only API: Master student records can only be edited by CDC Admin.']);
}

api_json(405, ['error' => 'Method not allowed.']);
