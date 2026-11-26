-- ============================================================================
-- CDC MANAGEMENT SYSTEM — LEAST-PRIVILEGE MYSQL PORTAL USERS
-- Run this in phpMyAdmin (SQL tab) or MySQL CLI to enforce at the database
-- engine level that ONLY Admin can edit/delete master Student & Faculty data.
-- ============================================================================

-- 1. Admin Portal DB User (Full control on cdc_management)
CREATE USER IF NOT EXISTS 'cdc_admin_user'@'localhost' IDENTIFIED BY 'ChangeMe_AdminDb#2026';
GRANT ALL PRIVILEGES ON `cdc_management`.* TO 'cdc_admin_user'@'localhost';

-- 2. Student Portal DB User (Read-only master data; can only apply & update own skills/resume/login)
CREATE USER IF NOT EXISTS 'cdc_student_user'@'localhost' IDENTIFIED BY 'ChangeMe_StudentDb#2026';
GRANT SELECT ON `cdc_management`.`v_student_portal_db` TO 'cdc_student_user'@'localhost';
GRANT SELECT ON `cdc_management`.`companies` TO 'cdc_student_user'@'localhost';
GRANT SELECT ON `cdc_management`.`placement_drives` TO 'cdc_student_user'@'localhost';
GRANT SELECT ON `cdc_management`.`training_sessions` TO 'cdc_student_user'@'localhost';
GRANT SELECT ON `cdc_management`.`notices` TO 'cdc_student_user'@'localhost';
GRANT SELECT (`id`, `roll_no`, `email`, `password_hash`, `portal_active`),
      UPDATE (`phone`, `skills`, `resume_url`, `password_hash`, `last_login_at`)
   ON `cdc_management`.`students` TO 'cdc_student_user'@'localhost';
GRANT SELECT, INSERT ON `cdc_management`.`applications` TO 'cdc_student_user'@'localhost';
GRANT INSERT ON `cdc_management`.`audit_logs` TO 'cdc_student_user'@'localhost';
GRANT SELECT, INSERT ON `cdc_management`.`login_attempts` TO 'cdc_student_user'@'localhost';

-- 3. Faculty Portal DB User (Read-only faculty/student master; can manage training & application stages)
CREATE USER IF NOT EXISTS 'cdc_faculty_user'@'localhost' IDENTIFIED BY 'ChangeMe_FacultyDb#2026';
GRANT SELECT ON `cdc_management`.`v_faculty_portal_db` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT ON `cdc_management`.`v_student_portal_db` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT ON `cdc_management`.`v_applications_report` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT ON `cdc_management`.`companies` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT ON `cdc_management`.`placement_drives` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT ON `cdc_management`.`notices` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT (`id`, `employee_id`, `email`, `password_hash`, `portal_active`),
      UPDATE (`password_hash`, `last_login_at`)
   ON `cdc_management`.`faculty_coordinators` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON `cdc_management`.`training_sessions` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT, UPDATE (`status`, `remarks`, `updated_by`) ON `cdc_management`.`applications` TO 'cdc_faculty_user'@'localhost';
GRANT INSERT ON `cdc_management`.`audit_logs` TO 'cdc_faculty_user'@'localhost';
GRANT SELECT, INSERT ON `cdc_management`.`login_attempts` TO 'cdc_faculty_user'@'localhost';

FLUSH PRIVILEGES;
