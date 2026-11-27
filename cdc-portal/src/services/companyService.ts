import { apiRequest } from './apiClient';
import { Company, JobRole, EligibilityResult, Student } from '../shared/types';

function mapRole(r: any): JobRole {
  return {
    id: String(r.id),
    roleTitle: r.role_title || r.roleTitle,
    packageCtc: r.package_ctc || r.packageCtc,
    stipend: r.stipend || undefined,
    jobType: r.job_type || r.jobType || 'Full-time',
    workLocation: r.work_location || r.workLocation || 'Bengaluru',
    bondPeriod: r.bond_period || undefined,
    description: r.description || '',
    requiredSkills: r.required_skills || [],
    eligibilityCriteria: r.eligibility_criteria || r.eligibilityCriteria,
  };
}

function mapCompany(c: any): Company {
  return {
    id: String(c.id),
    name: c.name,
    logoUrl:
      c.logo_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=142B4A&color=fff&bold=true`,
    description: c.description || '',
    website: c.website || '',
    roles: (c.roles || []).map(mapRole),
    applicationDeadline: c.application_deadline || c.applicationDeadline,
    recruitmentSchedule: c.recruitment_schedule || [],
    instructions: c.instructions || '',
    department: c.departments || ['CSE', 'IT'],
    academicYear: c.academic_year || '2026-2027',
  };
}

export const companyService = {
  async getCompanies(): Promise<Company[]> {
    const raw = await apiRequest<any[]>('/companies', { portal: 'student' });
    return raw.map(mapCompany);
  },

  async getCompanyById(id: string): Promise<Company | undefined> {
    const raw = await apiRequest<any>(`/companies/${id}`, { portal: 'student' });
    return mapCompany(raw);
  },

  async getJobRoles(companyId: string): Promise<JobRole[]> {
    const company = await this.getCompanyById(companyId);
    return company?.roles || [];
  },
};

export const eligibilityService = {
  async checkEligibility(
    roleId: string,
    _customStudent?: Student
  ): Promise<{ company: Company; role: JobRole; result: EligibilityResult } | null> {
    const [companies, result] = await Promise.all([
      companyService.getCompanies(),
      apiRequest<EligibilityResult>('/eligibility/evaluate', {
        method: 'POST',
        portal: 'student',
        body: JSON.stringify({ roleId }),
      }),
    ]);

    for (const company of companies) {
      const role = company.roles.find(r => r.id === String(roleId));
      if (role) return { company, role, result };
    }
    return null;
  },

  async getAllEligibilitySummaries(): Promise<Array<{ company: Company; role: JobRole; result: EligibilityResult }>> {
    const companies = await companyService.getCompanies();
    const out: Array<{ company: Company; role: JobRole; result: EligibilityResult }> = [];

    for (const company of companies) {
      for (const role of company.roles) {
        const result = await apiRequest<EligibilityResult>('/eligibility/evaluate', {
          method: 'POST',
          portal: 'student',
          body: JSON.stringify({ roleId: role.id }),
        });
        out.push({ company, role, result });
      }
    }
    return out;
  },
};
