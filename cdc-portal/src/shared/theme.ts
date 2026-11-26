// Central theme tokens for Career Development Centre (CDC) Portal

export const THEME_COLORS = {
  primary: '#142B4A',     // Deep Navy Blue
  secondary: '#2855A6',   // Royal Blue
  background: '#F5F7FA',  // Very Light Grey
  card: '#FFFFFF',        // White
  accent: '#EAF2FF',      // Soft Sky Blue
  text: '#263445',        // Dark Charcoal
  textMuted: '#78869A',   // Muted Grey
  success: '#10B981',     // Soft Green
  successBg: '#ECFDF5',   // Green badge background
  warning: '#F59E0B',     // Soft Amber
  warningBg: '#FFFBEB',   // Amber badge background
  danger: '#EF4444',      // Soft Red
  dangerBg: '#FEF2F2',    // Red badge background
  border: '#E2E8F0',
} as const;

export const BADGE_STYLES = {
  // Eligibility
  ELIGIBLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NOT_ELIGIBLE: 'bg-rose-50 text-rose-700 border-rose-200',
  PENDING_VERIFICATION: 'bg-amber-50 text-amber-700 border-amber-200',

  // Verification
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  NOT_UPLOADED: 'bg-slate-100 text-slate-600 border-slate-200',

  // Application
  APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSESSMENT_SCHEDULED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHORTLISTED: 'bg-purple-50 text-purple-700 border-purple-200',
  INTERVIEW_SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
  SELECTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NOT_SELECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  WAITLISTED: 'bg-amber-50 text-amber-700 border-amber-200',

  // Internship
  NOT_STARTED: 'bg-slate-100 text-slate-600 border-slate-200',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING_GUIDE_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  GUIDE_APPROVED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PENDING_CDC_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 border-sky-200',
  COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',

  // Parent Alert
  SCHEDULED: 'bg-slate-100 text-slate-700 border-slate-200',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',

  // Coding Status
  OK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING_CHECK: 'bg-blue-50 text-blue-700 border-blue-200',
  USERNAME_NOT_FOUND: 'bg-rose-50 text-rose-700 border-rose-200',
  FETCH_FAILED: 'bg-amber-50 text-amber-700 border-amber-200',
  DUPLICATE_USERNAME: 'bg-rose-50 text-rose-700 border-rose-200',
  NO_USERNAME_GIVEN: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;
