<?php
/**
 * CDC Admin Portal - Unified Excel / CSV Data Exchange & Portal Sync Hub
 * Exports separate Student DB, Faculty DB, Companies, Drives, and Applications
 * in both CSV (UTF-8 BOM) and Excel (.XLS SpreadsheetML), plus validated CSV Import.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Excel / CSV Sync Hub';

// Handle Direct Download Requests BEFORE outputting any HTML
if (isset($_GET['download'])) {
    $scope = (string)$_GET['download'];
    $format = ((string)($_GET['format'] ?? 'csv')) === 'excel' ? 'excel' : 'csv';
    try {
        CsvExcelManager::download($scope, $format);
    } catch (Throwable $e) {
        set_flash('error', $e->getMessage());
        redirect('data_exchange.php');
    }
}

// Handle Sample CSV Template Download
if (isset($_GET['template'])) {
    $tpl = (string)$_GET['template'];
    if ($tpl === 'students') {
        $headers = ['roll_no', 'full_name', 'email', 'phone', 'department', 'program', 'batch_year', 'semester', 'cgpa', 'active_backlogs', 'skills', 'placement_status'];
        $sample = [['roll_no' => '23CSE099', 'full_name' => 'Sample Student', 'email' => 'sample.s@student.cdc.edu', 'phone' => '+91-9800000001', 'department' => 'CSE', 'program' => 'B.Tech', 'batch_year' => '2027', 'semester' => '7', 'cgpa' => '8.50', 'active_backlogs' => '0', 'skills' => 'Python, SQL', 'placement_status' => 'unplaced']];
        $content = CsvExcelManager::buildCsvContent($headers, $sample);
        $fname = 'template_students_import.csv';
    } else {
        $headers = ['employee_id', 'full_name', 'email', 'phone', 'department', 'designation', 'coordinator_role', 'assigned_batches', 'can_manage_drives', 'can_verify_students'];
        $sample = [['employee_id' => 'FAC-199', 'full_name' => 'Dr. Sample Faculty', 'email' => 'sample.f@cdc.edu', 'phone' => '+91-9800000002', 'department' => 'CSE', 'designation' => 'Assistant Professor', 'coordinator_role' => 'dept_coordinator', 'assigned_batches' => '2027', 'can_manage_drives' => '1', 'can_verify_students' => '1']];
        $content = CsvExcelManager::buildCsvContent($headers, $sample);
        $fname = 'template_faculty_import.csv';
    }
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $fname . '"');
    echo $content;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'sync_snapshots') {
            $summary = CsvExcelManager::syncAllSnapshots($cdcConfig['paths']['exports']);
            set_flash('success', 'Synchronized all CSV & Excel snapshots to exports/ (' . json_encode($summary) . ').');
        } elseif ($action === 'import_csv') {
            $scope = post_str('scope');
            $defaultPass = post_str('default_password', 'Portal@1234');
            if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
                throw new RuntimeException('Please select a valid CSV file to upload.');
            }
            $ext = strtolower(pathinfo((string)$_FILES['csv_file']['name'], PATHINFO_EXTENSION));
            if ($ext !== 'csv') {
                throw new InvalidArgumentException('Only .csv files are accepted for secure import (save Excel sheets as CSV UTF-8).');
            }
            $res = CsvExcelManager::importCsv($scope, $_FILES['csv_file']['tmp_name'], $defaultPass ?: 'Portal@1234');
            $fileName = basename((string)$_FILES['csv_file']['name']);
            $summaryText = "Inserted: {$res['inserted']}, Updated: {$res['updated']}, Errors: " . count($res['errors']);
            AuditLogger::logSync($scope, 'import', 'csv', $res['inserted'] + $res['updated'], $fileName, null, empty($res['errors']) ? 'success' : 'partial', $summaryText);
            AuditLogger::log('CSV_IMPORT', $scope, null, "{$fileName} -> {$summaryText}");

            $msg = "Imported {$fileName} into {$scope} database ({$summaryText}).";
            if (!empty($res['errors'])) {
                $msg .= ' First error: ' . $res['errors'][0];
            }
            set_flash(empty($res['errors']) ? 'success' : 'error', $msg);
        }
    } catch (Throwable $e) {
        set_flash('error', 'Sync/Import failed: ' . $e->getMessage());
    }
    redirect('data_exchange.php');
}

$syncLogs = Database::fetchAll("SELECT * FROM data_sync_logs ORDER BY id DESC LIMIT 20");
$counts = [
    'students' => (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM students")['c'] ?? 0),
    'faculty' => (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM faculty_coordinators")['c'] ?? 0),
    'companies' => (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM companies")['c'] ?? 0),
    'drives' => (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM placement_drives")['c'] ?? 0),
    'applications' => (int)(Database::fetchOne("SELECT COUNT(*) AS c FROM applications")['c'] ?? 0),
];

require_once __DIR__ . '/includes/layout_top.php';
?>

<!-- Sync Banner -->
<div class="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
    <div>
        <div class="text-xs font-semibold uppercase tracking-wider text-indigo-300">Role-Isolated Portal Data Exchange</div>
        <h2 class="text-xl font-bold mt-1">Share Separate Student &amp; Faculty Databases via Excel / CSV</h2>
        <p class="text-xs text-slate-300 mt-1 max-w-2xl">
            Student data and Faculty data are stored in separate MySQL tables and exported into independent CSV &amp; Excel (.XLS) files with formula-injection protection, so all 3 portals stay synchronized securely.
        </p>
    </div>
    <form method="POST">
        <?= Security::csrfField() ?>
        <input type="hidden" name="action" value="sync_snapshots">
        <button type="submit" class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow-sm whitespace-nowrap">
            Refresh All Portal Snapshots
        </button>
    </form>
</div>

<!-- Role-Isolated Export Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    <?php
    $cards = [
        ['scope' => 'students', 'title' => 'Student Portal Database', 'desc' => 'Separate student academic, CGPA, skills & placement status table.', 'color' => 'blue'],
        ['scope' => 'faculty', 'title' => 'Faculty / Coordinator Database', 'desc' => 'Separate faculty IDs, departments, roles & portal permissions.', 'color' => 'purple'],
        ['scope' => 'drives', 'title' => 'Placement Drives (Shared)', 'desc' => 'Active & upcoming campus drives shared across all 3 portals.', 'color' => 'indigo'],
        ['scope' => 'companies', 'title' => 'Verified Companies Registry', 'desc' => 'Recruiter tiers, HR contacts & verification records.', 'color' => 'emerald'],
        ['scope' => 'applications', 'title' => 'Student Applications Report', 'desc' => 'Joined student + company + drive application pipeline.', 'color' => 'amber'],
    ];
    foreach ($cards as $c): ?>
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-900"><?= e($c['title']) ?></h3>
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"><?= $counts[$c['scope']] ?> rows</span>
                </div>
                <p class="text-xs text-slate-500 mt-1.5"><?= e($c['desc']) ?></p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <a href="?download=<?= e($c['scope']) ?>&format=csv" class="flex-1 text-center py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800">
                    Download .CSV
                </a>
                <a href="?download=<?= e($c['scope']) ?>&format=excel" class="flex-1 text-center py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                    Download Excel (.XLS)
                </a>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<!-- CSV Import Forms (Separate for Student DB vs Faculty DB) -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-900">Import into Student Database (.CSV)</h3>
            <a href="?template=students" class="text-xs font-medium text-indigo-600 hover:underline">Download Sample Template</a>
        </div>
        <form method="POST" enctype="multipart/form-data" class="space-y-3 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="import_csv">
            <input type="hidden" name="scope" value="students">
            <input type="file" name="csv_file" accept=".csv" required class="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Default Password for New Students</label>
                <input type="text" name="default_password" value="Portal@1234" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
            </div>
            <button type="submit" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                Upload &amp; Upsert Student CSV
            </button>
        </form>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-900">Import into Faculty Database (.CSV)</h3>
            <a href="?template=faculty" class="text-xs font-medium text-indigo-600 hover:underline">Download Sample Template</a>
        </div>
        <form method="POST" enctype="multipart/form-data" class="space-y-3 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="import_csv">
            <input type="hidden" name="scope" value="faculty">
            <input type="file" name="csv_file" accept=".csv" required class="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 file:font-semibold">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Default Password for New Faculty</label>
                <input type="text" name="default_password" value="Portal@1234" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
            </div>
            <button type="submit" class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold">
                Upload &amp; Upsert Faculty CSV
            </button>
        </form>
    </div>
</div>

<!-- Sync History Table -->
<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="text-sm font-semibold text-slate-900">Recent CSV / Excel Sync &amp; Transfer Logs</h3>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
            <tr>
                <th class="px-4 py-3">Timestamp</th>
                <th class="px-4 py-3">Portal Scope</th>
                <th class="px-4 py-3">Direction / Format</th>
                <th class="px-4 py-3">Records</th>
                <th class="px-4 py-3">File Name</th>
                <th class="px-4 py-3">Actor</th>
                <th class="px-4 py-3">Status</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            <?php if (!$syncLogs): ?>
                <tr><td colspan="7" class="px-4 py-6 text-center text-slate-400">No CSV/Excel transfers recorded yet.</td></tr>
            <?php endif; ?>
            <?php foreach ($syncLogs as $log): ?>
                <tr>
                    <td class="px-4 py-3 text-slate-500"><?= e($log['created_at']) ?></td>
                    <td class="px-4 py-3 font-semibold text-slate-800"><?= e(strtoupper($log['portal_scope'])) ?></td>
                    <td class="px-4 py-3"><?= e(ucfirst($log['direction'])) ?> &middot; <code><?= e($log['format']) ?></code></td>
                    <td class="px-4 py-3 font-semibold"><?= (int)$log['record_count'] ?></td>
                    <td class="px-4 py-3 text-slate-600"><?= e($log['file_name']) ?></td>
                    <td class="px-4 py-3 text-slate-500"><?= e($log['actor_email']) ?></td>
                    <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full font-medium <?= badge_class($log['status']) ?>"><?= e($log['status']) ?></span></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
