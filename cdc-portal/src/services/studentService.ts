import { apiRequest } from './apiClient';
import { Student, AcademicCorrectionRequest } from '../shared/types';

export const studentService = {
  async getStudentProfile(): Promise<Student> {
    return apiRequest<Student>('/students/me', { portal: 'student' });
  },

  async updatePersonalProfile(data: Partial<Pick<Student, 'phone' | 'address' | 'avatarUrl'>>): Promise<Student> {
    return apiRequest<Student>('/students/me/personal', {
      method: 'PATCH',
      portal: 'student',
      body: JSON.stringify(data),
    });
  },

  async requestAcademicCorrection(
    request: Omit<AcademicCorrectionRequest, 'id' | 'status' | 'submittedAt'>
  ): Promise<AcademicCorrectionRequest> {
    return apiRequest<AcademicCorrectionRequest>('/students/me/academic-correction', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify(request),
    });
  },

  async getAcademicCorrections(): Promise<AcademicCorrectionRequest[]> {
    const rows = await apiRequest<any[]>('/students/me/academic-correction', { portal: 'student' });
    return rows.map(r => ({
      id: String(r.id),
      studentId: String(r.student_profile_id),
      field: r.field,
      currentValue: r.current_value,
      requestedValue: r.requested_value,
      reason: r.reason,
      supportingDocName: r.supporting_doc_name,
      status: r.status,
      submittedAt: r.created_at,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      remarks: r.remarks,
    }));
  },
};

export const profileService = {
  async getSkillsAndProjects() {
    const student = await studentService.getStudentProfile();
    return student.skills;
  },

  async updateSkills(skills: Student['skills']): Promise<Student['skills']> {
    return apiRequest<Student['skills']>('/students/me/skills', {
      method: 'PATCH',
      portal: 'student',
      body: JSON.stringify({ skills }),
    });
  },
};
