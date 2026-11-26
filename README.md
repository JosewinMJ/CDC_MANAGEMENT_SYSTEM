# CDC Management System — Admin Portal & 3-Portal Unified Database

A complete, security-hardened **Career Development Centre (CDC) Admin Portal** designed for **XAMPP (Apache + MariaDB/MySQL + phpMyAdmin)** supporting **three portals**:
1. **Admin Portal** (`/admin`) — Full CDC governance, analytics, recruiter & drive management, audit trail, and Excel/CSV sync hub.
2. **Student Portal** — Isolated Student database (`students` table & `v_student_portal_db` view), independent CSV/Excel datasets, and token-authenticated API (`/api/students.php`).
3. **Faculty / Coordinator Portal** — Isolated Faculty database (`faculty_coordinators` table & `v_faculty_portal_db` view), independent CSV/Excel datasets, and token-authenticated API (`/api/faculty.php`).

## Key Features
- **Unified Secure Storage Layer (`shared/`)**: All 3 portals use `shared/Database.php` (native MySQL PDO prepared statements with `ATTR_EMULATE_PREPARES => false`), `shared/Security.php` (Argon2id/Bcrypt password hashing, CSRF tokens, XSS escaping, AES-256-GCM encryption helper, rate limiting, security headers), and `shared/AuditLogger.php`.
- **Separate Student & Faculty Excel/CSV Sharing (`admin/data_exchange.php`)**:
  - Export separate **Student DB** and **Faculty DB** in **UTF-8 BOM `.csv`** or **Excel `.xls` (SpreadsheetML)** with CSV formula-injection neutralization.
  - Import & upsert Student or Faculty `.csv` files with schema validation.
  - One-click **Refresh All Portal Snapshots** into protected `exports/`.
- **phpMyAdmin Ready (`database/cdc_schema.sql`)**: Normalized InnoDB schema with foreign keys, role-isolated views, and seeded demo records.

## Quick XAMPP Setup
1. Start **Apache** and **MySQL** in the **XAMPP Control Panel**.
2. Import `database/cdc_schema.sql` in **phpMyAdmin** (`http://localhost/phpmyadmin`) or via CLI:
   `C:\xampp\mysql\bin\mysql.exe -u root < "d:\CDC MANAGEMENT SYSTEM\database\cdc_schema.sql"`
3. Link or copy this folder into XAMPP `htdocs` (e.g., `C:\xampp\htdocs\cdc`).
4. Open `http://localhost/cdc/admin/`
   - **Default Admin Email**: `admin@cdc.edu`
   - **Default Password**: `Admin@1234`

## Pre-Seeded Inter-Portal API Tokens
- **Student Portal**: `cdc_stu_live_9f8e7d6c5b4a3210fedcba9876543210`
- **Faculty Portal**: `cdc_fac_live_1a2b3c4d5e6f708192a3b4c5d6e7f809`
*(Manage or rotate tokens anytime in **Admin Portal → Settings & API Tokens**.)*
