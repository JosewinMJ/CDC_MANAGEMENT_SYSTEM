<?php
/**
 * CDC Management System - Shared Bootstrap
 * Include this file across Admin, Student, and Faculty portals for identical DB & security behavior.
 */

declare(strict_types=1);

$cdcConfig = require __DIR__ . '/config.php';

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Security.php';
require_once __DIR__ . '/AuditLogger.php';
require_once __DIR__ . '/CsvExcelManager.php';

Database::init($cdcConfig);
Security::init($cdcConfig);
Security::sendSecurityHeaders();
