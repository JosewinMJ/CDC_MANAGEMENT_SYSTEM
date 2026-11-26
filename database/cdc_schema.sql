-- ============================================================================
-- CDC MANAGEMENT SYSTEM — UNIFIED MYSQL / PHPMYADMIN DATABASE SCHEMA
-- Designed for 3 Portals: Admin Portal, Student Portal, Faculty/Coordinator Portal
-- Separate logical tables & views for Student DB and Faculty DB
-- Compatible with XAMPP MariaDB 10.4+ / MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `cdc_management`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `cdc_management`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. ADMIN PORTAL TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(120) NOT NULL,
  `username` VARCHAR(60) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'cdc_admin', 'auditor') NOT NULL DEFAULT 'cdc_admin',
  `phone` VARCHAR(30) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admins_username` (`username`),
  UNIQUE KEY `uq_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. STUDENT PORTAL DATABASE TABLE (Isolated Student Records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `roll_no` VARCHAR(40) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `department` VARCHAR(80) NOT NULL,
  `program` VARCHAR(80) NOT NULL DEFAULT 'B.Tech',
  `batch_year` YEAR NOT NULL,
  `semester` TINYINT UNSIGNED NOT NULL DEFAULT 6,
  `cgpa` DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  `active_backlogs` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `skills` TEXT DEFAULT NULL,
  `resume_url` VARCHAR(255) DEFAULT NULL,
  `placement_status` ENUM('unplaced', 'shortlisted', 'placed', 'opted_out') NOT NULL DEFAULT 'unplaced',
  `placed_company` VARCHAR(150) DEFAULT NULL,
  `package_lpa` DECIMAL(6,2) DEFAULT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `portal_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_students_roll` (`roll_no`),
  UNIQUE KEY `uq_students_email` (`email`),
  KEY `idx_students_dept_batch` (`department`, `batch_year`),
  KEY `idx_students_status` (`placement_status`),
  KEY `idx_students_cgpa` (`cgpa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. FACULTY / COORDINATOR PORTAL DATABASE TABLE (Isolated Faculty Records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faculty_coordinators` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` VARCHAR(40) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `department` VARCHAR(80) NOT NULL,
  `designation` VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
  `coordinator_role` ENUM('tpo_head', 'dept_coordinator', 'placement_faculty', 'trainer') NOT NULL DEFAULT 'dept_coordinator',
  `assigned_batches` VARCHAR(120) DEFAULT NULL,
  `can_manage_drives` TINYINT(1) NOT NULL DEFAULT 0,
  `can_verify_students` TINYINT(1) NOT NULL DEFAULT 1,
  `portal_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_faculty_empid` (`employee_id`),
  UNIQUE KEY `uq_faculty_email` (`email`),
  KEY `idx_faculty_dept` (`department`),
  KEY `idx_faculty_role` (`coordinator_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. COMPANIES & RECRUITERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_name` VARCHAR(150) NOT NULL,
  `industry` VARCHAR(100) NOT NULL,
  `tier` ENUM('dream', 'super_dream', 'core', 'startup', 'mass') NOT NULL DEFAULT 'core',
  `website` VARCHAR(255) DEFAULT NULL,
  `hr_name` VARCHAR(120) DEFAULT NULL,
  `hr_email` VARCHAR(150) DEFAULT NULL,
  `hr_phone` VARCHAR(30) DEFAULT NULL,
  `location` VARCHAR(120) DEFAULT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_company_name` (`company_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. PLACEMENT DRIVES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `placement_drives` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `drive_title` VARCHAR(160) NOT NULL,
  `job_role` VARCHAR(120) NOT NULL,
  `package_lpa` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `eligible_departments` VARCHAR(255) NOT NULL DEFAULT 'ALL',
  `min_cgpa` DECIMAL(4,2) NOT NULL DEFAULT 6.00,
  `max_backlogs` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `batch_year` YEAR NOT NULL,
  `drive_date` DATE NOT NULL,
  `application_deadline` DATETIME NOT NULL,
  `drive_mode` ENUM('on_campus', 'virtual', 'hybrid') NOT NULL DEFAULT 'on_campus',
  `status` ENUM('upcoming', 'open', 'closed', 'completed', 'cancelled') NOT NULL DEFAULT 'open',
  `coordinator_id` INT UNSIGNED DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_drives_status_date` (`status`, `drive_date`),
  CONSTRAINT `fk_drives_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_drives_coordinator` FOREIGN KEY (`coordinator_id`) REFERENCES `faculty_coordinators` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_drives_admin` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. STUDENT APPLICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `drive_id` INT UNSIGNED NOT NULL,
  `student_id` INT UNSIGNED NOT NULL,
  `status` ENUM('applied', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn') NOT NULL DEFAULT 'applied',
  `remarks` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(120) DEFAULT NULL,
  `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_drive_student` (`drive_id`, `student_id`),
  KEY `idx_app_status` (`status`),
  CONSTRAINT `fk_app_drive` FOREIGN KEY (`drive_id`) REFERENCES `placement_drives` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TRAINING SESSIONS & WORKSHOPS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(160) NOT NULL,
  `topic_category` ENUM('aptitude', 'coding', 'soft_skills', 'mock_interview', 'resume', 'domain') NOT NULL DEFAULT 'coding',
  `faculty_id` INT UNSIGNED DEFAULT NULL,
  `target_department` VARCHAR(80) NOT NULL DEFAULT 'ALL',
  `batch_year` YEAR NOT NULL,
  `session_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `venue_or_link` VARCHAR(255) NOT NULL,
  `max_seats` INT UNSIGNED NOT NULL DEFAULT 100,
  `attended_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('scheduled', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_training_date` (`session_date`),
  CONSTRAINT `fk_training_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculty_coordinators` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. PORTAL NOTICES & ANNOUNCEMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(180) NOT NULL,
  `body` TEXT NOT NULL,
  `target_portal` ENUM('all', 'student', 'faculty') NOT NULL DEFAULT 'all',
  `priority` ENUM('normal', 'important', 'urgent') NOT NULL DEFAULT 'normal',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `published_by` INT UNSIGNED DEFAULT NULL,
  `expires_at` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notices_target` (`target_portal`, `is_pinned`),
  CONSTRAINT `fk_notices_admin` FOREIGN KEY (`published_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. PORTAL API TOKENS (Secure Inter-Portal Access)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `api_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `portal_name` ENUM('student_portal', 'faculty_portal', 'external_sync') NOT NULL,
  `token_label` VARCHAR(100) NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `token_prefix` VARCHAR(16) NOT NULL,
  `scopes` VARCHAR(255) NOT NULL DEFAULT 'read',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_used_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. CSV / EXCEL DATA SYNC LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `data_sync_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `portal_scope` ENUM('students', 'faculty', 'companies', 'drives', 'applications', 'full_report') NOT NULL,
  `direction` ENUM('export', 'import') NOT NULL,
  `format` ENUM('csv', 'excel_xls', 'json_api') NOT NULL,
  `record_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `file_name` VARCHAR(255) NOT NULL,
  `actor_email` VARCHAR(150) DEFAULT NULL,
  `status` ENUM('success', 'partial', 'failed') NOT NULL DEFAULT 'success',
  `summary` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sync_scope` (`portal_scope`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. IMMUTABLE AUDIT LOGS & SECURITY LOGIN ATTEMPTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_role` ENUM('admin', 'student', 'faculty', 'system') NOT NULL DEFAULT 'admin',
  `actor_id` INT UNSIGNED DEFAULT NULL,
  `actor_email` VARCHAR(150) DEFAULT NULL,
  `action` VARCHAR(80) NOT NULL,
  `entity_type` VARCHAR(60) NOT NULL,
  `entity_id` VARCHAR(60) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_entity` (`entity_type`, `created_at`),
  KEY `idx_audit_actor` (`actor_role`, `actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `identifier` VARCHAR(150) NOT NULL,
  `portal` ENUM('admin', 'student', 'faculty') NOT NULL DEFAULT 'admin',
  `ip_address` VARCHAR(45) NOT NULL,
  `was_successful` TINYINT(1) NOT NULL DEFAULT 0,
  `attempted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_login_rate` (`identifier`, `ip_address`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 12. ROLE-ISOLATED DATABASE VIEWS (FOR PHPMYADMIN & EXCEL/CSV PORTAL SYNC)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_student_portal_db` AS
SELECT
  `id`, `roll_no`, `full_name`, `email`, `phone`, `department`, `program`,
  `batch_year`, `semester`, `cgpa`, `active_backlogs`, `skills`, `resume_url`,
  `placement_status`, `placed_company`, `package_lpa`, `is_verified`, `portal_active`,
  `created_at`, `updated_at`
FROM `students`;

CREATE OR REPLACE VIEW `v_faculty_portal_db` AS
SELECT
  `id`, `employee_id`, `full_name`, `email`, `phone`, `department`, `designation`,
  `coordinator_role`, `assigned_batches`, `can_manage_drives`, `can_verify_students`,
  `portal_active`, `created_at`, `updated_at`
FROM `faculty_coordinators`;

CREATE OR REPLACE VIEW `v_applications_report` AS
SELECT
  a.`id` AS `application_id`,
  s.`roll_no`,
  s.`full_name` AS `student_name`,
  s.`email` AS `student_email`,
  s.`department`,
  s.`cgpa`,
  c.`company_name`,
  d.`drive_title`,
  d.`job_role`,
  d.`package_lpa`,
  a.`status` AS `application_status`,
  a.`remarks`,
  a.`applied_at`
FROM `applications` a
INNER JOIN `students` s ON s.`id` = a.`student_id`
INNER JOIN `placement_drives` d ON d.`id` = a.`drive_id`
INNER JOIN `companies` c ON c.`id` = d.`company_id`;

-- ----------------------------------------------------------------------------
-- 13. INITIAL SEED DATA (Idempotent Inserts)
-- Default Admin Login: admin@cdc.edu / Admin@1234
-- Default Student/Faculty Demo Password: Portal@1234
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `admins` (`id`, `full_name`, `username`, `email`, `password_hash`, `role`, `phone`, `is_active`) VALUES
(1, 'Dr. Arvind Menon (CDC Director)', 'admin', 'admin@cdc.edu', '$argon2id$v=19$m=65536,t=4,p=1$WEx0VXkzSXFEakl0bTFseg$Fn3EcHwMlPSLr3ZK5/qrf+e3ubQaNbv0wggSskShNr0', 'super_admin', '+91-9876500001', 1);

INSERT IGNORE INTO `faculty_coordinators` (`id`, `employee_id`, `full_name`, `email`, `password_hash`, `phone`, `department`, `designation`, `coordinator_role`, `assigned_batches`, `can_manage_drives`, `can_verify_students`, `portal_active`) VALUES
(1, 'FAC-101', 'Prof. Kavita Nair', 'kavita.nair@cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9876511001', 'CSE', 'Associate Professor', 'tpo_head', '2026,2027', 1, 1, 1),
(2, 'FAC-102', 'Prof. Rajesh Sharma', 'rajesh.sharma@cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9876511002', 'ECE', 'Assistant Professor', 'dept_coordinator', '2026,2027', 0, 1, 1),
(3, 'FAC-103', 'Ms. Neha Deshmukh', 'neha.d@cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9876511003', 'CDC Training', 'Lead Corporate Trainer', 'trainer', '2026,2027,2028', 0, 0, 1),
(4, 'FAC-104', 'Dr. Vikram Iyer', 'vikram.iyer@cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9876511004', 'IT', 'Professor', 'placement_faculty', '2026', 1, 1, 1);

INSERT IGNORE INTO `students` (`id`, `roll_no`, `full_name`, `email`, `password_hash`, `phone`, `department`, `program`, `batch_year`, `semester`, `cgpa`, `active_backlogs`, `skills`, `placement_status`, `placed_company`, `package_lpa`, `is_verified`, `portal_active`) VALUES
(1, '23CSE001', 'Aarav Kulkarni', 'aarav.k@student.cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9820011001', 'CSE', 'B.Tech', 2027, 7, 9.15, 0, 'Java, Spring Boot, React, SQL', 'placed', 'Google Cloud India', 24.50, 1, 1),
(2, '23CSE014', 'Diya Chatterjee', 'diya.c@student.cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9820011002', 'CSE', 'B.Tech', 2027, 7, 8.72, 0, 'Python, FastAPI, ML, PostgreSQL', 'shortlisted', NULL, NULL, 1, 1),
(3, '23IT008', 'Rohan Verma', 'rohan.v@student.cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9820011003', 'IT', 'B.Tech', 2027, 7, 8.34, 0, 'PHP, Laravel, MySQL, JavaScript', 'unplaced', NULL, NULL, 1, 1),
(4, '23ECE021', 'Sneha Reddy', 'sneha.r@student.cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9820011004', 'ECE', 'B.Tech', 2027, 7, 7.95, 0, 'Embedded C, Verilog, Python', 'placed', 'Qualcomm', 18.00, 1, 1),
(5, '23ME012', 'Karan Malhotra', 'karan.m@student.cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9820011005', 'ME', 'B.Tech', 2027, 7, 7.10, 1, 'AutoCAD, SolidWorks, ANSYS', 'unplaced', NULL, NULL, 0, 1),
(6, '23AIML005', 'Meera Joshi', 'meera.j@student.cdc.edu', '$2y$10$NUItL0OGobVcq49BfsO5Z.BOYxOAkJvgu0RYLxOKq546I4We218Qq', '+91-9820011006', 'AIML', 'B.Tech', 2027, 7, 9.02, 0, 'PyTorch, LLMs, Docker, SQL', 'shortlisted', NULL, NULL, 1, 1);

INSERT IGNORE INTO `companies` (`id`, `company_name`, `industry`, `tier`, `website`, `hr_name`, `hr_email`, `hr_phone`, `location`, `is_verified`) VALUES
(1, 'Google Cloud India', 'Cloud & AI', 'super_dream', 'https://cloud.google.com', 'Ananya Rao', 'ananya.hr@google-partner.example', '+91-8040001111', 'Bengaluru', 1),
(2, 'Qualcomm', 'Semiconductors & Embedded', 'dream', 'https://qualcomm.com', 'Siddharth Sen', 'careers@qualcomm.example', '+91-4040002222', 'Hyderabad', 1),
(3, 'TCS Digital', 'Enterprise IT', 'core', 'https://tcs.com', 'Prakash Joshi', 'campus@tcs.example', '+91-2240003333', 'Mumbai / Pune', 1),
(4, 'Razorpay', 'FinTech', 'super_dream', 'https://razorpay.com', 'Riya Kapoor', 'talent@razorpay.example', '+91-8040004444', 'Bengaluru', 1);

INSERT IGNORE INTO `placement_drives` (`id`, `company_id`, `drive_title`, `job_role`, `package_lpa`, `eligible_departments`, `min_cgpa`, `max_backlogs`, `batch_year`, `drive_date`, `application_deadline`, `drive_mode`, `status`, `coordinator_id`, `description`, `created_by`) VALUES
(1, 1, 'Google Cloud Associate Engineer Drive 2027', 'Associate Cloud Engineer', 24.50, 'CSE,IT,AIML', 8.00, 0, 2027, '2026-12-10', '2026-12-05 23:59:00', 'hybrid', 'completed', 1, 'Full-time SDE/Cloud role for 2027 graduating batch.', 1),
(2, 4, 'Razorpay SDE-1 Campus Hiring', 'Software Development Engineer I', 21.00, 'CSE,IT,AIML,ECE', 7.50, 0, 2027, '2026-12-18', '2026-12-14 23:59:00', 'virtual', 'open', 1, 'Backend & Distributed Systems role with 6-month internship + PPO.', 1),
(3, 3, 'TCS Digital National Drive', 'Systems Engineer (Digital)', 7.50, 'ALL', 6.50, 0, 2027, '2026-12-22', '2026-12-19 23:59:00', 'on_campus', 'open', 4, 'Pan-branch placement drive for eligible 2027 students.', 1),
(4, 2, 'Qualcomm Hardware & Firmware Hiring', 'Associate Engineer - Embedded', 18.00, 'ECE,CSE', 7.50, 0, 2027, '2026-12-02', '2026-11-30 23:59:00', 'on_campus', 'upcoming', 2, 'Core VLSI & Embedded Systems campus recruitment.', 1);

INSERT IGNORE INTO `applications` (`id`, `drive_id`, `student_id`, `status`, `remarks`, `updated_by`) VALUES
(1, 1, 1, 'accepted', 'Offer letter verified by CDC', 'admin@cdc.edu'),
(2, 2, 2, 'shortlisted', 'Cleared online coding round', 'kavita.nair@cdc.edu'),
(3, 2, 6, 'shortlisted', 'Top 5% in assessment', 'kavita.nair@cdc.edu'),
(4, 2, 3, 'applied', 'Pending resume screening', 'rohan.v@student.cdc.edu'),
(5, 3, 3, 'applied', 'Eligible - verified', 'admin@cdc.edu'),
(6, 4, 4, 'offered', 'Selected in technical panel 2', 'rajesh.sharma@cdc.edu');

INSERT IGNORE INTO `training_sessions` (`id`, `title`, `topic_category`, `faculty_id`, `target_department`, `batch_year`, `session_date`, `start_time`, `end_time`, `venue_or_link`, `max_seats`, `attended_count`, `status`) VALUES
(1, 'System Design & DSA Bootcamp', 'coding', 1, 'CSE,IT,AIML', 2027, '2026-12-03', '10:00:00', '13:00:00', 'Auditorium Block B', 180, 0, 'scheduled'),
(2, 'Resume Review & HR Mock Interviews', 'mock_interview', 3, 'ALL', 2027, '2026-12-06', '14:00:00', '17:00:00', 'CDC Seminar Hall 2', 120, 0, 'scheduled'),
(3, 'Quantitative Aptitude Intensive', 'aptitude', 3, 'ALL', 2027, '2026-11-20', '09:30:00', '12:30:00', 'Main Auditorium', 250, 214, 'completed');

INSERT IGNORE INTO `notices` (`id`, `title`, `body`, `target_portal`, `priority`, `is_pinned`, `published_by`, `expires_at`) VALUES
(1, 'Razorpay SDE-1 Registrations Open Till Dec 14', 'Eligible students (CGPA >= 7.5, 0 active backlogs) must confirm their resume in the Student Portal before Dec 14.', 'student', 'urgent', 1, 1, '2026-12-15'),
(2, 'Faculty Coordinators: Verify Batch 2027 CGPA Sheets', 'Department coordinators are requested to verify student academic data and upload any corrections via the Faculty Portal.', 'faculty', 'important', 1, 1, '2026-12-10'),
(3, 'Winter Placement Season Guidelines 2026-27', 'All three CDC portals now synchronize student and faculty databases via standardized CSV/Excel & secure PDO storage.', 'all', 'normal', 0, 1, '2027-01-31');

-- Pre-seeded API tokens for Student Portal and Faculty Portal
-- Student Portal Demo Token: cdc_stu_live_9f8e7d6c5b4a3210fedcba9876543210
-- Faculty Portal Demo Token: cdc_fac_live_1a2b3c4d5e6f708192a3b4c5d6e7f809
INSERT IGNORE INTO `api_tokens` (`id`, `portal_name`, `token_label`, `token_hash`, `token_prefix`, `scopes`, `is_active`) VALUES
(1, 'student_portal', 'Student Portal Primary Connector', SHA2('cdc_stu_live_9f8e7d6c5b4a3210fedcba9876543210', 256), 'cdc_stu_live', 'students:read,drives:read,applications:write,notices:read', 1),
(2, 'faculty_portal', 'Faculty Coordinator Primary Connector', SHA2('cdc_fac_live_1a2b3c4d5e6f708192a3b4c5d6e7f809', 256), 'cdc_fac_live', 'faculty:read,students:read,drives:read,training:write,notices:read', 1);

INSERT IGNORE INTO `audit_logs` (`id`, `actor_role`, `actor_id`, `actor_email`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`) VALUES
(1, 'system', 1, 'system@cdc.edu', 'SCHEMA_INIT', 'database', 'cdc_management', 'Initialized unified 3-portal CDC database schema and seed data', '127.0.0.1');
