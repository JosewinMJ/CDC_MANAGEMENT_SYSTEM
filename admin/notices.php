<?php
/**
 * CDC Admin Portal - Portal Notices & Targeted Announcements
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Portal Notices';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'publish') {
            $title = post_str('title');
            $body = post_str('body');
            $target = post_str('target_portal', 'all');
            $priority = post_str('priority', 'normal');
            $pinned = isset($_POST['is_pinned']) ? 1 : 0;
            $expires = post_str('expires_at') ?: null;

            if ($title === '' || $body === '') {
                throw new InvalidArgumentException('Notice title and message are required.');
            }
            Database::execute(
                "INSERT INTO notices (title, body, target_portal, priority, is_pinned, published_by, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$title, $body, $target, $priority, $pinned, (int)$currentAdmin['id'], $expires]
            );
            AuditLogger::log('NOTICE_PUBLISHED', 'notices', (string)Database::lastInsertId(), "Target: {$target} | {$title}");
            set_flash('success', 'Notice published to ' . strtoupper($target) . ' portal(s).');
        } elseif ($action === 'delete') {
            $id = post_int('id');
            Database::execute("DELETE FROM notices WHERE id = ?", [$id]);
            AuditLogger::log('NOTICE_DELETED', 'notices', (string)$id, 'Deleted notice');
            set_flash('success', 'Notice removed.');
        }
    } catch (Throwable $e) {
        set_flash('error', 'Error: ' . $e->getMessage());
    }
    redirect('notices.php');
}

$notices = Database::fetchAll("SELECT * FROM notices ORDER BY is_pinned DESC, created_at DESC");

require_once __DIR__ . '/includes/layout_top.php';
?>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-fit">
        <h2 class="text-sm font-bold text-slate-900 mb-3">Publish New Portal Notice</h2>
        <form method="POST" class="space-y-3 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="publish">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                <input type="text" name="title" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Target Portal</label>
                    <select name="target_portal" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                        <option value="all">All 3 Portals</option>
                        <option value="student">Student Portal Only</option>
                        <option value="faculty">Faculty Portal Only</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                    <select name="priority" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                        <option value="normal">Normal</option>
                        <option value="important">Important</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Expires On</label>
                <input type="date" name="expires_at" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Message *</label>
                <textarea name="body" rows="4" required class="w-full px-3 py-2 rounded-lg border border-slate-300"></textarea>
            </div>
            <label class="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                <input type="checkbox" name="is_pinned" value="1"> Pin to top of portal feed
            </label>
            <button type="submit" class="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">Publish Notice</button>
        </form>
    </div>

    <div class="lg:col-span-2 space-y-3">
        <?php foreach ($notices as $n): ?>
            <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start justify-between gap-4">
                <div>
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold <?= badge_class($n['priority']) ?>"><?= e(strtoupper($n['priority'])) ?></span>
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">Target: <?= e(strtoupper($n['target_portal'])) ?></span>
                        <?php if ((int)$n['is_pinned'] === 1): ?>
                            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">Pinned</span>
                        <?php endif; ?>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900"><?= e($n['title']) ?></h3>
                    <p class="text-xs text-slate-600 mt-1 whitespace-pre-line"><?= e($n['body']) ?></p>
                    <div class="text-[11px] text-slate-400 mt-2">Published: <?= e($n['created_at']) ?><?= $n['expires_at'] ? ' &middot; Expires: ' . e($n['expires_at']) : '' ?></div>
                </div>
                <form method="POST" onsubmit="return confirm('Delete notice?');">
                    <?= Security::csrfField() ?>
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="<?= (int)$n['id'] ?>">
                    <button type="submit" class="px-2.5 py-1 rounded bg-rose-50 text-rose-700 text-xs font-medium">Delete</button>
                </form>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
