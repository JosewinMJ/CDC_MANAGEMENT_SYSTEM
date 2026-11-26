<?php
/**
 * CDC Management System - Pure-PHP Universal Spreadsheet Reader
 * Parses .csv, .xlsx (OpenXML without ZipArchive), and .xls (Excel SpreadsheetML XML)
 * into normalized associative rows with flexible header alias mapping & scope auto-detection.
 */

declare(strict_types=1);

final class SpreadsheetReader
{
    private const HEADER_ALIASES = [
        'roll_no' => ['roll_no', 'rollno', 'roll_number', 'roll', 'usn', 'reg_no', 'registration_no', 'student_id'],
        'employee_id' => ['employee_id', 'emp_id', 'empid', 'faculty_id', 'staff_id'],
        'full_name' => ['full_name', 'fullname', 'name', 'student_name', 'faculty_name'],
        'email' => ['email', 'email_id', 'mail', 'official_email', 'student_email'],
        'phone' => ['phone', 'phone_no', 'mobile', 'mobile_no', 'contact', 'contact_no'],
        'department' => ['department', 'dept', 'branch', 'stream'],
        'program' => ['program', 'course', 'degree'],
        'batch_year' => ['batch_year', 'batch', 'graduation_year', 'passout_year'],
        'semester' => ['semester', 'sem'],
        'cgpa' => ['cgpa', 'gpa', 'aggregate'],
        'active_backlogs' => ['active_backlogs', 'backlogs', 'backlog_count', 'arrears'],
        'skills' => ['skills', 'tech_skills', 'skill_set'],
        'placement_status' => ['placement_status', 'status'],
        'placed_company' => ['placed_company', 'company'],
        'package_lpa' => ['package_lpa', 'ctc_lpa', 'package', 'lpa'],
        'is_verified' => ['is_verified', 'verified'],
        'portal_active' => ['portal_active', 'active'],
        'designation' => ['designation', 'title', 'post'],
        'coordinator_role' => ['coordinator_role', 'role', 'cdc_role'],
        'assigned_batches' => ['assigned_batches', 'batches'],
        'can_manage_drives' => ['can_manage_drives', 'manage_drives'],
        'can_verify_students' => ['can_verify_students', 'verify_students'],
        'initial_password' => ['initial_password', 'temp_password', 'password', 'default_password', 'login_password'],
        'company_name' => ['company_name', 'company', 'organization'],
        'industry' => ['industry', 'sector', 'domain'],
        'tier' => ['tier', 'company_tier', 'category'],
        'website' => ['website', 'url'],
        'hr_name' => ['hr_name', 'recruiter_name'],
        'hr_email' => ['hr_email', 'recruiter_email'],
        'hr_phone' => ['hr_phone', 'recruiter_phone'],
        'location' => ['location', 'city'],
    ];

    /**
     * Read any supported spreadsheet (.csv, .xlsx, .xls) into canonical headers & rows.
     */
    public static function readFile(string $filePath, string $extension): array
    {
        $ext = strtolower(trim($extension, '.'));
        $rawTable = match ($ext) {
            'csv' => self::parseCsv($filePath),
            'xlsx' => self::parseXlsx($filePath),
            'xls' => self::parseExcelXml($filePath),
            default => throw new InvalidArgumentException("Unsupported spreadsheet format '.{$ext}'. Please upload .xlsx, .xls, or .csv."),
        };

        if (count($rawTable) < 2) {
            throw new RuntimeException('The uploaded sheet is empty or missing data rows.');
        }

        $rawHeaders = array_shift($rawTable);
        $canonicalHeaders = array_map([self::class, 'normalizeHeader'], $rawHeaders);

        $rows = [];
        foreach ($rawTable as $row) {
            $nonEmpty = false;
            $assoc = [];
            foreach ($canonicalHeaders as $idx => $key) {
                if ($key === '') {
                    continue;
                }
                $val = trim((string)($row[$idx] ?? ''));
                if ($val !== '') {
                    $nonEmpty = true;
                }
                $assoc[$key] = $val;
            }
            if ($nonEmpty) {
                $rows[] = $assoc;
            }
        }

        return ['headers' => array_values(array_filter($canonicalHeaders)), 'rows' => $rows];
    }

