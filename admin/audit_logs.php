<?php
/**
 * CDC Admin Portal - Immutable Audit & Login Security Logs
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Audit & Login Logs';

$auditLogs = Database::fetchAll("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 60");
$loginAttempts = Database::fetchAll("SELECT * FROM login_attempts ORDER BY id DESC LIMIT 30");

require_once __DIR__ . '/includes/layout_top.php';
?>

<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div class="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900">System &amp; Admin Audit Trail (Latest 60)</h2>
            <span class="text-xs text-slate-400">Append-only governance log</span>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                <tr>
                    <th class="px-4 py-3">Timestamp</th>
                    <th class="px-4 py-3">Actor</th>
                    <th class="px-4 py-3">Action</th>
                    <th class="px-4 py-3">Entity</th>
                    <th class="px-4 py-3">Details</th>
                    <th class="px-4 py-3">IP</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                <?php foreach ($auditLogs as $a): ?>
                    <tr>
                        <td class="px-4 py-2.5 text-slate-500 whitespace-nowrap"><?= e($a['created_at']) ?></td>
                        <td class="px-4 py-2.5 font-medium"><?= e($a['actor_email'] ?? 'system') ?> <span class="text-slate-400">(<?= e($a['actor_role']) ?>)</span></td>
                        <td class="px-4 py-2.5 font-semibold text-indigo-700"><?= e($a['action']) ?></td>
                        <td class="px-4 py-2.5"><?= e($a['entity_type']) ?><?= $a['entity_id'] ? ' #' . e($a['entity_id']) : '' ?></td>
                        <td class="px-4 py-2.5 text-slate-600 max-w-xs truncate"><?= e($a['details']) ?></td>
                        <td class="px-4 py-2.5 text-slate-400"><?= e($a['ip_address']) ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
        <div class="px-5 py-4 border-b border-slate-200">
            <h2 class="text-sm font-bold text-slate-900">Authentication Attempts</h2>
        </div>
        <div class="divide-y divide-slate-100">
            <?php if (!$loginAttempts): ?>
                <div class="p-6 text-center text-xs text-slate-400">No login attempts recorded yet.</div>
            <?php endif; ?>
            <?php foreach ($loginAttempts as $la): ?>
                <div class="px-4 py-3 text-xs flex items-center justify-between gap-2">
                    <div class="min-w-0">
                        <div class="font-semibold text-slate-800 truncate"><?= e($la['identifier']) ?></div>
                        <div class="text-slate-400"><?= e($la['portal']) ?> &middot; <?= e($la['ip_address']) ?> &middot; <?= e($la['attempted_at']) ?></div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full font-semibold <?= (int)$la['was_successful'] ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700' ?>">
                        <?= (int)$la['was_successful'] ? 'OK' : 'FAIL' ?>
                    </span>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
