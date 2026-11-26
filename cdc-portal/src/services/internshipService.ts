import { db } from './storage';
import {
  Internship,
  InternshipStatus,
  InternshipTrack,
  UserRole,
  DocumentVerificationStatus,
  Document,
} from '../shared/types';

export const internshipService = {
  async getInternships(): Promise<Internship[]> {
    return Promise.resolve(db.getInternships());
  },

  async getInternshipsByTrack(track: InternshipTrack): Promise<Internship[]> {
    const internships = db.getInternships();
    return Promise.resolve(internships.filter(i => i.track === track));
  },

  async getInternshipById(id: string): Promise<Internship | undefined> {
    const internships = db.getInternships();
    return Promise.resolve(internships.find(i => i.id === id));
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
  }): Promise<Internship> {
    const student = db.getStudent();
    const existing = db.getInternships();

    const newDocuments: Document[] = [
      {
        id: `doc-${Date.now()}-offer`,
        name: data.offerLetterDocName,
        category: 'Offer Letter',
        fileUrl: `/uploads/${data.offerLetterDocName}`,
        fileSize: '1.2 MB',
        uploadDate: new Date().toISOString(),
        verificationStatus: DocumentVerificationStatus.PENDING_VERIFICATION,
        track: data.track,
      },
    ];

    if (data.supportingDocNames) {
      data.supportingDocNames.forEach((name, idx) => {
        newDocuments.push({
          id: `doc-${Date.now()}-sup-${idx}`,
          name,
          category: 'Other',
          fileUrl: `/uploads/${name}`,
          fileSize: '950 KB',
          uploadDate: new Date().toISOString(),
          verificationStatus: DocumentVerificationStatus.PENDING_VERIFICATION,
          track: data.track,
        });
      });
    }

    const newInternship: Internship = {
      id: `intern-${Date.now()}`,
      studentId: student.id,
      track: data.track,
      semester: data.semester,
      companyName: data.companyName,
      companyContactNumber: data.companyContactNumber,
      companyAddress: data.companyAddress,
      jobRole: data.customRole || data.jobRole,
      customRole: data.customRole,
      isStipend: data.isStipend,
      stipendAmount: data.stipendAmount,
      stipendCurrency: data.stipendCurrency || '₹',
      mode: data.mode,
      startDate: data.startDate,
      endDate: data.endDate,
      durationWeeks: data.durationWeeks,
      workProfile: data.workProfile,
      facultyGuideId: data.facultyGuideId,
      facultyGuideName: data.facultyGuideName,
      status: InternshipStatus.PENDING_GUIDE_REVIEW,
      academicYear: student.academicYear,
      documents: newDocuments,
      steps: [
        {
          stepNumber: 1,
          stepName: 'Student Submission',
          assignedRole: UserRole.STUDENT,
          decision: 'SUBMITTED',
          responsibleUserName: student.fullName,
          decisionDate: new Date().toISOString(),
          remarks: 'Internship details and offer letter submitted for faculty guide review.',
        },
        {
          stepNumber: 2,
          stepName: 'Faculty Guide Review',
          assignedRole: UserRole.GUIDE,
          decision: 'PENDING',
          responsibleUserName: data.facultyGuideName,
          remarks: 'Under review by assigned faculty mentor.',
        },
        {
          stepNumber: 3,
          stepName: 'CDC Coordinator Verification',
          assignedRole: UserRole.ADMIN_INTERNSHIP,
          decision: 'PENDING',
          responsibleUserName: 'CDC Internship Coordinator',
        },
        {
          stepNumber: 4,
          stepName: 'Final Approval',
          assignedRole: UserRole.ADMIN_SUPER,
          decision: 'PENDING',
          responsibleUserName: 'CDC Administration',
        },
      ],
    };

    existing.unshift(newInternship);
    db.setInternships(existing);

    // Audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: student.id,
      actorName: student.fullName,
      actorRole: UserRole.STUDENT,
      action: 'REGISTERED_INTERNSHIP',
      entityType: 'Internship',
      entityId: newInternship.id,
      details: `Registered ${data.track} internship with ${data.companyName}`,
      academicYear: student.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(newInternship);
  },

  async reviewInternshipMock(
    internshipId: string,
    role: UserRole.GUIDE | UserRole.ADMIN_INTERNSHIP,
    decision: 'APPROVED' | 'REJECTED',
    remarks: string,
    reviewerName: string
  ): Promise<Internship | null> {
    const internships = db.getInternships();
    const index = internships.findIndex(i => i.id === internshipId);
    if (index === -1) return null;

    const intern = internships[index];

    if (role === UserRole.GUIDE) {
      // Step 2
      const step2 = intern.steps.find(s => s.stepNumber === 2);
      if (step2) {
        step2.decision = decision;
        step2.decisionDate = new Date().toISOString();
        step2.responsibleUserName = reviewerName;
        step2.remarks = remarks;
      }

      if (decision === 'APPROVED') {
        intern.status = InternshipStatus.PENDING_CDC_APPROVAL;
      } else {
        intern.status = InternshipStatus.REJECTED;
      }
    } else if (role === UserRole.ADMIN_INTERNSHIP) {
      // Step 3 & Step 4
      const step3 = intern.steps.find(s => s.stepNumber === 3);
      if (step3) {
        step3.decision = decision;
        step3.decisionDate = new Date().toISOString();
        step3.responsibleUserName = reviewerName;
        step3.remarks = remarks;
      }

      const step4 = intern.steps.find(s => s.stepNumber === 4);
      if (decision === 'APPROVED') {
        intern.status = InternshipStatus.APPROVED;
        if (step4) {
          step4.decision = 'APPROVED';
          step4.decisionDate = new Date().toISOString();
          step4.responsibleUserName = 'CDC Administration';
          step4.remarks = 'Final administrative approval recorded.';
        }
      } else {
        intern.status = InternshipStatus.REJECTED;
        if (step4) {
          step4.decision = 'REJECTED';
          step4.decisionDate = new Date().toISOString();
          step4.responsibleUserName = 'CDC Administration';
          step4.remarks = remarks;
        }
      }
    }

    internships[index] = intern;
    db.setInternships(internships);

    // Audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: role === UserRole.GUIDE ? 'guide-201' : 'admin-intern-02',
      actorName: reviewerName,
      actorRole: role,
      action: `${decision}_INTERNSHIP_WORKFLOW`,
      entityType: 'Internship',
      entityId: internshipId,
      details: `${role} ${decision.toLowerCase()} internship with ${intern.companyName}`,
      remarks,
      academicYear: intern.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(intern);
  },

  async submitCompletion(
    internshipId: string,
    certificateName: string,
    reportName: string
  ): Promise<Internship | null> {
    const internships = db.getInternships();
    const index = internships.findIndex(i => i.id === internshipId);
    if (index === -1) return null;

    const intern = internships[index];
    intern.status = InternshipStatus.COMPLETED;

    intern.documents.push(
      {
        id: `doc-${Date.now()}-cert`,
        name: certificateName,
        category: 'Completion Certificate',
        fileUrl: `/uploads/${certificateName}`,
        fileSize: '1.4 MB',
        uploadDate: new Date().toISOString(),
        verificationStatus: DocumentVerificationStatus.VERIFIED,
        track: intern.track,
      },
      {
        id: `doc-${Date.now()}-rep`,
        name: reportName,
        category: 'Internship Report',
        fileUrl: `/uploads/${reportName}`,
        fileSize: '3.2 MB',
        uploadDate: new Date().toISOString(),
        verificationStatus: DocumentVerificationStatus.VERIFIED,
        track: intern.track,
      }
    );

    internships[index] = intern;
    db.setInternships(internships);

    return Promise.resolve(intern);
  },
};
