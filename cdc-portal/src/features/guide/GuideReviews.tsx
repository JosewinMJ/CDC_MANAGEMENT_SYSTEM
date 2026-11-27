import { DocumentDownload } from '../../components/common/DocumentDownload';
import { useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { apiRequest } from '../../services/apiClient';
import { formatDate } from '../../shared/utils';
import {
  card, danger, DefinitionCard, Empty, field, Filters, PageHeading, primary,
  RecordLink, ReviewBadge, ReviewCard, secondary, SectionHeader,
} from './GuidePanels';
import { Feedback } from './GuideTools';
import {
  getReviewStep, readableStatus, reviewFilters, reviewPath, reviewStatus, safeDocumentUrl, trackTitle,
  type InternshipSubmission, type Mentee, type PendingDocument,
} from './guideData';

export function ReviewQueue({ submissions }: { submissions: InternshipSubmission[] }) {
  const [params, setParams] = useSearchParams();
  const filter = params.get('status') ?? 'all';
  const trackedFilter = reviewFilters.find(option => option.value === filter) ?? reviewFilters[0];
  const filtered = submissions.filter(submission => trackedFilter.value === 'all' || reviewStatus(submission).group === trackedFilter.value);
  return <div className="space-y-4">
    <PageHeading title="Internship reviews" description="Review submissions from your assigned students." />
    <Filters label="Review status" options={reviewFilters} selected={trackedFilter.value}
      onChange={value => setParams(value === 'all' ? {} : { status: value }, { replace: true })} />
    <div className="flex items-center justify-between gap-2">
      <SectionHeader title={trackedFilter.value === 'all' ? 'All submissions' : trackedFilter.label} />
      <span className="rounded-full bg-[#EAF2FF] px-2.5 py-1 text-xs font-semibold text-[#2855A6]">{filtered.length} {filtered.length === 1 ? 'submission' : 'submissions'}</span>
    </div>
    {filtered.length > 0 ? <div className="grid gap-3 md:grid-cols-2">
      {filtered.map(submission => <ReviewCard key={submission.id} submission={submission} />)}
    </div> : <Empty>No internship submissions match this view.</Empty>}
    <div className="rounded-xl border border-blue-100 bg-[#EAF2FF] px-4 py-3 text-sm text-[#142B4A]">
      <strong>Approval sequence</strong>
      <p className="mt-0.5">Guide review → Internship coordinator approval</p>
    </div>
  </div>;
}

const decisions = {
  APPROVED: { title: 'Approve and forward', message: 'Submission forwarded to the internship coordinator.', button: primary },
  CHANGES_REQUESTED: { title: 'Request changes', message: 'Change request recorded in the student’s review timeline.', button: secondary },
  REJECTED: { title: 'Reject submission', message: 'Submission rejected.', button: danger },
};
type Decision = keyof typeof decisions;

export function ReviewDetail({ submissions, mentees, onReview, onRefresh, showDocuments = false }: {
  submissions: InternshipSubmission[];
  mentees: Mentee[];
  onReview: (submission: InternshipSubmission) => void;
  onRefresh: () => void;
  showDocuments?: boolean;
}) {
  const { id } = useParams();
  const submission = submissions.find(item => String(item.id) === id);
  if (!submission) return <div className="space-y-4">
    <PageHeading title="Submission unavailable" back="/guide/internships" />
    <Empty>This submission is unavailable in your review queue.</Empty>
  </div>;
  if (showDocuments) {
    return <div className="space-y-4">
      <PageHeading title="Submission documents" description={submission.company_name} back={reviewPath(submission.id)} />
      {submission.documents?.length ? <ul className="space-y-3">
        {submission.documents.map((document, index) => {
          const link = (document.downloadUrl || document.fileUrl || document.file_url);
          const url = link && (/^\/documents\/\d+\/file$/.test(link) ? link : safeDocumentUrl(link));
          return <li key={document.id ?? index} className={`${card} flex flex-wrap items-center gap-3 p-4`}>
            <FileText size={19} className="text-[#2855A6]" />
            <span className="min-w-0 flex-1 text-sm font-semibold wrap-break-word">{document.name ?? document.category ?? 'Attachment'}</span>
            {url ? <DocumentDownload path={url} name={document.name ?? "Attachment"} portal="guide" />
              : <span className="text-xs text-slate-600">File unavailable</span>}
          </li>;
        })}
      </ul> : <Empty>No documents are attached to this submission.</Empty>}
    </div>;
  }

  const mentee = mentees.find(student => student.id === submission.student_profile_id);
  return <SubmissionReview key={submission.id} submission={submission} mentee={mentee} onReview={onReview} onRefresh={onRefresh} />;
}

function SubmissionReview({ submission, mentee, onReview, onRefresh }: {
  submission: InternshipSubmission; mentee?: Mentee;
  onReview: (submission: InternshipSubmission) => void;
  onRefresh: () => void;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const pending = reviewStatus(submission).group === 'pending';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision) return;
    setSaving(true);
    setFeedback({});
    try {
      const updated = await apiRequest<InternshipSubmission>(`/internships/${submission.id}/review`, {
        portal: 'guide', method: 'POST', body: JSON.stringify({ role: 'GUIDE', decision, remarks: remarks.trim() || null }),
      });
      onReview(updated);
      setFeedback({ success: decisions[decision].message });
      setDecision(null);
      setRemarks('');
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : 'Unable to save the review.' });
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-4">
    <PageHeading title={submission.student_profile?.user.name ?? 'Review submission'}
      description={`${submission.company_name} · ${trackTitle(submission.track)}`} back="/guide/internships" />
    <Feedback {...feedback} />
    {feedback.error && <button type="button" className={secondary} onClick={onRefresh}>Refresh review</button>}
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <DefinitionCard title="Internship details" badge={<ReviewBadge submission={submission} />} items={[
          ['Track', trackTitle(submission.track)],
          ['Programme', mentee?.programme],
          ['Work profile', submission.work_profile || submission.job_role],
          ['Company location', submission.company_address],
          ['Duration', `${formatDate(submission.start_date)} – ${formatDate(submission.end_date)}`],
          ['Submitted', formatDate(submission.created_at)],
        ]} />
        {mentee && <RecordLink to={`/guide/students/${mentee.id}`} title="Student and company details" description={`Reg. ${mentee.reg_number} · Semester ${mentee.semester}`} />}
        <RecordLink to={`${reviewPath(submission.id)}/documents`} icon="file" title="Submission documents"
          description={`${submission.documents?.length ?? 0} attachments`} />
      </div>
      <div className="space-y-3">
        <section className={`${card} space-y-3 p-4 sm:p-5`}>
          <h2 className="font-bold text-[#142B4A]">Approval stages</h2>
          <ol className="space-y-2">
            {[...(submission.steps ?? [])].sort((a, b) => a.stepNumber - b.stepNumber).map(step =>
              <li key={step.stepNumber} className={`flex items-start gap-2.5 rounded-xl p-2.5 text-sm ${pending && step.stepNumber === 2 ? 'bg-[#EAF2FF]' : 'bg-slate-50'}`}>
                <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-[#2855A6]">{step.stepNumber}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-[#142B4A]">{step.stepName}</p>
                  <p className="text-xs text-slate-600">{readableStatus(step.reviewOutcome ?? step.decision)}{step.responsibleUserName && ` · ${step.responsibleUserName}`}</p>
                  {step.remarks && <p className="mt-1 whitespace-pre-wrap wrap-break-word text-slate-700">{step.remarks}</p>}
                </div>
              </li>
            )}
          </ol>
          {!submission.steps?.length && <p className="text-sm text-slate-600">No approval steps recorded yet.</p>}
        </section>
        {pending && (decision
          ? <form className={`${card} space-y-3 p-4`} onSubmit={submit}>
            <h2 className="font-bold text-[#142B4A]">{decisions[decision].title}</h2>
            <label className="block space-y-1 text-sm">Remarks {decision === 'APPROVED' ? '(optional)' : '(required)'}
              <textarea className={field} autoFocus rows={3} maxLength={500} value={remarks}
                onChange={e => setRemarks(e.target.value)} required={decision !== 'APPROVED'} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={decisions[decision].button} disabled={saving || (decision !== 'APPROVED' && !remarks.trim())}>{saving ? 'Saving…' : 'Confirm decision'}</button>
              <button type="button" className={secondary} disabled={saving} onClick={() => { setDecision(null); setFeedback({}); }}>Cancel</button>
            </div>
          </form>
          : <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className={`${primary} sm:col-span-2`} onClick={() => setDecision('APPROVED')}>Approve and forward</button>
            <button type="button" className={secondary} onClick={() => setDecision('CHANGES_REQUESTED')}>Request changes</button>
            <button type="button" className={danger} onClick={() => setDecision('REJECTED')}>Reject</button>
          </div>)}
      </div>
    </div>
  </div>;
}

export function GuideDocuments({ documents, onVerified }: {
  documents: PendingDocument[];
  onVerified: (id: number) => void;
}) {
  const [decision, setDecision] = useState<{ id: number; status: 'VERIFIED' | 'REJECTED' }>();
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision) return;
    setSaving(true);
    setFeedback({});
    try {
      await apiRequest(`/documents/${decision.id}/verification`, {
        portal: 'guide', method: 'PATCH', body: JSON.stringify({ status: decision.status, remarks: remarks.trim() || null }),
      });
      onVerified(decision.id);
      setFeedback({ success: decision.status === 'VERIFIED' ? 'Document verified.' : 'Document rejected.' });
      setDecision(undefined);
      setRemarks('');
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : 'Unable to update the document.' });
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-4">
    <PageHeading title="Document verification" description="Review documents submitted by your assigned students." />
    <Feedback {...feedback} />
    {!documents.length && <Empty>No student documents are awaiting verification.</Empty>}
    {documents.map(document => {
      const link = (document.downloadUrl || document.file_url || document.fileUrl);
      const url = link && (/^\/documents\/\d+\/file$/.test(link) ? link : safeDocumentUrl(link));
      return <article key={document.id} className={`${card} space-y-3 p-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 wrap-break-word">
            <h2 className="text-sm font-bold text-[#142B4A]">{document.name}</h2>
            <p className="text-xs text-slate-600">{document.student_profile?.user.name} · {document.category}</p>
          </div>
          {url && <DocumentDownload path={url} name={document.name ?? "Attachment"} portal="guide" />}
        </div>
        {!url && <p className="text-xs text-slate-600">File unavailable</p>}
        {decision?.id === document.id ? <form onSubmit={submit} className="space-y-2">
          <label className="block text-sm">Remarks {decision.status === 'REJECTED' ? '(required)' : '(optional)'}
            <textarea autoFocus className={field} rows={2} maxLength={255} required={decision.status === 'REJECTED'} value={remarks} onChange={e => setRemarks(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={decision.status === 'REJECTED' ? danger : primary} disabled={saving || (decision.status === 'REJECTED' && !remarks.trim())}>Confirm {decision.status === 'REJECTED' ? 'rejection' : 'verification'}</button>
            <button type="button" className={secondary} disabled={saving} onClick={() => setDecision(undefined)}>Cancel</button>
          </div>
        </form> : <div className="flex flex-wrap gap-2">
          <button type="button" className={primary} disabled={saving || !url} onClick={() => { setRemarks(''); setDecision({ id: document.id, status: 'VERIFIED' }); }}>Verify</button>
          <button type="button" className={danger} disabled={saving} onClick={() => { setRemarks(''); setDecision({ id: document.id, status: 'REJECTED' }); }}>Reject</button>
        </div>}
      </article>;
    })}
  </div>;
}

export function GuideAllocation({ mentees, submissions }: { mentees: Mentee[]; submissions: InternshipSubmission[] }) {
  return <div className="space-y-4">
    <PageHeading title="Guide allocation" description="View assigned guides and coordinator approval status." back="/guide/students" />
    {!mentees.length && <Empty>No students are assigned to this guide.</Empty>}
    <div className="grid items-start gap-3 md:grid-cols-2">
      {mentees.map(student => {
        const submission = submissions.find(item => item.student_profile_id === student.id);
        const guideStep = getReviewStep(submission, 2);
        const coordinatorStep = getReviewStep(submission, 3);
        return <DefinitionCard key={student.id} title={student.user.name} badge={<Link to={`/guide/students/${student.id}`} className="text-xs text-[#2855A6]">{student.reg_number}</Link>} items={[
          ['Assigned guide', student.assigned_guide?.name ?? submission?.faculty_guide?.name ?? '—'],
          ['Guide decision', guideStep ? readableStatus(guideStep.reviewOutcome ?? guideStep.decision) : 'No review recorded'],
          ['Coordinator approval', coordinatorStep ? readableStatus(coordinatorStep.decision) : 'No decision recorded'],
        ]} />;
      })}
    </div>
  </div>;
}
