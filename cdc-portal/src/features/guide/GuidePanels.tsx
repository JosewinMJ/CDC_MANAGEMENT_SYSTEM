import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, FileText, UserRound } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../shared/utils';
import {
  dateKey, initials, reviewPath, reviewStatus, trackTitle,
  type GuideEvent, type InternshipSubmission,
} from './guideData';

export const card = 'rounded-2xl border border-slate-200/90 bg-white shadow-xs';
export const primary = 'inline-flex min-h-10 items-center justify-center rounded-lg bg-[#2855A6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#142B4A] disabled:opacity-50';
export const secondary = 'inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#2855A6] hover:bg-blue-50 disabled:opacity-50';
export const danger = 'inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50';
export const field = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';

export function PageHeading({ title, description, back }: { title: string; description?: string; back?: string }) {
  return <div>
    {back && <Link to={back} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2855A6]">
      <ChevronLeft size={16} /> Back
    </Link>}
    <h1 className="text-2xl font-extrabold tracking-tight text-[#142B4A] sm:text-3xl">{title}</h1>
    {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
  </div>;
}

export function SectionHeader({ title, to, action }: { title: string; to?: string; action?: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-2">
    <h2 className="text-base font-bold text-[#142B4A]">{title}</h2>
    {to && <Link className="text-sm font-semibold text-[#2855A6] hover:underline" to={to}>{action}</Link>}
  </div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className={`${card} p-4 text-sm text-slate-600`}>{children}</p>;
}

export function DefinitionCard({ title, items, badge }: { title: string; items: [string, ReactNode][]; badge?: ReactNode }) {
  return <section className={`${card} p-4 sm:p-5`}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
      <h2 className="font-bold text-[#142B4A]">{title}</h2>
      {badge}
    </div>
    <dl className="divide-y divide-slate-100">
      {items.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2.5 text-sm">
        <dt className="text-slate-600">{label}</dt>
        <dd className="text-right font-medium wrap-break-word text-[#142B4A]">{value ?? '—'}</dd>
      </div>)}
    </dl>
  </section>;
}

export function Filters({ label, options, selected, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return <div role="group" aria-label={label} className="flex flex-wrap gap-2">
    {options.map(option => <button key={option.value} type="button" aria-pressed={selected === option.value}
      onClick={() => onChange(option.value)}
      className={`min-h-9 rounded-full border px-2.5 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm ${selected === option.value
        ? 'border-[#142B4A] bg-[#142B4A] text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-blue-50'}`}>
      {option.label}
    </button>)}
  </div>;
}

export function ReviewBadge({ submission }: { submission: InternshipSubmission }) {
  const { group, label } = reviewStatus(submission);
  return <StatusBadge status={group === 'coordinator' ? 'GUIDE_APPROVED' : submission.status} label={label} dot={false} />;
}

export function ReviewCard({ submission, className = 'block' }: { submission: InternshipSubmission; className?: string }) {
  const name = submission.student_profile?.user.name ?? 'Student';
  return <Link to={reviewPath(submission.id)} className={`${card} ${className} space-y-3 p-3.5 hover:border-blue-300 sm:p-4`}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EAF2FF] text-xs font-bold text-[#2855A6]">{initials(name)}</span>
        <div className="min-w-0 wrap-break-word">
          <p className="text-sm font-bold text-[#142B4A]">{name}</p>
          <p className="text-xs text-slate-600">{submission.company_name}</p>
        </div>
      </div>
      <ReviewBadge submission={submission} />
    </div>
    <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
      <span>{trackTitle(submission.track)} · {formatDate(submission.created_at)}</span>
      <ChevronRight size={16} className="shrink-0 text-[#2855A6]" />
    </div>
  </Link>;
}

export function RecordLink({ to, title, description, detail, icon = 'student', badge }: {
  to: string; title: string; description?: string; detail?: string; icon?: 'student' | 'file'; badge?: ReactNode;
}) {
  const Icon = icon === 'student' ? UserRound : FileText;
  return <Link to={to} className={`${card} block p-3 hover:border-blue-300 sm:p-4`}>
    <span className="flex flex-wrap items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EAF2FF] text-[#2855A6]"><Icon size={17} /></span>
      <span className="min-w-0 flex-1 wrap-break-word">
        <span className="block text-sm font-bold text-[#142B4A]">{title}</span>
        {description && <span className="block text-xs text-slate-600">{description}</span>}
      </span>
      {badge}
      {!detail && <ChevronRight size={16} className="shrink-0 text-[#2855A6]" />}
    </span>
    {detail && <span className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
      {detail}<ChevronRight size={16} className="shrink-0 text-[#2855A6]" />
    </span>}
  </Link>;
}

export function EventCard({ event }: { event: GuideEvent }) {
  return <Link to={reviewPath(event.submissionId)}
    className={`${card} flex items-center gap-3 p-3 hover:border-blue-300`}>
    <span className="grid min-h-10 min-w-10 place-items-center rounded-lg bg-[#EAF2FF] px-2 text-sm font-bold text-[#2855A6]">
      {Number(event.date.slice(-2))}
    </span>
    <span className="min-w-0 flex-1 wrap-break-word">
      <strong className="block text-sm text-[#142B4A]">{event.title}</strong>
      <span className="block text-xs text-slate-600">{formatDate(event.date)} · {event.detail}</span>
    </span>
    <ChevronRight size={16} className="shrink-0 text-[#2855A6]" />
  </Link>;
}

export function GuideCalendar({ events }: { events: GuideEvent[] }) {
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1, 12);
  });
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate();
  const monthEvents = events.filter(event => event.date.startsWith(dateKey(month).slice(0, 7)));
  const markedDays = new Set(monthEvents.map(event => event.date));
  const selectedEvents = monthEvents.filter(event => event.date === selected);
  const moveMonth = (direction: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + direction, 1, 12);
    setMonth(next);
    setSelected(dateKey(next));
  };

  return <div className="space-y-4">
    <PageHeading title="Calendar" description="Start and end dates for your assigned internships." />
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className={`${card} p-3 sm:p-5`} aria-label="Internship calendar">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#142B4A] sm:text-base">
            <CalendarDays size={17} className="hidden sm:block" />
            {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{monthEvents.length} events</span>
            <button type="button" className="rounded-lg p-2 text-[#2855A6] hover:bg-blue-50" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={17} /></button>
            <button type="button" className="rounded-lg p-2 text-[#2855A6] hover:bg-blue-50" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={17} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day} className="pb-1 font-medium text-slate-600">{day}</span>)}
          {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1;
            const date = dateKey(new Date(month.getFullYear(), month.getMonth(), day, 12));
            const hasEvent = markedDays.has(date);
            return <button type="button" key={date} onClick={() => setSelected(date)} aria-pressed={date === selected}
              aria-label={`${formatDate(date)}${hasEvent ? ', scheduled event' : ''}`}
              className={`min-h-9 rounded-lg font-medium ${date === selected ? 'bg-[#2855A6] text-white'
                : hasEvent ? 'bg-[#EAF2FF] text-[#2855A6]' : 'text-slate-700 hover:bg-slate-100'}`}>
              {day}{hasEvent && <span aria-hidden="true" className="mx-auto block size-1 rounded-full bg-current" />}
            </button>;
          })}
        </div>
      </section>
      <section className="space-y-3" aria-live="polite">
        <SectionHeader title={formatDate(selected)} />
        {selectedEvents.length ? selectedEvents.map(event => <EventCard key={event.id} event={event} />)
          : <Empty>No internships start or end on this date.</Empty>}
      </section>
    </div>
  </div>;
}
