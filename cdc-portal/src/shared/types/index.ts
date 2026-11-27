// Shared Domain Models for the Career Development Centre (CDC) Portal
import {
  UserRole,
  EligibilityStatus,
  ApplicationStatus,
  InternshipTrack,
  InternshipMode,
  InternshipStatus,
  DocumentVerificationStatus,
  ParentAlertDeliveryStatus,
  ParentAlertType,
  NotificationChannel,
  CodingTrackingStatus,
  NoticePriority,
  NoticeCategory,
  ProblemDifficulty,
} from './enums';

export * from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
}

export interface ParentContact {
  name: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  phone: string;
  isVerified: boolean;
  email?: string;
  preferredChannel: NotificationChannel;
  consentGiven: boolean;
  lastVerifiedAt?: string;
}

export interface SemesterResult {
  semesterNumber: number;
  gpa: number;
  credits: number;
  backlogs: number;
}

export interface AcademicRecord {
  degree: string;
  programme: string;
  department: string;
  branch: string;
  specialization?: string;
  academicYear: string; // e.g. "2026-2027"
  graduationYear: number;
  tenthPercentage: number;
  twelfthPercentage: number;
  currentCgpa: number;
  activeBacklogs: number;
  historicalBacklogs: number;
  semesterResults: SemesterResult[];
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  correctionPending?: boolean;
}

