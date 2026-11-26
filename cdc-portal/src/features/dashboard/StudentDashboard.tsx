import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  FileCheck2,
  Clock,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Upload,
  Search,
  CheckCircle,
  FilePlus,
  Terminal,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Award,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { ProgressRing } from '../../components/common/ProgressRing';
import { StatusBadge } from '../../components/common/StatusBadge';
import { db, subscribeToStore } from '../../services/storage';
import { companyService } from '../../services/companyService';
import { applicationService } from '../../services/applicationService';
import { interviewService } from '../../services/interviewService';
import { internshipService } from '../../services/internshipService';
import { noticeService } from '../../services/noticeService';
import { parentAlertService } from '../../services/parentAlertService';
import { codingChallengeService } from '../../services/codingChallengeService';
import {
  Student,
  Company,
  Application,
  Interview,
  Internship,
  Notice,
  ParentAlert,
  CodingProfile,
  InternshipTrack,
} from '../../shared/types';
import { formatDate } from '../../shared/utils';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student>(db.getStudent());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [alerts, setAlerts] = useState<ParentAlert[]>([]);
  const [coding, setCoding] = useState<CodingProfile>(db.getCodingProfile());

  const loadAll = async () => {
    setStudent(db.getStudent());
    const [comps, apps, ints, internList, nots, alrts, code] = await Promise.all([
      companyService.getCompanies(),
      applicationService.getApplications(),
      interviewService.getUpcomingInterviews(),
      internshipService.getInternships(),
      noticeService.getNotices(),
      parentAlertService.getParentAlerts(),
      codingChallengeService.getCodingProfile(),
    ]);
    setCompanies(comps);
    setApplications(apps);
    setInterviews(ints);
    setInternships(internList);
    setNotices(nots);
    setAlerts(alrts);
    setCoding(code);
  };

  useEffect(() => {
    loadAll();
    const unsubscribe = subscribeToStore('cdc_student', loadAll);
    const unsubsApps = subscribeToStore('cdc_applications', loadAll);
    const unsubsInts = subscribeToStore('cdc_internships', loadAll);
    const unsubsNotices = subscribeToStore('cdc_notices', loadAll);
    const unsubsCoding = subscribeToStore('cdc_coding_profile', loadAll);

    return () => {
      unsubscribe();
      unsubsApps();
      unsubsInts();
      unsubsNotices();
      unsubsCoding();
    };
  }, []);

  // Compute eligible unapplied companies for the Parent Alert Warning Banner
  const appliedCompanyIds = applications.map(a => a.companyId);
  const eligibleUnappliedCompanies = companies.filter(
    c => !appliedCompanyIds.includes(c.id) && (c.id === 'comp-infosys' || c.id === 'comp-tcs')
  );

  const track1 = internships.find(i => i.track === InternshipTrack.TRACK_1_SUMMER);
  const track2 = internships.find(i => i.track === InternshipTrack.TRACK_2_HYBRID);
  const track3 = internships.find(i => i.track === InternshipTrack.TRACK_3_SEMESTER);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Section */}
      <div className="bg-gradient-to-r from-[#142B4A] via-[#1a3860] to-[#2855A6] rounded-2xl p-6 lg:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-400/20 text-blue-200 border border-blue-300/30">
              Academic Session {student.academicYear}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-300/30">
              Placement Cycle Active
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Good Morning, {student.fullName.split(' ')[0]}!
          </h1>
          <p className="text-xs lg:text-sm text-blue-100/90 mt-1.5 leading-relaxed">
            Welcome to your Career Development Centre portal. Track your placement journey, manage 3-track internships, and stay updated with upcoming recruitment drives.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-blue-300/20 text-xs text-blue-100">
            <div>
              <span className="opacity-75">Reg Number:</span>{' '}
              <strong className="text-white font-semibold">{student.regNumber}</strong>
            </div>
            <div>
              <span className="opacity-75">Programme:</span>{' '}
              <strong className="text-white font-semibold">{student.academicRecord.degree} {student.academicRecord.branch}</strong>
            </div>
            <div>
              <span className="opacity-75">Faculty Guide:</span>{' '}
              <strong className="text-white font-semibold">{student.assignedGuideName}</strong>
            </div>
            <div>
              <span className="opacity-75">Current CGPA:</span>{' '}
              <strong className="text-white font-semibold">{student.academicRecord.currentCgpa}</strong>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Parent Notification Warning Banner (UI Spec Section B) */}
      {eligibleUnappliedCompanies.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Action Required: Eligible Opportunities Pending Application
                </h4>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  Parent Alert Trigger
                </span>
              </div>
              <p className="text-xs text-amber-950 mt-1 leading-snug">
                You are <strong>Eligible</strong> for <strong>{eligibleUnappliedCompanies.length} companies</strong> ({eligibleUnappliedCompanies.map(c => c.name).join(', ')}) that you have not applied to. As per CDC placement policy, your parent (Rajesh R) will be notified on <strong>27 Nov 2026</strong> via WhatsApp if no action is taken.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/student/parent-alerts')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
            >
              View Alert Rules
            </button>
            <button
              onClick={() => navigate('/student/companies')}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition"
            >
              Apply Now →
            </button>
          </div>
        </div>
      )}

      {/* 3. Four Attractive Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Eligible Companies"
          value="12"
          subtitle="Companies matching your profile"
          icon={Building2}
          iconBgColor="bg-blue-50"
          iconColor="text-[#2855A6]"
          trendText="2 pending your application"
          trendPositive={false}
          onClick={() => navigate('/student/companies')}
        />

        <StatCard
          title="Active Applications"
          value={applications.length}
          subtitle="Applications currently in progress"
          icon={FileCheck2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trendText="1 Shortlisted · 1 Interview"
          trendPositive={true}
          onClick={() => navigate('/student/applications')}
        />

        <StatCard
          title="Upcoming Interviews"
          value={interviews.length}
          subtitle="Scheduled recruitment activities"
          icon={Clock}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          trendText="Next: Wipro (05 Dec)"
          trendPositive={true}
          onClick={() => navigate('/student/interviews')}
        />

        <StatCard
          title="Internship Status"
          value={track2 ? 'Track 2 Active' : 'In Progress'}
          subtitle="Track 1 Verified · Track 2 In Progress"
          icon={Briefcase}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-600"
          trendText="Cognizant Tech (Hybrid)"
          trendPositive={true}
          onClick={() => navigate('/student/internships/my-internships')}
        />
      </div>

      {/* 4. Main Grid: Profile Completion & 3-Track Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Profile Completion & Internship Journey */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Completion Section */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ProgressRing
                percentage={85}
                size={110}
                strokeWidth={10}
                color="#2855A6"
                trackColor="#EAF2FF"
                label="Completed"
              />

              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#142B4A]">Profile Completion Status</h3>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    85% Ready
                  </span>
                </div>
                <p className="text-xs text-[#78869A] mt-1">
                  Keep your credentials verified to maximize your placement shortlisting score.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Personal Info</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Academic Details</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Skills & Projects</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Certificates</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Resume Upload</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Parent Contact (OTP)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => navigate('/student/profile/personal')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2855A6] hover:text-[#142B4A] transition"
                  >
                    Complete My Profile <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Internship Journey Progress Tracker (Added in UI Spec §A) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider">
                  Internship Journey (3 Structured Tracks)
                </h3>
                <p className="text-xs text-[#78869A] mt-0.5">
                  Mandatory degree milestones monitored by assigned faculty guide
                </p>
              </div>
              <button
                onClick={() => navigate('/student/internships/my-internships')}
                className="text-xs font-semibold text-[#2855A6] hover:underline"
              >
                View Track Details →
              </button>
            </div>

            {/* Horizontal Track Stepper */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Track 1 */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Track 1 (2nd Year)
                  </span>
                  <StatusBadge status="COMPLETED" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Summer Internship</h4>
                <p className="text-[11px] text-slate-600 truncate">
                  Infosys Springboard (8 wks · ₹10k/mo)
                </p>
                <div className="text-[10px] text-emerald-700 font-medium">✓ Verified & Approved</div>
              </div>

              {/* Track 2 */}
              <div className="p-3.5 rounded-xl border border-blue-300 bg-blue-50/60 ring-2 ring-blue-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#2855A6] uppercase tracking-wider">
                    Track 2 (3rd Year)
                  </span>
                  <StatusBadge status="IN_PROGRESS" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Hybrid Internship</h4>
                <p className="text-[11px] text-slate-700 truncate">
                  Cognizant Tech (12 wks · ₹15k/mo)
                </p>
                <div className="text-[10px] text-blue-700 font-semibold">
                  ⚡ Guide & CDC Approved (Ongoing)
                </div>
              </div>

              {/* Track 3 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Track 3 (4th Year)
                  </span>
                  <StatusBadge status="NOT_STARTED" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">7th & 8th Semesters</h4>
                <p className="text-[11px] text-slate-500 truncate">
                  Odd & Even semester split
                </p>
                <button
                  onClick={() => navigate('/student/internships/register')}
                  className="text-[10px] font-bold text-[#2855A6] hover:underline"
                >
                  Start Registration →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Daily Coding Challenge & Quick Actions */}
        <div className="space-y-6">
          {/* Daily Coding Challenge (LeetCode) Tracker Card (UI Spec §H) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                    Daily Coding Challenge
                  </h3>
                  <p className="text-[11px] text-[#78869A]">LeetCode: @{coding.username}</p>
                </div>
              </div>

              <StatusBadge status={coding.trackingStatus} />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-lg font-bold text-[#142B4A]">{coding.totalSolved}</div>
                  <div className="text-[10px] font-medium text-[#78869A]">Total Solved</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-lg font-bold text-[#2855A6]">
                    {coding.solvedThisWeek} / {coding.weeklyTarget}
                  </div>
                  <div className="text-[10px] font-medium text-[#78869A]">This Week (Target 10)</div>
                </div>
              </div>

              {/* Weekly Target Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-700">Weekly Target Progress</span>
                  <span className="text-slate-500">{Math.round((coding.solvedThisWeek / coding.weeklyTarget) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (coding.solvedThisWeek / coding.weeklyTarget) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-amber-600 mt-1 font-medium">
                  {coding.weeklyTarget - coding.solvedThisWeek} solves needed before Sunday midnight
                </p>
              </div>

              {/* Posted questions done */}
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                <span className="text-slate-700 font-medium">CDC Assigned Questions:</span>
                <strong className="text-[#2855A6]">
                  {coding.postedQuestionsDone} of {coding.postedQuestionsTotal} Done
                </strong>
              </div>

              <button
                onClick={() => navigate('/student/daily-coding/dashboard')}
                className="w-full py-2 bg-[#142B4A] hover:bg-[#2855A6] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>View DSA Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/student/profile/documents')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-[#EAF2FF]/40 text-slate-700 hover:text-[#2855A6] font-semibold transition"
              >
                <Upload className="w-4 h-4 text-[#2855A6]" />
                <span>Upload Resume</span>
              </button>

              <button
                onClick={() => navigate('/student/companies')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-[#EAF2FF]/40 text-slate-700 hover:text-[#2855A6] font-semibold transition"
              >
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Browse Drives</span>
              </button>

              <button
                onClick={() => navigate('/student/eligibility')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-[#EAF2FF]/40 text-slate-700 hover:text-[#2855A6] font-semibold transition"
              >
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span>Check Eligibility</span>
              </button>

              <button
                onClick={() => navigate('/student/internships/register')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-[#EAF2FF]/40 text-slate-700 hover:text-[#2855A6] font-semibold transition"
              >
                <FilePlus className="w-4 h-4 text-amber-600" />
                <span>Register Track</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Upcoming Recruitment Drives Table (Functional Report §3.3) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#142B4A]">Active & Upcoming Recruitment Drives</h3>
            <p className="text-xs text-[#78869A] mt-0.5">
              Campus placement drives with verified eligibility status for your profile
            </p>
          </div>
          <Link
            to="/student/companies"
            className="text-xs font-bold text-[#2855A6] hover:underline flex items-center gap-1"
          >
            Explore all companies <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Company</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Job Role</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Package / CTC</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Eligibility</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Deadline</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.slice(0, 5).map(company => {
                const primaryRole = company.roles[0];
                const isApplied = appliedCompanyIds.includes(company.id);
                const isEligible = company.id !== 'comp-google' && company.id !== 'comp-microsoft';

                return (
                  <tr key={company.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          className="w-8 h-8 rounded-lg object-contain p-1 border border-slate-200 bg-white"
                        />
                        <div>
                          <span className="font-bold text-[#142B4A] hover:text-[#2855A6]">
                            {company.name}
                          </span>
                          <span className="block text-[10px] text-slate-400">{company.website.replace('https://', '')}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {primaryRole.roleTitle}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#142B4A]">{primaryRole.packageCtc}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {isEligible ? (
                        <StatusBadge status="ELIGIBLE" />
                      ) : (
                        <StatusBadge status="NOT_ELIGIBLE" />
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {formatDate(company.applicationDeadline)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isApplied ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Applied
                        </span>
                      ) : isEligible ? (
                        <button
                          onClick={() => navigate(`/student/companies/${company.id}`)}
                          className="px-3 py-1 bg-[#2855A6] hover:bg-[#142B4A] text-white font-bold rounded-lg transition"
                        >
                          Apply Now
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/student/companies/${company.id}`)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                        >
                          View Criteria
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Application Progress & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Progress Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider">
                Active Application Progress
              </h3>
              <p className="text-xs text-[#78869A] mt-0.5">Recruitment milestone progression</p>
            </div>
            <Link to="/student/applications" className="text-xs font-semibold text-[#2855A6] hover:underline">
              View All ({applications.length}) →
            </Link>
          </div>

          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={app.companyLogo} alt={app.companyName} className="w-5 h-5 object-contain" />
                    <span className="font-bold text-xs text-[#142B4A]">{app.companyName}</span>
                    <span className="text-xs text-slate-400">· {app.packageCtc}</span>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 mt-2">
                  <span>Next Stage:</span>
                  <strong className="text-[#2855A6]">{app.nextStage}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider">
                Recent Notices & Announcements
              </h3>
              <p className="text-xs text-[#78869A] mt-0.5">Official CDC broadcasts and guide updates</p>
            </div>
            <Link to="/student/notices" className="text-xs font-semibold text-[#2855A6] hover:underline">
              All Notices →
            </Link>
          </div>

          <div className="space-y-3">
            {notices.slice(0, 3).map(notice => {
              const isUnread = !notice.readByStudentIds.includes('stud-21bce1042');
              return (
                <div
                  key={notice.id}
                  onClick={() => navigate('/student/notices')}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isUnread
                      ? 'bg-blue-50/50 border-blue-200'
                      : 'bg-slate-50/40 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2855A6]">
                      {notice.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(notice.publishedDate)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#142B4A] mt-1.5 truncate">{notice.title}</h4>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span>By: {notice.publisherName} ({notice.publisherRole})</span>
                    {isUnread && <span className="text-xs font-bold text-[#2855A6]">Unread</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
