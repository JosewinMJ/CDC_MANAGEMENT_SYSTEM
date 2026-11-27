import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { DocumentDownload } from '../../components/common/DocumentDownload';
import { documentService } from '../../services/documentService';
import { Document, DocumentVerificationStatus } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUploader } from '../../components/common/FileUploader';
import { Modal } from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../shared/utils';

export const DocumentsTab: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [category, setCategory] = useState<Document['category']>('Resume');
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const report = (err: unknown) => showToast({type: 'error', title: 'Document request failed', message: err instanceof Error ? err.message : 'Try again.'});
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const { showToast } = useNotification();

  const loadDocuments = async () => {
    const list = await documentService.getDocuments();
    setDocuments(list);
  };

  useEffect(() => {
    loadDocuments().catch(report);
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || busy) {
      showToast({ type: 'error', title: 'File Missing', message: 'Please select a file to upload.' });
      return;
    }

    setBusy(true);
    try {
      await documentService.uploadDocument(file, category);
      setFile(undefined);
      setIsUploadModalOpen(false);
      await loadDocuments();
      showToast({ type: 'success', title: 'Document uploaded', message: 'Submitted for guide verification.' });
    } catch (error) { report(error); }
    finally { setBusy(false); }
  };

  const handleDelete = async (docId: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await documentService.deleteDocument(docId);
      await loadDocuments();
      showToast({ type: 'info', title: 'Document Removed', message: `${name} has been deleted.` });
    } catch (error) {
      report(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card with Upload CTA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#142B4A]">Official Documents & Verification Repository</h3>
          <p className="text-xs text-[#78869A] mt-0.5">
            Uploaded marksheets, resumes and internship letters required for placement compliance
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2855A6] hover:bg-[#142B4A] rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          Upload New Document
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Document Name</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">File Size</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Upload Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2855A6] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate max-w-xs">
                        <span className="font-bold text-[#142B4A] block truncate">{doc.name}</span>
                        {doc.verifiedBy && (
                          <span className="text-[10px] text-slate-400">
                            Verified by: {doc.verifiedBy}
                          </span>
                        )}
                        {doc.rejectionReason && (
                          <span className="text-[10px] text-rose-600 block">
                            Reason: {doc.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-700">{doc.category}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{doc.fileSize}</td>
                  <td className="py-3.5 px-4 text-slate-600">{formatDate(doc.uploadDate)}</td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={doc.verificationStatus} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-slate-600 hover:text-[#2855A6] hover:bg-slate-100 rounded-lg transition"
                        title="Preview Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <DocumentDownload path={doc.fileUrl} name={doc.name} portal="student" />

                      <button
                        disabled={Boolean(doc.internshipId)} onClick={() => handleDelete(doc.id, doc.name).catch(report)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Verification Document"
        subtitle="Submit academic records or internship credentials for CDC verification"
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#142B4A] mb-1">Document Category:</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs"
            >
              <option value="Resume">Resume / Curriculum Vitae</option>
              <option value="10th Marksheet">10th Grade Marksheet</option>
              <option value="12th Marksheet">12th Grade Marksheet</option>
              <option value="Semester Marksheet">Consolidated Semester Marksheet</option>
              <option value="Certificate">Professional Certificate</option>
              <option value="Offer Letter">Internship Offer Letter</option>
              <option value="Completion Certificate">Internship Completion Certificate</option>
              <option value="Internship Report">Final Internship Report</option>
              <option value="Other">Other Institutional Document</option>
            </select>
          </div>

          <FileUploader
            label="Select Document File:"
            helperText="PDF or DOCX up to 5MB"
            onFileSelect={(_, selected) => setFile(selected)}
            selectedFileName={file?.name}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={busy}
              className="px-5 py-2 text-xs font-bold bg-[#2855A6] hover:bg-[#142B4A] text-white rounded-xl shadow-xs transition"
            >
              Upload Document
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview: ${previewDoc.name}`}
          subtitle={`${previewDoc.category} · Status: ${previewDoc.verificationStatus}`}
          maxWidth="lg"
        >
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
            <FileCheck className="w-16 h-16 text-[#2855A6] mx-auto opacity-80" />
            <h4 className="text-sm font-bold text-[#142B4A]">{previewDoc.name}</h4>
            <p className="text-xs text-slate-500">
              Uploaded on {formatDate(previewDoc.uploadDate)} · File size: {previewDoc.fileSize}
            </p>
            <div className="inline-block">
              <StatusBadge status={previewDoc.verificationStatus} />
            </div>
            {previewDoc.verifiedBy && (
              <p className="text-xs text-emerald-800 font-medium">
                Verified by {previewDoc.verifiedBy} on {formatDate(previewDoc.verifiedDate)}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
