<?php
/**
 * CDC Admin Portal - Companies & Recruiters Registry
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/auth_guard.php';
$pageTitle = 'Companies & Recruiters';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Security::requireValidCsrf();
    $action = post_str('action');

    try {
        if ($action === 'save') {
            $id = post_int('id');
            $name = post_str('company_name');
            $industry = post_str('industry');
            $tier = post_str('tier', 'core');
            $website = post_str('website');
            $hrName = post_str('hr_name');
            $hrEmail = post_str('hr_email');
            $hrPhone = post_str('hr_phone');
            $location = post_str('location');
            $isVerified = isset($_POST['is_verified']) ? 1 : 0;
            $notes = post_str('notes');

            if ($name === '' || $industry === '') {
                throw new InvalidArgumentException('Company Name and Industry are required.');
            }

            if ($id > 0) {
                Database::execute(
                    "UPDATE companies SET company_name=?, industry=?, tier=?, website=?, hr_name=?, hr_email=?, hr_phone=?, location=?, is_verified=?, notes=? WHERE id=?",
                    [$name, $industry, $tier, $website, $hrName, $hrEmail, $hrPhone, $location, $isVerified, $notes, $id]
                );
                AuditLogger::log('COMPANY_UPDATED', 'companies', (string)$id, "Updated company {$name}");
                set_flash('success', "Company {$name} updated.");
            } else {
                Database::execute(
                    "INSERT INTO companies (company_name, industry, tier, website, hr_name, hr_email, hr_phone, location, is_verified, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [$name, $industry, $tier, $website, $hrName, $hrEmail, $hrPhone, $location, $isVerified, $notes]
                );
                $newId = Database::lastInsertId();
                AuditLogger::log('COMPANY_CREATED', 'companies', (string)$newId, "Added company {$name}");
                set_flash('success', "Company {$name} added.");
            }
        } elseif ($action === 'delete') {
            $id = post_int('id');
            Database::execute("DELETE FROM companies WHERE id = ?", [$id]);
            AuditLogger::log('COMPANY_DELETED', 'companies', (string)$id, 'Deleted company');
            set_flash('success', 'Company removed.');
        }
    } catch (Throwable $e) {
        set_flash('error', 'Error: ' . $e->getMessage());
    }
    redirect('companies.php');
}

$companies = Database::fetchAll("
    SELECT c.*, (SELECT COUNT(*) FROM placement_drives d WHERE d.company_id = c.id) AS drive_count
    FROM companies c
    ORDER BY c.company_name ASC
");

require_once __DIR__ . '/includes/layout_top.php';
?>

<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <p class="text-sm text-slate-600">Manage partner recruiters, HR contacts, and compensation tiers.</p>
    <div class="flex gap-2">
        <a href="data_exchange.php?download=companies&format=csv" class="px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">Export CSV</a>
        <button type="button" onclick="openAddCompany()" class="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700">+ Add Company</button>
    </div>
</div>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
                <th class="px-4 py-3">Company</th>
                <th class="px-4 py-3">Tier</th>
                <th class="px-4 py-3">HR Contact</th>
                <th class="px-4 py-3">Location</th>
                <th class="px-4 py-3">Drives</th>
                <th class="px-4 py-3 text-right">Actions</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            <?php foreach ($companies as $c): ?>
                <tr class="hover:bg-slate-50/70">
                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-900"><?= e($c['company_name']) ?></div>
                        <div class="text-xs text-slate-500"><?= e($c['industry']) ?></div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium <?= badge_class($c['tier']) ?>">
                            <?= e(strtoupper(str_replace('_', ' ', $c['tier']))) ?>
                        </span>
                    </td>
                    <td class="px-4 py-3 text-xs">
                        <div class="font-medium text-slate-800"><?= e($c['hr_name'] ?: '—') ?></div>
                        <div class="text-slate-500"><?= e($c['hr_email'] ?: '') ?></div>
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-600"><?= e($c['location'] ?: '—') ?></td>
                    <td class="px-4 py-3 text-xs font-semibold text-indigo-600"><?= (int)$c['drive_count'] ?></td>
                    <td class="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <button type="button" onclick='openEditCompany(<?= json_encode($c, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>)' class="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">Edit</button>
                        <form method="POST" class="inline" onsubmit="return confirm('Delete company and its drives?');">
                            <?= Security::csrfField() ?>
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" value="<?= (int)$c['id'] ?>">
                            <button type="submit" class="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700">Delete</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<div id="companyModal" class="cdc-modal">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 id="compModalTitle" class="text-base font-semibold">Add Company</h3>
            <button type="button" onclick="closeModal('companyModal')" class="text-slate-400 text-xl">&times;</button>
        </div>
        <form method="POST" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <?= Security::csrfField() ?>
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="id" id="comp_id" value="0">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
                <input type="text" name="company_name" id="comp_name" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Industry *</label>
                <input type="text" name="industry" id="comp_industry" required class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Tier</label>
                <select name="tier" id="comp_tier" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="super_dream">Super Dream</option>
                    <option value="dream">Dream</option>
                    <option value="core">Core</option>
                    <option value="startup">Startup</option>
                    <option value="mass">Mass Recruiter</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                <input type="text" name="location" id="comp_location" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">HR Name</label>
                <input type="text" name="hr_name" id="comp_hr_name" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">HR Email</label>
                <input type="email" name="hr_email" id="comp_hr_email" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">HR Phone</label>
                <input type="text" name="hr_phone" id="comp_hr_phone" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Website</label>
                <input type="url" name="website" id="comp_website" class="w-full px-3 py-2 rounded-lg border border-slate-300">
            </div>
            <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea name="notes" id="comp_notes" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-300"></textarea>
            </div>
            <div class="sm:col-span-2">
                <label class="inline-flex items-center gap-2 text-xs font-medium">
                    <input type="checkbox" name="is_verified" id="comp_verified" value="1" checked> Verified Recruiter
                </label>
            </div>
            <div class="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('companyModal')" class="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Save Company</button>
            </div>
        </form>
    </div>
</div>

<script>
function openAddCompany() {
    document.getElementById('compModalTitle').textContent = 'Add Company';
    document.getElementById('comp_id').value = 0;
    ['comp_name','comp_industry','comp_location','comp_hr_name','comp_hr_email','comp_hr_phone','comp_website','comp_notes'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('comp_tier').value = 'core';
    document.getElementById('comp_verified').checked = true;
    openModal('companyModal');
}
function openEditCompany(c) {
    document.getElementById('compModalTitle').textContent = 'Edit Company: ' + c.company_name;
    document.getElementById('comp_id').value = c.id;
    document.getElementById('comp_name').value = c.company_name || '';
    document.getElementById('comp_industry').value = c.industry || '';
    document.getElementById('comp_tier').value = c.tier || 'core';
    document.getElementById('comp_location').value = c.location || '';
    document.getElementById('comp_hr_name').value = c.hr_name || '';
    document.getElementById('comp_hr_email').value = c.hr_email || '';
    document.getElementById('comp_hr_phone').value = c.hr_phone || '';
    document.getElementById('comp_website').value = c.website || '';
    document.getElementById('comp_notes').value = c.notes || '';
    document.getElementById('comp_verified').checked = parseInt(c.is_verified) === 1;
    openModal('companyModal');
}
</script>

<?php require_once __DIR__ . '/includes/layout_bottom.php'; ?>
