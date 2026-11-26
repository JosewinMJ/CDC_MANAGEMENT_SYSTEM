<?php
/**
 * CDC Admin Portal - Logout
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/shared/bootstrap.php';
require_once __DIR__ . '/includes/helpers.php';

Security::startSecureSession();

if (!empty($_SESSION['admin_id'])) {
    AuditLogger::log('ADMIN_LOGOUT', 'admin', (string)$_SESSION['admin_id'], 'Admin signed out');
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

redirect('login.php');
