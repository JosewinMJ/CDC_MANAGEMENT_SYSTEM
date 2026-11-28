import { apiRequest } from './apiClient';
import { Application, ApplicationStatus, Interview } from '../shared/types';

function mapApplication(a: any): Application {
  const companyName = a.company?.name || a.companyName || 'Company';
  return {
    id: String(a.id),
    studentId: String(a.student_profile_id || a.studentId || ''),
    companyId: String(a.company_id || a.companyId || ''),
    companyName,
    companyLogo:
      a.company?.logo_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=142B4A&color=fff&bold=true`,
    roleId: String(a.job_role_id || a.roleId || ''),
    roleTitle: a.job_role?.role_title || a.roleTitle || 'Role',
    packageCtc: a.job_role?.package_ctc || a.packageCtc || '',
    appliedDate: a.created_at || a.appliedDate || new Date().toISOString(),
    status: (a.status as ApplicationStatus) || ApplicationStatus.APPLIED,
    nextStage: a.next_stage || a.nextStage,
    timeline: a.timeline || [],
    academicYear: a.academic_year || '2026-2027',
  };
}

export const applicationService = {
  async getApplications(): Promise<Application[]> {
    const raw = await apiRequest<any[]>('/applications/my-applications', { portal: 'student' });
    return raw.map(mapApplication);
  },

  async applyForRole(companyId: string, roleId: string): Promise<Application> {
    const raw = await apiRequest<any>('/applications', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify({
        companyId: Number(companyId),
        roleId: Number(roleId),
      }),
    });
    return mapApplication(raw);
  },

  async advanceApplicationStageMock(
    applicationId: string,
    nextStatus: ApplicationStatus,
    remarks?: string
  ): Promise<Application | null> {
    const raw = await apiRequest<any>(`/admin/applications/${applicationId}/stage`, {
      method: 'PATCH',
      portal: 'admin',
      body: JSON.stringify({ status: nextStatus, remarks }),
    });
    return mapApplication(raw);
  },
};

export const interviewService = {
  async getInterviews(): Promise<Interview[]> {
    return apiRequest<Interview[]>('/interviews', { portal: 'student' });
  },

  async getUpcomingInterviews(): Promise<Interview[]> {
    const interviews = await this.getInterviews();
    return interviews.filter(i => i.status === 'Scheduled');
  },
};
