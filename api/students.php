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

if ($method === 'POST') {
    if ($token['portal_name'] !== 'student_portal') {
        api_json(403, ['error' => 'Write access restricted to student_portal token.']);
    }
    $input = json_decode((string)file_get_contents('php://input'), true) ?: [];
    $roll = trim((string)($input['roll_no'] ?? ''));
    $name = trim((string)($input['full_name'] ?? ''));
    $email = filter_var(trim((string)($input['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    $dept = strtoupper(trim((string)($input['department'] ?? '')));
    $pass = (string)($input['password'] ?? '');

    if ($roll === '' || $name === '' || !$email || $dept === '' || strlen($pass) < 8) {
        api_json(422, ['error' => 'roll_no, full_name, valid email, department, and password (8+ chars) are required.']);
    }

    $hash = Security::hashPassword($pass);
    Database::execute(
        "INSERT INTO students (roll_no, full_name, email, password_hash, phone, department, program, batch_year, semester, cgpa, active_backlogs, skills)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $roll, $name, $email, $hash, $input['phone'] ?? null, $dept,
            $input['program'] ?? 'B.Tech', (int)($input['batch_year'] ?? date('Y') + 1),
            (int)($input['semester'] ?? 6), (float)($input['cgpa'] ?? 0),
            (int)($input['active_backlogs'] ?? 0), $input['skills'] ?? null
        ]
    );
    $id = Database::lastInsertId();
    AuditLogger::log('API_STUDENT_CREATED', 'students', (string)$id, "Created via student_portal API ({$roll})", 'student', $id, $email);
    api_json(201, ['message' => 'Student registered securely.', 'id' => $id]);
}

api_json(405, ['error' => 'Method not allowed.']);
