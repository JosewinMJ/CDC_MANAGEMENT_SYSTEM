import { apiRequest } from './apiClient';
import { Document, DocumentVerificationStatus } from '../shared/types';

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
};
