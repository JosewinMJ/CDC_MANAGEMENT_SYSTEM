<?php
/**
 * CDC API - Faculty/Coordinator Portal Database Endpoint (Isolated Faculty Scope)
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$token = api_require_token(['faculty_portal']);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $empId = trim((string)($_GET['employee_id'] ?? ''));
    if ($empId !== '') {
        $fac = Database::fetchOne("SELECT * FROM v_faculty_portal_db WHERE employee_id = ?", [$empId]);
        if (!$fac) {
            api_json(404, ['error' => 'Faculty record not found.']);
        }
        api_json(200, ['portal' => 'faculty_db', 'data' => $fac]);
    }
    $rows = Database::fetchAll("SELECT * FROM v_faculty_portal_db ORDER BY department, employee_id");
    api_json(200, ['portal' => 'faculty_db', 'count' => count($rows), 'data' => $rows]);
}

api_json(405, ['error' => 'Method not allowed.']);
