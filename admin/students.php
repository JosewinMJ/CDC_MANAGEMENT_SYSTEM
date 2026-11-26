<?php
/**
 * CDC Admin Portal - Student Database Management (Isolated Student DB)
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Student Database';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'save') {
            $id = post_int('id');
            $rollNo = post_str('roll_no');
            $fullName = post_str('full_name');
            $email = filter_var(post_str('email'), FILTER_VALIDATE_EMAIL);
            $phone = post_str('phone');
            $dept = strtoupper(post_str('department'));
            $program = post_str('program', 'B.Tech');
            $batchYear = post_int('batch_year', (int)date('Y') + 1);
            $semester = max(1, min(12, post_int('semester', 6)));
            $cgpa = max(0, min(10, post_float('cgpa')));
            $backlogs = max(0, post_int('active_backlogs'));
            $skills = post_str('skills');
            $status = post_str('placement_status', 'unplaced');
            $placedCompany = post_str('placed_company');
            $packageLpa = post_str('package_lpa') !== '' ? post_float('package_lpa') : null;
            $isVerified = isset($_POST['is_verified']) ? 1 : 0;
            $portalActive = isset($_POST['portal_active']) ? 1 : 0;
            $password = (string)($_POST['password'] ?? '');

            if ($rollNo === '' || $fullName === '' || !$email || $dept === '') {
                throw new InvalidArgumentException('Roll No, Full Name, valid Email, and Department are required.');
            }

            if ($id > 0) {
                if ($password !== '') {
                    $hash = Security::hashPassword($password);
                    Database::execute(
                        "UPDATE students SET roll_no=?, full_name=?, email=?, password_hash=?, phone=?, department=?, program=?, batch_year=?, semester=?, cgpa=?, active_backlogs=?, skills=?, placement_status=?, placed_company=?, package_lpa=?, is_verified=?, portal_active=? WHERE id=?",
                        [$rollNo, $fullName, $email, $hash, $phone, $dept, $program, $batchYear, $semester, $cgpa, $backlogs, $skills, $status, $placedCompany ?: null, $packageLpa, $isVerified, $portalActive, $id]
                    );
                } else {
                    Database::execute(
                        "UPDATE students SET roll_no=?, full_name=?, email=?, phone=?, department=?, program=?, batch_year=?, semester=?, cgpa=?, active_backlogs=?, skills=?, placement_status=?, placed_company=?, package_lpa=?, is_verified=?, portal_active=? WHERE id=?",
                        [$rollNo, $fullName, $email, $phone, $dept, $program, $batchYear, $semester, $cgpa, $backlogs, $skills, $status, $placedCompany ?: null, $packageLpa, $isVerified, $portalActive, $id]
                    );
                }
                AuditLogger::log('STUDENT_UPDATED', 'students', (string)$id, "Updated student {$rollNo} ({$fullName})");
                set_flash('success', "Student {$fullName} ({$rollNo}) updated.");
            } else {
                $hash = Security::hashPassword($password !== '' ? $password : 'Portal@1234');
                Database::execute(
                    "INSERT INTO students (roll_no, full_name, email, password_hash, phone, department, program, batch_year, semester, cgpa, active_backlogs, skills, placement_status, placed_company, package_lpa, is_verified, portal_active)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [$rollNo, $fullName, $email, $hash, $phone, $dept, $program, $batchYear, $semester, $cgpa, $backlogs, $skills, $status, $placedCompany ?: null, $packageLpa, $isVerified, $portalActive]
                );
                $newId = Database::lastInsertId();
                AuditLogger::log('STUDENT_CREATED', 'students', (string)$newId, "Created student {$rollNo} ({$fullName})");
                set_flash('success', "Student {$fullName} ({$rollNo}) added to Student DB.");
            }
        } elseif ($action === 'toggle_verify') {
            $id = post_int('id');
            Database::execute("UPDATE students SET is_verified = 1 - is_verified WHERE id = ?", [$id]);
            AuditLogger::log('STUDENT_VERIFY_TOGGLED', 'students', (string)$id, 'Toggled verification state');
            set_flash('success', 'Student verification status updated.');
        } elseif ($action === 'delete') {
            $id = post_int('id');
            $row = Database::fetchOne("SELECT roll_no, full_name FROM students WHERE id = ?", [$id]);
            Database::execute("DELETE FROM students WHERE id = ?", [$id]);
            AuditLogger::log('STUDENT_DELETED', 'students', (string)$id, 'Deleted student ' . ($row['roll_no'] ?? $id));
            set_flash('success', 'Student record removed.');
        }
    } catch (Throwable $e) {
        set_flash('error', 'Error: ' . $e->getMessage());
    }
    redirect('students.php');
}

// Filters
$q = trim((string)($_GET['q'] ?? ''));
$deptFilter = trim((string)($_GET['dept'] ?? ''));
$statusFilter = trim((string)($_GET['status'] ?? ''));

$where = [];
$params = [];
if ($q !== '') {
    $where[] = "(roll_no LIKE ? OR full_name LIKE ? OR email LIKE ? OR skills LIKE ?)";
    $like = "%{$q}%";
    array_push($params, $like, $like, $like, $like);
}
if ($deptFilter !== '') {
    $where[] = "department = ?";
    $params[] = $deptFilter;
}
if ($statusFilter !== '') {
    $where[] = "placement_status = ?";
    $params[] = $statusFilter;
}

$sql = "SELECT id, roll_no, full_name, email, phone, department, program, batch_year, semester, cgpa, active_backlogs, skills, placement_status, placed_company, package_lpa, is_verified, portal_active
        FROM students";
if ($where) {
    $sql .= " WHERE " . implode(' AND ', $where);
}
$sql .= " ORDER BY department ASC, roll_no ASC";
$students = Database::fetchAll($sql, $params);
$departments = Database::fetchAll("SELECT DISTINCT department FROM students ORDER BY department");

require_once __DIR__ . '/includes/layout_top.php';
?>

<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
        <p class="text-sm text-slate-600">Manage isolated Student Portal records (Table: <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">students</code> &middot; View: <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">v_student_portal_db</code>).</p>
    </div>
    <div class="flex flex-wrap gap-2">
        <a href="data_exchange.php?download=students&format=csv" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
            <i data-lucide="download" class="w-3.5 h-3.5"></i> Export CSV
        </a>
        <a href="data_exchange.php?download=students&format=excel" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i> Export Excel (.XLS)
        </a>
        <button type="button" onclick="openAddStudent()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i> Add Student
        </button>
    </div>
</div>

<!-- Search & Filter Bar -->
<form method="GET" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
    <input type="text" name="q" value="<?= e($q) ?>" placeholder="Search roll no, name, email, skills..."
           class="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
    <select name="dept" class="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
        <option value="">All Departments</option>
        <?php foreach ($departments as $d): ?>
            <option value="<?= e($d['department']) ?>" <?= $deptFilter === $d['department'] ? 'selected' : '' ?>><?= e($d['department']) ?></option>
        <?php endforeach; ?>
    </select>
    <div class="flex gap-2">
        <select name="status" class="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="">All Status</option>
            <?php foreach (['unplaced', 'shortlisted', 'placed', 'opted_out'] as $st): ?>
                <option value="<?= e($st) ?>" <?= $statusFilter === $st ? 'selected' : '' ?>><?= e(ucfirst(str_replace('_', ' ', $st))) ?></option>
            <?php endforeach; ?>
        </select>
        <button type="submit" class="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800">Filter</button>
    </div>
</form>

<!-- Students Table -->
<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
                <th class="px-4 py-3">Student</th>
                <th class="px-4 py-3">Dept / Batch</th>
                <th class="px-4 py-3">CGPA &amp; Backlogs</th>
                <th class="px-4 py-3">Placement Status</th>
                <th class="px-4 py-3">Verified / Portal</th>
                <th class="px-4 py-3 text-right">Actions</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            <?php if (!$students): ?>
                <tr><td colspan="6" class="px-4 py-8 text-center text-slate-400">No students match the current filter.</td></tr>
            <?php endif; ?>
            <?php foreach ($students as $s): ?>
                <tr class="hover:bg-slate-50/70">
                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-900"><?= e($s['full_name']) ?></div>
                        <div class="text-xs text-slate-500"><?= e($s['roll_no']) ?> &middot; <?= e($s['email']) ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs">
                        <span class="font-semibold text-slate-800"><?= e($s['department']) ?></span> (<?= e($s['program']) ?>)
                        <div class="text-slate-500">Batch <?= e($s['batch_year']) ?> &middot; Sem <?= e($s['semester']) ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs">
                        <span class="font-bold text-slate-800"><?= number_format((float)$s['cgpa'], 2) ?></span> CGPA
                        <div class="text-slate-500"><?= (int)$s['active_backlogs'] ?> Backlogs</div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium <?= badge_class($s['placement_status']) ?>">
                            <?= e(ucfirst(str_replace('_', ' ', $s['placement_status']))) ?>
                        </span>
                        <?php if ($s['placed_company']): ?>
                            <div class="text-[11px] text-slate-600 mt-0.5"><?= e($s['placed_company']) ?> (<?= e($s['package_lpa']) ?> LPA)</div>
                        <?php endif; ?>
                    </td>
                    <td class="px-4 py-3 text-xs">
                        <form method="POST" class="inline">
                            <?= Security::csrfField() ?>
                            <input type="hidden" name="action" value="toggle_verify">
                            <input type="hidden" name="id" value="<?= (int)$s['id'] ?>">
                            <button type="submit" class="px-2 py-0.5 rounded text-xs font-medium <?= (int)$s['is_verified'] ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700' ?>">
                                <?= (int)$s['is_verified'] ? 'Verified' : 'Pending Verify' ?>
                            </button>
                        </form>
                        <div class="text-[11px] text-slate-400 mt-0.5"><?= (int)$s['portal_active'] ? 'Portal Active' : 'Portal Disabled' ?></div>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <button type="button"
                                onclick='openEditStudent(<?= json_encode($s, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>)'
                                class="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Edit</button>
                        <form method="POST" class="inline" onsubmit="return confirm('Delete student <?= e($s['roll_no']) ?>?');">
                            <?= Security::csrfField() ?>
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" value="<?= (int)$s['id'] ?>">
                            <button type="submit" class="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100">Delete</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Add/Edit Student Modal -->
<div id="studentModal" class="cdc-modal">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 id="studentModalTitle" class="text-base font-semibold text-slate-900">Add Student</h3>
            <button type="button" onclick="closeModal('studentModal')" class="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <form method="POST" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="id" id="stu_id" value="0">

            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Roll Number *</label>
                <input type="text" name="roll_no" id="stu_roll_no" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input type="text" name="full_name" id="stu_full_name" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input type="email" name="email" id="stu_email" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input type="text" name="phone" id="stu_phone" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
                <input type="text" name="department" id="stu_department" placeholder="CSE, IT, ECE, AIML" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Program</label>
                <input type="text" name="program" id="stu_program" value="B.Tech" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Batch Year</label>
                <input type="number" name="batch_year" id="stu_batch_year" value="2027" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
                <input type="number" name="semester" id="stu_semester" min="1" max="12" value="7" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">CGPA</label>
                <input type="number" step="0.01" min="0" max="10" name="cgpa" id="stu_cgpa" value="8.00" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Active Backlogs</label>
                <input type="number" min="0" name="active_backlogs" id="stu_backlogs" value="0" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Placement Status</label>
                <select name="placement_status" id="stu_status" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="unplaced">Unplaced</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="placed">Placed</option>
                    <option value="opted_out">Opted Out</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Portal Password <span class="font-normal text-slate-400">(blank = keep/default)</span></label>
                <input type="password" name="password" id="stu_password" placeholder="Default: Portal@1234" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Placed Company</label>
                <input type="text" name="placed_company" id="stu_company" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Package (LPA)</label>
                <input type="number" step="0.01" name="package_lpa" id="stu_lpa" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">Skills (comma separated)</label>
                <input type="text" name="skills" id="stu_skills" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div class="sm:col-span-2 flex items-center gap-6 pt-1">
                <label class="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input type="checkbox" name="is_verified" id="stu_verified" value="1" checked class="rounded border-slate-300 text-indigo-600">
                    Verified Academic Profile
                </label>
                <label class="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input type="checkbox" name="portal_active" id="stu_portal_active" value="1" checked class="rounded border-slate-300 text-indigo-600">
                    Student Portal Login Enabled
                </label>
            </div>
            <div class="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('studentModal')" class="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700">Save Student</button>
            </div>
        </form>
    </div>
</div>

<script>
function openAddStudent() {
    document.getElementById('studentModalTitle').textContent = 'Add New Student';
    document.getElementById('stu_id').value = 0;
    ['stu_roll_no','stu_full_name','stu_email','stu_phone','stu_department','stu_company','stu_lpa','stu_skills','stu_password'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('stu_program').value = 'B.Tech';
    document.getElementById('stu_batch_year').value = '2027';
    document.getElementById('stu_semester').value = '7';
    document.getElementById('stu_cgpa').value = '8.00';
    document.getElementById('stu_backlogs').value = '0';
    document.getElementById('stu_status').value = 'unplaced';
    document.getElementById('stu_verified').checked = true;
    document.getElementById('stu_portal_active').checked = true;
    openModal('studentModal');
}

function openEditStudent(s) {
    document.getElementById('studentModalTitle').textContent = 'Edit Student: ' + s.roll_no;
    document.getElementById('stu_id').value = s.id;
    document.getElementById('stu_roll_no').value = s.roll_no || '';
    document.getElementById('stu_full_name').value = s.full_name || '';
    document.getElementById('stu_email').value = s.email || '';
    document.getElementById('stu_phone').value = s.phone || '';
    document.getElementById('stu_department').value = s.department || '';
    document.getElementById('stu_program').value = s.program || 'B.Tech';
    document.getElementById('stu_batch_year').value = s.batch_year || 2027;
    document.getElementById('stu_semester').value = s.semester || 7;
    document.getElementById('stu_cgpa').value = s.cgpa || '0.00';
    document.getElementById('stu_backlogs').value = s.active_backlogs || 0;
    document.getElementById('stu_status').value = s.placement_status || 'unplaced';
    document.getElementById('stu_company').value = s.placed_company || '';
    document.getElementById('stu_lpa').value = s.package_lpa || '';
    document.getElementById('stu_skills').value = s.skills || '';
    document.getElementById('stu_password').value = '';
    document.getElementById('stu_verified').checked = parseInt(s.is_verified) === 1;
    document.getElementById('stu_portal_active').checked = parseInt(s.portal_active) === 1;
    openModal('studentModal');
}
</script>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
