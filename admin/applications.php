<?php
/**
 * CDC Admin Portal - Student Drive Applications & Shortlisting
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Drive Applications';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'update_status') {
            $appId = post_int('application_id');
            $newStatus = post_str('status');
            $remarks = post_str('remarks');
            $allowed = ['applied', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn'];
            if (!in_array($newStatus, $allowed, true)) {
                throw new InvalidArgumentException('Invalid application status.');
            }

            Database::transaction(function () use ($appId, $newStatus, $remarks, $currentAdmin) {
                Database::execute(
                    "UPDATE applications SET status = ?, remarks = ?, updated_by = ? WHERE id = ?",
                    [$newStatus, $remarks, $currentAdmin['email'], $appId]
                );

                // Automatically synchronize Student DB placement status when offered/accepted or shortlisted
                $info = Database::fetchOne(
                    "SELECT a.student_id, c.company_name, d.package_lpa
                     FROM applications a
                     INNER JOIN placement_drives d ON d.id = a.drive_id
                     INNER JOIN companies c ON c.id = d.company_id
                     WHERE a.id = ?",
                    [$appId]
                );
                if ($info) {
                    if ($newStatus === 'accepted') {
                        Database::execute(
                            "UPDATE students SET placement_status = 'placed', placed_company = ?, package_lpa = ? WHERE id = ?",
                            [$info['company_name'], $info['package_lpa'], (int)$info['student_id']]
                        );
                    } elseif ($newStatus === 'shortlisted' || $newStatus === 'interview') {
                        Database::execute(
                            "UPDATE students SET placement_status = 'shortlisted' WHERE id = ? AND placement_status = 'unplaced'",
                            [(int)$info['student_id']]
                        );
                    }
                }
            });

            AuditLogger::log('APPLICATION_STATUS_UPDATED', 'applications', (string)$appId, "Status -> {$newStatus}");
            set_flash('success', 'Application status updated & synced with Student DB.');
        } elseif ($action === 'add_application') {
            $driveId = post_int('drive_id');
            $studentId = post_int('student_id');
            Database::execute(
                "INSERT INTO applications (drive_id, student_id, status, remarks, updated_by) VALUES (?, ?, 'applied', 'Added by CDC Admin', ?)",
                [$driveId, $studentId, $currentAdmin['email']]
            );
            AuditLogger::log('APPLICATION_CREATED', 'applications', (string)Database::lastInsertId(), "Student {$studentId} -> Drive {$driveId}");
            set_flash('success', 'Student enrolled in placement drive.');
        }
    } catch (Throwable $e) {
        set_flash('error', 'Error: ' . $e->getMessage());
    }
    redirect('applications.php' . (isset($_GET['drive_id']) ? '?drive_id=' . (int)$_GET['drive_id'] : ''));
}

$driveFilter = (int)($_GET['drive_id'] ?? 0);
$statusFilter = trim((string)($_GET['status'] ?? ''));

$where = [];
$params = [];
if ($driveFilter > 0) {
    $where[] = "a.drive_id = ?";
    $params[] = $driveFilter;
}
if ($statusFilter !== '') {
    $where[] = "a.status = ?";
    $params[] = $statusFilter;
}

$sql = "SELECT a.id, a.drive_id, a.student_id, a.status, a.remarks, a.updated_by, a.applied_at,
               s.roll_no, s.full_name AS student_name, s.department, s.cgpa,
               d.drive_title, d.package_lpa, c.company_name
        FROM applications a
        INNER JOIN students s ON s.id = a.student_id
        INNER JOIN placement_drives d ON d.id = a.drive_id
        INNER JOIN companies c ON c.id = d.company_id";
if ($where) {
    $sql .= " WHERE " . implode(' AND ', $where);
}
$sql .= " ORDER BY a.applied_at DESC";

$apps = Database::fetchAll($sql, $params);
$drives = Database::fetchAll("SELECT d.id, d.drive_title, c.company_name FROM placement_drives d INNER JOIN companies c ON c.id = d.company_id ORDER BY d.drive_date DESC");
$students = Database::fetchAll("SELECT id, roll_no, full_name, department FROM students ORDER BY roll_no");

require_once __DIR__ . '/includes/layout_top.php';
?>

<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <p class="text-sm text-slate-600">Review applications, shortlist candidates, and auto-sync accepted offers to the Student DB.</p>
    <div class="flex gap-2">
        <a href="data_exchange.php?download=applications&format=csv" class="px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700">Export CSV</a>
        <a href="data_exchange.php?download=applications&format=excel" class="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white">Export Excel</a>
        <button type="button" onclick="openModal('enrollModal')" class="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white">+ Enroll Student</button>
    </div>
</div>

<form method="GET" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
    <select name="drive_id" class="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
        <option value="0">All Placement Drives</option>
        <?php foreach ($drives as $dr): ?>
            <option value="<?= (int)$dr['id'] ?>" <?= $driveFilter === (int)$dr['id'] ? 'selected' : '' ?>><?= e($dr['company_name']) ?> — <?= e($dr['drive_title']) ?></option>
        <?php endforeach; ?>
    </select>
    <select name="status" class="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
        <option value="">All Statuses</option>
        <?php foreach (['applied', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn'] as $st): ?>
            <option value="<?= e($st) ?>" <?= $statusFilter === $st ? 'selected' : '' ?>><?= e(ucfirst($st)) ?></option>
        <?php endforeach; ?>
    </select>
    <button type="submit" class="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold">Filter</button>
</form>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
                <th class="px-4 py-3">Student</th>
                <th class="px-4 py-3">Company / Drive</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Remarks</th>
                <th class="px-4 py-3">Update Stage</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            <?php if (!$apps): ?>
                <tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">No applications found.</td></tr>
            <?php endif; ?>
            <?php foreach ($apps as $a): ?>
                <tr>
                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-900"><?= e($a['student_name']) ?></div>
                        <div class="text-xs text-slate-500"><?= e($a['roll_no']) ?> &middot; <?= e($a['department']) ?> &middot; CGPA <?= e($a['cgpa']) ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs">
                        <div class="font-semibold text-slate-800"><?= e($a['company_name']) ?> (<?= e($a['package_lpa']) ?> LPA)</div>
                        <div class="text-slate-500"><?= e($a['drive_title']) ?></div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium <?= badge_class($a['status']) ?>"><?= e(ucfirst($a['status'])) ?></span>
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-600"><?= e($a['remarks'] ?: '—') ?></td>
                    <td class="px-4 py-3">
                        <form method="POST" class="flex items-center gap-1.5">
                            <?= Security::csrfField() ?>
                            <input type="hidden" name="action" value="update_status">
                            <input type="hidden" name="application_id" value="<?= (int)$a['id'] ?>">
                            <select name="status" class="px-2 py-1 rounded border border-slate-300 text-xs bg-white">
                                <?php foreach (['applied', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn'] as $st): ?>
                                    <option value="<?= e($st) ?>" <?= $a['status'] === $st ? 'selected' : '' ?>><?= e(ucfirst($st)) ?></option>
                                <?php endforeach; ?>
                            </select>
                            <input type="text" name="remarks" value="<?= e($a['remarks']) ?>" placeholder="Remarks" class="w-28 px-2 py-1 rounded border border-slate-300 text-xs">
                            <button type="submit" class="px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-semibold">Save</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<div id="enrollModal" class="cdc-modal">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-base font-semibold">Enroll Student in Drive</h3>
            <button type="button" onclick="closeModal('enrollModal')" class="text-slate-400 text-xl">&times;</button>
        </div>
        <form method="POST" class="p-6 space-y-4 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="add_application">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Student</label>
                <select name="student_id" required class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <?php foreach ($students as $s): ?>
                        <option value="<?= (int)$s['id'] ?>"><?= e($s['roll_no']) ?> — <?= e($s['full_name']) ?> (<?= e($s['department']) ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Placement Drive</label>
                <select name="drive_id" required class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <?php foreach ($drives as $dr): ?>
                        <option value="<?= (int)$dr['id'] ?>"><?= e($dr['company_name']) ?> — <?= e($dr['drive_title']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" onclick="closeModal('enrollModal')" class="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Enroll</button>
            </div>
        </form>
    </div>
</div>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
