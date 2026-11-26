<?php
/**
 * CDC Admin Portal - Executive Dashboard
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Executive Dashboard';

// Core KPI Queries
$studentStats = Database::fetchOne("
    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN placement_status = 'placed' THEN 1 ELSE 0 END) AS placed,
        SUM(CASE WHEN placement_status = 'shortlisted' THEN 1 ELSE 0 END) AS shortlisted,
        SUM(CASE WHEN placement_status = 'unplaced' THEN 1 ELSE 0 END) AS unplaced,
        SUM(CASE WHEN placement_status = 'opted_out' THEN 1 ELSE 0 END) AS opted_out,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) AS verified,
        ROUND(COALESCE(AVG(NULLIF(package_lpa, 0)), 0), 2) AS avg_lpa,
        ROUND(COALESCE(MAX(package_lpa), 0), 2) AS max_lpa
    FROM students
");

$facultyCount = (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM faculty_coordinators WHERE portal_active = 1")['c'] ?? 0);
$companyCount = (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM companies WHERE is_verified = 1")['c'] ?? 0);
$openDrivesCount = (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM placement_drives WHERE status IN ('open','upcoming')")['c'] ?? 0);
$appCount = (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM applications")['c'] ?? 0);

// Department breakdown for chart
$deptBreakdown = Database::fetchAll("
    SELECT department,
           COUNT(*) AS total_students,
           SUM(CASE WHEN placement_status = 'placed' THEN 1 ELSE 0 END) AS placed_students
    FROM students
    GROUP BY department
    ORDER BY total_students DESC
");

$upcomingDrives = Database::fetchAll("
    SELECT d.id, d.drive_title, d.job_role, d.package_lpa, d.drive_date, d.status, d.min_cgpa,
           c.company_name, COALESCE(f.full_name, 'Unassigned') AS coordinator_name,
           (SELECT COUNT(*) FROM applications a WHERE a.drive_id = d.id) AS applicant_count
    FROM placement_drives d
    INNER JOIN companies c ON c.id = d.company_id
    LEFT JOIN faculty_coordinators f ON f.id = d.coordinator_id
    ORDER BY d.drive_date DESC
    LIMIT 5
");

$recentAudits = Database::fetchAll("
    SELECT actor_role, actor_email, action, entity_type, details, created_at
    FROM audit_logs
    ORDER BY id DESC
    LIMIT 7
");

$recentSyncs = Database::fetchAll("
    SELECT portal_scope, direction, format, record_count, file_name, status, created_at
    FROM data_sync_logs
    ORDER BY id DESC
    LIMIT 5
");

$totalStudents = (int)($studentStats['total'] ?? 0);
$placedStudents = (int)($studentStats['placed'] ?? 0);
$placementRate = $totalStudents > 0 ? round(($placedStudents / $totalStudents) * 100, 1) : 0.0;

require_once __DIR__ . '/includes/layout_top.php';
?>

<!-- 3-Portal Architecture Status Strip -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Portal 1 &middot; Active</div>
            <div class="text-sm font-bold text-slate-900 mt-0.5">Admin Control Portal</div>
            <div class="text-xs text-slate-500 mt-0.5">Full RBAC &bull; Audit &bull; CSV/Excel Sync</div>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">Online</span>
    </div>
    <a href="students.php" class="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:border-indigo-300 transition">
        <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-blue-600">Portal 2 &middot; Isolated Student DB</div>
            <div class="text-sm font-bold text-slate-900 mt-0.5"><?= $totalStudents ?> Students Registered</div>
            <div class="text-xs text-slate-500 mt-0.5"><?= (int)($studentStats['verified'] ?? 0) ?> Verified &bull; Table: <code>students</code></div>
        </div>
        <i data-lucide="graduation-cap" class="w-8 h-8 text-blue-500/80"></i>
    </a>
    <a href="faculty.php" class="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:border-indigo-300 transition">
        <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-purple-600">Portal 3 &middot; Isolated Faculty DB</div>
            <div class="text-sm font-bold text-slate-900 mt-0.5"><?= $facultyCount ?> Active Coordinators</div>
            <div class="text-xs text-slate-500 mt-0.5">Table: <code>faculty_coordinators</code></div>
        </div>
        <i data-lucide="users" class="w-8 h-8 text-purple-500/80"></i>
    </a>
</div>

<!-- Executive KPI Cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Placement Rate</span>
            <i data-lucide="trending-up" class="w-4 h-4 text-emerald-600"></i>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-slate-900"><?= $placementRate ?>%</span>
            <span class="text-xs text-slate-500"><?= $placedStudents ?> / <?= $totalStudents ?> placed</span>
        </div>
        <div class="mt-3 w-full bg-slate-100 rounded-full h-1.5">
            <div class="bg-emerald-500 h-1.5 rounded-full" style="width: <?= min(100, $placementRate) ?>%"></div>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Packages (LPA)</span>
            <i data-lucide="award" class="w-4 h-4 text-indigo-600"></i>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-slate-900"><?= e($studentStats['max_lpa'] ?? '0.00') ?></span>
            <span class="text-xs text-slate-500">Highest LPA</span>
        </div>
        <div class="mt-2 text-xs text-slate-500">
            Average Package: <strong class="text-slate-700"><?= e($studentStats['avg_lpa'] ?? '0.00') ?> LPA</strong>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Drives &amp; Recruiters</span>
            <i data-lucide="briefcase" class="w-4 h-4 text-blue-600"></i>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-slate-900"><?= $openDrivesCount ?></span>
            <span class="text-xs text-slate-500">Active / Upcoming</span>
        </div>
        <div class="mt-2 text-xs text-slate-500">
            Verified Companies: <strong class="text-slate-700"><?= $companyCount ?></strong>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Drive Applications</span>
            <i data-lucide="file-check-2" class="w-4 h-4 text-amber-600"></i>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-slate-900"><?= $appCount ?></span>
            <span class="text-xs text-slate-500">Total Submissions</span>
        </div>
        <div class="mt-2 text-xs text-slate-500">
            Shortlisted Students: <strong class="text-slate-700"><?= (int)($studentStats['shortlisted'] ?? 0) ?></strong>
        </div>
    </div>
</div>

<!-- Charts Row -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h2 class="text-sm font-semibold text-slate-900">Department-wise Placement Overview</h2>
                <p class="text-xs text-slate-500">Total vs Placed students across academic departments</p>
            </div>
            <a href="students.php" class="text-xs font-medium text-indigo-600 hover:text-indigo-700">Manage Students &rarr;</a>
        </div>
        <div class="h-64">
            <canvas id="deptChart"></canvas>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-900">Student Status Distribution</h2>
        <p class="text-xs text-slate-500 mb-4">Live breakdown from Student DB</p>
        <div class="h-56 flex items-center justify-center">
            <canvas id="statusChart"></canvas>
        </div>
    </div>
</div>

<!-- Tables Row: Drives & Sync/Audit -->
<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div class="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-900">Recent &amp; Active Placement Drives</h2>
            <a href="drives.php" class="text-xs font-medium text-indigo-600 hover:underline">View All Drives</a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                    <th class="px-4 py-3">Company / Role</th>
                    <th class="px-4 py-3">Package</th>
                    <th class="px-4 py-3">Coordinator</th>
                    <th class="px-4 py-3">Drive Date</th>
                    <th class="px-4 py-3">Applicants</th>
                    <th class="px-4 py-3">Status</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                <?php foreach ($upcomingDrives as $d): ?>
                    <tr class="hover:bg-slate-50/70">
                        <td class="px-4 py-3">
                            <div class="font-semibold text-slate-900"><?= e($d['company_name']) ?></div>
                            <div class="text-xs text-slate-500"><?= e($d['job_role']) ?> &middot; Min CGPA <?= e($d['min_cgpa']) ?></div>
                        </td>
                        <td class="px-4 py-3 font-medium text-slate-800"><?= e($d['package_lpa']) ?> LPA</td>
                        <td class="px-4 py-3 text-xs text-slate-600"><?= e($d['coordinator_name']) ?></td>
                        <td class="px-4 py-3 text-xs text-slate-600"><?= e($d['drive_date']) ?></td>
                        <td class="px-4 py-3 text-xs font-semibold text-indigo-600"><?= (int)$d['applicant_count'] ?></td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium <?= badge_class($d['status']) ?>">
                                <?= e(ucfirst($d['status'])) ?>
                            </span>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-900">Security Audit Feed</h2>
            <a href="audit_logs.php" class="text-xs font-medium text-indigo-600 hover:underline">Full Trail</a>
        </div>
        <div class="divide-y divide-slate-100 flex-1">
            <?php foreach ($recentAudits as $log): ?>
                <div class="px-4 py-3 text-xs">
                    <div class="flex items-center justify-between gap-2">
                        <span class="font-semibold text-slate-800"><?= e($log['action']) ?></span>
                        <span class="text-slate-400"><?= e(date('M d, H:i', strtotime($log['created_at']))) ?></span>
                    </div>
                    <div class="text-slate-500 mt-0.5 truncate"><?= e($log['details']) ?></div>
                    <div class="text-[11px] text-slate-400 mt-0.5"><?= e($log['actor_email'] ?? 'system') ?></div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<!-- Quick Excel/CSV Export Shortcuts -->
<div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div>
        <h2 class="text-sm font-semibold text-slate-900">Quick Role-Isolated Database Exports (Excel &amp; CSV)</h2>
        <p class="text-xs text-slate-500 mt-0.5">Download separate Student &amp; Faculty spreadsheets to share directly with the Student and Faculty portals.</p>
    </div>
    <div class="flex flex-wrap gap-2">
        <a href="data_exchange.php?download=students&format=csv" class="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
            Student DB (.CSV)
        </a>
        <a href="data_exchange.php?download=students&format=excel" class="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700">
            Student DB (.XLS)
        </a>
        <a href="data_exchange.php?download=faculty&format=csv" class="px-3 py-2 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200">
            Faculty DB (.CSV)
        </a>
        <a href="data_exchange.php?download=faculty&format=excel" class="px-3 py-2 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700">
            Faculty DB (.XLS)
        </a>
    </div>
</div>

<script>
const deptLabels = <?= json_encode(array_column($deptBreakdown, 'department')) ?>;
const deptTotal = <?= json_encode(array_map('intval', array_column($deptBreakdown, 'total_students'))) ?>;
const deptPlaced = <?= json_encode(array_map('intval', array_column($deptBreakdown, 'placed_students'))) ?>;

new Chart(document.getElementById('deptChart'), {
    type: 'bar',
    data: {
        labels: deptLabels,
        datasets: [
            { label: 'Total Students', data: deptTotal, backgroundColor: '#CBD5E1', borderRadius: 6 },
            { label: 'Placed Students', data: deptPlaced, backgroundColor: '#4F46E5', borderRadius: 6 }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
});

new Chart(document.getElementById('statusChart'), {
    type: 'doughnut',
    data: {
        labels: ['Placed', 'Shortlisted', 'Unplaced', 'Opted Out'],
        datasets: [{
            data: [
                <?= (int)($studentStats['placed'] ?? 0) ?>,
                <?= (int)($studentStats['shortlisted'] ?? 0) ?>,
                <?= (int)($studentStats['unplaced'] ?? 0) ?>,
                <?= (int)($studentStats['opted_out'] ?? 0) ?>
            ],
            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#94A3B8'],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: { legend: { position: 'bottom' } }
    }
});
</script>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
