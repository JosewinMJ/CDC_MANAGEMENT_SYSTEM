<?php
/**
 * CDC Management System - Unified Security Layer
 * Provides Argon2id/Bcrypt hashing, CSRF protection, XSS escaping,
 * AES-256-GCM encryption, CSV-injection defense, rate limiting, and secure sessions.
 */

declare(strict_types=1);

final class Security
{
    private static array $config = [];

    public static function init(array $config): void
    {
        self::$config = $config;
    }

    public static function sendSecurityHeaders(): void
    {
        if (headers_sent()) {
            return;
        }
        header('X-Frame-Options: SAMEORIGIN');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    }

    public static function startSecureSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $sec = self::$config['security'] ?? [];
        session_name($sec['session_name'] ?? 'CDC_ADMIN_SESS');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        ]);
        session_start();
    }

    public static function hashPassword(string $plain): string
    {
        $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
        return password_hash($plain, $algo);
    }

    public static function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    public static function csrfToken(): string
    {
        self::startSecureSession();
        if (empty($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['_csrf_token'];
    }

    public static function csrfField(): string
    {
        return '<input type="hidden" name="_csrf_token" value="' . self::e(self::csrfToken()) . '">';
    }

    public static function verifyCsrf(?string $token): bool
    {
        self::startSecureSession();
        if (empty($_SESSION['_csrf_token']) || empty($token)) {
            return false;
        }
        return hash_equals($_SESSION['_csrf_token'], $token);
    }

    public static function requireValidCsrf(): void
    {
        $token = $_POST['_csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        if (!self::verifyCsrf($token)) {
            http_response_code(403);
            exit('Security check failed: Invalid or expired CSRF token. Please refresh and try again.');
        }
    }

    public static function e(mixed $value): string
    {
        return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Prevent Excel/CSV Formula Injection (=, +, -, @, tab, CR).
     */
    public static function sanitizeCsvCell(mixed $value): string
    {
        $str = (string)($value ?? '');
        if ($str !== '' && preg_match('/^[=+\-@\t\r]/', $str)) {
            return "'" . $str;
        }
        return $str;
    }

    /**
     * AES-256-GCM authenticated encryption helper for sensitive tokens/fields.
     */
    public static function encryptField(string $plaintext): string
    {
        $key = hash('sha256', self::$config['security']['app_key'] ?? 'cdc_default_key', true);
        $iv = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        if ($cipher === false) {
            throw new RuntimeException('Encryption failed.');
        }
        return base64_encode($iv . $tag . $cipher);
    }

    public static function decryptField(string $encoded): ?string
    {
        $raw = base64_decode($encoded, true);
        if ($raw === false || strlen($raw) < 28) {
            return null;
        }
        $key = hash('sha256', self::$config['security']['app_key'] ?? 'cdc_default_key', true);
        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $cipher = substr($raw, 28);
        $plain = openssl_decrypt($cipher, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        return $plain === false ? null : $plain;
    }

    public static function clientIp(): string
    {
        return substr((string)($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 0, 45);
    }

    public static function isRateLimited(string $identifier, string $portal = 'admin'): bool
    {
        $max = (int)(self::$config['security']['max_login_attempts'] ?? 5);
        $mins = (int)(self::$config['security']['lockout_minutes'] ?? 15);
        $row = Database::fetchOne(
            "SELECT COUNT(*) AS fail_count
             FROM login_attempts
             WHERE identifier = ? AND portal = ? AND was_successful = 0
               AND attempted_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)",
            [$identifier, $portal, $mins]
        );
        return ((int)($row['fail_count'] ?? 0)) >= $max;
    }

    public static function recordLoginAttempt(string $identifier, string $portal, bool $success): void
    {
        Database::execute(
            "INSERT INTO login_attempts (identifier, portal, ip_address, was_successful) VALUES (?, ?, ?, ?)",
            [$identifier, $portal, self::clientIp(), $success ? 1 : 0]
        );
    }
}
