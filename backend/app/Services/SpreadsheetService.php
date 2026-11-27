<?php

namespace App\Services;

use App\Models\Company;
use App\Models\DataSyncLog;
use App\Models\FacultyProfile;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class SpreadsheetService
{
    private const HEADER_ALIASES = [
        'reg_number' => ['reg_number', 'roll_no', 'rollno', 'roll_number', 'roll', 'usn', 'reg_no', 'registration_no'],
        'employee_id' => ['employee_id', 'emp_id', 'empid', 'faculty_id', 'staff_id'],
        'full_name' => ['full_name', 'fullname', 'name', 'student_name', 'faculty_name'],
        'email' => ['email', 'email_id', 'mail', 'official_email', 'student_email'],
        'phone' => ['phone', 'phone_no', 'mobile', 'mobile_no', 'contact'],
        'department' => ['department', 'dept', 'branch', 'stream'],
        'degree' => ['degree', 'program', 'course'],
        'graduation_year' => ['graduation_year', 'batch_year', 'batch', 'passout_year'],
        'semester' => ['semester', 'sem'],
        'current_cgpa' => ['current_cgpa', 'cgpa', 'gpa', 'aggregate'],
        'active_backlogs' => ['active_backlogs', 'backlogs', 'backlog_count'],
        'placement_status' => ['placement_status', 'status'],
        'placed_company' => ['placed_company', 'company'],
        'package_lpa' => ['package_lpa', 'ctc_lpa', 'package', 'lpa'],
        'designation' => ['designation', 'title', 'post'],
        'coordinator_role' => ['coordinator_role', 'role', 'cdc_role'],
        'assigned_batches' => ['assigned_batches', 'batches'],
        'initial_password' => ['initial_password', 'temp_password', 'password', 'default_password'],
        'company_name' => ['company_name', 'company', 'organization'],
        'industry' => ['industry', 'sector', 'domain'],
        'tier' => ['tier', 'company_tier'],
        'website' => ['website', 'url'],
        'hr_name' => ['hr_name', 'recruiter_name'],
        'hr_email' => ['hr_email', 'recruiter_email'],
        'location' => ['location', 'city'],
    ];

    public static function sanitizeCsvCell(mixed $val): string
    {
        $str = (string)($val ?? '');
        if ($str !== '' && preg_match('/^[=+\-@\t\r]/', $str)) {
            return "'" . $str;
        }
        return $str;
    }

    public static function getExportDataset(string $scope): array
    {
        return match ($scope) {
            'students' => [
                'title' => 'CDC Student Portal Database',
                'filename' => 'cdc_students_database',
                'headers' => ['reg_number', 'full_name', 'email', 'phone', 'branch', 'degree', 'graduation_year', 'semester', 'current_cgpa', 'active_backlogs', 'verification_status', 'placement_status', 'placed_company', 'package_lpa'],
                'rows' => StudentProfile::with('user:id,name,email,phone')->orderBy('branch')->orderBy('reg_number')->get()->map(fn ($s) => [
                    'reg_number' => $s->reg_number,
                    'full_name' => $s->user?->name ?? '',
                    'email' => $s->user?->email ?? '',
                    'phone' => $s->user?->phone ?? '',
                    'branch' => $s->branch,
                    'degree' => $s->degree,
                    'graduation_year' => $s->graduation_year,
                    'semester' => $s->semester,
                    'current_cgpa' => $s->current_cgpa,
                    'active_backlogs' => $s->active_backlogs,
                    'verification_status' => $s->verification_status,
                    'placement_status' => $s->placement_status,
                    'placed_company' => $s->placed_company ?? '',
                    'package_lpa' => $s->package_lpa ?? '',
                ])->all(),
            ],
            'faculty' => [
                'title' => 'CDC Faculty & Guide Portal Database',
                'filename' => 'cdc_faculty_database',
                'headers' => ['employee_id', 'full_name', 'email', 'phone', 'department', 'designation', 'coordinator_role', 'assigned_batches', 'can_manage_drives', 'can_verify_students'],
                'rows' => FacultyProfile::with('user:id,name,email,phone,department')->orderBy('employee_id')->get()->map(fn ($f) => [
                    'employee_id' => $f->employee_id,
                    'full_name' => $f->user?->name ?? '',
                    'email' => $f->user?->email ?? '',
                    'phone' => $f->user?->phone ?? '',
                    'department' => $f->user?->department ?? '',
                    'designation' => $f->designation,
                    'coordinator_role' => $f->coordinator_role,
                    'assigned_batches' => $f->assigned_batches ?? '',
                    'can_manage_drives' => $f->can_manage_drives ? 1 : 0,
                    'can_verify_students' => $f->can_verify_students ? 1 : 0,
                ])->all(),
            ],
            'companies' => [
                'title' => 'CDC Companies Registry',
                'filename' => 'cdc_companies_database',
                'headers' => ['slug_code', 'name', 'industry', 'tier', 'location', 'hr_name', 'hr_email', 'application_deadline'],
                'rows' => Company::orderBy('name')->get()->map(fn ($c) => [
                    'slug_code' => $c->slug_code,
                    'name' => $c->name,
                    'industry' => $c->industry,
                    'tier' => $c->tier,
                    'location' => $c->location ?? '',
                    'hr_name' => $c->hr_name ?? '',
                    'hr_email' => $c->hr_email ?? '',
                    'application_deadline' => $c->application_deadline?->format('Y-m-d') ?? '',
                ])->all(),
            ],
            default => throw new InvalidArgumentException("Unsupported scope: {$scope}"),
        };
    }

    public static function buildCsv(array $headers, array $rows): string
    {
        $fh = fopen('php://temp', 'r+');
        fwrite($fh, "\xEF\xBB\xBF");
        fputcsv($fh, $headers);
        foreach ($rows as $row) {
            $line = [];
            foreach ($headers as $col) {
                $line[] = self::sanitizeCsvCell($row[$col] ?? '');
            }
            fputcsv($fh, $line);
        }
        rewind($fh);
        $csv = stream_get_contents($fh) ?: '';
        fclose($fh);
        return $csv;
    }

    public static function buildExcelXml(string $title, array $headers, array $rows): string
    {
        $sheet = preg_replace('/[\\\\\\/\\?\\*\\[\\]:]/', '', substr($title, 0, 31)) ?: 'CDC_Data';
        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<?mso-application progid=\"Excel.Sheet\"?>\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
        $xml .= '<Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#142B4A" ss:Pattern="Solid"/></Style></Styles>';
        $xml .= '<Worksheet ss:Name="' . htmlspecialchars($sheet, ENT_XML1, 'UTF-8') . '"><Table><Row>';
        foreach ($headers as $h) {
            $xml .= '<Cell ss:StyleID="Header"><Data ss:Type="String">' . htmlspecialchars(strtoupper(str_replace('_', ' ', $h)), ENT_XML1, 'UTF-8') . '</Data></Cell>';
        }
        $xml .= '</Row>';
        foreach ($rows as $row) {
            $xml .= '<Row>';
            foreach ($headers as $col) {
                $val = self::sanitizeCsvCell($row[$col] ?? '');
                $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($val, ENT_XML1, 'UTF-8') . '</Data></Cell>';
            }
            $xml .= '</Row>';
        }
        return $xml . '</Table></Worksheet></Workbook>';
    }

    public static function importSheet(string $scope, string $filePath, string $ext, string $defaultPassword = 'Portal@1234', ?string $actorEmail = null): array
    {
        $parsed = self::parseFile($filePath, $ext);
        $resolved = $scope === 'auto' ? self::detectScope($parsed['headers']) : $scope;

        if (!in_array($resolved, ['students', 'faculty', 'companies'], true)) {
            throw new InvalidArgumentException('Unsupported import target.');
        }

        $defaultHash = Hash::make($defaultPassword);
        $inserted = 0;
        $updated = 0;
        $errors = [];

        DB::transaction(function () use ($parsed, $resolved, $defaultHash, &$inserted, &$updated, &$errors) {
            foreach ($parsed['rows'] as $idx => $row) {
                $line = $idx + 2;
                if ($resolved === 'students') {
                    $reg = $row['reg_number'] ?? '';
                    $name = $row['full_name'] ?? '';
                    $email = filter_var($row['email'] ?? '', FILTER_VALIDATE_EMAIL);
                    $branch = strtoupper($row['department'] ?? 'CSE');
                    if ($reg === '' || $name === '' || !$email) {
                        $errors[] = "Row {$line}: Missing reg_number/roll_no, full_name, or valid email.";
                        continue;
                    }
                    $existing = StudentProfile::where('reg_number', $reg)->first();
                    $rowPass = trim((string)($row['initial_password'] ?? ''));

                    if ($existing) {
                        $existing->user->update([
                            'name' => $name,
                            'email' => $email,
                            'phone' => $row['phone'] ?? $existing->user->phone,
                            'department' => $branch,
                            ...($rowPass !== '' ? ['password' => Hash::make($rowPass)] : []),
                        ]);
                        $existing->update([
                            'branch' => $branch,
                            'degree' => $row['degree'] ?: $existing->degree,
                            'graduation_year' => (int)($row['graduation_year'] ?: $existing->graduation_year),
                            'semester' => (int)($row['semester'] ?: $existing->semester),
                            'current_cgpa' => array_key_exists('current_cgpa', $row) ? (float)($row['current_cgpa'] ?: 0) : $existing->current_cgpa,
                            'active_backlogs' => array_key_exists('active_backlogs', $row) ? (int)($row['active_backlogs'] ?: 0) : $existing->active_backlogs,
                            'placement_status' => in_array($row['placement_status'] ?? '', ['unplaced', 'shortlisted', 'placed', 'opted_out'], true)
                                ? $row['placement_status'] : $existing->placement_status,
                        ]);
                        $updated++;
                    } else {
                        $user = User::create([
                            'name' => $name,
                            'email' => $email,
                            'password' => $rowPass !== '' ? Hash::make($rowPass) : $defaultHash,
                            'role' => 'STUDENT',
                            'phone' => $row['phone'] ?? null,
                            'department' => $branch,
                            'must_change_password' => true,
                        ]);
                        StudentProfile::create([
                            'user_id' => $user->id,
                            'reg_number' => $reg,
                            'branch' => $branch,
                            'degree' => $row['degree'] ?: 'B.Tech',
                            'graduation_year' => (int)($row['graduation_year'] ?: 2027),
                            'semester' => (int)($row['semester'] ?: 7),
                            'current_cgpa' => (float)($row['current_cgpa'] ?: 0),
                            'active_backlogs' => (int)($row['active_backlogs'] ?: 0),
                            'verification_status' => 'VERIFIED',
                            'placement_status' => in_array($row['placement_status'] ?? '', ['unplaced', 'shortlisted', 'placed', 'opted_out'], true)
                                ? $row['placement_status'] : 'unplaced',
                        ]);
                        $inserted++;
                    }
                } elseif ($resolved === 'faculty') {
                    $empId = $row['employee_id'] ?? '';
                    $name = $row['full_name'] ?? '';
                    $email = filter_var($row['email'] ?? '', FILTER_VALIDATE_EMAIL);
                    $dept = strtoupper($row['department'] ?? 'CSE');
                    if ($empId === '' || $name === '' || !$email) {
                        $errors[] = "Row {$line}: Missing employee_id, full_name, or valid email.";
                        continue;
                    }
                    $existing = FacultyProfile::where('employee_id', $empId)->first();
                    $rowPass = trim((string)($row['initial_password'] ?? ''));

                    if ($existing) {
                        $existing->user->update([
                            'name' => $name,
                            'email' => $email,
                            'phone' => $row['phone'] ?? $existing->user->phone,
                            'department' => $dept,
                            ...($rowPass !== '' ? ['password' => Hash::make($rowPass)] : []),
                        ]);
                        $existing->update([
                            'designation' => $row['designation'] ?: $existing->designation,
                            'assigned_batches' => $row['assigned_batches'] ?? $existing->assigned_batches,
                        ]);
                        $updated++;
                    } else {
                        $user = User::create([
                            'name' => $name,
                            'email' => $email,
                            'password' => $rowPass !== '' ? Hash::make($rowPass) : $defaultHash,
                            'role' => 'GUIDE',
                            'phone' => $row['phone'] ?? null,
                            'department' => $dept,
                            'must_change_password' => true,
                        ]);
                        FacultyProfile::create([
                            'user_id' => $user->id,
                            'employee_id' => $empId,
                            'designation' => $row['designation'] ?: 'Assistant Professor',
                            'coordinator_role' => in_array($row['coordinator_role'] ?? '', ['tpo_head', 'dept_coordinator', 'placement_faculty', 'faculty_guide', 'trainer'], true)
                                ? $row['coordinator_role'] : 'faculty_guide',
                            'assigned_batches' => $row['assigned_batches'] ?? '2027',
                        ]);
                        $inserted++;
                    }
                } else {
                    $cName = $row['company_name'] ?? '';
                    if ($cName === '') {
                        $errors[] = "Row {$line}: Missing company_name.";
                        continue;
                    }
                    $slug = 'comp-' . Str::slug($cName);
                    $existing = Company::where('slug_code', $slug)->first();
                    if ($existing) {
                        $existing->update([
                            'name' => $cName,
                            'industry' => $row['industry'] ?: $existing->industry,
                            'location' => $row['location'] ?? $existing->location,
                            'hr_name' => $row['hr_name'] ?? $existing->hr_name,
                            'hr_email' => $row['hr_email'] ?? $existing->hr_email,
                        ]);
                        $updated++;
                    } else {
                        Company::create([
                            'slug_code' => $slug,
                            'name' => $cName,
                            'industry' => $row['industry'] ?: 'Technology',
                            'tier' => in_array($row['tier'] ?? '', ['super_dream', 'dream', 'core', 'startup', 'mass'], true) ? $row['tier'] : 'core',
                            'location' => $row['location'] ?? 'Bengaluru',
                            'hr_name' => $row['hr_name'] ?? null,
                            'hr_email' => $row['hr_email'] ?? null,
                            'application_deadline' => now()->addDays(20)->toDateString(),
                        ]);
                        $inserted++;
                    }
                }
            }
        });

        DataSyncLog::create([
            'portal_scope' => $resolved,
            'direction' => 'import',
            'format' => $ext,
            'record_count' => $inserted + $updated,
            'file_name' => basename($filePath),
            'actor_email' => $actorEmail,
            'status' => empty($errors) ? 'success' : 'partial',
            'summary' => "Inserted: {$inserted}, Updated: {$updated}, Errors: " . count($errors),
        ]);

        return ['detected_scope' => $resolved, 'inserted' => $inserted, 'updated' => $updated, 'errors' => $errors];
    }

    private static function parseFile(string $path, string $ext): array
    {
        $ext = strtolower(trim($ext, '.'));
        $raw = match ($ext) {
            'csv' => self::parseCsv($path),
            'xls' => self::parseExcelXml($path),
            'xlsx' => self::parseXlsx($path),
            default => throw new InvalidArgumentException("Unsupported format '.{$ext}'. Use .xlsx, .xls, or .csv."),
        };
        if (count($raw) < 2) {
            throw new RuntimeException('Uploaded sheet is empty or missing rows.');
        }
        $headers = array_map(static function ($h) {
            $slug = trim(preg_replace('/[^a-z0-9]+/', '_', strtolower(trim((string)$h))) ?? '', '_');
            foreach (self::HEADER_ALIASES as $canon => $aliases) {
                if (in_array($slug, $aliases, true)) {
                    return $canon;
                }
            }
            return $slug;
        }, array_shift($raw));

        $rows = [];
        foreach ($raw as $r) {
            $assoc = [];
            $hasVal = false;
            foreach ($headers as $i => $k) {
                if ($k === '') {
                    continue;
                }
                $v = trim((string)($r[$i] ?? ''));
                if ($v !== '') {
                    $hasVal = true;
                }
                $assoc[$k] = $v;
            }
            if ($hasVal) {
                $rows[] = $assoc;
            }
        }
        return ['headers' => array_values(array_filter($headers)), 'rows' => $rows];
    }

    private static function detectScope(array $headers): string
    {
        if (in_array('reg_number', $headers, true)) {
            return 'students';
        }
        if (in_array('employee_id', $headers, true)) {
            return 'faculty';
        }
        if (in_array('company_name', $headers, true)) {
            return 'companies';
        }
        throw new InvalidArgumentException('Could not auto-detect database from headers.');
    }

    private static function parseCsv(string $path): array
    {
        $fh = fopen($path, 'r');
        if ($fh === false) {
            throw new RuntimeException('Cannot open CSV.');
        }
        if (fread($fh, 3) !== "\xEF\xBB\xBF") {
            rewind($fh);
        }
        $rows = [];
        while (($r = fgetcsv($fh)) !== false) {
            $rows[] = $r;
        }
        fclose($fh);
        return $rows;
    }

    private static function parseExcelXml(string $path): array
    {
        $xml = @simplexml_load_string((string)file_get_contents($path));
        if ($xml === false) {
            return self::parseCsv($path);
        }
        $xml->registerXPathNamespace('ss', 'urn:schemas-microsoft-com:office:spreadsheet');
        $rows = [];
        foreach (($xml->xpath('//ss:Worksheet[1]//ss:Row') ?: []) as $rn) {
            $r = [];
            foreach ($rn->children() as $cell) {
                $val = '';
                foreach ($cell->children() as $d) {
                    $val = (string)$d;
                    break;
                }
                $r[] = $val;
            }
            $rows[] = $r;
        }
        return $rows;
    }

    private static function parseXlsx(string $path): array
    {
        $bin = (string)file_get_contents($path);
        if (substr($bin, 0, 2) !== 'PK') {
            throw new RuntimeException('Invalid .xlsx file.');
        }
        $eocdPos = strrpos($bin, "\x50\x4b\x05\x06");
        if ($eocdPos === false) {
            throw new RuntimeException('Corrupted .xlsx file.');
        }
        $eocd = unpack('vdisk/vcdDisk/ventriesDisk/ventriesTotal/VcdSize/VcdOffset', substr($bin, $eocdPos + 4, 16));
        $pos = (int)$eocd['cdOffset'];
        $entries = [];
        for ($i = 0; $i < (int)$eocd['entriesTotal']; $i++) {
            if (substr($bin, $pos, 4) !== "\x50\x4b\x01\x02") {
                break;
            }
            $hdr = unpack('vverMade/vverNeed/vflag/vmethod/vmtime/vmdate/Vcrc/VcompSize/VuncompSize/vnameLen/vextraLen/vcommentLen/vdisk/vintAttr/VextAttr/VlocalOffset', substr($bin, $pos + 4, 42));
            $name = str_replace('\\', '/', substr($bin, $pos + 46, (int)$hdr['nameLen']));
            $pos += 46 + (int)$hdr['nameLen'] + (int)$hdr['extraLen'] + (int)$hdr['commentLen'];
            $lo = (int)$hdr['localOffset'];
            $lh = unpack('vnameLen/vextraLen', substr($bin, $lo + 26, 4));
            $comp = substr($bin, $lo + 30 + (int)$lh['nameLen'] + (int)$lh['extraLen'], (int)$hdr['compSize']);
            $entries[$name] = (int)$hdr['method'] === 0 ? $comp : ((int)$hdr['method'] === 8 ? (@gzinflate($comp) ?: '') : '');
        }
        $sheetXml = $entries['xl/worksheets/sheet1.xml'] ?? null;
        if (!$sheetXml) {
            throw new RuntimeException('Worksheet not found in .xlsx.');
        }
        $ss = [];
        if (isset($entries['xl/sharedStrings.xml'])) {
            $sx = @simplexml_load_string($entries['xl/sharedStrings.xml']);
            if ($sx) {
                foreach ($sx->si as $si) {
                    $ss[] = isset($si->t) ? (string)$si->t : implode('', array_map(fn ($r) => (string)$r->t, iterator_to_array($si->r)));
                }
            }
        }
        $wx = simplexml_load_string($sheetXml);
        $table = [];
        foreach ($wx->sheetData->row as $rn) {
            $cells = [];
            $max = 0;
            foreach ($rn->c as $c) {
                preg_match('/^([A-Z]+)/i', (string)$c['r'], $m);
                $idx = 0;
                foreach (str_split(strtoupper($m[1] ?? 'A')) as $ch) {
                    $idx = $idx * 26 + (ord($ch) - 64);
                }
                $idx = max(0, $idx - 1);
                $max = max($max, $idx);
                $t = (string)($c['t'] ?? '');
                $cells[$idx] = $t === 's' ? ($ss[(int)$c->v] ?? '') : ($t === 'inlineStr' ? (string)($c->is->t ?? '') : (string)($c->v ?? ''));
            }
            $row = [];
            for ($k = 0; $k <= $max; $k++) {
                $row[] = $cells[$k] ?? '';
            }
            $table[] = $row;
        }
        return $table;
    }
}
