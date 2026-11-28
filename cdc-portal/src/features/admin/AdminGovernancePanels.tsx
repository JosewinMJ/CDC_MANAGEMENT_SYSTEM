import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/apiClient';
import { DocumentDownload } from '../../components/common/DocumentDownload';
import { Modal } from '../../components/common/Modal';
import { Building2, Briefcase, ShieldCheck, Trash2, Users } from 'lucide-react';

export const AdminReportsPanel: React.FC<{ year: string }> = ({ year }) => {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    apiRequest(`/admin/reports?academic_year=${encodeURIComponent(year)}`, { portal: 'admin' })
      .then(setReport)
      .catch(() => {});
  }, [year]);

  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-slate-500 font-semibold uppercase">Unique Placed / Offers</div>
          <div className="text-2xl font-bold text-[#142B4A] mt-1">
            {report.placementSummary.uniquePlaced} / {report.placementSummary.totalOffers}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-slate-500 font-semibold uppercase">Internships Recorded</div>
          <div className="text-2xl font-bold text-[#2855A6] mt-1">{report.internshipSummary.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-slate-500 font-semibold uppercase">Completed Internships</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{report.internshipSummary.completed}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-slate-500 font-semibold uppercase">Internship → PPO Conversions</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{report.internshipSummary.ppoConversions}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 font-bold text-sm text-[#142B4A]">
            Company-wise Recruitment Summary
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Roles</th>
                <th className="px-4 py-2.5">Applied</th>
                <th className="px-4 py-2.5">Shortlisted</th>
                <th className="px-4 py-2.5">Selected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report.companyStats || []).map((c: any) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-semibold text-[#142B4A]">{c.name}</td>
                  <td className="px-4 py-2.5">{c.rolesCount}</td>
                  <td className="px-4 py-2.5">{c.applicants}</td>
                  <td className="px-4 py-2.5 text-[#2855A6] font-semibold">{c.shortlisted}</td>
                  <td className="px-4 py-2.5 text-emerald-700 font-bold">{c.selected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 font-bold text-sm text-[#142B4A]">
            Academic Year Historical Comparison
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Academic Year</th>
                <th className="px-4 py-2.5">Students</th>
                <th className="px-4 py-2.5">Placed</th>
                <th className="px-4 py-2.5">Avg CTC</th>
                <th className="px-4 py-2.5">Max CTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report.yearlyStats || []).map((y: any) => (
                <tr key={y.academic_year}>
                  <td className="px-4 py-2.5 font-bold text-[#142B4A]">{y.academic_year}</td>
                  <td className="px-4 py-2.5">{y.total}</td>
                  <td className="px-4 py-2.5 text-emerald-700 font-semibold">{y.placed}</td>
                  <td className="px-4 py-2.5">{y.avg_lpa || 0} LPA</td>
                  <td className="px-4 py-2.5">{y.max_lpa || 0} LPA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const AdminGovernanceTab: React.FC<{ onStatus: (type: 'ok' | 'err', text: string) => void }> = ({ onStatus }) => {
  const [mous, setMous] = useState<any[]>([]);
  const [consultancies, setConsultancies] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [staffAllowed, setStaffAllowed] = useState(true);

  const [newMou, setNewMou] = useState({ organization_name: '', agreement_date: '', expiry_date: '', contact_person: '', collaboration_type: 'Placements & Internships', agreement_doc_name: '' });
  const [newCons, setNewCons] = useState({ industry_partner: '', project_title: '', faculty_coordinator: '', duration: '6 Months', project_details: '' });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'ADMIN_INTERNSHIP', password: 'Admin@1234' });

  const loadGovernance = async () => {
    const [m, c] = await Promise.all([
      apiRequest<any[]>('/admin/mous', { portal: 'admin' }).catch(() => []),
      apiRequest<any[]>('/admin/consultancies', { portal: 'admin' }).catch(() => []),
    ]);
    setMous(m);
    setConsultancies(c);
    try {
      const u = await apiRequest<any[]>('/admin/users', { portal: 'admin' });
      setStaffUsers(u);
      setStaffAllowed(true);
    } catch {
      setStaffAllowed(false);
    }
  };

  useEffect(() => {
    loadGovernance();
  }, []);

  const addMou = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/mous', { method: 'POST', portal: 'admin', body: JSON.stringify(newMou) });
      setNewMou({ organization_name: '', agreement_date: '', expiry_date: '', contact_person: '', collaboration_type: 'Placements & Internships', agreement_doc_name: '' });
      onStatus('ok', 'MOU record created in MySQL.');
      loadGovernance();
    } catch (err) {
      onStatus('err', err instanceof Error ? err.message : 'Failed to create MOU');
    }
  };

  const addConsultancy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/consultancies', { method: 'POST', portal: 'admin', body: JSON.stringify(newCons) });
      setNewCons({ industry_partner: '', project_title: '', faculty_coordinator: '', duration: '6 Months', project_details: '' });
      onStatus('ok', 'Consultancy record saved to MySQL.');
      loadGovernance();
    } catch (err) {
      onStatus('err', err instanceof Error ? err.message : 'Failed to save consultancy');
    }
  };

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/users', { method: 'POST', portal: 'admin', body: JSON.stringify(newStaff) });
      setNewStaff({ name: '', email: '', role: 'ADMIN_INTERNSHIP', password: 'Admin@1234' });
      onStatus('ok', 'Admin staff account created.');
      loadGovernance();
    } catch (err) {
      onStatus('err', err instanceof Error ? err.message : 'Failed to create admin role user');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. MOU Records */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-[#142B4A]">
          <Building2 className="w-4 h-4 text-[#2855A6]" /> Institutional MOU Records
        </div>
        <form onSubmit={addMou} className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 text-xs items-end">
          <input required placeholder="Organization Name" value={newMou.organization_name} onChange={e => setNewMou({ ...newMou, organization_name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input required type="date" value={newMou.agreement_date} onChange={e => setNewMou({ ...newMou, agreement_date: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input type="date" value={newMou.expiry_date} onChange={e => setNewMou({ ...newMou, expiry_date: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input placeholder="Collaboration Type" value={newMou.collaboration_type} onChange={e => setNewMou({ ...newMou, collaboration_type: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input placeholder="Agreement Doc Name" value={newMou.agreement_doc_name} onChange={e => setNewMou({ ...newMou, agreement_doc_name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <button type="submit" className="py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">+ Add MOU</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 uppercase text-slate-500">
              <tr><th className="px-4 py-2.5">Organization</th><th className="px-4 py-2.5">Dates</th><th className="px-4 py-2.5">Collaboration</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mous.map(m => (
                <tr key={m.id}>
                  <td className="px-4 py-2.5 font-semibold text-[#142B4A]">{m.organization_name}<div className="text-[11px] font-normal text-slate-400">{m.agreement_doc_name}</div></td>
                  <td className="px-4 py-2.5">{m.agreement_date} → {m.expiry_date || 'Open'}</td>
                  <td className="px-4 py-2.5">{m.collaboration_type}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={m.status}
                      onChange={async e => {
                        await apiRequest(`/admin/mous/${m.id}`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ status: e.target.value }) });
                        loadGovernance();
                      }}
                      className="px-2 py-1 rounded border border-slate-300 bg-white text-xs font-semibold"
                    >
                      <option>Active</option><option>Pending Renewal</option><option>Expired</option><option>Terminated</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={async () => { await apiRequest(`/admin/mous/${m.id}`, { method: 'DELETE', portal: 'admin' }); loadGovernance(); }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Consultancy Records */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-[#142B4A]">
          <Briefcase className="w-4 h-4 text-[#2855A6]" /> Industry Consultancy Projects
        </div>
        <form onSubmit={addConsultancy} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs items-end">
          <input required placeholder="Industry Partner" value={newCons.industry_partner} onChange={e => setNewCons({ ...newCons, industry_partner: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input required placeholder="Project Title" value={newCons.project_title} onChange={e => setNewCons({ ...newCons, project_title: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input required placeholder="Faculty Coordinator" value={newCons.faculty_coordinator} onChange={e => setNewCons({ ...newCons, faculty_coordinator: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input placeholder="Duration (e.g. 6 Months)" value={newCons.duration} onChange={e => setNewCons({ ...newCons, duration: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
          <button type="submit" className="py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">+ Add Consultancy</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 uppercase text-slate-500">
              <tr><th className="px-4 py-2.5">Partner</th><th className="px-4 py-2.5">Project</th><th className="px-4 py-2.5">Coordinator</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultancies.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-semibold text-[#142B4A]">{c.industry_partner}</td>
                  <td className="px-4 py-2.5">{c.project_title} <span className="text-slate-400">({c.duration})</span></td>
                  <td className="px-4 py-2.5">{c.faculty_coordinator}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={c.status}
                      onChange={async e => {
                        await apiRequest(`/admin/consultancies/${c.id}`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ status: e.target.value }) });
                        loadGovernance();
                      }}
                      className="px-2 py-1 rounded border border-slate-300 bg-white text-xs font-semibold"
                    >
                      <option>Proposed</option><option>Ongoing</option><option>Completed</option><option>On Hold</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={async () => { await apiRequest(`/admin/consultancies/${c.id}`, { method: 'DELETE', portal: 'admin' }); loadGovernance(); }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Admin User Roles & Permissions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-[#142B4A]">
          <ShieldCheck className="w-4 h-4 text-[#2855A6]" /> CDC Admin Portal Roles &amp; Permissions
        </div>
        {!staffAllowed ? (
          <p className="text-xs text-slate-500">Super Administrator (`ADMIN_SUPER`) privileges are required to create or modify CDC Admin permission levels.</p>
        ) : (
          <>
            <form onSubmit={addStaff} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs items-end">
              <input required placeholder="Staff Name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
              <input required type="email" placeholder="Official Email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
              <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                <option value="ADMIN_SUPER">Super Admin</option>
                <option value="ADMIN_PLACEMENT">Placement Coordinator</option>
                <option value="ADMIN_INTERNSHIP">Internship Coordinator</option>
                <option value="ADMIN_STAFF">Authorized CDC Staff</option>
              </select>
              <input required type="password" minLength={8} placeholder="Password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
              <button type="submit" className="py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">+ Add Admin User</button>
            </form>
            <div className="divide-y divide-slate-100 text-xs">
              {staffUsers.map(u => (
                <div key={u.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#142B4A]">{u.name}</span>{' '}
                    <span className="text-slate-500">({u.email})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={async e => {
                        await apiRequest(`/admin/users/${u.id}`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ role: e.target.value }) });
                        onStatus('ok', `Updated role for ${u.name}`);
                        loadGovernance();
                      }}
                      className="px-2 py-1 rounded border border-slate-300 bg-white font-semibold"
                    >
                      <option value="ADMIN_SUPER">ADMIN_SUPER</option>
                      <option value="ADMIN_PLACEMENT">ADMIN_PLACEMENT</option>
                      <option value="ADMIN_INTERNSHIP">ADMIN_INTERNSHIP</option>
                      <option value="ADMIN_STAFF">ADMIN_STAFF</option>
                    </select>
                    <button
                      onClick={async () => {
                        await apiRequest(`/admin/users/${u.id}`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ is_active: !u.is_active }) });
                        loadGovernance();
                      }}
                      className={`px-2.5 py-1 rounded font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                    >
                      {u.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const AdminStudentEditModal: React.FC<{
  student: any | null;
  faculty: any[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}> = ({ student, faculty, onClose, onSaved, onError }) => {
  const [cgpa, setCgpa] = useState('');
  const [backlogs, setBacklogs] = useState('0');
  const [verificationStatus, setVerificationStatus] = useState('VERIFIED');
  const [placementStatus, setPlacementStatus] = useState('unplaced');
  const [placedCompany, setPlacedCompany] = useState('');
  const [packageLpa, setPackageLpa] = useState('');
  const [assignedGuideId, setAssignedGuideId] = useState('');

  useEffect(() => {
    if (student) {
      setCgpa(String(student.current_cgpa ?? 0));
      setBacklogs(String(student.active_backlogs ?? 0));
      setVerificationStatus(student.verification_status ?? 'VERIFIED');
      setPlacementStatus(student.placement_status ?? 'unplaced');
      setPlacedCompany(student.placed_company ?? '');
      setPackageLpa(student.package_lpa ? String(student.package_lpa) : '');
      setAssignedGuideId(student.assigned_guide_id ? String(student.assigned_guide_id) : '');
    }
  }, [student]);

  if (!student) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/admin/students/${student.id}`, {
        method: 'PATCH',
        portal: 'admin',
        body: JSON.stringify({
          current_cgpa: parseFloat(cgpa),
          active_backlogs: parseInt(backlogs, 10),
          verification_status: verificationStatus,
          placement_status: placementStatus,
          placed_company: placedCompany || null,
          package_lpa: packageLpa ? parseFloat(packageLpa) : null,
          assigned_guide_id: assignedGuideId ? Number(assignedGuideId) : null,
        }),
      });
      onSaved();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update student record');
    }
  };

  return (
    <Modal isOpen={!!student} onClose={onClose} title={`Manage Student: ${student.user?.name}`} subtitle={`${student.reg_number} · ${student.branch}`} maxWidth="lg">
      <form onSubmit={save} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">CGPA</label>
            <input type="number" step="0.01" value={cgpa} onChange={e => setCgpa(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Active Backlogs</label>
            <input type="number" value={backlogs} onChange={e => setBacklogs(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Verification</label>
            <select value={verificationStatus} onChange={e => setVerificationStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Assigned Faculty Guide</label>
            <select value={assignedGuideId} onChange={e => setAssignedGuideId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
              <option value="">-- Unassigned --</option>
              {faculty.map(f => (
                <option key={f.user_id} value={f.user_id}>{f.user?.name} ({f.user?.department})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Placement Status</label>
            <select value={placementStatus} onChange={e => setPlacementStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
              <option value="unplaced">unplaced</option>
              <option value="shortlisted">shortlisted</option>
              <option value="placed">placed</option>
              <option value="opted_out">opted_out</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Placed Company / LPA</label>
            <div className="flex gap-1.5">
              <input value={placedCompany} onChange={e => setPlacedCompany(e.target.value)} placeholder="Company" className="w-2/3 px-2 py-2 border border-slate-300 rounded-lg" />
              <input type="number" step="0.1" value={packageLpa} onChange={e => setPackageLpa(e.target.value)} placeholder="LPA" className="w-1/3 px-2 py-2 border border-slate-300 rounded-lg" />
            </div>
          </div>
        </div>

        {(student.documents || []).length > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-[#142B4A]">Uploaded Documents ({student.documents.length})</div>
            {student.documents.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                <span>{d.category}: <strong>{d.name}</strong> ({d.verification_status})</span>
                {d.file_url && <DocumentDownload path={d.file_url} name={d.name} portal="admin" />}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#2855A6] text-white font-semibold">Save Record</button>
        </div>
      </form>
    </Modal>
  );
};

export const AdminEligibilityModal: React.FC<{ companyId: number | null; onClose: () => void }> = ({ companyId, onClose }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!companyId) return;
    apiRequest(`/admin/companies/${companyId}/eligibility-summary`, { portal: 'admin' })
      .then(setData)
      .catch(() => {});
  }, [companyId]);

  if (!companyId) return null;

  return (
    <Modal isOpen={!!companyId} onClose={onClose} title={`Eligibility Breakdown: ${data?.company || 'Drive'}`} subtitle={data?.role || ''} maxWidth="xl">
      <div className="max-h-96 overflow-y-auto">
        {!data ? (
          <p className="text-xs text-slate-500">Evaluating all student records...</p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 uppercase text-slate-500">
              <tr><th className="px-3 py-2">Student</th><th className="px-3 py-2">Branch / CGPA</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Reason</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.summary || []).map((row: any) => (
                <tr key={row.studentId}>
                  <td className="px-3 py-2 font-semibold">{row.name} ({row.regNumber})</td>
                  <td className="px-3 py-2">{row.branch} · {row.cgpa}</td>
                  <td className="px-3 py-2 font-bold">{row.status}</td>
                  <td className="px-3 py-2 text-slate-500">{row.reason || 'Satisfies criteria'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
};

export const AdminFacultyRosterModal: React.FC<{ faculty: any | null; onClose: () => void }> = ({ faculty, onClose }) => {
  if (!faculty) return null;
  const students = faculty.user?.mentored_students || [];
  return (
    <Modal isOpen={!!faculty} onClose={onClose} title={`Assigned Students: ${faculty.user?.name}`} subtitle={`${faculty.employee_id} · ${faculty.user?.department}`} maxWidth="md">
      <div className="space-y-2 text-xs">
        {students.length === 0 ? (
          <p className="text-slate-500 flex items-center gap-1.5"><Users className="w-4 h-4" /> No students currently assigned to this guide.</p>
        ) : (
          students.map((s: any) => (
            <div key={s.id} className="p-2.5 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-[#142B4A]">{s.user?.name} ({s.reg_number})</span>
              <span className="text-slate-500">{s.branch} · {s.placement_status}</span>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};
