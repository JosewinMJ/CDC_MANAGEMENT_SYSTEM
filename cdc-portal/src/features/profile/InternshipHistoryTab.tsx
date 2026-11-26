import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Calendar, FileText, ChevronRight, Award, Plus } from 'lucide-react';
import { internshipService } from '../../services/internshipService';
import { Internship, InternshipTrack } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../shared/utils';

export const InternshipHistoryTab: React.FC = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState<Internship[]>([]);

  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    const list = await internshipService.getInternships();
    setInternships(list);
  };

  const track1List = internships.filter(i => i.track === InternshipTrack.TRACK_1_SUMMER);
  const track2List = internships.filter(i => i.track === InternshipTrack.TRACK_2_HYBRID);
  const track3List = internships.filter(i => i.track === InternshipTrack.TRACK_3_SEMESTER);

  const renderTrackGroup = (title: string, subtitle: string, items: Internship[], trackKey: InternshipTrack) => (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider">{title}</h3>
          <p className="text-xs text-[#78869A] mt-0.5">{subtitle}</p>
        </div>
        {items.length === 0 && (
          <button
            onClick={() => navigate('/student/internships/register')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF2FF] hover:bg-blue-100 text-[#2855A6] text-xs font-bold rounded-lg transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Track Record
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#78869A] bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          No registered records for this track yet.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(intern => (
            <div
              key={intern.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#142B4A]">{intern.companyName}</h4>
                    {intern.semester && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2855A6]">
                        {intern.semester}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{intern.jobRole}</p>
                </div>
                <StatusBadge status={intern.status} />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{intern.workProfile}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <span className="font-semibold text-slate-800">
                    {intern.durationWeeks} Weeks ({formatDate(intern.startDate)} – {formatDate(intern.endDate)})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Stipend</span>
                  <span className="font-semibold text-slate-800">
                    {intern.isStipend ? `₹${intern.stipendAmount?.toLocaleString()}/mo` : 'Unpaid'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Faculty Mentor</span>
                  <span className="font-semibold text-slate-800">{intern.facultyGuideName}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Mode</span>
                  <span className="font-semibold text-slate-800">{intern.mode || 'Offline'}</span>
                </div>
              </div>

              {/* Supporting Documents preview */}
              {intern.documents.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Documents:</span>
                  {intern.documents.map(d => (
                    <span
                      key={d.id}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium"
                    >
                      <FileText className="w-3 h-3 text-[#2855A6]" />
                      {d.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#142B4A]">Internship History (Grouped by 3 Tracks)</h2>
          <p className="text-xs text-[#78869A] mt-0.5">
            Degree requirement records reviewed by faculty guide and validated by CDC
          </p>
        </div>

        <button
          onClick={() => navigate('/student/internships/my-internships')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#2855A6] bg-[#EAF2FF] hover:bg-blue-100 rounded-xl transition self-start sm:self-auto"
        >
          <span>Open Full Internship Module</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {renderTrackGroup(
        'Track 1 – Summer Internship (After 2nd Year)',
        'Mandatory 6-8 week summer internship prior to 5th semester',
        track1List,
        InternshipTrack.TRACK_1_SUMMER
      )}

      {renderTrackGroup(
        'Track 2 – Hybrid Internship (After 3rd Year)',
        '10-12 week industry internship before final year',
        track2List,
        InternshipTrack.TRACK_2_HYBRID
      )}

      {renderTrackGroup(
        'Track 3 – 4th Year Internship (Odd & Even Semesters)',
        'Semester-long industrial project or full-time internship',
        track3List,
        InternshipTrack.TRACK_3_SEMESTER
      )}
    </div>
  );
};
