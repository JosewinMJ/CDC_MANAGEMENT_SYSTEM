import { db } from './storage';
import { Company, JobRole, EligibilityResult, Student } from '../shared/types';
import { evaluateEligibility } from '../shared/eligibility';

export const companyService = {
  async getCompanies(): Promise<Company[]> {
    return Promise.resolve(db.getCompanies());
  },

  async getCompanyById(id: string): Promise<Company | undefined> {
    const companies = db.getCompanies();
    return Promise.resolve(companies.find(c => c.id === id));
  },

  async getJobRoles(companyId: string): Promise<JobRole[]> {
    const company = await this.getCompanyById(companyId);
    return Promise.resolve(company?.roles || []);
  },
};

export const eligibilityService = {
  async checkEligibility(roleId: string, customStudent?: Student): Promise<{ company: Company; role: JobRole; result: EligibilityResult } | null> {
    const student = customStudent || db.getStudent();
    const coding = db.getCodingProfile();
    const companies = db.getCompanies();

    for (const company of companies) {
      const role = company.roles.find(r => r.id === roleId);
      if (role) {
        const result = evaluateEligibility(student, student.academicRecord, coding, role.eligibilityCriteria);
        return Promise.resolve({
          company,
          role,
          result,
        });
      }
    }
    return Promise.resolve(null);
  },

  async getAllEligibilitySummaries(customStudent?: Student): Promise<Array<{ company: Company; role: JobRole; result: EligibilityResult }>> {
    const student = customStudent || db.getStudent();
    const coding = db.getCodingProfile();
    const companies = db.getCompanies();
    const results: Array<{ company: Company; role: JobRole; result: EligibilityResult }> = [];

    for (const company of companies) {
      for (const role of company.roles) {
        const result = evaluateEligibility(student, student.academicRecord, coding, role.eligibilityCriteria);
        results.push({ company, role, result });
      }
    }

    return Promise.resolve(results);
  },
};
