import { db } from './storage';
import { Application, ApplicationStatus, Interview, UserRole } from '../shared/types';

export const applicationService = {
  async getApplications(): Promise<Application[]> {
    return Promise.resolve(db.getApplications());
  },

  async applyForRole(companyId: string, roleId: string): Promise<Application> {
    const student = db.getStudent();
    const companies = db.getCompanies();
    const company = companies.find(c => c.id === companyId);
    if (!company) throw new Error('Company not found');
    const role = company.roles.find(r => r.id === roleId);
    if (!role) throw new Error('Role not found');

    const existingApps = db.getApplications();
    const alreadyApplied = existingApps.find(a => a.companyId === companyId && a.roleId === roleId);
    if (alreadyApplied) throw new Error('Already applied for this role');

    const newApp: Application = {
      id: `app-${Date.now()}`,
      studentId: student.id,
      companyId: company.id,
      companyName: company.name,
      companyLogo: company.logoUrl,
      roleId: role.id,
      roleTitle: role.roleTitle,
      packageCtc: role.packageCtc,
      appliedDate: new Date().toISOString(),
      status: ApplicationStatus.APPLIED,
      nextStage: 'Application Document Verification by CDC',
      academicYear: student.academicYear,
      timeline: [
        { stage: ApplicationStatus.APPLIED, date: new Date().toISOString(), completed: true, remarks: 'Application submitted successfully via CDC Portal' },
        { stage: ApplicationStatus.ASSESSMENT_SCHEDULED, date: '', completed: false },
        { stage: ApplicationStatus.SHORTLISTED, date: '', completed: false },
        { stage: ApplicationStatus.INTERVIEW_SCHEDULED, date: '', completed: false },
        { stage: ApplicationStatus.SELECTED, date: '', completed: false },
      ],
    };

    existingApps.unshift(newApp);
    db.setApplications(existingApps);

    // Cancel or clear scheduled parent alerts for this company since student applied!
    const parentAlerts = db.getParentAlerts();
    const updatedAlerts = parentAlerts.filter(a => !(a.companyId === companyId && a.deliveryStatus === 'SCHEDULED'));
    db.setParentAlerts(updatedAlerts);

    // Audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: student.id,
      actorName: student.fullName,
      actorRole: UserRole.STUDENT,
      action: 'SUBMITTED_PLACEMENT_APPLICATION',
      entityType: 'Application',
      entityId: newApp.id,
      details: `Applied for ${role.roleTitle} at ${company.name}`,
      academicYear: student.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(newApp);
  },

  // Mock function for Guide/Admin simulator
  async advanceApplicationStageMock(applicationId: string, nextStatus: ApplicationStatus, remarks?: string): Promise<Application | null> {
    const apps = db.getApplications();
    const appIndex = apps.findIndex(a => a.id === applicationId);
    if (appIndex === -1) return null;

    const app = apps[appIndex];
    app.status = nextStatus;
    
    // Update timeline
    const stageItem = app.timeline.find(t => t.stage === nextStatus);
    if (stageItem) {
      stageItem.completed = true;
      stageItem.date = new Date().toISOString();
      if (remarks) stageItem.remarks = remarks;
    } else {
      app.timeline.push({
        stage: nextStatus,
        date: new Date().toISOString(),
        completed: true,
        remarks,
      });
    }

    if (nextStatus === ApplicationStatus.INTERVIEW_SCHEDULED) {
      app.nextStage = 'Technical & HR Interview';
    } else if (nextStatus === ApplicationStatus.SELECTED) {
      app.nextStage = 'Offer Letter Issuance';
    } else if (nextStatus === ApplicationStatus.NOT_SELECTED) {
      app.nextStage = 'Recruitment Process Concluded';
    }

    apps[appIndex] = app;
    db.setApplications(apps);

    // Audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: 'admin-placement-01',
      actorName: 'CDC Placement Coordinator',
      actorRole: UserRole.ADMIN_PLACEMENT,
      action: 'UPDATED_APPLICATION_STAGE',
      entityType: 'Application',
      entityId: applicationId,
      details: `Application for ${app.companyName} advanced to ${nextStatus}`,
      remarks,
      academicYear: app.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(app);
  },
};

export const interviewService = {
  async getInterviews(): Promise<Interview[]> {
    return Promise.resolve(db.getInterviews());
  },

  async getUpcomingInterviews(): Promise<Interview[]> {
    const interviews = db.getInterviews();
    return Promise.resolve(interviews.filter(i => i.status === 'Scheduled'));
  },
};
