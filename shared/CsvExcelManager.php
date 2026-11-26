<?php
/**
 * CDC Management System - Secure CSV & Excel (.xls SpreadsheetML) Exchange Engine
 * Generates clean, separate role-isolated datasets for Student Portal, Faculty Portal,
 * Companies, Placement Drives, and Applications, plus safe validated CSV import.
 */

declare(strict_types=1);

final class CsvExcelManager
{
    /**
     * Fetch dataset rows and headers for a specific portal scope.
     * Notice how Student DB and Faculty DB are strictly separated!
     */
    public static function getScopeDataset(string $scope): array
    {
        return match ($scope) {
            'students' => [
                'title' => 'CDC Student Portal Database',
                'filename_base' => 'cdc_students_database',
                'headers' => [
                    'roll_no', 'full_name', 'email', 'phone', 'department', 'program',
                    'batch_year', 'semester', 'cgpa', 'active_backlogs', 'skills',
                    'placement_status', 'placed_company', 'package_lpa', 'is_verified', 'portal_active'
                ],
                'rows' => Database::fetchAll(
                    "SELECT roll_no, full_name, email, phone, department, program, batch_year,
                            semester, cgpa, active_backlogs, skills, placement_status,
                            placed_company, package_lpa, is_verified, portal_active
                     FROM v_student_portal_db ORDER BY department, roll_no"
                ),
            ],
            'faculty' => [
                'title' => 'CDC Faculty & Coordinator Portal Database',
                'filename_base' => 'cdc_faculty_database',
                'headers' => [
                    'employee_id', 'full_name', 'email', 'phone', 'department', 'designation',
                    'coordinator_role', 'assigned_batches', 'can_manage_drives', 'can_verify_students', 'portal_active'
                ],
                'rows' => Database::fetchAll(
                    "SELECT employee_id, full_name, email, phone, department, designation,
                            coordinator_role, assigned_batches, can_manage_drives, can_verify_students, portal_active
                     FROM v_faculty_portal_db ORDER BY department, employee_id"
                ),
            ],
            'companies' => [
                'title' => 'CDC Verified Companies Registry',
                'filename_base' => 'cdc_companies_database',
                'headers' => [
                    'id', 'company_name', 'industry', 'tier', 'website', 'hr_name',
                    'hr_email', 'hr_phone', 'location', 'is_verified'
                ],
                'rows' => Database::fetchAll(
                    "SELECT id, company_name, industry, tier, website, hr_name, hr_email, hr_phone, location, is_verified
                     FROM companies ORDER BY company_name"
                ),
            ],
            'drives' => [
                'title' => 'CDC Placement Drives Schedule',
                'filename_base' => 'cdc_drives_shared',
                'headers' => [
                    'id', 'company_name', 'drive_title', 'job_role', 'package_lpa',
                    'eligible_departments', 'min_cgpa', 'max_backlogs', 'batch_year',
                    'drive_date', 'application_deadline', 'drive_mode', 'status', 'coordinator_name'
                ],
                'rows' => Database::fetchAll(
                    "SELECT d.id, c.company_name, d.drive_title, d.job_role, d.package_lpa,
                            d.eligible_departments, d.min_cgpa, d.max_backlogs, d.batch_year,
                            d.drive_date, d.application_deadline, d.drive_mode, d.status,
                            COALESCE(f.full_name, 'Unassigned') AS coordinator_name
                     FROM placement_drives d
                     INNER JOIN companies c ON c.id = d.company_id
                     LEFT JOIN faculty_coordinators f ON f.id = d.coordinator_id
                     ORDER BY d.drive_date DESC"
                ),
            ],
            'applications' => [
                'title' => 'CDC Student Applications Report',
                'filename_base' => 'cdc_applications_report',
                'headers' => [
                    'application_id', 'roll_no', 'student_name', 'student_email', 'department',
                    'cgpa', 'company_name', 'drive_title', 'job_role', 'package_lpa',
                    'application_status', 'remarks', 'applied_at'
                ],
                'rows' => Database::fetchAll("SELECT * FROM v_applications_report ORDER BY applied_at DESC"),
            ],
            default => throw new InvalidArgumentException("Unsupported export scope: {$scope}"),
        };
    }

