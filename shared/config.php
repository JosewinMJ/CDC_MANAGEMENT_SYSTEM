<?php
/**
 * CDC Management System - Unified Configuration
 * Shared across Admin Portal, Student Portal, and Faculty/Coordinator Portal.
 */

declare(strict_types=1);

return [
    'app_name' => 'CDC Management System',
    'institution' => 'Career Development Centre',
    'timezone' => 'Asia/Kolkata',
    'db' => [
        'host' => getenv('CDC_DB_HOST') ?: '127.0.0.1',
        'port' => (int)(getenv('CDC_DB_PORT') ?: 3306),
        'database' => getenv('CDC_DB_NAME') ?: 'cdc_management',
        'username' => getenv('CDC_DB_USER') ?: 'root',
        'password' => getenv('CDC_DB_PASS') !== false ? (string)getenv('CDC_DB_PASS') : '',
        'charset' => 'utf8mb4',
    ],
    'security' => [
        // 32-byte key for AES-256-GCM field encryption (override via CDC_APP_KEY env var in production)
        'app_key' => getenv('CDC_APP_KEY') ?: 'cdc_mgt_2026_secure_32byte_key!!',
        'session_name' => 'CDC_ADMIN_SESS',
        'session_lifetime' => 3600, // 60 minutes idle timeout
        'max_login_attempts' => 5,
        'lockout_minutes' => 15,
    ],
    'paths' => [
        'root' => dirname(__DIR__),
        'exports' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'exports',
    ],
];