export interface AcademicCorrectionRequest {
  id: string;
  studentId: string;
  field: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  supportingDocName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface SkillProfile {
  technicalSkills: string[];
  nonTechnicalSkills: string[];
  programmingLanguages: string[];
  toolsAndTechnologies: string[];
  projects: Project[];
  certifications: Certification[];
  achievements: string[];
}

export interface Document {
  internshipId?: number;
  id: string;
  name: string;
  category: 'Resume' | '10th Marksheet' | '12th Marksheet' | 'Semester Marksheet' | 'Certificate' | 'Offer Letter' | 'Joining Letter' | 'Progress Report' | 'Completion Certificate' | 'Internship Report' | 'Other';
  fileUrl: string;
  fileSize: string;
  uploadDate: string;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verifiedDate?: string;
  rejectionReason?: string;
  downloadUrl?: string;
  track?: InternshipTrack;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
}

export interface Student {
  id: string;
  regNumber: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  avatarUrl: string;
  academicYear: string; // "2026-2027"
  assignedGuideId: string;
  assignedGuideName: string;
  assignedGuideEmail: string;
  parentContact: ParentContact;
  academicRecord: AcademicRecord;
  skills: SkillProfile;
  documents: Document[];
  leetcodeUsername?: string;
}

export interface EligibilityCriteria {
  minCgpa: number;
  minTenthMarks: number;
  minTwelfthMarks: number;
  maxActiveBacklogs: number;
  maxHistoricalBacklogs: number;
  allowedBranches: string[];
  allowedDegrees: string[];
  allowedGraduationYears: number[];
  minCodingProblemsSolved?: number; // Optional LeetCode practice criterion
}

export interface CriterionCheck {
  studentValue: string | number;
  requiredValue: string | number;
  passed: boolean;
  reason?: string;
}

export interface EligibilityResult {
  overallStatus: EligibilityStatus;
  criteriaBreakdown: {
    cgpa: CriterionCheck;
    tenthMarks: CriterionCheck;
    twelfthMarks: CriterionCheck;
    activeBacklogs: CriterionCheck;
    historicalBacklogs: CriterionCheck;
    branch: CriterionCheck;
    graduationYear: CriterionCheck;
    codingPractice?: CriterionCheck;
    academicVerification: CriterionCheck;
  };
  summaryReason?: string;
}

export interface JobRole {
  id: string;
  roleTitle: string;
  packageCtc: string; // e.g. "9.5 LPA"
  stipend?: string;   // e.g. "₹40,000 / month"
  jobType: 'Full-time' | 'Internship' | 'Internship + Full-time';
  workLocation: string;
  bondPeriod?: string;
  description: string;
  requiredSkills: string[];
  eligibilityCriteria: EligibilityCriteria;
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  website: string;
  roles: JobRole[];
  applicationDeadline: string;
  recruitmentSchedule: {
    stageName: string;
    date: string;
    mode: 'Online' | 'Offline' | 'Campus Visit';
  }[];
  instructions: string;
  department: string[];
  academicYear: string;
}

export interface ApplicationTimelineStage {
  stage: ApplicationStatus;
  date: string;
  completed: boolean;
  remarks?: string;
}

export interface Application {
  id: string;
  studentId: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  roleId: string;
  roleTitle: string;
  packageCtc: string;
  appliedDate: string;
  status: ApplicationStatus;
  nextStage?: string;
  timeline: ApplicationTimelineStage[];
  academicYear: string;
}

export interface Interview {
  id: string;
  studentId: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  roleTitle: string;
  roundName: string;
  scheduledDate: string;
  scheduledTime: string;
  venueOrLink: string;
  isOnline: boolean;
  instructions: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  academicYear: string;
}

export interface InternshipApprovalStep {
  reviewOutcome?: 'CHANGES_REQUESTED';
  stepNumber: number;
  stepName: 'Student Submission' | 'Faculty Guide Review' | 'CDC Coordinator Verification' | 'Final Approval';
  assignedRole: UserRole;
  decision: 'APPROVED' | 'REJECTED' | 'PENDING' | 'SUBMITTED';
  responsibleUserName: string;
  decisionDate?: string;
  remarks?: string;
}

export interface Internship {
  id: string;
  studentId: string;
  track: InternshipTrack;
  semester?: '7th Semester (Odd)' | '8th Semester (Even)'; // For Track 3
  companyName: string;
  companyContactNumber: string;
  companyAddress: string;
  jobRole: string;
  customRole?: string;
  isStipend: boolean;
  stipendAmount?: number;
  stipendCurrency?: string;
  mode?: InternshipMode;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  workProfile: string;
  facultyGuideId: string;
  facultyGuideName: string;
  status: InternshipStatus;
  steps: InternshipApprovalStep[];
  documents: Document[];
  academicYear: string;
  isCdcPublished?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  publisherName: string;
  publisherRole: 'CDC Administrator' | 'Placement Coordinator' | 'Faculty Guide';
  publishedDate: string;
  expiryDate?: string;
  category: NoticeCategory;
  priority: NoticePriority;
  isImportant: boolean;
  attachments?: { name: string; url: string; size: string }[];
  readByStudentIds: string[];
  targetBranches?: string[];
  academicYear: string;
}

export interface ParentAlert {
  id: string;
  studentId: string;
  companyId: string;
  companyName: string;
  applicationDeadline: string;
  alertType: ParentAlertType;
  recipientMaskedPhone: string;
  channel: NotificationChannel;
  scheduledDate: string;
  sentDate?: string;
  deliveryStatus: ParentAlertDeliveryStatus;
  sampleMessage: string;
  academicYear: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: 'deadline' | 'assessment' | 'interview' | 'campus_visit' | 'internship_milestone' | 'document_deadline' | 'parent_alert' | 'cdc_event';
  companyName?: string;
  venueOrLink?: string;
  status?: string;
  actionUrl?: string;
  actionLabel?: string;
  academicYear: string;
}

export interface TopicStat {
  topicName: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  targetCount: number;
  isStrong?: boolean;
}

export interface SolvedProblem {
  id: string;
  title: string;
  leetcodeUrl: string;
  difficulty: ProblemDifficulty;
  topics: string[];
  solvedAt: string;
}

export interface PostedQuestion {
  id: string;
  title: string;
  leetcodeUrl: string;
  difficulty: ProblemDifficulty;
  postedDate: string;
  dueDate: string;
  isSolved: boolean;
  solvedAt?: string;
  solvedByCount?: number;
  totalStudents?: number;
}

export interface WeeklyReport {
  weekEndingDate: string; // Sunday
  weekNumber: number;
  easy: number;
  medium: number;
  hard: number;
  solvedThisWeek: number;
  totalSinceStart: number;
  postedQuestionsDone: number;
  targetMet: boolean;
  flag: 'Target met' | 'Below target (10)';
}

export interface CodingProfile {
  username: string;
  fullName: string;
  regNumber: string;
  classSection: string;
  trackingStatus: CodingTrackingStatus;
  programStartDate: string;
  lastUpdated: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  solvedThisWeek: number;
  weeklyTarget: number;
  postedQuestionsDone: number;
  postedQuestionsTotal: number;
  lastSolvedDate: string;
  streakDays: number;
  dailySolveTrend: { date: string; count: number }[];
  topicStats: TopicStat[];
  solvedProblems: SolvedProblem[];
  postedQuestions: PostedQuestion[];
  weeklyReports: WeeklyReport[];
  activityMap: { date: string; solves: number }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'Internship' | 'Application' | 'Profile' | 'Document' | 'Notice' | 'ParentAlert';
  entityId: string;
  details: string;
  remarks?: string;
  academicYear: string;
}
