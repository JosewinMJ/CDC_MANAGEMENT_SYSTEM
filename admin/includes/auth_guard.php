<?php
/**
 * Admin Portal Authentication & RBAC Guard
 */

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/shared/bootstrap.php';
require_once __DIR__ . '/helpers.php';

Security::startSecureSession();

$lifetime = (int)($cdcConfig['security']['session_lifetime'] ?? 3600);
if (isset($_SESSION['last_activity']) && (time() - (int)$_SESSION['last_activity']) > $lifetime) {
    session_unset();
    session_destroy();
    Security::startSecureSession();
    set_flash('error', 'Your session expired due to inactivity. Please sign in again.');
    redirect('login.php');
}

if (empty($_SESSION['admin_id'])) {
    redirect('login.php');
}

$_SESSION['last_activity'] = time();

$currentAdmin = Database::fetchOne(
    "SELECT id, full_name, username, email, role, is_active FROM admins WHERE id = ?",
    [(int)$_SESSION['admin_id']]
);

if (!$currentAdmin || (int)$currentAdmin['is_active'] !== 1) {
    session_unset();
    session_destroy();
    redirect('login.php');
}
