# CDC Management System — Industrial 3-Portal Platform (Laravel 12 + React 19 + MySQL/phpMyAdmin)

A production-structured **Career Development Centre (CDC) Management System** integrating:
1. **`backend/` — Laravel 12 + Sanctum REST API** (`/api/v1/*`) with Eloquent ORM, version-controlled migrations, role-based middleware (`STUDENT`, `GUIDE`, `ADMIN_*`), rate limiting, audit logging, 1-click `.sql` backup, and `.xlsx`/`.xls`/`.csv` auto-import/export.
2. **`cdc-portal/` — Unified React 19 + TypeScript + Vite Frontend** containing all three portals:
   - **Student Portal (`/student/*`)** — Dashboard, Calendar, 6-tab Profile, Eligibility Checker, Applications, 3-Track Internships, LeetCode Tracker, Notices, Parent Alerts.
   - **Guide / Faculty Portal (`/guide/*`)** — Assigned Mentees Roster, Internship Reviews, Document Verification, Guide Notice Publisher.
   - **Admin Portal (`/admin/*`)** — Executive Recharts Dashboard, Student & Faculty Master DBs, Company/Drive Builder, Application Stage Control, Academic Correction Approvals, Universal `.xlsx`/`.csv` Auto-Sync, Audit Trail & SQL Backup.
3. **`admin/` & `shared/` — Legacy Core PHP XAMPP Admin Portal** (preserved for direct Apache/XAMPP usage on `cdc_management`).

---

## Quick Setup (Collaborators)

### 1. Start XAMPP MySQL & Create Database
Open **XAMPP Control Panel** → Start **Apache** and **MySQL**, then in **phpMyAdmin** (`http://localhost/phpmyadmin/`):
- Create database `cdc_industrial` (or run `php artisan migrate --seed` after configuring `.env`).

### 2. Backend Setup (`backend/`)
```bash
cd backend
copy .env.example .env
# Set DB_CONNECTION=mysql, DB_HOST=127.0.0.1, DB_PORT=3306, DB_DATABASE=cdc_industrial, DB_USERNAME=root, DB_PASSWORD=
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

### 3. Frontend Setup (`cdc-portal/`)
```bash
cd cdc-portal
npm install
npm run build
npm run dev
```
Or double-click **`run_industrial.bat`** on Windows to launch both servers together!

### Updating an existing installation

Run `php artisan migrate` from `backend/` before serving the updated portal. Internship evidence and student document uploads are stored on Laravel's private `local` disk, so keep `backend/storage/app/private` writable and persistent. To support three 5 MB internship attachments in one submission, configure PHP with `upload_max_filesize` of at least `5M` and `post_max_size` of at least `16M`.

---

## Seeded Portal Accounts
| Portal | Email | Password |
| :--- | :--- | :--- |
| **Admin Portal (`/admin`)** | `cdc.admin@vit.ac.in` | `Admin@1234` |
| **Guide Portal (`/guide`)** | `k.ramanathan@vit.ac.in` | `Portal@1234` |
| **Student Portal (`/student`)** | `sneha.r2023@vitstudent.ac.in` | `Portal@1234` |
