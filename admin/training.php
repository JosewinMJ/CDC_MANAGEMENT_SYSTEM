<?php
/**
 * CDC Admin Portal - Training Sessions & Workshops
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Training Sessions';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'save') {
            $title = post_str('title');
            $cat = post_str('topic_category', 'coding');
            $facId = post_int('faculty_id') ?: null;
            $dept = strtoupper(post_str('target_department', 'ALL'));
            $batch = post_int('batch_year', 2027);
            $date = post_str('session_date');
            $start = post_str('start_time', '10:00');
            $end = post_str('end_time', '12:00');
            $venue = post_str('venue_or_link');
            $seats = post_int('max_seats', 100);
            $status = post_str('status', 'scheduled');

            if ($title === '' || $date === '' || $venue === '') {
                throw new InvalidArgumentException('Title, Date, and Venue/Link are required.');
            }
            Database::execute(
                "INSERT INTO training_sessions (title, topic_category, faculty_id, target_department, batch_year, session_date, start_time, end_time, venue_or_link, max_seats, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [$title, $cat, $facId, $dept, $batch, $date, $start, $end, $venue, $seats, $status]
            );
            AuditLogger::log('TRAINING_CREATED', 'training_sessions', (string)Database::lastInsertId(), "Scheduled {$title}");
            set_flash('success', "Training session '{$title}' scheduled.");
        } elseif ($action === 'delete') {
            $id = post_int('id');
            Database::execute("DELETE FROM training_sessions WHERE id = ?", [$id]);
            AuditLogger::log('TRAINING_DELETED', 'training_sessions', (string)$id, 'Deleted training session');
            set_flash('success', 'Training session removed.');
        }
    } catch (Throwable $e) {
        set_flash('error', 'Error: ' . $e->getMessage());
    }
    redirect('training.php');
}

$sessions = Database::fetchAll("
    SELECT t.*, COALESCE(f.full_name, 'External / TBA') AS trainer_name
    FROM training_sessions t
    LEFT JOIN faculty_coordinators f ON f.id = t.faculty_id
    ORDER BY t.session_date DESC
");
$faculty = Database::fetchAll("SELECT id, full_name, department FROM faculty_coordinators WHERE portal_active = 1 ORDER BY full_name");

require_once __DIR__ . '/includes/layout_top.php';
?>

<div class="flex items-center justify-between">
    <p class="text-sm text-slate-600">Schedule aptitude, coding, and mock interview bootcamps led by CDC faculty &amp; trainers.</p>
    <button type="button" onclick="openModal('trainingModal')" class="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700">+ Schedule Session</button>
</div>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
                <th class="px-4 py-3">Session Title</th>
                <th class="px-4 py-3">Faculty / Trainer</th>
                <th class="px-4 py-3">Target</th>
                <th class="px-4 py-3">Schedule &amp; Venue</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Action</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            <?php foreach ($sessions as $t): ?>
                <tr>
                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-900"><?= e($t['title']) ?></div>
                        <div class="text-xs text-slate-500"><?= e(strtoupper(str_replace('_', ' ', $t['topic_category']))) ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-700"><?= e($t['trainer_name']) ?></td>
                    <td class="px-4 py-3 text-xs"><?= e($t['target_department']) ?> &middot; Batch <?= e($t['batch_year']) ?></td>
                    <td class="px-4 py-3 text-xs">
                        <div><?= e($t['session_date']) ?> (<?= e(substr($t['start_time'], 0, 5)) ?> - <?= e(substr($t['end_time'], 0, 5)) ?>)</div>
                        <div class="text-slate-500"><?= e($t['venue_or_link']) ?> &middot; Max <?= (int)$t['max_seats'] ?></div>
                    </td>
                    <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-medium <?= badge_class($t['status']) ?>"><?= e(ucfirst($t['status'])) ?></span></td>
                    <td class="px-4 py-3 text-right">
                        <form method="POST" onsubmit="return confirm('Remove session?');">
                            <?= Security::csrfField() ?>
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" value="<?= (int)$t['id'] ?>">
                            <button type="submit" class="px-2.5 py-1 rounded bg-rose-50 text-rose-700 text-xs font-medium">Delete</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<div id="trainingModal" class="cdc-modal">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-base font-semibold">Schedule Training Session</h3>
            <button type="button" onclick="closeModal('trainingModal')" class="text-slate-400 text-xl">&times;</button>
        </div>
        <form method="POST" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="save">
            <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">Session Title *</label>
                <input type="text" name="title" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select name="topic_category" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="coding">Coding / DSA</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="mock_interview">Mock Interview</option>
                    <option value="soft_skills">Soft Skills</option>
                    <option value="resume">Resume Building</option>
                    <option value="domain">Domain Specific</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Faculty / Trainer</label>
                <select name="faculty_id" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="">-- External / TBA --</option>
                    <?php foreach ($faculty as $f): ?>
                        <option value="<?= (int)$f['id'] ?>"><?= e($f['full_name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Target Dept</label>
                <input type="text" name="target_department" value="ALL" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Batch Year</label>
                <input type="number" name="batch_year" value="2027" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Session Date *</label>
                <input type="date" name="session_date" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Max Seats</label>
                <input type="number" name="max_seats" value="120" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                <input type="time" name="start_time" value="10:00" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                <input type="time" name="end_time" value="12:30" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">Venue / Meeting Link *</label>
                <input type="text" name="venue_or_link" required placeholder="Main Auditorium or Meet URL" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div class="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onclick="closeModal('trainingModal')" class="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Schedule</button>
            </div>
        </form>
    </div>
</div>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
