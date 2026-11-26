import { db } from './storage';
import { Document, DocumentVerificationStatus, UserRole } from '../shared/types';

export const documentService = {
  async getDocuments(): Promise<Document[]> {
    const student = db.getStudent();
    return Promise.resolve(student.documents);
  },

  async uploadDocument(doc: Omit<Document, 'id' | 'uploadDate' | 'verificationStatus'>): Promise<Document> {
    const student = db.getStudent();
    const newDoc: Document = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString(),
      verificationStatus: DocumentVerificationStatus.PENDING_VERIFICATION,
    };

    const updatedDocs = [newDoc, ...student.documents.filter(d => d.category !== doc.category || doc.category === 'Certificate' || doc.category === 'Other')];
    db.setStudent({
      ...student,
      documents: updatedDocs,
    });

    // Audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: student.id,
      actorName: student.fullName,
      actorRole: UserRole.STUDENT,
      action: 'UPLOADED_DOCUMENT',
      entityType: 'Document',
      entityId: newDoc.id,
      details: `Uploaded ${newDoc.category}: ${newDoc.name}`,
      academicYear: student.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(newDoc);
  },

  async deleteDocument(docId: string): Promise<boolean> {
    const student = db.getStudent();
    const filtered = student.documents.filter(d => d.id !== docId);
    db.setStudent({
      ...student,
      documents: filtered,
    });
    return Promise.resolve(true);
  },

  // Mock function for Guide/Admin simulator
  async verifyDocumentMock(docId: string, status: DocumentVerificationStatus, remarks?: string, reviewerName = 'Dr. K. Ramanathan'): Promise<Document | null> {
    const student = db.getStudent();
    const docIndex = student.documents.findIndex(d => d.id === docId);
    if (docIndex === -1) return null;

    const doc = student.documents[docIndex];
    const updatedDoc: Document = {
      ...doc,
      verificationStatus: status,
      verifiedBy: reviewerName,
      verifiedDate: new Date().toISOString(),
      rejectionReason: status === DocumentVerificationStatus.REJECTED ? (remarks || 'Document illegible or invalid') : undefined,
    };

    student.documents[docIndex] = updatedDoc;
    db.setStudent(student);

    // Audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: 'guide-201',
      actorName: reviewerName,
      actorRole: UserRole.GUIDE,
      action: status === DocumentVerificationStatus.VERIFIED ? 'VERIFIED_DOCUMENT' : 'REJECTED_DOCUMENT',
      entityType: 'Document',
      entityId: docId,
      details: `${status} document: ${doc.name}`,
      remarks,
      academicYear: student.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(updatedDoc);
  },
};
