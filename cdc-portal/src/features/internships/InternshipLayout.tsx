import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import {
  Compass,
  FilePlus2,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabItem } from '../../components/common/Tabs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { internshipService } from '../../services/internshipService';
import { subscribeToStore } from '../../services/storeEvents';
import { Internship, InternshipTrack, InternshipStatus } from '../../shared/types';

export const InternshipLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<Internship[]>([]);

  const loadInternships = async () => {
    const list = await internshipService.getInternships();
    setInternships(list);
  };

  useEffect(() => {
    loadInternships();
    const unsub = subscribeToStore('cdc_internships', loadInternships);
    return () => unsub();
  }, []);

  const track1 = internships.find(i => i.track === InternshipTrack.TRACK_1_SUMMER);
  const track2 = internships.find(i => i.track === InternshipTrack.TRACK_2_HYBRID);
  const track3_7 = internships.find(i => i.track === InternshipTrack.TRACK_3_SEMESTER && i.semester === '7th Semester (Odd)');
  const track3_8 = internships.find(i => i.track === InternshipTrack.TRACK_3_SEMESTER && i.semester === '8th Semester (Even)');

  const currentTab = location.pathname.split('/')[3] || 'my-internships';

  const tabs: TabItem[] = [
    { id: 'my-internships', label: 'My Internships & Tracking', icon: <Layers className="w-4 h-4" /> },
    { id: 'register', label: 'Register Internship (Tracks 1–3)', icon: <FilePlus2 className="w-4 h-4" /> },
    { id: 'opportunities', label: 'CDC Published Opportunities', icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Internship Journey Horizontal Tracker (UI Spec Section A) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#142B4A]">Institutional Internship Coordination</h1>
            <p className="text-xs text-[#78869A] mt-0.5">
              Three structured degree tracks: Summer Internship, Hybrid Engagement, and 4th Year Semesters
            </p>
          </div>
          <span className="text-xs font-bold text-[#2855A6] bg-[#EAF2FF] px-3 py-1 rounded-full self-start sm:self-auto border border-blue-200">
            Current Stage: Track 2 (3rd Year Active)
          </span>
        </div>

        {/* 3 Track Cards Header Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Track 1 Card */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Track 1 (After 2nd Year)
              </span>
              <StatusBadge status={track1 ? track1.status : 'NOT_STARTED'} />
            </div>
            <h3 className="text-sm font-bold text-[#142B4A]">Summer Internship</h3>
            <p className="text-xs text-slate-600">
              {track1 ? `${track1.companyName} (${track1.jobRole})` : '6–8 weeks summer technical project'}
            </p>
            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold">
                {track1?.status === 'COMPLETED' ? '✓ Verified & Credits Awarded' : 'Pending completion'}
              </span>
              <button
                onClick={() => navigate('/student/internships/my-internships?track=1')}
                className="text-[11px] font-bold text-[#2855A6] hover:underline"
              >
                View →
              </button>
            </div>
          </div>

          {/* Track 2 Card */}
          <div className="p-4 rounded-xl border border-blue-300 bg-blue-50/60 ring-2 ring-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#2855A6] uppercase tracking-wider">
                Track 2 (After 3rd Year)
              </span>
              <StatusBadge status={track2 ? track2.status : 'NOT_STARTED'} />
            </div>
            <h3 className="text-sm font-bold text-[#142B4A]">Hybrid Internship</h3>
            <p className="text-xs text-slate-700">
              {track2 ? `${track2.companyName} (${track2.mode || 'Hybrid'})` : '10–12 weeks industry internship'}
            </p>
            <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
              <span className="text-blue-700 font-semibold">
                {track2 ? '⚡ Guide & CDC Approved' : 'Not started'}
              </span>
              <button
                onClick={() => navigate('/student/internships/my-internships?track=2')}
                className="text-[11px] font-bold text-[#2855A6] hover:underline"
              >
                Track Status →
              </button>
            </div>
          </div>

          {/* Track 3 Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Track 3 (4th Year)
              </span>
              <StatusBadge status={track3_7 || track3_8 ? 'IN_PROGRESS' : 'NOT_STARTED'} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">7th & 8th Semesters</h3>
            <p className="text-xs text-slate-600">
              Odd & Even semester split (recorded separately)
            </p>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Eligible in 4th Year</span>
              <button
                onClick={() => navigate('/student/internships/register?track=3')}
                className="text-[11px] font-bold text-[#2855A6] hover:underline"
              >
                Register Track 3 →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={currentTab}
        onChange={tabId => navigate(`/student/internships/${tabId}`)}
      />

      {/* Child Views */}
      <Outlet />
    </div>
  );
};
