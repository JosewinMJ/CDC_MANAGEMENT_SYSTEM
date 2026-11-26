<?php
/**
 * CDC Admin Portal - Placement Drives Management
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Placement Drives';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'save') {
            $id = post_int('id');
            $companyId = post_int('company_id');
            $title = post_str('drive_title');
            $role = post_str('job_role');
            $lpa = post_float('package_lpa');
            $depts = strtoupper(post_str('eligible_departments', 'ALL'));
            $minCgpa = post_float('min_cgpa', 6.0);
            $maxBacklogs = post_int('max_backlogs', 0);
            $batchYear = post_int('batch_year', (int)date('Y') + 1);
            $driveDate = post_str('drive_date');
            $deadline = str_replace('T', ' ', post_str('application_deadline'));
            if (strlen($deadline) === 16) {
                $deadline .= ':00';
            }
            $mode = post_str('drive_mode', 'on_campus');
            $status = post_str('status', 'open');
            $coordinatorId = post_int('coordinator_id') ?: null;
            $desc = post_str('description');

            if ($companyId <= 0 || $title === '' || $role === '' || $driveDate === '') {
                throw new InvalidArgumentException('Company, Drive Title, Job Role, and Drive Date are required.');
            }

            if ($id > 0) {
                Database::execute(
                    "UPDATE placement_drives SET company_id=?, drive_title=?, job_role=?, package_lpa=?, eligible_departments=?, min_cgpa=?, max_backlogs=?, batch_year=?, drive_date=?, application_deadline=?, drive_mode=?, status=?, coordinator_id=?, description=? WHERE id=?",
                    [$companyId, $title, $role, $lpa, $depts, $minCgpa, $maxBacklogs, $batchYear, $driveDate, $deadline, $mode, $status, $coordinatorId, $desc, $id]
                );
                AuditLogger::log('DRIVE_UPDATED', 'placement_drives', (string)$id, "Updated drive {$title}");
                set_flash('success', "Placement drive '{$title}' updated.");
            } else {
                Database::execute(
                    "INSERT INTO placement_drives (company_id, drive_title, job_role, package_lpa, eligible_departments, min_cgpa, max_backlogs, batch_year, drive_date, application_deadline, drive_mode, status, coordinator_id, description, created_by)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [$companyId, $title, $role, $lpa, $depts, $minCgpa, $maxBacklogs, $batchYear, $driveDate, $deadline, $mode, $status, $coordinatorId, $desc, (int)$currentAdmin['id']]
                );
                $newId = Database::lastInsertId();
                AuditLogger::log('DRIVE_CREATED', 'placement_drives', (string)$newId, "Created drive {$title}");
                set_flash('success', "Placement drive '{$title}' published.");
            }
        } elseif ($action === 'delete') {
            $id = post_int('id');
            Database::execute("DELETE FROM placement_drives WHERE id = ?", [$id]);
            AuditLogger::log('DRIVE_DELETED', 'placement_drives', (string)$id, 'Deleted drive');
            set_flash('success', 'Placement drive deleted.');
        }
    } catch (Throwable $e) {
        set_flash('error', 'Error: ' . $e->getMessage());
    }
    redirect('drives.php');
}

$drives = Database::fetchAll("
    SELECT d.*, c.company_name, COALESCE(f.full_name, 'Unassigned') AS coordinator_name,
           (SELECT COUNT(*) FROM applications a WHERE a.drive_id = d.id) AS applicant_count
    FROM placement_drives d
    INNER JOIN companies c ON c.id = d.company_id
    LEFT JOIN faculty_coordinators f ON f.id = d.coordinator_id
    ORDER BY d.drive_date DESC
");
$companies = Database::fetchAll("SELECT id, company_name FROM companies ORDER BY company_name");
$faculty = Database::fetchAll("SELECT id, full_name, department FROM faculty_coordinators WHERE portal_active = 1 ORDER BY full_name");

require_once __DIR__ . '/includes/layout_top.php';
?>

<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <p class="text-sm text-slate-600">Configure campus recruitment drives, eligibility rules, and faculty coordinators.</p>
    <div class="flex gap-2">
        <a href="data_exchange.php?download=drives&format=excel" class="px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700">Export Excel</a>
        <button type="button" onclick="openAddDrive()" class="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700">+ Create Drive</button>
    </div>
</div>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
                <th class="px-4 py-3">Drive &amp; Company</th>
                <th class="px-4 py-3">Eligibility</th>
                <th class="px-4 py-3">Package</th>
                <th class="px-4 py-3">Dates &amp; Coordinator</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            <?php foreach ($drives as $d): ?>
                <tr class="hover:bg-slate-50/70">
                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-900"><?= e($d['drive_title']) ?></div>
                        <div class="text-xs text-slate-500"><?= e($d['company_name']) ?> &middot; <?= e($d['job_role']) ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs">
                        <div>Depts: <strong><?= e($d['eligible_departments']) ?></strong></div>
                        <div class="text-slate-500">Min CGPA <?= e($d['min_cgpa']) ?> &middot; Max Backlogs <?= (int)$d['max_backlogs'] ?> &middot; Batch <?= e($d['batch_year']) ?></div>
                    </td>
                    <td class="px-4 py-3 font-semibold text-slate-800"><?= e($d['package_lpa']) ?> LPA</td>
                    <td class="px-4 py-3 text-xs">
                        <div>Drive: <strong><?= e($d['drive_date']) ?></strong> (<?= e($d['drive_mode']) ?>)</div>
                        <div class="text-slate-500">Coord: <?= e($d['coordinator_name']) ?> &middot; <a href="applications.php?drive_id=<?= (int)$d['id'] ?>" class="text-indigo-600 font-semibold"><?= (int)$d['applicant_count'] ?> apps</a></div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium <?= badge_class($d['status']) ?>"><?= e(ucfirst($d['status'])) ?></span>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <button type="button" onclick='openEditDrive(<?= json_encode($d, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>)' class="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">Edit</button>
                        <form method="POST" class="inline" onsubmit="return confirm('Delete this drive?');">
                            <?= Security::csrfField() ?>
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" value="<?= (int)$d['id'] ?>">
                            <button type="submit" class="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700">Delete</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<div id="driveModal" class="cdc-modal">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 id="driveModalTitle" class="text-base font-semibold">Create Placement Drive</h3>
            <button type="button" onclick="closeModal('driveModal')" class="text-slate-400 text-xl">&times;</button>
        </div>
        <form method="POST" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="id" id="drv_id" value="0">

            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Company *</label>
                <select name="company_id" id="drv_company" required class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <?php foreach ($companies as $co): ?>
                        <option value="<?= (int)$co['id'] ?>"><?= e($co['company_name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Faculty Coordinator</label>
                <select name="coordinator_id" id="drv_coord" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="">-- Unassigned --</option>
                    <?php foreach ($faculty as $f): ?>
                        <option value="<?= (int)$f['id'] ?>"><?= e($f['full_name']) ?> (<?= e($f['department']) ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">Drive Title *</label>
                <input type="text" name="drive_title" id="drv_title" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Job Role *</label>
                <input type="text" name="job_role" id="drv_role" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Package (LPA)</label>
                <input type="number" step="0.01" name="package_lpa" id="drv_lpa" value="10.00" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Eligible Departments</label>
                <input type="text" name="eligible_departments" id="drv_depts" value="CSE,IT,AIML" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Batch Year</label>
                <input type="number" name="batch_year" id="drv_batch" value="2027" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Min CGPA</label>
                <input type="number" step="0.01" name="min_cgpa" id="drv_cgpa" value="7.00" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Max Active Backlogs</label>
                <input type="number" name="max_backlogs" id="drv_backlogs" value="0" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Drive Date *</label>
                <input type="date" name="drive_date" id="drv_date" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Application Deadline *</label>
                <input type="datetime-local" name="application_deadline" id="drv_deadline" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Mode</label>
                <select name="drive_mode" id="drv_mode" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="on_campus">On Campus</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select name="status" id="drv_status" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="open">Open</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="closed">Closed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea name="description" id="drv_desc" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-300"></textarea>
            </div>
            <div class="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('driveModal')" class="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Save Drive</button>
            </div>
        </form>
    </div>
</div>

<script>
function openAddDrive() {
    document.getElementById('driveModalTitle').textContent = 'Create Placement Drive';
    document.getElementById('drv_id').value = 0;
    ['drv_title','drv_role','drv_desc'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('drv_lpa').value = '10.00';
    document.getElementById('drv_depts').value = 'CSE,IT,AIML';
    document.getElementById('drv_batch').value = '2027';
    document.getElementById('drv_cgpa').value = '7.00';
    document.getElementById('drv_backlogs').value = '0';
    document.getElementById('drv_status').value = 'open';
    openModal('driveModal');
}
function openEditDrive(d) {
    document.getElementById('driveModalTitle').textContent = 'Edit Drive';
    document.getElementById('drv_id').value = d.id;
    document.getElementById('drv_company').value = d.company_id;
    document.getElementById('drv_coord').value = d.coordinator_id || '';
    document.getElementById('drv_title').value = d.drive_title || '';
    document.getElementById('drv_role').value = d.job_role || '';
    document.getElementById('drv_lpa').value = d.package_lpa || '';
    document.getElementById('drv_depts').value = d.eligible_departments || 'ALL';
    document.getElementById('drv_batch').value = d.batch_year || 2027;
    document.getElementById('drv_cgpa').value = d.min_cgpa || 6.0;
    document.getElementById('drv_backlogs').value = d.max_backlogs || 0;
    document.getElementById('drv_date').value = d.drive_date || '';
    document.getElementById('drv_deadline').value = (d.application_deadline || '').replace(' ', 'T').slice(0, 16);
    document.getElementById('drv_mode').value = d.drive_mode || 'on_campus';
    document.getElementById('drv_status').value = d.status || 'open';
    document.getElementById('drv_desc').value = d.description || '';
    openModal('driveModal');
}
</script>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