    /**
     * Build UTF-8 BOM RFC-4180 CSV content with formula-injection protection.
     */
    public static function buildCsvContent(array $headers, array $rows): string
    {
        $fh = fopen('php://temp', 'r+');
        fwrite($fh, "\xEF\xBB\xBF"); // UTF-8 BOM for seamless Excel opening
        fputcsv($fh, $headers);
        foreach ($rows as $row) {
            $line = [];
            foreach ($headers as $col) {
                $line[] = Security::sanitizeCsvCell($row[$col] ?? '');
            }
            fputcsv($fh, $line);
        }
        rewind($fh);
        $csv = stream_get_contents($fh);
        fclose($fh);
        return $csv === false ? '' : $csv;
    }

    /**
     * Build native Excel SpreadsheetML (.xls) XML workbook with styled header row.
     */
    public static function buildExcelXmlContent(string $sheetTitle, array $headers, array $rows): string
    {
        $safeSheet = preg_replace('/[\\\\\\/\\?\\*\\[\\]:]/', '', substr($sheetTitle, 0, 31)) ?: 'CDC_Data';
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<?mso-application progid="Excel.Sheet"?>' . "\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"'
              . ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' . "\n";
        $xml .= '<Styles>'
              . '<Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/>'
              . '<Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/></Style>'
              . '<Style ss:ID="Cell"><Font ss:Size="10"/></Style>'
              . '</Styles>' . "\n";
        $xml .= '<Worksheet ss:Name="' . htmlspecialchars($safeSheet, ENT_XML1, 'UTF-8') . '">' . "\n";
        $xml .= '<Table>' . "\n";

        // Header row
        $xml .= '<Row>';
        foreach ($headers as $h) {
            $label = strtoupper(str_replace('_', ' ', (string)$h));
            $xml .= '<Cell ss:StyleID="Header"><Data ss:Type="String">'
                  . htmlspecialchars($label, ENT_XML1, 'UTF-8') . '</Data></Cell>';
        }
        $xml .= '</Row>' . "\n";

        // Data rows
        foreach ($rows as $row) {
            $xml .= '<Row>';
            foreach ($headers as $col) {
                $raw = $row[$col] ?? '';
                $isNumeric = is_int($raw) || is_float($raw) || (is_string($raw) && is_numeric($raw) && !str_starts_with($raw, '+') && !str_starts_with($raw, '0'));
                if ($isNumeric && strlen((string)$raw) < 12) {
                    $xml .= '<Cell ss:StyleID="Cell"><Data ss:Type="Number">'
                          . htmlspecialchars((string)$raw, ENT_XML1, 'UTF-8') . '</Data></Cell>';
                } else {
                    $safe = Security::sanitizeCsvCell($raw);
                    $xml .= '<Cell ss:StyleID="Cell"><Data ss:Type="String">'
                          . htmlspecialchars($safe, ENT_XML1, 'UTF-8') . '</Data></Cell>';
                }
            }
            $xml .= '</Row>' . "\n";
        }

        $xml .= '</Table></Worksheet></Workbook>';
        return $xml;
    }

    /**
     * Stream dataset download directly to browser and record audit + sync logs.
     */
    public static function download(string $scope, string $format = 'csv'): never
    {
        $dataset = self::getScopeDataset($scope);
        $stamp = date('Ymd_His');
        if ($format === 'excel') {
            $fileName = $dataset['filename_base'] . '_' . $stamp . '.xls';
            $content = self::buildExcelXmlContent($dataset['title'], $dataset['headers'], $dataset['rows']);
            $mime = 'application/vnd.ms-excel; charset=UTF-8';
            $logFmt = 'excel_xls';
        } else {
            $fileName = $dataset['filename_base'] . '_' . $stamp . '.csv';
            $content = self::buildCsvContent($dataset['headers'], $dataset['rows']);
            $mime = 'text/csv; charset=UTF-8';
            $logFmt = 'csv';
        }

        AuditLogger::logSync($scope, 'export', $logFmt, count($dataset['rows']), $fileName);
        AuditLogger::log('EXPORT_' . strtoupper($format), $scope, null, "Exported " . count($dataset['rows']) . " rows to {$fileName}");

        header('Content-Type: ' . $mime);
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Content-Length: ' . strlen($content));
        echo $content;
        exit;
    }

