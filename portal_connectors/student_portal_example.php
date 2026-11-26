<?php
/**
 * Example Student Portal Integration using the SAME Shared Secure Storage Layer.
 * Demonstrates identical PDO prepared statements, Argon2id/Bcrypt verification, and CSV export.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/shared/bootstrap.php';

// Example 1: Authenticate a student using the exact same Security + Database layer
function studentPortalLogin(string $emailOrRoll, string $password): ?array
{
    if (Security::isRateLimited($emailOrRoll, 'student')) {
        throw new RuntimeException('Too many failed attempts.');
    }
    $student = Database::fetchOne(
        "SELECT id, roll_no, full_name, email, password_hash, department, cgpa, portal_active
         FROM students WHERE (email = ? OR roll_no = ?) LIMIT 1",
        [$emailOrRoll, $emailOrRoll]
    );
    if ($student && (int)$student['portal_active'] === 1 && Security::verifyPassword($password, $student['password_hash'])) {
        Security::recordLoginAttempt($emailOrRoll, 'student', true);
        AuditLogger::log('STUDENT_LOGIN', 'students', (string)$student['id'], 'Student portal login', 'student', (int)$student['id'], $student['email']);
        unset($student['password_hash']);
        return $student;
    }
    Security::recordLoginAttempt($emailOrRoll, 'student', false);
    return null;
}
