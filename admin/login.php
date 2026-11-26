<?php
/**
 * CDC Admin Portal - Hardened Authentication Page
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/shared/bootstrap.php';
require_once __DIR__ . '/includes/helpers.php';

Security::startSecureSession();

if (!empty($_SESSION['admin_id'])) {
    redirect('index.php');
}

$error = null;
$flash = get_flash();
if ($flash && $flash['type'] === 'error') {
    $error = $flash['message'];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();

    $identifier = trim((string)($_POST['identifier'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if ($identifier === '' || $password === '') {
        $error = 'Please enter both username/email and password.';
    } elseif (Security::isRateLimited($identifier, 'admin')) {
        $error = 'Too many failed login attempts. Please wait 15 minutes before retrying.';
        AuditLogger::log('LOGIN_BLOCKED', 'admin', null, "Rate limit triggered for {$identifier}", 'system', null, $identifier);
    } else {
        $admin = Database::fetchOne(
            "SELECT id, full_name, username, email, password_hash, role, is_active
             FROM admins
             WHERE (email = ? OR username = ?)
             LIMIT 1",
            [$identifier, $identifier]
        );

        if ($admin && (int)$admin['is_active'] === 1 && Security::verifyPassword($password, $admin['password_hash'])) {
            Security::recordLoginAttempt($identifier, 'admin', true);
            session_regenerate_id(true);
            $_SESSION['admin_id'] = (int)$admin['id'];
            $_SESSION['admin_name'] = $admin['full_name'];
            $_SESSION['admin_email'] = $admin['email'];
            $_SESSION['admin_role'] = $admin['role'];
            $_SESSION['last_activity'] = time();

            Database::execute("UPDATE admins SET last_login_at = NOW() WHERE id = ?", [(int)$admin['id']]);
            AuditLogger::log('ADMIN_LOGIN', 'admin', (string)$admin['id'], 'Successful admin portal login');
            set_flash('success', 'Welcome back, ' . $admin['full_name'] . '.');
            redirect('index.php');
        } else {
            Security::recordLoginAttempt($identifier, 'admin', false);
            AuditLogger::log('LOGIN_FAILED', 'admin', null, "Failed login attempt for {$identifier}", 'system', null, $identifier);
            $error = 'Invalid credentials or inactive admin account.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In — CDC Admin Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="assets/app.css">
</head>
<body class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
<div class="w-full max-w-md">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-6 text-white">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-lg shadow">
                    CDC
                </div>
                <div>
                    <h1 class="text-lg font-bold tracking-tight">Career Development Centre</h1>
                    <p class="text-xs text-indigo-200">Admin Portal &middot; 3-Portal Unified Database</p>
                </div>
            </div>
        </div>

        <form method="POST" class="p-6 space-y-4" autocomplete="off">
            <?= Security::csrfField() ?>

            <?php if ($error): ?>
                <div class="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 text-sm font-medium">
                    <?= e($error) ?>
                </div>
            <?php endif; ?>

            <div>
                <label for="identifier" class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5">
                    Admin Email or Username
                </label>
                <input id="identifier" name="identifier" type="text" required
                       value="<?= e($_POST['identifier'] ?? '') ?>"
                       placeholder="admin@cdc.edu"
                       class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label for="password" class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5">
                    Password
                </label>
                <input id="password" name="password" type="password" required
                       placeholder="Enter your password"
                       class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <button type="submit"
                    class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition">
                Sign In to Admin Portal
            </button>

            <div class="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div class="flex items-center justify-between">
                    <span>Demo Admin:</span>
                    <code class="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">admin@cdc.edu / Admin@1234</code>
                </div>
                <div class="text-[11px] text-slate-400">
                    Protected with Argon2id hashing, CSRF validation, prepared PDO statements &amp; rate limiting.
                </div>
            </div>
        </form>
    </div>
</div>
</body>
</html>
