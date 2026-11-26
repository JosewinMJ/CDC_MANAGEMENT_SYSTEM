<?php
/**
 * CDC Management System - Unified Immutable Audit Logger
 */

declare(strict_types=1);

final class AuditLogger
{
    public static function log(
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?string $details = null,
        string $actorRole = 'admin',
        ?int $actorId = null,
        ?string $actorEmail = null
    ): void {
        if ($actorId === null && isset($_SESSION['admin_id'])) {
            $actorId = (int)$_SESSION['admin_id'];
            $actorEmail = $_SESSION['admin_email'] ?? null;
        }
        $ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? 'CLI'), 0, 255);
        Database::execute(
            "INSERT INTO audit_logs (actor_role, actor_id, actor_email, action, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [$actorRole, $actorId, $actorEmail, $action, $entityType, $entityId, $details, Security::clientIp(), $ua]
        );
    }

    public static function logSync(
        string $portalScope,
        string $direction,
        string $format,
        int $recordCount,
        string $fileName,
        ?string $actorEmail = null,
        string $status = 'success',
        ?string $summary = null
    ): void {
        $actorEmail = $actorEmail ?? ($_SESSION['admin_email'] ?? 'system@cdc.edu');
        Database::execute(
            "INSERT INTO data_sync_logs (portal_scope, direction, format, record_count, file_name, actor_email, status, summary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [$portalScope, $direction, $format, $recordCount, $fileName, $actorEmail, $status, $summary]
        );
    }
}
