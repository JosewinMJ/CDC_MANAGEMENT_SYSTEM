<?php
/**
 * Admin Portal Top Shell (Sidebar + Header + Flash Banner)
 */
$pageTitle = $pageTitle ?? 'Admin Dashboard';
$activePage = basename($_SERVER['PHP_SELF']);
$flash = get_flash();

$navGroups = [
    'Overview' => [
        ['href' => 'index.php', 'label' => 'Dashboard', 'icon' => 'layout-dashboard'],
    ],
    'Portal Databases' => [
        ['href' => 'students.php', 'label' => 'Student Database', 'icon' => 'graduation-cap'],
        ['href' => 'faculty.php', 'label' => 'Faculty & Coordinators', 'icon' => 'users'],
    ],
    'Placement Operations' => [
        ['href' => 'companies.php', 'label' => 'Companies & HRs', 'icon' => 'building-2'],
        ['href' => 'drives.php', 'label' => 'Placement Drives', 'icon' => 'briefcase'],
        ['href' => 'applications.php', 'label' => 'Applications', 'icon' => 'file-check-2'],
        ['href' => 'training.php', 'label' => 'Training Sessions', 'icon' => 'presentation'],
    ],
    'Sync & Communication' => [
        ['href' => 'data_exchange.php', 'label' => 'Excel / CSV Sync Hub', 'icon' => 'file-spreadsheet'],
        ['href' => 'notices.php', 'label' => 'Portal Notices', 'icon' => 'megaphone'],
    ],
    'Security & Governance' => [
        ['href' => 'audit_logs.php', 'label' => 'Audit & Login Logs', 'icon' => 'shield-check'],
        ['href' => 'settings.php', 'label' => 'Settings & API Tokens', 'icon' => 'settings'],
    ],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($pageTitle) ?> — CDC Admin Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
    <link rel="stylesheet" href="assets/app.css">
</head>
<body class="bg-slate-50 text-slate-900 antialiased">
<div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 -translate-x-full lg:translate-x-0">
        <div class="h-16 px-5 flex items-center gap-3 border-b border-slate-800">
            <div class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                CDC
            </div>
            <div class="min-w-0">
                <div class="text-sm font-semibold text-white truncate">CDC Admin Portal</div>
                <div class="text-[11px] text-slate-400 truncate">3-Portal Unified Control</div>
            </div>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            <?php foreach ($navGroups as $groupLabel => $items): ?>
                <div>
                    <div class="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <?= e($groupLabel) ?>
                    </div>
                    <div class="space-y-0.5">
                        <?php foreach ($items as $item):
                            $isActive = $activePage === $item['href'];
                            $cls = $isActive
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white';
                        ?>
                            <a href="<?= e($item['href']) ?>" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors <?= $cls ?>">
                                <i data-lucide="<?= e($item['icon']) ?>" class="w-4 h-4 shrink-0"></i>
                                <span class="truncate"><?= e($item['label']) ?></span>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </nav>

        <div class="p-3 border-t border-slate-800 bg-slate-950/40">
            <div class="flex items-center gap-2.5 px-2 py-1.5">
                <div class="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold uppercase">
                    <?= e(substr($currentAdmin['full_name'], 0, 2)) ?>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold text-white truncate"><?= e($currentAdmin['full_name']) ?></div>
                    <div class="text-[11px] text-slate-400 truncate"><?= e(str_replace('_', ' ', $currentAdmin['role'])) ?></div>
                </div>
            </div>
            <div class="mt-2 flex gap-2">
                <a href="/phpmyadmin" target="_blank" rel="noopener" class="flex-1 text-center text-xs py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition">
                    phpMyAdmin
                </a>
                <a href="logout.php" class="flex-1 text-center text-xs py-1.5 rounded-md bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition">
                    Sign Out
                </a>
            </div>
        </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 lg:pl-64 flex flex-col min-w-0">
        <!-- Top Header -->
        <header class="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
                <button type="button" onclick="toggleSidebar()" class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Toggle Menu">
                    <i data-lucide="menu" class="w-5 h-5"></i>
                </button>
                <div class="min-w-0">
                    <h1 class="text-lg font-semibold text-slate-900 truncate"><?= e($pageTitle) ?></h1>
                </div>
            </div>

            <div class="flex items-center gap-2.5">
                <a href="data_exchange.php" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition">
                    <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
                    Excel / CSV Hub
                </a>
                <span class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    MySQL PDO Secure
                </span>
            </div>
        </header>

        <!-- Content Body -->
        <main class="flex-1 p-4 sm:p-6 space-y-6">
            <?php if ($flash): ?>
                <?php
                    $isErr = $flash['type'] === 'error';
                    $bannerCls = $isErr
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800';
                ?>
                <div class="rounded-xl border px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 <?= $bannerCls ?>">
                    <div class="flex items-center gap-2">
                        <i data-lucide="<?= $isErr ? 'alert-circle' : 'check-circle-2' ?>" class="w-4 h-4 shrink-0"></i>
                        <span><?= e($flash['message']) ?></span>
                    </div>
                    <button type="button" onclick="this.parentElement.remove()" class="opacity-60 hover:opacity-100">&times;</button>
                </div>
            <?php endif; ?>