    /**
     * Write synchronized CSV + Excel snapshots into exports/ folder for Student & Faculty portals.
     */
    public static function syncAllSnapshots(string $exportDir): array
    {
        if (!is_dir($exportDir)) {
            mkdir($exportDir, 0750, true);
        }
        $scopes = ['students', 'faculty', 'companies', 'drives', 'applications'];
        $summary = [];
        foreach ($scopes as $scope) {
            $dataset = self::getScopeDataset($scope);
            $csvName = $dataset['filename_base'] . '_latest.csv';
            $xlsName = $dataset['filename_base'] . '_latest.xls';
            file_put_contents($exportDir . DIRECTORY_SEPARATOR . $csvName, self::buildCsvContent($dataset['headers'], $dataset['rows']));
            file_put_contents($exportDir . DIRECTORY_SEPARATOR . $xlsName, self::buildExcelXmlContent($dataset['title'], $dataset['headers'], $dataset['rows']));
            $summary[$scope] = count($dataset['rows']);
            AuditLogger::logSync($scope, 'export', 'csv', count($dataset['rows']), $csvName, null, 'success', 'Portal sync snapshot refreshed');
        }
        AuditLogger::log('SYNC_PORTAL_SNAPSHOTS', 'system', null, json_encode($summary));
        return $summary;
    }

