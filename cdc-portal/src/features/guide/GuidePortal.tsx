import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight, Bell, CalendarDays, ClipboardCheck, Clock, FileCheck2, LayoutDashboard, MessageSquare, RotateCcw, Terminal, UserRound, Users,
} from 'lucide-react';
import reviewIllustration from '../../assets/guide-review.svg';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';
import { InternshipTrack } from '../../shared/types';
import {
  card, Empty, EventCard, field, Filters, GuideCalendar, PageHeading, RecordLink,
  ReviewBadge, ReviewCard, secondary, SectionHeader,
} from './GuidePanels';
import { GuideMenteeDetail } from './GuideMenteeDetail';
import { GuideAllocation, GuideDocuments, ReviewDetail, ReviewQueue } from './GuideReviews';
import { GuideChat } from './GuideChat';
import { Feedback, GuideCoding, GuideNotices } from './GuideTools';
import {
  dateKey, initials, internshipEvents, reviewPath, reviewStatus, trackTitle, tracks,
  type GuideDashboard, type GuideEvent, type InternshipSubmission, type Mentee,
} from './guideData';

const mainNavigation = [
  { to: '/guide/dashboard', title: 'Overview', icon: LayoutDashboard },
  { to: '/guide/students', title: 'Students', icon: Users },
  { to: '/guide/internships', title: 'Reviews', icon: ClipboardCheck },
  { to: '/guide/calendar', title: 'Calendar', icon: CalendarDays },
];
const toolsNavigation = [
  { to: '/guide/documents', title: 'Documents', icon: FileCheck2 },
  { to: '/guide/chat', title: 'Mentor chat', icon: MessageSquare },
  { to: '/guide/coding', title: 'Coding challenge', icon: Terminal },
  { to: '/guide/notices', title: 'Notices', icon: Bell },
];
const emptySubmissions: InternshipSubmission[] = [];

