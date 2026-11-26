// Status Enums for the Career Development Centre (CDC) Portal

export enum UserRole {
  STUDENT = 'STUDENT',
  GUIDE = 'GUIDE',
  ADMIN_SUPER = 'ADMIN_SUPER',
  ADMIN_PLACEMENT = 'ADMIN_PLACEMENT',
  ADMIN_INTERNSHIP = 'ADMIN_INTERNSHIP',
  ADMIN_STAFF = 'ADMIN_STAFF',
}

export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  ASSESSMENT_SCHEDULED = 'ASSESSMENT_SCHEDULED',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  SELECTED = 'SELECTED',
  NOT_SELECTED = 'NOT_SELECTED',
  WAITLISTED = 'WAITLISTED',
}

export enum InternshipTrack {
  TRACK_1_SUMMER = 'TRACK_1_SUMMER',       // After 2nd Year
  TRACK_2_HYBRID = 'TRACK_2_HYBRID',       // After 3rd Year
  TRACK_3_SEMESTER = 'TRACK_3_SEMESTER',   // 4th Year (Odd/Even Sem)
}

export enum InternshipMode {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  HYBRID = 'Hybrid',
}

export enum InternshipStatus {
  NOT_STARTED = 'NOT_STARTED',
  SUBMITTED = 'SUBMITTED',
  PENDING_GUIDE_REVIEW = 'PENDING_GUIDE_REVIEW',
  GUIDE_APPROVED = 'GUIDE_APPROVED',
  PENDING_CDC_APPROVAL = 'PENDING_CDC_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum DocumentVerificationStatus {
  NOT_UPLOADED = 'NOT_UPLOADED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ParentAlertDeliveryStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum ParentAlertType {
  REMINDER_1 = 'Reminder 1 (3 days before)',
  REMINDER_2 = 'Reminder 2 (1 day before)',
  DEADLINE_DAY = 'Deadline Day Reminder',
  FINAL_MISSED = 'Final Notice (Deadline Passed)',
}

export enum NotificationChannel {
  WHATSAPP = 'WhatsApp',
  SMS = 'SMS',
  EMAIL = 'Email',
}

export enum CodingTrackingStatus {
  OK = 'OK',
  PENDING_CHECK = 'PENDING_CHECK',
  USERNAME_NOT_FOUND = 'USERNAME_NOT_FOUND',
  FETCH_FAILED = 'FETCH_FAILED',
  DUPLICATE_USERNAME = 'DUPLICATE_USERNAME',
  NO_USERNAME_GIVEN = 'NO_USERNAME_GIVEN',
}

export enum NoticePriority {
  NORMAL = 'Normal',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum NoticeCategory {
  ALL = 'All Categories',
  PLACEMENT = 'Placement',
  INTERNSHIP = 'Internship',
  DEADLINE = 'Deadline',
  INTERVIEW = 'Interview',
  ACADEMIC = 'Academic',
  GUIDE = 'Guide Instructions',
  GENERAL = 'General',
}

export enum ProblemDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}
