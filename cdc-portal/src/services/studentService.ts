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
    return Promise.resolve([]);
  },
};

export const profileService = {
  async getSkillsAndProjects() {
    const student = await studentService.getStudentProfile();
    return student.skills;
  },

  async updateSkills(skills: Student['skills']): Promise<Student['skills']> {
    return skills;
  },
};