    public static function detectScope(array $headers): string
    {
        if (in_array('roll_no', $headers, true)) {
            return 'students';
        }
        if (in_array('employee_id', $headers, true)) {
            return 'faculty';
        }
        if (in_array('company_name', $headers, true)) {
            return 'companies';
        }
        throw new InvalidArgumentException(
            'Could not auto-detect target database from sheet columns. Include roll_no (Student), employee_id (Faculty), or company_name (Company), or select the target manually.'
        );
    }

    private static function normalizeHeader(mixed $header): string
    {
        $slug = strtolower(trim((string)$header));
        $slug = preg_replace('/[^a-z0-9]+/', '_', $slug) ?? '';
        $slug = trim($slug, '_');
        if ($slug === '') {
            return '';
        }
        foreach (self::HEADER_ALIASES as $canonical => $variants) {
            if (in_array($slug, $variants, true)) {
                return $canonical;
            }
        }
        return $slug;
    }

    private static function parseCsv(string $filePath): array
    {
        $fh = fopen($filePath, 'r');
        if ($fh === false) {
            throw new RuntimeException('Unable to open uploaded CSV file.');
        }
        $bom = fread($fh, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($fh);
        }
        $firstLine = fgets($fh);
        if ($firstLine === false) {
            fclose($fh);
            return [];
        }
        $delimiter = ',';
        if (substr_count($firstLine, ';') > substr_count($firstLine, ',')) {
            $delimiter = ';';
        } elseif (substr_count($firstLine, "\t") > substr_count($firstLine, ',')) {
            $delimiter = "\t";
        }
        rewind($fh);
        $bom = fread($fh, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($fh);
        }

        $table = [];
        while (($row = fgetcsv($fh, 0, $delimiter)) !== false) {
            $table[] = $row;
        }
        fclose($fh);
        return $table;
    }

    private static function parseExcelXml(string $filePath): array
    {
        $content = file_get_contents($filePath);
        if ($content === false) {
            throw new RuntimeException('Unable to read uploaded .xls file.');
        }
        // Fallback if user renamed a CSV to .xls
        if (!str_contains($content, '<Workbook') && !str_contains($content, '<Row')) {
            return self::parseCsv($filePath);
        }

        $prev = libxml_use_internal_errors(true);
        $xml = simplexml_load_string($content);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);

        if ($xml === false) {
            throw new RuntimeException('Invalid .xls XML format. Please save as .xlsx or .csv UTF-8.');
        }

