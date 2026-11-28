import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Megaphone, MessageSquare, RefreshCw, Search, Send } from 'lucide-react';
import { apiRequest } from '../../services/apiClient';
import { formatDateTime } from '../../shared/utils';
import { card, Empty, field, PageHeading, primary, secondary } from './GuidePanels';

interface ThreadSummary {
  studentProfileId: number;
  regNumber: string;
  name: string;
  email: string;
  branch: string;
  unreadCount: number;
  lastMessage: string | null;
  lastSenderRole: string | null;
  lastMessageAt: string | null;
}

interface MentorMsg {
  id: number;
  sender_role: 'STUDENT' | 'GUIDE';
  sender_name: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export function GuideChat() {
  const [params] = useSearchParams();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const q = params.get('studentId');
    return q ? Number(q) : null;
  });
  const [messages, setMessages] = useState<MentorMsg[]>([]);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    try {
      const list = await apiRequest<ThreadSummary[]>('/guide/chat/threads', { portal: 'guide' });
      setThreads(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].studentProfileId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load student threads.');
    }
  };

  const loadMessages = async (stuId: number, scroll = false) => {
    try {
      const res = await apiRequest<{ student: any; messages: MentorMsg[] }>(`/guide/students/${stuId}/chat`, { portal: 'guide' });
      setActiveStudent(res.student);
      setMessages(res.messages);
      setError('');
      if (scroll) {
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages.');
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId, true);
    const id = setInterval(() => {
      loadThreads();
      loadMessages(selectedId, false);
    }, 8000);
    return () => clearInterval(id);
  }, [selectedId]);

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    try {
      await apiRequest(`/guide/students/${selectedId}/chat`, {
        method: 'POST',
        portal: 'guide',
        body: JSON.stringify({ message: reply.trim() }),
      });
      setReply('');
      await Promise.all([loadMessages(selectedId, true), loadThreads()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!broadcastText.trim() || broadcasting) return;
    setBroadcasting(true);
    setError('');
    setStatusNote('');
    try {
      const res = await apiRequest<{ sentCount: number }>('/guide/chat/broadcast', {
        method: 'POST',
        portal: 'guide',
        body: JSON.stringify({ message: broadcastText.trim() }),
      });
      setBroadcastText('');
      setShowBroadcast(false);
      setStatusNote(`Sent message to ${res.sentCount} assigned student(s).`);
      await Promise.all([
        loadThreads(),
        selectedId ? loadMessages(selectedId, true) : Promise.resolve(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast chat.');
    } finally {
      setBroadcasting(false);
    }
  };

  const query = search.trim().toLowerCase();
  const visibleThreads = threads.filter(
    t => !query || [t.name, t.regNumber, t.branch].some(v => v.toLowerCase().includes(query))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title="Student Mentor Chat" description="Start or continue two-way chats, or message all students assigned under you at once." />
        {threads.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setShowBroadcast(v => !v);
              setStatusNote('');
            }}
            className={primary}
          >
            <Megaphone size={15} className="mr-1.5" />
            {showBroadcast ? 'Close Broadcast Chat' : `Message All Students (${threads.length})`}
          </button>
        )}
      </div>
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {statusNote && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{statusNote}</p>}

      {showBroadcast && (
        <form onSubmit={handleBroadcast} className={`${card} p-4 space-y-3 border-blue-200 bg-blue-50/40`}>
          <div>
            <h2 className="text-sm font-bold text-[#142B4A]">Broadcast Chat to All Assigned Students ({threads.length})</h2>
            <p className="text-xs text-slate-600">This message will be delivered directly into each assigned student&apos;s Mentor Chat inbox.</p>
          </div>
          <textarea
            className={field}
            required
            rows={3}
            maxLength={2000}
            value={broadcastText}
            onChange={e => setBroadcastText(e.target.value)}
            placeholder="Write an update or instruction for all students under you..."
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowBroadcast(false)} className={secondary}>Cancel</button>
            <button type="submit" disabled={broadcasting || !broadcastText.trim()} className={primary}>
              <Send size={15} className="mr-1.5" /> {broadcasting ? 'Sending to all…' : 'Send to All Students'}
            </button>
          </div>
        </form>
      )}

      {threads.length === 0 ? (
        <Empty>No assigned students available to message.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className={`${card} divide-y divide-slate-100 overflow-hidden self-start`}>
            <div className="p-3 bg-slate-50 space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Assigned Students ({threads.length})
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter or start chat..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2855A6]"
                />
              </div>
            </div>
            {visibleThreads.map(t => (
              <button
                type="button"
                key={t.studentProfileId}
                onClick={() => setSelectedId(t.studentProfileId)}
                className={`w-full text-left p-3.5 transition hover:bg-blue-50/50 ${
                  selectedId === t.studentProfileId ? 'bg-[#EAF2FF]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[#142B4A] truncate">{t.name}</span>
                  {t.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#2855A6] text-white text-[10px] font-bold">
                      {t.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{t.regNumber} · {t.branch}</p>
                <p className="text-xs text-slate-600 truncate mt-1">
                  {t.lastMessage ? t.lastMessage : 'Click to start a chat'}
                </p>
              </button>
            ))}
          </aside>

          <section className={`${card} flex flex-col h-[520px] overflow-hidden`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-[#142B4A]">{activeStudent?.user?.name || 'Select a student'}</h2>
                <p className="text-xs text-slate-500">{activeStudent?.reg_number} · {activeStudent?.user?.email}</p>
              </div>
              {selectedId && (
                <button type="button" onClick={() => loadMessages(selectedId, true)} className={secondary}>
                  <RefreshCw size={15} className="mr-1.5" /> Refresh
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F7FA]/60">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                  <MessageSquare size={28} className="text-slate-300" />
                  <span>No messages yet. Send a message below.</span>
                </div>
              ) : (
                messages.map(m => {
                  const isMine = m.sender_role === 'GUIDE';
                  return (
                    <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-2xs ${
                          isMine
                            ? 'bg-[#2855A6] text-white rounded-br-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        <p className={`text-[11px] font-bold mb-0.5 ${isMine ? 'text-blue-200' : 'text-[#2855A6]'}`}>
                          {isMine ? 'You' : m.sender_name}
                        </p>
                        <p className="whitespace-pre-wrap">{m.message}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{formatDateTime(m.created_at)}</span>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="p-3.5 border-t border-slate-100 bg-white flex gap-2">
              <input
                className={field}
                required
                maxLength={2000}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your reply to the student..."
              />
              <button type="submit" disabled={sending || !reply.trim()} className={primary}>
                <Send size={15} className="mr-1.5" /> {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
