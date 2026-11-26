<?php
/**
 * CDC Admin Portal - Faculty & Coordinator Database (Isolated Faculty DB)
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Faculty & Coordinators';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'save') {
            $id = post_int('id');
            $empId = post_str('employee_id');
            $fullName = post_str('full_name');
            $email = filter_var(post_str('email'), FILTER_VALIDATE_EMAIL);
            $phone = post_str('phone');
            $dept = strtoupper(post_str('department'));
            $designation = post_str('designation', 'Assistant Professor');
            $role = post_str('coordinator_role', 'dept_coordinator');
            $batches = post_str('assigned_batches');
            $canDrives = isset($_POST['can_manage_drives']) ? 1 : 0;
            $canVerify = isset($_POST['can_verify_students']) ? 1 : 0;
            $portalActive = isset($_POST['portal_active']) ? 1 : 0;
            $password = (string)($_POST['password'] ?? '');

            if ($empId === '' || $fullName === '' || !$email || $dept === '') {
                throw new InvalidArgumentException('Employee ID, Full Name, valid Email, and Department are required.');
            }

            if ($id > 0) {
                if ($password !== '') {
                    $hash = Security::hashPassword($password);
                    Database::execute(
                        "UPDATE faculty_coordinators SET employee_id=?, full_name=?, email=?, password_hash=?, phone=?, department=?, designation=?, coordinator_role=?, assigned_batches=?, can_manage_drives=?, can_verify_students=?, portal_active=? WHERE id=?",
                        [$empId, $fullName, $email, $hash, $phone, $dept, $designation, $role, $batches, $canDrives, $canVerify, $portalActive, $id]
                    );
                } else {
                    Database::execute(
                        "UPDATE faculty_coordinators SET employee_id=?, full_name=?, email=?, phone=?, department=?, designation=?, coordinator_role=?, assigned_batches=?, can_manage_drives=?, can_verify_students=?, portal_active=? WHERE id=?",
                        [$empId, $fullName, $email, $phone, $dept, $designation, $role, $batches, $canDrives, $canVerify, $portalActive, $id]
                    );
                }
                AuditLogger::log('FACULTY_UPDATED', 'faculty_coordinators', (string)$id, "Updated faculty {$empId} ({$fullName})");
                set_flash('success', "Faculty record {$fullName} updated.");
            } else {
                $hash = Security::hashPassword($password !== '' ? $password : 'Portal@1234');
                Database::execute(
                    "INSERT INTO faculty_coordinators (employee_id, full_name, email, password_hash, phone, department, designation, coordinator_role, assigned_batches, can_manage_drives, can_verify_students, portal_active)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [$empId, $fullName, $email, $hash, $phone, $dept, $designation, $role, $batches, $canDrives, $canVerify, $portalActive]
                );
                $newId = Database::lastInsertId();
                AuditLogger::log('FACULTY_CREATED', 'faculty_coordinators', (string)$newId, "Created faculty {$empId} ({$fullName})");
                set_flash('success', "Faculty {$fullName} ({$empId}) added to Faculty DB.");
            }
        } elseif ($action === 'delete') {
            $id = post_int('id');
            Database::execute("DELETE FROM faculty_coordinators WHERE id = ?", [$id]);
            AuditLogger::log('FACULTY_DELETED', 'faculty_coordinators', (string)$id, 'Deleted faculty record');
            set_flash('success', 'Faculty coordinator removed.');
        }
    } catch (Throwable $e) {
        set_flash('error', 'Error: ' . $e->getMessage());
    }
    redirect('faculty.php');
}

$q = trim((string)($_GET['q'] ?? ''));
$roleFilter = trim((string)($_GET['role'] ?? ''));

$where = [];
$params = [];
if ($q !== '') {
    $where[] = "(employee_id LIKE ? OR full_name LIKE ? OR email LIKE ? OR department LIKE ?)";
    $like = "%{$q}%";
    array_push($params, $like, $like, $like, $like);
}
if ($roleFilter !== '') {
    $where[] = "coordinator_role = ?";
    $params[] = $roleFilter;
}

$sql = "SELECT id, employee_id, full_name, email, phone, department, designation, coordinator_role, assigned_batches, can_manage_drives, can_verify_students, portal_active
        FROM faculty_coordinators";
if ($where) {
    $sql .= " WHERE " . implode(' AND ', $where);
}
$sql .= " ORDER BY department ASC, employee_id ASC";
$facultyList = Database::fetchAll($sql, $params);

require_once __DIR__ . '/includes/layout_top.php';
?>

<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <p class="text-sm text-slate-600">Manage isolated Faculty/Coordinator Portal database (Table: <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">faculty_coordinators</code> &middot; View: <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">v_faculty_portal_db</code>).</p>
    <div class="flex flex-wrap gap-2">
        <a href="data_exchange.php?download=faculty&format=csv" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
            <i data-lucide="download" class="w-3.5 h-3.5"></i> Export CSV
        </a>
        <a href="data_exchange.php?download=faculty&format=excel" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i> Export Excel (.XLS)
        </a>
        <button type="button" onclick="openAddFaculty()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i> Add Faculty
        </button>
    </div>
</div>

<form method="GET" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
    <input type="text" name="q" value="<?= e($q) ?>" placeholder="Search employee ID, name, email, department..."
           class="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm">
    <select name="role" class="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
        <option value="">All Roles</option>
        <option value="tpo_head" <?= $roleFilter === 'tpo_head' ? 'selected' : '' ?>>TPO Head</option>
        <option value="dept_coordinator" <?= $roleFilter === 'dept_coordinator' ? 'selected' : '' ?>>Dept Coordinator</option>
        <option value="placement_faculty" <?= $roleFilter === 'placement_faculty' ? 'selected' : '' ?>>Placement Faculty</option>
        <option value="trainer" <?= $roleFilter === 'trainer' ? 'selected' : '' ?>>Trainer</option>
    </select>
    <button type="submit" class="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold">Filter</button>
</form>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
                <th class="px-4 py-3">Faculty / Coordinator</th>
                <th class="px-4 py-3">Department &amp; Designation</th>
                <th class="px-4 py-3">CDC Role &amp; Batches</th>
                <th class="px-4 py-3">Permissions</th>
                <th class="px-4 py-3 text-right">Actions</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            <?php if (!$facultyList): ?>
                <tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">No faculty coordinators found.</td></tr>
            <?php endif; ?>
            <?php foreach ($facultyList as $f): ?>
                <tr class="hover:bg-slate-50/70">
                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-900"><?= e($f['full_name']) ?></div>
                        <div class="text-xs text-slate-500"><?= e($f['employee_id']) ?> &middot; <?= e($f['email']) ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs">
                        <div class="font-semibold text-slate-800"><?= e($f['department']) ?></div>
                        <div class="text-slate-500"><?= e($f['designation']) ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs">
                        <span class="px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700"><?= e(str_replace('_', ' ', ucfirst($f['coordinator_role']))) ?></span>
                        <div class="text-slate-500 mt-1">Batches: <?= e($f['assigned_batches'] ?: 'All') ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs space-y-1">
                        <div><?= (int)$f['can_manage_drives'] ? '&#10003; Manage Drives' : '&#10007; Read-only Drives' ?></div>
                        <div><?= (int)$f['can_verify_students'] ? '&#10003; Verify Students' : '&#10007; No Student Verify' ?></div>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <button type="button"
                                onclick='openEditFaculty(<?= json_encode($f, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>)'
                                class="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Edit</button>
                        <form method="POST" class="inline" onsubmit="return confirm('Remove faculty <?= e($f['employee_id']) ?>?');">
                            <?= Security::csrfField() ?>
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" value="<?= (int)$f['id'] ?>">
                            <button type="submit" class="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100">Delete</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Add/Edit Faculty Modal -->
<div id="facultyModal" class="cdc-modal">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 id="facultyModalTitle" class="text-base font-semibold text-slate-900">Add Faculty Coordinator</h3>
            <button type="button" onclick="closeModal('facultyModal')" class="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <form method="POST" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="id" id="fac_id" value="0">

            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Employee ID *</label>
                <input type="text" name="employee_id" id="fac_emp_id" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input type="text" name="full_name" id="fac_name" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input type="email" name="email" id="fac_email" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input type="text" name="phone" id="fac_phone" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
                <input type="text" name="department" id="fac_dept" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                <input type="text" name="designation" id="fac_desig" value="Assistant Professor" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Coordinator Role</label>
                <select name="coordinator_role" id="fac_role" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="dept_coordinator">Dept Coordinator</option>
                    <option value="tpo_head">TPO Head</option>
                    <option value="placement_faculty">Placement Faculty</option>
                    <option value="trainer">Trainer</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Assigned Batches</label>
                <input type="text" name="assigned_batches" id="fac_batches" placeholder="2026,2027" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">Portal Password <span class="font-normal text-slate-400">(blank = keep/default Portal@1234)</span></label>
                <input type="password" name="password" id="fac_password" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div class="sm:col-span-2 flex flex-wrap gap-4 pt-1 text-xs font-medium text-slate-700">
                <label class="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_manage_drives" id="fac_drives" value="1"> Can Manage Drives
                </label>
                <label class="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_verify_students" id="fac_verify" value="1" checked> Can Verify Students
                </label>
                <label class="inline-flex items-center gap-2">
                    <input type="checkbox" name="portal_active" id="fac_active" value="1" checked> Portal Login Active
                </label>
            </div>
            <div class="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('facultyModal')" class="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700">Save Faculty</button>
            </div>
        </form>
    </div>
</div>

<script>
function openAddFaculty() {
    document.getElementById('facultyModalTitle').textContent = 'Add Faculty Coordinator';
    document.getElementById('fac_id').value = 0;
    ['fac_emp_id','fac_name','fac_email','fac_phone','fac_dept','fac_batches','fac_password'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fac_desig').value = 'Assistant Professor';
    document.getElementById('fac_role').value = 'dept_coordinator';
    document.getElementById('fac_drives').checked = false;
    document.getElementById('fac_verify').checked = true;
    document.getElementById('fac_active').checked = true;
    openModal('facultyModal');
}

function openEditFaculty(f) {
    document.getElementById('facultyModalTitle').textContent = 'Edit Faculty: ' + f.employee_id;
    document.getElementById('fac_id').value = f.id;
    document.getElementById('fac_emp_id').value = f.employee_id || '';
    document.getElementById('fac_name').value = f.full_name || '';
    document.getElementById('fac_email').value = f.email || '';
    document.getElementById('fac_phone').value = f.phone || '';
    document.getElementById('fac_dept').value = f.department || '';
    document.getElementById('fac_desig').value = f.designation || '';
    document.getElementById('fac_role').value = f.coordinator_role || 'dept_coordinator';
    document.getElementById('fac_batches').value = f.assigned_batches || '';
    document.getElementById('fac_password').value = '';
    document.getElementById('fac_drives').checked = parseInt(f.can_manage_drives) === 1;
    document.getElementById('fac_verify').checked = parseInt(f.can_verify_students) === 1;
    document.getElementById('fac_active').checked = parseInt(f.portal_active) === 1;
    openModal('facultyModal');
}
</script>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