        $xml->registerXPathNamespace('ss', 'urn:schemas-microsoft-com:office:spreadsheet');
        $rows = $xml->xpath('//ss:Worksheet[1]//ss:Row') ?: $xml->xpath('//Row');
        $table = [];
        foreach ($rows as $rowNode) {
            $rowArr = [];
            $colIdx = 0;
            foreach ($rowNode->children() as $cell) {
                $attrs = $cell->attributes('urn:schemas-microsoft-com:office:spreadsheet');
                if (isset($attrs['Index'])) {
                    $targetIdx = max(0, ((int)$attrs['Index']) - 1);
                    while ($colIdx < $targetIdx) {
                        $rowArr[] = '';
                        $colIdx++;
                    }
                }
                $val = '';
                foreach ($cell->children() as $dataNode) {
                    $val = (string)$dataNode;
                    break;
                }
                $rowArr[] = $val;
                $colIdx++;
            }
            $table[] = $rowArr;
        }
        return $table;
    }

    /**
     * Pure-PHP .xlsx parser using built-in zlib + SimpleXML (no ZipArchive extension required).
     */
    private static function parseXlsx(string $filePath): array
    {
        $entries = self::readZipEntries($filePath);
        $sheetXml = $entries['xl/worksheets/sheet1.xml'] ?? null;
        if ($sheetXml === null) {
            foreach ($entries as $name => $data) {
                if (preg_match('#^xl/worksheets/sheet\d+\.xml$#', $name)) {
                    $sheetXml = $data;
                    break;
                }
            }
        }
        if ($sheetXml === null) {
            throw new RuntimeException('Invalid .xlsx workbook: worksheet XML not found.');
        }

        $sharedStrings = [];
        if (isset($entries['xl/sharedStrings.xml'])) {
            $ssXml = simplexml_load_string($entries['xl/sharedStrings.xml']);
            if ($ssXml !== false) {
                foreach ($ssXml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string)$si->t;
                    } else {
                        $parts = [];
                        foreach ($si->r as $run) {
                            $parts[] = (string)$run->t;
                        }
                        $sharedStrings[] = implode('', $parts);
                    }
                }
            }
        }

        $wsXml = simplexml_load_string($sheetXml);
        if ($wsXml === false) {
            throw new RuntimeException('Unable to parse .xlsx worksheet XML.');
        }

        $table = [];
        if (!isset($wsXml->sheetData->row)) {
            return [];
        }
        foreach ($wsXml->sheetData->row as $rowNode) {
            $rowCells = [];
            $maxCol = 0;
            foreach ($rowNode->c as $cell) {
                $ref = (string)($cell['r'] ?? '');
                $colIdx = $ref !== '' ? self::colLettersToIndex($ref) : count($rowCells);
                $maxCol = max($maxCol, $colIdx);
                $type = (string)($cell['t'] ?? '');
                $val = '';
                if ($type === 's') {
                    $idx = (int)$cell->v;
                    $val = $sharedStrings[$idx] ?? '';
                } elseif ($type === 'inlineStr') {
                    $val = (string)($cell->is->t ?? '');
                } else {
                    $val = (string)($cell->v ?? '');
                }
                $rowCells[$colIdx] = $val;
            }
            $dense = [];
            for ($i = 0; $i <= $maxCol; $i++) {
                $dense[] = $rowCells[$i] ?? '';
            }
            $table[] = $dense;
        }
        return $table;
    }

    private static function colLettersToIndex(string $cellRef): int
    {
        if (!preg_match('/^([A-Z]+)/i', $cellRef, $m)) {
            return 0;
        }
        $letters = strtoupper($m[1]);
        $index = 0;
        for ($i = 0; $i < strlen($letters); $i++) {
            $index = $index * 26 + (ord($letters[$i]) - ord('A') + 1);
        }
        return $index - 1;
    }

    /**
     * Minimal pure-PHP ZIP Central Directory reader (supports Store=0 and Deflate=8).
     */
    private static function readZipEntries(string $filePath): array
    {
        $bin = file_get_contents($filePath);
        if ($bin === false || strlen($bin) < 22) {
            throw new RuntimeException('Unable to read .xlsx file.');
        }
        if (substr($bin, 0, 2) !== 'PK') {
            throw new RuntimeException('Uploaded .xlsx file is not a valid ZIP/OpenXML workbook.');
        }

        $eocdPos = strrpos($bin, "\x50\x4b\x05\x06");
        if ($eocdPos === false) {
            throw new RuntimeException('Corrupted .xlsx file (missing ZIP end directory).');
        }
        $eocd = unpack('vdisk/vcdDisk/ventriesDisk/ventriesTotal/VcdSize/VcdOffset', substr($bin, $eocdPos + 4, 16));
        $pos = (int)$eocd['cdOffset'];
        $total = (int)$eocd['entriesTotal'];

        $files = [];
        for ($i = 0; $i < $total; $i++) {
            if (substr($bin, $pos, 4) !== "\x50\x4b\x01\x02") {
                break;
            }
            $hdr = unpack(
                'vverMade/vverNeed/vflag/vmethod/vmtime/vmdate/Vcrc/VcompSize/VuncompSize/vnameLen/vextraLen/vcommentLen/vdisk/vintAttr/VextAttr/VlocalOffset',
                substr($bin, $pos + 4, 42)
            );
            $name = str_replace('\\', '/', substr($bin, $pos + 46, (int)$hdr['nameLen']));
            $pos += 46 + (int)$hdr['nameLen'] + (int)$hdr['extraLen'] + (int)$hdr['commentLen'];

            $localOff = (int)$hdr['localOffset'];
            if (substr($bin, $localOff, 4) !== "\x50\x4b\x03\x04") {
                continue;
            }
            $lh = unpack('vnameLen/vextraLen', substr($bin, $localOff + 26, 4));
            $dataStart = $localOff + 30 + (int)$lh['nameLen'] + (int)$lh['extraLen'];
            $compData = substr($bin, $dataStart, (int)$hdr['compSize']);

            if ((int)$hdr['method'] === 0) {
                $files[$name] = $compData;
            } elseif ((int)$hdr['method'] === 8) {
                $uncomp = @gzinflate($compData);
                if ($uncomp !== false) {
                    $files[$name] = $uncomp;
                }
            }
        }
        return $files;
    }
}
