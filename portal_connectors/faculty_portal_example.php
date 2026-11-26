<?php
/**
 * Example Faculty/Coordinator Portal Integration using the SAME Shared Secure Storage Layer.
 * Demonstrates isolated faculty table access while sharing drives & student verification securely.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/shared/bootstrap.php';

function facultyPortalLogin(string $emailOrEmpId, string $password): ?array
{
    if (Security::isRateLimited($emailOrEmpId, 'faculty')) {
        throw new RuntimeException('Too many failed attempts.');
    }
    $faculty = Database::fetchOne(
        "SELECT id, employee_id, full_name, email, password_hash, department, coordinator_role, can_manage_drives, can_verify_students, portal_active
         FROM faculty_coordinators WHERE (email = ? OR employee_id = ?) LIMIT 1",
        [$emailOrEmpId, $emailOrEmpId]
    );
    if ($faculty && (int)$faculty['portal_active'] === 1 && Security::verifyPassword($password, $faculty['password_hash'])) {
        Security::recordLoginAttempt($emailOrEmpId, 'faculty', true);
        AuditLogger::log('FACULTY_LOGIN', 'faculty_coordinators', (string)$faculty['id'], 'Faculty portal login', 'faculty', (int)$faculty['id'], $faculty['email']);
        unset($faculty['password_hash']);
        return $faculty;
    }
    Security::recordLoginAttempt($emailOrEmpId, 'faculty', false);
    return null;
}
