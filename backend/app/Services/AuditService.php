<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditService
{
    public static function log(
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?string $details = null,
        ?string $remarks = null,
        ?Request $request = null
    ): void {
        $req = $request ?? request();
        $user = $req?->user();

        AuditLog::create([
            'actor_user_id' => $user?->id,
            'actor_name' => $user?->name ?? 'System',
            'actor_role' => $user?->role ?? 'SYSTEM',
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'remarks' => $remarks,
            'ip_address' => $req?->ip() ?? '127.0.0.1',
            'academic_year' => '2026-2027',
        ]);
    }
}
