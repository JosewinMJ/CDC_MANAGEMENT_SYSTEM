import { apiRequest } from './apiClient';
import { db } from './storage';
import { Document, DocumentVerificationStatus, UserRole } from '../shared/types';

export const documentService = {
  async getDocuments(): Promise<Document[]> {
    const rows = await apiRequest<Array<{
      id: number; name: string; category: Document['category']; file_url: string; file_size: string;
      created_at: string; verification_status: DocumentVerificationStatus; verified_by?: string; verified_date?: string; rejection_reason?: string;
      internship_id?: number;
    }>>('/students/me/documents', { portal: 'student' });
    return rows.map(row => ({
      id: String(row.id), name: row.name, category: row.category, fileUrl: row.file_url,
      fileSize: row.file_size, uploadDate: row.created_at, verificationStatus: row.verification_status,
      verifiedBy: row.verified_by, verifiedDate: row.verified_date, rejectionReason: row.rejection_reason, internshipId: row.internship_id,
    }));
  },

  async uploadDocument(file: File, category: string) {
    const body = new FormData();
    body.set('file', file);
    body.set('category', category);
    return apiRequest('/students/me/documents', { portal: 'student', method: 'POST', body });
  },

  async deleteDocument(id: string) {
    return apiRequest('/students/me/documents/' + id, { portal: 'student', method: 'DELETE' });
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
