import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../../services/apiClient';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../shared/utils';
import { card, Empty, field, PageHeading, primary, secondary } from './GuidePanels';
import { dateKey } from './guideData';

interface Question {
  id: string;
  title: string;
  difficulty: string;
  dueDate: string;
  solvedByCount: number;
  totalStudents: number;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  regNumber: string;
  branch: string;
  leetcodeUsername: string | null;
  postedSolved: number;
}

const blankQuestion = { title: '', leetcodeUrl: '', difficulty: 'Easy', dueDate: '' };
const guide = { portal: 'guide' } as const;

export function GuideCoding() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [question, setQuestion] = useState(blankQuestion);
  const [today] = useState(() => dateKey(new Date()));
  const [posting, setPosting] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [refresh, setRefresh] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const options = { ...guide, signal: controller.signal };
    apiRequest<Question[]>('/coding-challenge/questions', options)
      .then(setQuestions)
      .catch(error => { if (!controller.signal.aborted) setLoadError(error.message); });
    apiRequest<LeaderboardEntry[]>('/coding-challenge/leaderboard', options)
      .then(setLeaderboard)
      .catch(error => { if (!controller.signal.aborted) setLoadError(error.message); });
    return () => controller.abort();
  }, [refresh]);

  async function postQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPosting(true);
    setFeedback({});
    try {
      await apiRequest('/coding-challenge/questions', {
        ...guide, method: 'POST',
        body: JSON.stringify({ ...question, title: question.title.trim(), topics: ['DSA'] }),
      });
      setQuestion(blankQuestion);
      setFeedback({ success: 'Coding question published.' });
      setRefresh(version => version + 1);
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : 'Unable to post the question.' });
    } finally {
      setPosting(false);
    }
  }

  return <div className="space-y-4">
    <PageHeading title="Daily coding challenge" description="Post questions and check student participation." />
    <form onSubmit={postQuestion} className={`${card} space-y-4 p-4 sm:p-5`}>
      <h2 className="font-bold text-[#142B4A]">Post a question</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">Problem title
          <input className={field} required maxLength={180} value={question.title} onChange={e => setQuestion({ ...question, title: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm font-semibold">LeetCode problem URL
          <input className={field} type="url" required maxLength={500} value={question.leetcodeUrl} onChange={e => setQuestion({ ...question, leetcodeUrl: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm font-semibold">Difficulty
          <select className={field} value={question.difficulty} onChange={e => setQuestion({ ...question, difficulty: e.target.value })}>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold">Due date
          <input className={field} type="date" required min={today} value={question.dueDate} onChange={e => setQuestion({ ...question, dueDate: e.target.value })} />
        </label>
      </div>
      <Feedback {...feedback} />
      <button type="submit" disabled={posting || !question.title.trim()} className={primary}>{posting ? 'Posting…' : 'Post question'}</button>
    </form>
    {loadError && <div className="space-y-2"><Feedback error={loadError} /><button className={secondary} onClick={() => { setLoadError(''); setRefresh(version => version + 1); }}>Retry</button></div>}
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={`${card} p-4`}>
        <h2 className="font-bold text-[#142B4A]">Posted questions</h2>
        {questions === null && !loadError && <p className="mt-2 text-sm text-slate-600">Loading questions…</p>}
        {questions?.length === 0 && <p className="mt-2 text-sm text-slate-600">No coding questions have been posted.</p>}
        <ul className="mt-2 divide-y divide-slate-100">
          {questions?.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
            <div className="min-w-0 wrap-break-word">
              <strong>{item.title}</strong>
              <p className="text-xs text-slate-600">{item.difficulty} · Due {formatDate(item.dueDate)}</p>
            </div>
            <span className="text-xs font-semibold text-[#2855A6]">{item.solvedByCount}/{item.totalStudents} solved</span>
          </li>)}
        </ul>
      </section>
      <section className={`${card} p-4`}>
        <h2 className="font-bold text-[#142B4A]">Student leaderboard</h2>
        {leaderboard === null && !loadError && <p className="mt-2 text-sm text-slate-600">Loading leaderboard…</p>}
        {leaderboard?.length === 0 && <p className="mt-2 text-sm text-slate-600">No leaderboard entries yet.</p>}
        <ol className="mt-2 divide-y divide-slate-100">
          {leaderboard?.map(student => <li key={student.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
            <div className="min-w-0 wrap-break-word">
              <strong>{student.name}</strong>
              <p className="text-xs text-slate-600">{student.regNumber} · {student.branch}{student.leetcodeUsername && ` · @${student.leetcodeUsername}`}</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700">{student.postedSolved} posted questions solved</span>
          </li>)}
        </ol>
      </section>
    </div>
  </div>;
}

interface GuideNotice {
  id: number;
  title: string;
  content: string;
  publisher_name: string;
  priority: string;
  created_at: string;
}

export function Feedback({ error, success }: { error?: string; success?: string }) {
  if (error) return <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>;
  if (success) return <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>;
  return null;
}

export function GuideNotices() {
  const [notices, setNotices] = useState<GuideNotice[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<GuideNotice[]>('/notices', { ...guide, signal: controller.signal })
      .then(setNotices)
      .catch(error => { if (!controller.signal.aborted) setLoadError(error.message); });
    return () => controller.abort();
  }, [retry]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublishing(true);
    setFeedback({});
    try {
      await apiRequest('/guide/notices', {
        ...guide, method: 'POST',
        body: JSON.stringify({ title: title.trim(), content: content.trim(), priority }),
      });
      setTitle('');
      setContent('');
      setPriority('Normal');
      setFeedback({ success: 'Notice published to the Student Portal feed.' });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : 'Unable to publish the notice.' });
    } finally {
      setPublishing(false);
    }
  }

  return <div className="space-y-4">
    <PageHeading title="Notices" description="Read announcements for guides and publish updates to the Student Portal." />
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <form onSubmit={publish} className={`${card} space-y-4 p-4 sm:p-5`}>
        <h2 className="font-bold text-[#142B4A]">Publish guide notice</h2>
        <label className="block space-y-1 text-sm font-semibold">Title
          <input className={field} required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm font-semibold">Message
          <textarea className={field} required rows={5} value={content} onChange={e => setContent(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm font-semibold">Priority
          <select className={field} value={priority} onChange={e => setPriority(e.target.value)}>
            <option>Normal</option><option>High</option><option>Urgent</option>
          </select>
        </label>
        <Feedback {...feedback} />
        <button type="submit" className={primary} disabled={publishing || !title.trim() || !content.trim()}>{publishing ? 'Publishing…' : 'Publish notice'}</button>
      </form>
      <section className="space-y-3">
        <h2 className="font-bold text-[#142B4A]">Announcements for guides</h2>
        {loadError && <div className="space-y-2"><Feedback error={loadError} /><button className={secondary} onClick={() => { setLoadError(''); setRetry(version => version + 1); }}>Retry</button></div>}
        {notices === null && !loadError && <Empty>Loading announcements…</Empty>}
        {notices?.length === 0 && <Empty>No announcements yet.</Empty>}
        {notices?.map(notice => <article className={`${card} space-y-2 p-4`} key={notice.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-[#142B4A]">{notice.title}</h3>
            {notice.priority !== 'Normal' && <StatusBadge status={notice.priority} dot={false} />}
          </div>
          <p className="text-xs text-slate-600">{notice.publisher_name} · {formatDate(notice.created_at)}</p>
          <p className="whitespace-pre-wrap wrap-break-word text-sm">{notice.content}</p>
        </article>)}
      </section>
    </div>
  </div>;
}
