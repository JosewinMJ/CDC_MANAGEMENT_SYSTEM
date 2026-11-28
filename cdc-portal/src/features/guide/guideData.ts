import { InternshipTrack } from '../../shared/types';

export interface Mentee {
  id: number;
  reg_number: string;
  branch: string;
  programme: string;
  semester: number;
  current_cgpa: number;
  tenth_percentage?: number;
  twelfth_percentage?: number;
  active_backlogs?: number;
  historical_backlogs?: number;
  placement_status: string;
  verification_status: string;
  user: { name: string; email: string; phone?: string };
  assigned_guide?: { name: string } | null;
  documents?: Array<{ id: number; name: string; category: string; verification_status: string }>;
}

export interface ReviewStep {
  stepNumber: number;
  stepName: string;
  decision: string;
  reviewOutcome?: 'CHANGES_REQUESTED';
  remarks?: string | null;
  responsibleUserName?: string;
}

export interface SubmissionDocument {
  id?: string | number;
  name?: string;
  category?: string;
  fileUrl?: string;
  downloadUrl?: string;
  file_url?: string;
}

export interface InternshipSubmission {
  id: number;
  student_profile_id: number;
  student_profile?: Pick<Mentee, 'reg_number' | 'user'> | null;
  faculty_guide?: { name: string } | null;
  track: InternshipTrack;
  semester: string | null;
  company_name: string;
  company_address: string | null;
  company_contact_number: string | null;
  job_role: string;
  work_profile: string | null;
  mode: string;
  is_stipend: boolean;
  stipend_amount: number | null;
  stipend_currency: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  created_at: string;
  status: string;
  steps: ReviewStep[] | null;
  documents: SubmissionDocument[] | null;
}

export interface PendingDocument extends SubmissionDocument {
  id: number;
  name: string;
  category: string;
  student_profile?: Pick<Mentee, 'reg_number' | 'user'> | null;
}

export interface GuideDashboard {
  mentees: Mentee[];
  documents: PendingDocument[];
}

export const tracks = [
  { value: InternshipTrack.TRACK_1_SUMMER, label: 'Summer I', title: 'Summer Internship I' },
  { value: InternshipTrack.TRACK_2_HYBRID, label: 'Summer II', title: 'Summer Internship II' },
  { value: InternshipTrack.TRACK_3_SEMESTER, label: 'Flexible', title: 'Flexible Internship' },
];

export const reviewFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Needs review' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'returned', label: 'Returned' },
];

export function trackTitle(track: InternshipTrack) {
  return tracks.find(option => option.value === track)?.title ?? 'Internship';
}

export function getReviewStep(submission: InternshipSubmission | undefined, number: number) {
  return submission?.steps?.find(step => step.stepNumber === number);
}

export const reviewPath = (id: number) => `/guide/internships/${id}`;

export function reviewStatus(submission: InternshipSubmission) {
  switch (submission.status) {
    case 'PENDING_GUIDE_REVIEW':
      return { group: 'pending', label: 'Needs review' };
    case 'GUIDE_APPROVED':
    case 'PENDING_CDC_APPROVAL':
      return { group: 'coordinator', label: 'With coordinator' };
    case 'REJECTED':
      return {
        group: 'returned',
        label: getReviewStep(submission, 2)?.reviewOutcome === 'CHANGES_REQUESTED' ? 'Changes requested' : 'Rejected',
      };
    case 'APPROVED':
    case 'IN_PROGRESS':
    case 'COMPLETED':
      return { group: 'closed', label: readableStatus(submission.status) };
    default:
      return { group: 'other', label: readableStatus(submission.status) };
  }
}

export function readableStatus(status: string) {
  return status.toLowerCase().replaceAll('_', ' ').replace(/^./, first => first.toUpperCase());
}

export function initials(name: string) {
  return name.replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2)
    .map(word => word.charAt(0).toUpperCase()).join('');
}

export function safeDocumentUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin &&
        (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/storage/'))) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    if (url.protocol === 'https:' && /^https:\/\//i.test(value)) return url.href;
  } catch {
    return undefined;
  }
  return undefined;
}

export function dateKey(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map(value => String(value).padStart(2, '0')).join('-');
}

export interface GuideEvent {
  id: string;
  date: string;
  title: string;
  detail: string;
  submissionId: number;
}

export function internshipEvents(submissions: InternshipSubmission[]): GuideEvent[] {
  return submissions.flatMap(submission => {
    if (submission.status === 'REJECTED') return [];
    const detail = [submission.student_profile?.user.name, submission.company_name].filter(Boolean).join(' · ');
    return [
      { id: `${submission.id}-start`, date: submission.start_date?.slice(0, 10), title: 'Internship starts', detail, submissionId: submission.id },
      { id: `${submission.id}-end`, date: submission.end_date?.slice(0, 10), title: 'Internship ends', detail, submissionId: submission.id },
    ].filter(event => event.date);
  });
}