    /**
     * Parse and safely import a CSV upload into either `students` or `faculty_coordinators`.
     */
    public static function importCsv(string $scope, string $tmpFilePath, string $defaultPassword = 'Portal@1234'): array
    {
        if (!in_array($scope, ['students', 'faculty'], true)) {
            throw new InvalidArgumentException('CSV import is supported for students and faculty scopes.');
        }

        $fh = fopen($tmpFilePath, 'r');
        if ($fh === false) {
            throw new RuntimeException('Unable to read uploaded CSV file.');
        }

        // Strip UTF-8 BOM if present
        $bom = fread($fh, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($fh);
        }

        $rawHeaders = fgetcsv($fh);
        if ($rawHeaders === false || count($rawHeaders) < 3) {
            fclose($fh);
            throw new RuntimeException('Invalid CSV header row.');
        }

        $headers = array_map(static fn($h) => strtolower(trim((string)$h)), $rawHeaders);
        $defaultHash = Security::hashPassword($defaultPassword);
        $inserted = 0;
        $updated = 0;
        $errors = [];
        $lineNum = 1;

        Database::transaction(function () use ($fh, $headers, $scope, $defaultHash, &$inserted, &$updated, &$errors, &$lineNum) {
            while (($row = fgetcsv($fh)) !== false) {
                $lineNum++;
                if (count($row) === 1 && trim((string)$row[0]) === '') {
                    continue;
                }
                $assoc = [];
                foreach ($headers as $idx => $key) {
                    $assoc[$key] = trim((string)($row[$idx] ?? ''));
                }

                if ($scope === 'students') {
                    $roll = $assoc['roll_no'] ?? '';
                    $name = $assoc['full_name'] ?? '';
                    $email = filter_var($assoc['email'] ?? '', FILTER_VALIDATE_EMAIL);
                    $dept = $assoc['department'] ?? '';
                    if ($roll === '' || $name === '' || !$email || $dept === '') {
                        $errors[] = "Line {$lineNum}: Missing required roll_no, full_name, valid email, or department.";
                        continue;
                    }
                    $existing = Database::fetchOne("SELECT * FROM students WHERE roll_no = ? OR email = ?", [$roll, $email]);
                    $cgpa = array_key_exists('cgpa', $assoc) ? max(0, min(10, (float)($assoc['cgpa'] ?: 0))) : (float)($existing['cgpa'] ?? 0);
                    $batch = array_key_exists('batch_year', $assoc) ? (int)($assoc['batch_year'] ?: date('Y') + 1) : (int)($existing['batch_year'] ?? (date('Y') + 1));
                    $sem = array_key_exists('semester', $assoc) ? max(1, min(12, (int)($assoc['semester'] ?: 6))) : (int)($existing['semester'] ?? 6);
                    $backlogs = array_key_exists('active_backlogs', $assoc) ? max(0, (int)($assoc['active_backlogs'] ?: 0)) : (int)($existing['active_backlogs'] ?? 0);
                    $status = in_array($assoc['placement_status'] ?? '', ['unplaced', 'shortlisted', 'placed', 'opted_out'], true)
                        ? $assoc['placement_status']
                        : ($existing['placement_status'] ?? 'unplaced');

                    $placedCompany = array_key_exists('placed_company', $assoc)
                        ? (($assoc['placed_company'] !== '') ? $assoc['placed_company'] : null)
                        : ($existing['placed_company'] ?? null);
                    $packageLpa = array_key_exists('package_lpa', $assoc)
                        ? (($assoc['package_lpa'] !== '') ? (float)$assoc['package_lpa'] : null)
                        : ($existing['package_lpa'] ?? null);

                    if ($existing) {
                        Database::execute(
                            "UPDATE students SET full_name=?, email=?, phone=?, department=?, program=?, batch_year=?, semester=?, cgpa=?, active_backlogs=?, skills=?, placement_status=?, placed_company=?, package_lpa=?, is_verified=?, portal_active=? WHERE id=?",
                            [
                                $name, $email,
                                array_key_exists('phone', $assoc) ? $assoc['phone'] : $existing['phone'],
                                $dept,
                                ($assoc['program'] ?? '') !== '' ? $assoc['program'] : $existing['program'],
                                $batch, $sem, $cgpa, $backlogs,
                                array_key_exists('skills', $assoc) ? $assoc['skills'] : $existing['skills'],
                                $status, $placedCompany, $packageLpa,
                                array_key_exists('is_verified', $assoc) ? (int)$assoc['is_verified'] : (int)$existing['is_verified'],
                                array_key_exists('portal_active', $assoc) ? (int)$assoc['portal_active'] : (int)$existing['portal_active'],
                                (int)$existing['id']
                            ]
                        );
                        $updated++;
                    } else {
                        Database::execute(
                            "INSERT INTO students (roll_no, full_name, email, password_hash, phone, department, program, batch_year, semester, cgpa, active_backlogs, skills, placement_status, placed_company, package_lpa, is_verified, portal_active)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            [
                                $roll, $name, $email, $defaultHash, $assoc['phone'] ?? null, $dept,
                                ($assoc['program'] ?? '') !== '' ? $assoc['program'] : 'B.Tech', $batch, $sem, $cgpa, $backlogs,
                                $assoc['skills'] ?? null, $status, $placedCompany, $packageLpa,
                                (int)($assoc['is_verified'] ?? 1), (int)($assoc['portal_active'] ?? 1)
                            ]
                        );
                        $inserted++;
                    }
                } else {
                    $empId = $assoc['employee_id'] ?? '';
                    $name = $assoc['full_name'] ?? '';
                    $email = filter_var($assoc['email'] ?? '', FILTER_VALIDATE_EMAIL);
                    $dept = $assoc['department'] ?? '';
                    if ($empId === '' || $name === '' || !$email || $dept === '') {
                        $errors[] = "Line {$lineNum}: Missing required employee_id, full_name, valid email, or department.";
                        continue;
                    }
                    $existing = Database::fetchOne("SELECT * FROM faculty_coordinators WHERE employee_id = ? OR email = ?", [$empId, $email]);
                    $role = in_array($assoc['coordinator_role'] ?? '', ['tpo_head', 'dept_coordinator', 'placement_faculty', 'trainer'], true)
                        ? $assoc['coordinator_role']
                        : ($existing['coordinator_role'] ?? 'dept_coordinator');

                    if ($existing) {
                        Database::execute(
                            "UPDATE faculty_coordinators SET full_name=?, email=?, phone=?, department=?, designation=?, coordinator_role=?, assigned_batches=?, can_manage_drives=?, can_verify_students=?, portal_active=? WHERE id=?",
                            [
                                $name, $email,
                                array_key_exists('phone', $assoc) ? $assoc['phone'] : $existing['phone'],
                                $dept,
                                ($assoc['designation'] ?? '') !== '' ? $assoc['designation'] : $existing['designation'],
                                $role,
                                array_key_exists('assigned_batches', $assoc) ? $assoc['assigned_batches'] : $existing['assigned_batches'],
                                array_key_exists('can_manage_drives', $assoc) ? (int)$assoc['can_manage_drives'] : (int)$existing['can_manage_drives'],
                                array_key_exists('can_verify_students', $assoc) ? (int)$assoc['can_verify_students'] : (int)$existing['can_verify_students'],
                                array_key_exists('portal_active', $assoc) ? (int)$assoc['portal_active'] : (int)$existing['portal_active'],
                                (int)$existing['id']
                            ]
                        );
                        $updated++;
                    } else {
                        Database::execute(
                            "INSERT INTO faculty_coordinators (employee_id, full_name, email, password_hash, phone, department, designation, coordinator_role, assigned_batches, can_manage_drives, can_verify_students, portal_active)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            [
                                $empId, $name, $email, $defaultHash, $assoc['phone'] ?? null, $dept,
                                ($assoc['designation'] ?? '') !== '' ? $assoc['designation'] : 'Assistant Professor', $role,
                                $assoc['assigned_batches'] ?? null, (int)($assoc['can_manage_drives'] ?? 0),
                                (int)($assoc['can_verify_students'] ?? 1), (int)($assoc['portal_active'] ?? 1)
                            ]
                        );
                        $inserted++;
                    }
                }
            }
        });

        fclose($fh);
        return ['inserted' => $inserted, 'updated' => $updated, 'errors' => $errors];
    }
}
