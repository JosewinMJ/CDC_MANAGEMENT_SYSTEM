<?php
/**
 * CDC Inter-Portal Secure API Bootstrap
 * Authenticates Student Portal, Faculty Portal, and Excel Sync requests via SHA-256 API tokens.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/shared/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

function api_json(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function api_require_token(array $allowedPortals = ['student_portal', 'faculty_portal', 'external_sync']): array
{
    $raw = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($raw === '' && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/^Bearer\s+(.+)$/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
            $raw = trim($m[1]);
        }
    }
    if ($raw === '') {
        api_json(401, ['error' => 'Missing API token. Provide X-API-Key or Authorization: Bearer <token>.']);
    }

    $hash = hash('sha256', $raw);
    $token = Database::fetchOne(
        "SELECT id, portal_name, token_label, scopes, is_active FROM api_tokens WHERE token_hash = ? LIMIT 1",
        [$hash]
    );

    if (!$token || (int)$token['is_active'] !== 1 || !in_array($token['portal_name'], $allowedPortals, true)) {
        AuditLogger::log('API_AUTH_FAILED', 'api_tokens', null, 'Unauthorized API access attempt', 'system', null, 'api_client');
        api_json(403, ['error' => 'Invalid, revoked, or unauthorized portal token.']);
    }

    Database::execute("UPDATE api_tokens SET last_used_at = NOW() WHERE id = ?", [(int)$token['id']]);
    return $token;
}
