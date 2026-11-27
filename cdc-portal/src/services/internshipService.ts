import { apiRequest } from './apiClient';
import { Internship, InternshipStatus, InternshipTrack, UserRole } from '../shared/types';

function mapInternship(it: any): Internship {
  return {
    id: String(it.id),
    studentId: String(it.student_profile_id || ''),
    track: it.track as InternshipTrack,
    semester: it.semester || undefined,
    companyName: it.company_name,
    companyContactNumber: it.company_contact_number || '',
    companyAddress: it.company_address || '',
    jobRole: it.job_role,
    isStipend: Boolean(it.is_stipend),
    stipendAmount: it.stipend_amount ?? undefined,
    stipendCurrency: it.stipend_currency || '₹',
    mode: it.mode,
    startDate: it.start_date,
    endDate: it.end_date,
    durationWeeks: Number(it.duration_weeks || 8),
    workProfile: it.work_profile || '',
    facultyGuideId: String(it.faculty_guide_id || ''),
    facultyGuideName: it.faculty_guide?.name || 'Faculty Guide',
    status: it.status === 'REJECTED' && it.steps?.some((step: Internship['steps'][number]) => step.reviewOutcome === 'CHANGES_REQUESTED')
      ? InternshipStatus.CHANGES_REQUESTED : it.status as InternshipStatus,
    steps: it.steps || [],
    documents: it.documents || [],
    academicYear: it.academic_year || '2026-2027',
  };
}

export const internshipService = {
  async getInternships(): Promise<Internship[]> {
    const raw = await apiRequest<any[]>('/internships/my-internships', { portal: 'student' });
    return raw.map(mapInternship);
  },

  async getInternshipsByTrack(track: InternshipTrack): Promise<Internship[]> {
    const list = await this.getInternships();
    return list.filter(i => i.track === track);
  },

  async getInternshipById(id: string): Promise<Internship | undefined> {
    const list = await this.getInternships();
    return list.find(i => i.id === id);
  },

  async registerInternship(data: {
    track: InternshipTrack;
    semester?: '7th Semester (Odd)' | '8th Semester (Even)';
    companyName: string;
    companyContactNumber: string;
    companyAddress: string;
    jobRole: string;
    customRole?: string;
    isStipend: boolean;
    stipendAmount?: number;
    stipendCurrency?: string;
    mode?: any;
    startDate: string;
    endDate: string;
    durationWeeks: number;
    workProfile: string;
    facultyGuideId: string;
    facultyGuideName: string;
    offerLetterDocName: string;
    supportingDocNames?: string[];
    files?: Record<string, File | undefined>;
  }): Promise<Internship> {
    const { files, ...values } = data;
    const body = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && !Array.isArray(value)) body.set(key, typeof value === 'boolean' ? String(Number(value)) : String(value));
    }
    body.set('jobRole', data.customRole || data.jobRole);
    for (const [key, file] of Object.entries(files ?? {})) {
      if (file) body.set(key, file);
    }
    const raw = await apiRequest('/internships/register', { method: 'POST', portal: 'student', body });
    return mapInternship(raw);
  },

  async reviewInternshipMock(
    internshipId: string,
    role: UserRole.GUIDE | UserRole.ADMIN_INTERNSHIP,
    decision: 'APPROVED' | 'REJECTED',
    remarks?: string,
    _reviewerName?: string
  ): Promise<Internship | null> {
    const portal = role === UserRole.GUIDE ? 'guide' : 'admin';
    const raw = await apiRequest<any>(`/internships/${internshipId}/review`, {
      method: 'POST',
      portal,
      body: JSON.stringify({ role, decision, remarks }),
    });
    return mapInternship(raw);
  },

  async submitCompletion(
    internshipId: string,
    _certName: string,
    _reportName: string
  ): Promise<Internship | null> {
    return this.getInternshipById(internshipId).then(x => x ?? null);
  },
};
