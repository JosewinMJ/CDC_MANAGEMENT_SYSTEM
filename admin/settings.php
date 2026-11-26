<?php
/**
 * CDC Admin Portal - Security Settings & Inter-Portal API Tokens
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Settings & API Tokens';

$newPlainToken = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'change_password') {
            $curr = (string)($_POST['current_password'] ?? '');
            $next = (string)($_POST['new_password'] ?? '');
            $conf = (string)($_POST['confirm_password'] ?? '');

            $row = Database::fetchOne("SELECT password_hash FROM admins WHERE id = ?", [(int)$currentAdmin['id']]);
            if (!$row || !Security::verifyPassword($curr, $row['password_hash'])) {
                throw new InvalidArgumentException('Current password is incorrect.');
            }
            if (strlen($next) < 8 || $next !== $conf) {
                throw new InvalidArgumentException('New password must be at least 8 characters and match confirmation.');
            }
            Database::execute("UPDATE admins SET password_hash = ? WHERE id = ?", [Security::hashPassword($next), (int)$currentAdmin['id']]);
            AuditLogger::log('ADMIN_PASSWORD_CHANGED', 'admins', (string)$currentAdmin['id'], 'Updated admin password');
            set_flash('success', 'Admin password updated securely with Argon2id.');
            redirect('settings.php');
        } elseif ($action === 'create_token') {
            $portal = post_str('portal_name');
            $label = post_str('token_label');
            $scopes = post_str('scopes', 'read');
            if ($label === '' || !in_array($portal, ['student_portal', 'faculty_portal', 'external_sync'], true)) {
                throw new InvalidArgumentException('Valid portal and token label are required.');
            }
            $plain = 'cdc_' . substr($portal, 0, 3) . '_' . bin2hex(random_bytes(20));
            $hash = hash('sha256', $plain);
            $prefix = substr($plain, 0, 12);
            Database::execute(
                "INSERT INTO api_tokens (portal_name, token_label, token_hash, token_prefix, scopes, is_active) VALUES (?, ?, ?, ?, ?, 1)",
                [$portal, $label, $hash, $prefix, $scopes]
            );
            AuditLogger::log('API_TOKEN_CREATED', 'api_tokens', (string)Database::lastInsertId(), "Issued token {$prefix}... for {$portal}");
            $newPlainToken = $plain;
        } elseif ($action === 'toggle_token') {
            $id = post_int('id');
            Database::execute("UPDATE api_tokens SET is_active = 1 - is_active WHERE id = ?", [$id]);
            AuditLogger::log('API_TOKEN_TOGGLED', 'api_tokens', (string)$id, 'Toggled token active status');
            set_flash('success', 'API token state updated.');
            redirect('settings.php');
        } elseif ($action === 'backup_sql') {
            $pdo = Database::getConnection();
            $tables = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_NUM);
            $sqlDump = "-- CDC Management System Full Database Backup\n-- Generated: " . date('Y-m-d H:i:s') . "\n\nSET FOREIGN_KEY_CHECKS=0;\n\n";
            foreach ($tables as $t) {
                $tbl = str_replace('`', '', $t[0]);
                $create = $pdo->query("SHOW CREATE TABLE `{$tbl}`")->fetch(PDO::FETCH_NUM);
                $sqlDump .= "DROP TABLE IF EXISTS `{$tbl}`;\n" . $create[1] . ";\n\n";
                $rows = $pdo->query("SELECT * FROM `{$tbl}`")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) {
                    $cols = array_map(static fn($c) => '`' . str_replace('`', '', $c) . '`', array_keys($r));
                    $vals = array_map(static fn($v) => $v === null ? 'NULL' : $pdo->quote((string)$v), array_values($r));
                    $sqlDump .= "INSERT INTO `{$tbl}` (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $vals) . ");\n";
                }
                $sqlDump .= "\n";
            }
            $sqlDump .= "SET FOREIGN_KEY_CHECKS=1;\n";
            $fname = 'cdc_management_backup_' . date('Ymd_His') . '.sql';
            AuditLogger::log('DB_BACKUP_DOWNLOADED', 'database', 'cdc_management', "Downloaded {$fname}");
            header('Content-Type: application/sql; charset=UTF-8');
            header('Content-Disposition: attachment; filename="' . $fname . '"');
            header('Content-Length: ' . strlen($sqlDump));
            echo $sqlDump;
            exit;
        }
    } catch (Throwable $e) {
        set_flash('error', $e->getMessage());
        redirect('settings.php');
    }
}

$tokens = Database::fetchAll("SELECT * FROM api_tokens ORDER BY created_at DESC");

require_once __DIR__ . '/includes/layout_top.php';
?>

<?php if ($newPlainToken): ?>
    <div class="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-900">
        <div class="font-bold">Copy Your New Portal API Token Now (shown only once):</div>
        <code class="block mt-2 p-2.5 bg-white rounded-lg border border-amber-200 text-xs font-mono select-all"><?= e($newPlainToken) ?></code>
    </div>
<?php endif; ?>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Password Security Card -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-fit">
        <h2 class="text-sm font-bold text-slate-900 mb-3">Change Admin Password</h2>
        <form method="POST" class="space-y-3 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="change_password">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
                <input type="password" name="current_password" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">New Password (min 8 chars)</label>
                <input type="password" name="new_password" required minlength="8" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                <input type="password" name="confirm_password" required minlength="8" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <button type="submit" class="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold">Update Password</button>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-200">
            <h3 class="text-sm font-bold text-slate-900 mb-1">Full Database Backup (.SQL)</h3>
            <p class="text-xs text-slate-500 mb-3">Download a complete MySQL backup (safe to restore anytime in phpMyAdmin). Master records can only be edited here in the Admin Portal.</p>
            <form method="POST">
                <?= Security::csrfField() ?>
                <input type="hidden" name="action" value="backup_sql">
                <button type="submit" class="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                    Download Full .SQL Backup
                </button>
            </form>
        </div>
    </div>

    <!-- Inter-Portal API Tokens -->
    <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900 mb-1">Issue Inter-Portal API Token</h2>
            <p class="text-xs text-slate-500 mb-3">Tokens are stored as SHA-256 hashes in <code>api_tokens</code> so Student &amp; Faculty portals authenticate securely against <code>/api/*.php</code>.</p>
            <form method="POST" class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <?= Security::csrfField() ?>
                <input type="hidden" name="action" value="create_token">
                <select name="portal_name" class="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="student_portal">Student Portal</option>
                    <option value="faculty_portal">Faculty Portal</option>
                    <option value="external_sync">Excel / External Sync</option>
                </select>
                <input type="text" name="token_label" required placeholder="Token label (e.g. Prod Student)" class="px-3 py-2 rounded-lg border border-slate-300">
                <div class="flex gap-2">
                    <input type="text" name="scopes" value="read,export" class="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs">
                    <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Generate</button>
                </div>
            </form>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-3 border-b border-slate-200">
                <h3 class="text-sm font-semibold text-slate-900">Active &amp; Revoked Portal Tokens</h3>
            </div>
            <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                <tr>
                    <th class="px-4 py-2.5">Portal</th>
                    <th class="px-4 py-2.5">Label &amp; Prefix</th>
                    <th class="px-4 py-2.5">Scopes</th>
                    <th class="px-4 py-2.5">Status</th>
                    <th class="px-4 py-2.5 text-right">Action</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                <?php foreach ($tokens as $tk): ?>
                    <tr>
                        <td class="px-4 py-2.5 font-semibold"><?= e($tk['portal_name']) ?></td>
                        <td class="px-4 py-2.5"><?= e($tk['token_label']) ?> <code class="text-slate-400">(<?= e($tk['token_prefix']) ?>...)</code></td>
                        <td class="px-4 py-2.5 text-slate-500"><?= e($tk['scopes']) ?></td>
                        <td class="px-4 py-2.5">
                            <span class="px-2 py-0.5 rounded-full font-semibold <?= (int)$tk['is_active'] ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700' ?>">
                                <?= (int)$tk['is_active'] ? 'Active' : 'Revoked' ?>
                            </span>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                            <form method="POST" class="inline">
                                <?= Security::csrfField() ?>
                                <input type="hidden" name="action" value="toggle_token">
                                <input type="hidden" name="id" value="<?= (int)$tk['id'] ?>">
                                <button type="submit" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium">
                                    <?= (int)$tk['is_active'] ? 'Revoke' : 'Activate' ?>
                                </button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
