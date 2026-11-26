<?php
/**
 * Admin Portal UI & Validation Helpers
 */

declare(strict_types=1);

function e(mixed $val): string
{
    return Security::e($val);
}

function redirect(string $url): never
{
    header('Location: ' . $url);
    exit;
}

function set_flash(string $type, string $message): void
{
    Security::startSecureSession();
    $_SESSION['_flash'] = ['type' => $type, 'message' => $message];
}

function get_flash(): ?array
{
    Security::startSecureSession();
    if (!isset($_SESSION['_flash'])) {
        return null;
    }
    $flash = $_SESSION['_flash'];
    unset($_SESSION['_flash']);
    return $flash;
}

function badge_class(string $status): string
{
    return match (strtolower($status)) {
        'placed', 'accepted', 'offered', 'completed', 'open', 'super_dream', 'success' => 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
        'shortlisted', 'interview', 'upcoming', 'dream', 'ongoing', 'important' => 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
        'applied', 'scheduled', 'core', 'normal', 'partial' => 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
        'rejected', 'cancelled', 'closed', 'opted_out', 'urgent', 'failed', 'withdrawn' => 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
        default => 'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20',
    };
}

function post_str(string $key, string $default = ''): string
{
    return trim((string)($_POST[$key] ?? $default));
}

function post_int(string $key, int $default = 0): int
{
    return (int)($_POST[$key] ?? $default);
}

function post_float(string $key, float $default = 0.0): float
{
    return (float)($_POST[$key] ?? $default);
}
