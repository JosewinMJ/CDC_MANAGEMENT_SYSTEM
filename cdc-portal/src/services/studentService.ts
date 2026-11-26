import { db } from './storage';
import { Student, AcademicRecord, AcademicCorrectionRequest, UserRole } from '../shared/types';

export const studentService = {
  async getStudentProfile(): Promise<Student> {
    return Promise.resolve(db.getStudent());
  },

  async updatePersonalProfile(data: Partial<Pick<Student, 'phone' | 'address' | 'avatarUrl'>>): Promise<Student> {
    const student = db.getStudent();
    const updated: Student = {
      ...student,
      ...data,
    };
    db.setStudent(updated);

    // Record audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: student.id,
      actorName: student.fullName,
      actorRole: UserRole.STUDENT,
      action: 'UPDATED_PERSONAL_PROFILE',
      entityType: 'Profile',
      entityId: student.id,
      details: 'Updated contact/address details',
      academicYear: student.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(updated);
  },

  async requestAcademicCorrection(request: Omit<AcademicCorrectionRequest, 'id' | 'status' | 'submittedAt'>): Promise<AcademicCorrectionRequest> {
    const student = db.getStudent();
    const newReq: AcademicCorrectionRequest = {
      ...request,
      id: `corr-${Date.now()}`,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    const corrections = db.getCorrections();
    corrections.unshift(newReq);
    db.setCorrections(corrections);

    // Mark student academic record as correction pending
    const updatedStudent: Student = {
      ...student,
      academicRecord: {
        ...student.academicRecord,
        correctionPending: true,
      },
    };
    db.setStudent(updatedStudent);

    // Audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: student.id,
      actorName: student.fullName,
      actorRole: UserRole.STUDENT,
      action: 'SUBMITTED_ACADEMIC_CORRECTION_REQUEST',
      entityType: 'Profile',
      entityId: student.id,
      details: `Correction requested for field: ${request.field} (from '${request.currentValue}' to '${request.requestedValue}')`,
      academicYear: student.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(newReq);
  },

  async getAcademicCorrections(): Promise<AcademicCorrectionRequest[]> {
    return Promise.resolve(db.getCorrections());
  },
};

export const profileService = {
  async getSkillsAndProjects() {
    const student = db.getStudent();
    return Promise.resolve(student.skills);
  },

  async updateSkills(skills: Student['skills']): Promise<Student['skills']> {
    const student = db.getStudent();
    const updated: Student = {
      ...student,
      skills,
    };
    db.setStudent(updated);
    return Promise.resolve(updated.skills);
  },
};
