import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../../services/apiClient';
import { DocumentDownload } from '../../components/common/DocumentDownload';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatDateTime } from '../../shared/utils';
import { card, DefinitionCard, Empty, field, PageHeading, primary, ReviewCard, SectionHeader } from './GuidePanels';
import { Feedback } from './GuideTools';
import { type InternshipSubmission } from './guideData';

interface GuideStudentDetailResponse {
  student: any;
  eligibility: Array<{
    roleId: number;
    companyName: string;
    roleTitle: string;
    packageCtc: string;
    overallStatus: string;
    summaryReason: string | null;
  }>;
}

export function GuideMenteeDetail({ studentId }: { studentId?: string }) {
  const [detail, setDetail] = useState<GuideStudentDetailResponse | null>(null);
  const [error, setError] = useState('');
  const [remark, setRemark] = useState('');
  const [category, setCategory] = useState<'mentoring' | 'profile_update_request' | 'progress'>('mentoring');
  const [isConfidential, setIsConfidential] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});

  const loadDetail = () => {
    if (!studentId) return;
    apiRequest<GuideStudentDetailResponse>(`/guide/students/${studentId}`, { portal: 'guide' })
      .then(setDetail)
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load student record.'));
  };

  useEffect(() => {
    loadDetail();
  }, [studentId]);

  async function saveRemark(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!studentId || !remark.trim()) return;
    setSaving(true);
    setFeedback({});
    try {
      await apiRequest(`/guide/students/${studentId}/remarks`, {
        portal: 'guide',
        method: 'POST',
        body: JSON.stringify({ remark: remark.trim(), category, is_confidential: isConfidential }),
      });
      setRemark('');
      setFeedback({
        success: isConfidential
          ? 'Confidential mentoring remark saved (visible only to Guides & CDC Admins).'
          : 'Update request sent to Student Portal.',
      });
      loadDetail();
    } catch (err) {
      setFeedback({ error: err instanceof Error ? err.message : 'Unable to save remark.' });
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeading title="Student unavailable" back="/guide/students" />
        <Empty>{error}</Empty>
      </div>
    );
  }

  if (!detail) {
    return <p className="text-sm text-slate-600">Loading assigned student profile…</p>;
  }

  const { student, eligibility } = detail;
  const semesters = student.semester_results || [];
  const skills = student.skills || {};
  const docs = student.documents || [];
  const apps = student.applications || [];
  const internships: InternshipSubmission[] = student.internships || [];
  const remarks = student.mentoring_remarks || [];
  const hasResume = docs.some((d: any) => d.category === 'Resume');

  return (
    <div className="space-y-5">
      <PageHeading
        title={student.user?.name || 'Assigned Student'}
        description={`Reg. ${student.reg_number} · ${student.branch} · Semester ${student.semester} · ${student.user?.email || ''}`}
        back="/guide/students"
      />

      {!hasResume && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900">
          Attention: This student has not uploaded a Resume document yet.
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <DefinitionCard
            title="Academic & Verification Summary"
            items={[
              ['Programme', `${student.degree} ${student.programme}`],
              ['Academic Year', student.academic_year],
              ['Current CGPA', student.current_cgpa],
              ['10th / 12th Marks', `${student.tenth_percentage}% / ${student.twelfth_percentage}%`],
              ['Backlogs (Active / Hist)', `${student.active_backlogs} / ${student.historical_backlogs}`],
              ['Placement Status', <StatusBadge key="pl" status={student.placement_status} />],
              ['Academic Verification', <StatusBadge key="vr" status={student.verification_status} />],
            ]}
          />

          <section className={`${card} p-4 sm:p-5 space-y-3`}>
            <h2 className="font-bold text-[#142B4A]">Semester-wise CGPA History</h2>
            {semesters.length === 0 ? (
              <p className="text-xs text-slate-500">No semester results recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase">
                    <tr><th className="py-2 px-3">Sem</th><th className="py-2 px-3">GPA</th><th className="py-2 px-3">Credits</th><th className="py-2 px-3">Backlogs</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {semesters.map((s: any) => (
                      <tr key={s.semesterNumber}>
                        <td className="py-2 px-3 font-semibold">Sem {s.semesterNumber}</td>
                        <td className="py-2 px-3 font-bold text-[#142B4A]">{s.gpa}</td>
                        <td className="py-2 px-3">{s.credits}</td>
                        <td className="py-2 px-3">{s.backlogs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={`${card} p-4 sm:p-5 space-y-3`}>
            <h2 className="font-bold text-[#142B4A]">Resumes &amp; Uploaded Documents ({docs.length})</h2>
            {docs.length === 0 ? (
              <p className="text-xs text-slate-500">No documents uploaded by student.</p>
            ) : (
              <div className="space-y-2">
                {docs.map((d: any) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-[#142B4A] truncate">{d.name}</p>
                      <p className="text-slate-500">{d.category} · <StatusBadge status={d.verification_status} /></p>
                    </div>
                    {d.file_url && <DocumentDownload path={d.file_url} name={d.name} portal="guide" />}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={`${card} p-4 sm:p-5 space-y-2`}>
            <h2 className="font-bold text-[#142B4A]">Skills &amp; Projects</h2>
            <div className="flex flex-wrap gap-1.5">
              {[...(skills.programmingLanguages || []), ...(skills.technicalSkills || [])].map((sk: string) => (
                <span key={sk} className="px-2 py-0.5 rounded bg-[#EAF2FF] text-[#2855A6] text-xs font-semibold">{sk}</span>
              ))}
            </div>
            {(skills.projects || []).length > 0 && (
              <ul className="pt-2 space-y-1.5 text-xs text-slate-700">
                {skills.projects.map((p: any) => (
                  <li key={p.id}><strong>{p.title}:</strong> {p.description}</li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className={`${card} p-4 sm:p-5 space-y-3`}>
            <h2 className="font-bold text-[#142B4A]">Mentoring Remarks &amp; Update Requests</h2>
            <form onSubmit={saveRemark} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-2">
                <select className={field} value={category} onChange={e => setCategory(e.target.value as any)}>
                  <option value="mentoring">Confidential Mentoring Note</option>
                  <option value="progress">Progress Observation</option>
                  <option value="profile_update_request">Request Profile / Doc Update</option>
                </select>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 px-2">
                  <input type="checkbox" checked={isConfidential} onChange={e => setIsConfidential(e.target.checked)} />
                  Confidential (Hidden from student)
                </label>
              </div>
              <textarea
                required
                rows={3}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="Write confidential mentoring feedback or a document update instruction..."
                className={field}
              />
              <Feedback {...feedback} />
              <button type="submit" disabled={saving || !remark.trim()} className={primary}>
                {saving ? 'Saving…' : 'Save Remark'}
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {remarks.length === 0 ? (
                <p className="text-xs text-slate-500">No mentoring remarks recorded yet.</p>
              ) : (
                remarks.map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#142B4A]">{r.author_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.is_confidential ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>
                        {r.is_confidential ? 'CONFIDENTIAL' : 'STUDENT VISIBLE'}
                      </span>
                    </div>
                    <p className="text-slate-700">{r.remark}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(r.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={`${card} p-4 sm:p-5 space-y-2.5`}>
            <h2 className="font-bold text-[#142B4A]">Company Eligibility &amp; Applications</h2>
            {eligibility.map(el => (
              <div key={el.roleId} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-xs">
                <div>
                  <strong className="text-[#142B4A]">{el.companyName}</strong> — {el.roleTitle} ({el.packageCtc})
                  {el.summaryReason && <p className="text-[11px] text-rose-700">{el.summaryReason}</p>}
                </div>
                <StatusBadge status={el.overallStatus} />
              </div>
            ))}
            {apps.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase">Submitted Applications ({apps.length})</p>
                {apps.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg">
                    <span>{a.company?.name} — {a.job_role?.role_title}</span>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="Internship Submissions" />
            {internships.length ? internships.map(submission => <ReviewCard key={submission.id} submission={submission} />)
              : <Empty>No internship submissions recorded for this student.</Empty>}
          </section>
        </div>
      </div>
    </div>
  );
}
