<?php
/**
 * CDC API - Token-Authenticated CSV / Excel Feed for Portal Sync
 * Example: GET /api/export.php?scope=students&format=csv (with X-API-Key header)
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$token = api_require_token(['student_portal', 'faculty_portal', 'external_sync']);
$scope = (string)($_GET['scope'] ?? '');
$format = ((string)($_GET['format'] ?? 'csv')) === 'excel' ? 'excel' : 'csv';

$allowedScopes = match ($token['portal_name']) {
    'student_portal' => ['students', 'drives'],
    'faculty_portal' => ['faculty', 'students', 'drives', 'applications'],
    default => ['students', 'faculty', 'companies', 'drives', 'applications'],
};

if (!in_array($scope, $allowedScopes, true)) {
    api_json(403, ['error' => 'Your portal token does not have access to scope: ' . $scope]);
}

CsvExcelManager::download($scope, $format);