export function GuidePortal() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [dashboard, setDashboard] = useState<GuideDashboard | null>(null);
  const [submissions, setSubmissions] = useState<InternshipSubmission[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const options = { portal: 'guide', signal: controller.signal } as const;
    Promise.all([
      apiRequest<GuideDashboard>('/guide/dashboard', options),
      apiRequest<InternshipSubmission[]>('/guide/internships', options),
    ]).then(([nextDashboard, nextSubmissions]) => {
      if (controller.signal.aborted) return;
      setDashboard(nextDashboard);
      setSubmissions(nextSubmissions);
    }).catch(error => {
      if (!controller.signal.aborted) setLoadError(error.message);
    });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  function updateReview(updated: InternshipSubmission) {
    setSubmissions(list => list?.map(item => item.id === updated.id ? updated : item) ?? null);
  }

  function removeVerifiedDocument(id: number) {
    setDashboard(previous => previous && { ...previous, documents: previous.documents.filter(document => document.id !== id) });
  }

  const events = internshipEvents(submissions ?? emptySubmissions);
  const retry = () => {
    setLoadError('');
    setRefresh(version => version + 1);
  };
  const loadPortal = (page: (data: GuideDashboard, reviews: InternshipSubmission[]) => ReactNode) => {
    if (loadError) return <div className="space-y-3">
      <Feedback error={loadError} />
      <button type="button" onClick={retry} className={secondary}>Retry loading guide data</button>
    </div>;
    if (!dashboard || !submissions) return <p role="status" className="text-sm text-slate-600">Loading guide data…</p>;
    return page(dashboard, submissions);
  };

  return <div className="min-h-screen bg-[#F5F7FA] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-dvh flex-col bg-[#142B4A] text-white lg:flex">
      <Brand desktop />
      <nav aria-label="Guide navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
        {[...mainNavigation, ...toolsNavigation].map(({ to, title, icon: Icon }) =>
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-[#2855A6] text-white' : 'text-blue-100 hover:bg-white/10'}`}>
            <Icon size={17} /> {title}
          </NavLink>)}
      </nav>
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex min-h-[69px] max-w-7xl items-center justify-between gap-3 px-5 sm:px-6 lg:min-h-15 lg:px-8">
          <div className="lg:hidden"><Brand /></div>
          <div className="hidden text-xs font-medium text-slate-600 lg:block">Career Development Centre <span className="px-2 text-slate-300">/</span><span className="font-bold text-[#142B4A]">Guide Portal</span></div>
          <Link to="/guide/profile" aria-label="Guide profile" className="flex min-w-0 items-center gap-2 rounded-lg hover:bg-slate-50">
            <span className="hidden truncate text-xs font-bold text-[#142B4A] sm:inline">{currentUser.name}</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-blue-100 bg-[#EAF2FF] text-xs font-bold text-[#2855A6]">{initials(currentUser.name)}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:p-8">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={loadPortal((data, reviews) => <GuideOverview data={data} submissions={reviews} events={events} />)} />
          <Route path="students" element={loadPortal((data, reviews) => <MenteeRoster mentees={data.mentees} submissions={reviews} />)} />
          <Route path="students/allocation" element={loadPortal((data, reviews) => <GuideAllocation mentees={data.mentees} submissions={reviews} />)} />
          <Route path="students/:id" element={<MenteeRecordRoute />} />
          <Route path="internships" element={loadPortal((_data, reviews) => <ReviewQueue submissions={reviews} />)} />
          <Route path="internships/:id" element={loadPortal((data, reviews) => <ReviewDetail submissions={reviews} mentees={data.mentees} onReview={updateReview} onRefresh={retry} />)} />
          <Route path="internships/:id/documents" element={loadPortal((data, reviews) => <ReviewDetail submissions={reviews} mentees={data.mentees} onReview={updateReview} onRefresh={retry} showDocuments />)} />
          <Route path="calendar" element={loadPortal(() => <GuideCalendar events={events} />)} />
          <Route path="documents" element={loadPortal(data => <GuideDocuments documents={data.documents} onVerified={removeVerifiedDocument} />)} />
          <Route path="chat" element={<GuideChat />} />
          <Route path="coding" element={<GuideCoding />} />
          <Route path="notices" element={loadPortal(data => <GuideNotices mentees={data.mentees} />)} />
          <Route path="profile" element={<GuideProfile name={currentUser.name} email={currentUser.email} count={dashboard?.mentees.length} />} />
          <Route path="*" element={<div className="space-y-4"><PageHeading title="Guide page unavailable" back="/guide/dashboard" /><Empty>Choose a section from the Guide Portal navigation.</Empty></div>} />
        </Routes>
      </main>
      <nav aria-label="Guide navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-4 py-2">
          {mainNavigation.map(({ to, title, icon: Icon }) => <NavLink key={to} to={to}
            className={({ isActive }) => `flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-xs ${isActive
              ? 'bg-[#EAF2FF] font-bold text-[#2855A6]' : 'font-medium text-slate-600 hover:bg-slate-50'}`}>
            <Icon size={18} aria-hidden="true" />
            {title}
          </NavLink>)}
        </div>
      </nav>
    </div>
  </div>;
}

function Brand({ desktop = false }: { desktop?: boolean }) {
  return <Link to="/guide/dashboard" className={`flex items-center gap-2.5 ${desktop ? 'border-b border-white/10 p-5' : ''}`}>
    <img src="/christ-logo.png" alt="CHRIST University" className="size-10 shrink-0 rounded-xl border border-slate-200/80 bg-white object-contain p-0.5" />
    <div>
      <p className={`text-[10px] font-semibold ${desktop ? 'text-blue-200' : 'text-slate-600'}`}>Career Development Centre</p>
      <p className={`font-bold ${desktop ? 'text-sm text-white' : 'text-lg leading-tight text-[#142B4A]'}`}>Guide Portal</p>
    </div>
  </Link>;
}

function GuideOverview({ data, submissions, events }: {
  data: GuideDashboard; submissions: InternshipSubmission[]; events: GuideEvent[];
}) {
  const awaiting = submissions.filter(item => reviewStatus(item).group === 'pending');
  const coordinator = submissions.filter(item => reviewStatus(item).group === 'coordinator').length;
  const returned = submissions.filter(item => reviewStatus(item).group === 'returned').length;
  const [today] = useState(() => dateKey(new Date()));
  const upcoming = events.filter(event => event.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const mainReview = awaiting[0];
  const metrics = [
    { title: 'Students', value: data.mentees.length, icon: Users, to: '/guide/students', background: 'bg-white' },
    { title: 'With coordinator', value: coordinator, icon: Clock, to: '/guide/internships?status=coordinator', background: 'bg-[#EAF2FF]' },
    { title: 'Returned', value: returned, icon: RotateCcw, to: '/guide/internships?status=returned', background: 'bg-rose-50' },
  ];
  return <div className="space-y-5">
    <h1 className="sr-only">Guide dashboard</h1>
    <section aria-labelledby="guide-review-overview" className="relative isolate overflow-hidden rounded-2xl bg-linear-to-r from-[#142B4A] via-[#1a3860] to-[#2855A6] px-4 py-4 text-white shadow-md sm:px-6 sm:py-5">
      <img src={reviewIllustration} alt="" className="pointer-events-none absolute top-4 right-1 -z-10 hidden min-[360px]:block sm:right-6" />
      <div className="min-[360px]:mr-28">
        <p className="text-xs font-bold tracking-wider text-blue-100 uppercase">Internship reviews</p>
        <h2 id="guide-review-overview" className="mt-1 text-[1.7rem] leading-tight font-extrabold tracking-tight sm:text-3xl">
          {awaiting.length === 1 ? '1 submission to review' : `${awaiting.length} submissions to review`}
        </h2>
        {awaiting.length === 1 && mainReview && <p className="mt-1 text-xs text-blue-100">{mainReview.student_profile?.user.name ?? 'Student'} · {mainReview.company_name}</p>}
        <Link to={awaiting.length === 1 && mainReview ? reviewPath(mainReview.id) : '/guide/internships?status=pending'}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#EAF2FF] px-3 text-sm font-bold text-[#142B4A] hover:bg-white">
          {awaiting.length === 1 ? 'Review submission' : 'Open review queue'} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {metrics.map(({ title, value, icon: Icon, to, background }) => <Link to={to} key={to}
        className={`rounded-xl border border-slate-200/80 px-2.5 py-2 shadow-xs transition hover:border-blue-300 hover:shadow-sm sm:px-4 sm:py-3 ${background}`}>
        <span className="flex items-center justify-between gap-1 font-bold text-[#142B4A]">
          <span className="text-2xl tracking-tight">{value}</span><Icon size={15} className="shrink-0 text-[#2855A6]" aria-hidden="true" />
        </span>
        <span className="block text-[11px] leading-tight font-medium text-slate-700 sm:text-sm">{title}</span>
      </Link>)}
    </div>
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className="space-y-3">
        <SectionHeader title="Needs your review" to="/guide/internships?status=pending" action="View all" />
        {awaiting.length ? awaiting.slice(0, 3).map((submission, index) =>
          <ReviewCard key={submission.id} submission={submission} className={index > 0 ? 'hidden sm:block' : undefined} />)
          : <Empty>No internships are awaiting guide review.</Empty>}
      </section>
      <section className="space-y-3">
        <SectionHeader title="Upcoming schedule" to="/guide/calendar" action="Calendar" />
        {upcoming.length ? upcoming.map(event => <EventCard key={event.id} event={event} />) : <Empty>No upcoming internship dates.</Empty>}
      </section>
    </div>
    <section className="space-y-3">
      <SectionHeader title="Guide tools" />
      <div className="grid gap-3 md:grid-cols-3">
        <RecordLink to="/guide/documents" icon="file" title="Documents" description={`${data.documents.length} awaiting verification`} />
        <RecordLink to="/guide/coding" icon="file" title="Coding challenge" description="Post questions and view the leaderboard" />
        <RecordLink to="/guide/notices" icon="file" title="Notices" description="Read announcements and publish updates" />
      </div>
    </section>
  </div>;
}

function MenteeRoster({ mentees, submissions }: { mentees: Mentee[]; submissions: InternshipSubmission[] }) {
  const [track, setTrack] = useState('all');
  const [semester, setSemester] = useState('all');
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const listed = mentees.flatMap(student => {
    const matching = submissions.filter(item => item.student_profile_id === student.id && (track === 'all' || item.track === track));
    const internship = matching.find(item => {
      if (semester === 'all') return true;
      const recordedSemester = item.semester?.toLowerCase().match(/\b(odd|even)\b/)?.[0];
      return (recordedSemester ?? (student.semester % 2 ? 'odd' : 'even')) === semester;
    });
    if (track !== 'all' && !internship) return [];
    if (query && ![student.user.name, student.reg_number, student.branch].some(value => value.toLowerCase().includes(query))) return [];
    return [{ student, internship }];
  });
  return <div className="space-y-4">
    <PageHeading title="Assigned students" description={`${mentees.length} ${mentees.length === 1 ? 'student' : 'students'} across your internship cohorts.`} />
    <input type="search" className={`${field} sm:max-w-sm`} aria-label="Search assigned students" placeholder="Search name, registration number or branch" value={search} onChange={e => setSearch(e.target.value)} />
    <Filters label="Internship track" selected={track} options={[{ value: 'all', label: 'All' }, ...tracks]}
      onChange={value => { setTrack(value); setSemester('all'); }} />
    {track === InternshipTrack.TRACK_3_SEMESTER && <Filters label="Flexible internship semester" selected={semester}
      options={[{ value: 'all', label: 'All semesters' }, { value: 'even', label: 'Even' }, { value: 'odd', label: 'Odd' }]} onChange={setSemester} />}
    {listed.length ? <div className="grid gap-3 md:grid-cols-2">
      {listed.map(({ student, internship }) => {
        const missingResume = !(student.documents || []).some(d => d.category === 'Resume');
        return <RecordLink key={student.id} to={`/guide/students/${student.id}`} title={student.user.name}
          description={`Reg. ${student.reg_number} · Semester ${student.semester}${missingResume ? ' · Missing Resume' : ''}`}
          detail={internship ? `${trackTitle(internship.track)} · ${internship.company_name}` : undefined}
          badge={internship && <ReviewBadge submission={internship} />} />;
      })}
    </div> : <Empty>No assigned students match this view.</Empty>}
    <RecordLink to="/guide/students/allocation" title="Guide allocation" description="View assigned guides and review decisions" />
  </div>;
}

function MenteeRecordRoute() {
  const { id } = useParams();
  return <GuideMenteeDetail studentId={id} />;
}

function GuideProfile({ name, email, count }: {
  name: string; email: string; count?: number;
}) {
  return <div className="max-w-2xl space-y-4">
    <PageHeading title="Guide profile" back="/guide/dashboard" />
    <div className={`${card} flex min-w-0 items-center gap-3 p-4`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#EAF2FF] text-[#2855A6]"><UserRound size={20} /></span>
      <div className="min-w-0 wrap-break-word"><p className="font-bold text-[#142B4A]">{name}</p><p className="text-sm text-slate-600">{email}</p></div>
    </div>
    <RecordLink to="/guide/students" title="View assigned students" description={`${count ?? 0} students assigned`} />
    {toolsNavigation.map(tool => <RecordLink key={tool.to} to={tool.to} icon="file" title={tool.title} />)}
  </div>;
}
