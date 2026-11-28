import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      <PageHeading title="Student Mentor Chat" description="Direct two-way messaging with your assigned students." />
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {threads.length === 0 ? (
        <Empty>No assigned students available to message.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className={`${card} divide-y divide-slate-100 overflow-hidden self-start`}>
            <div className="p-3.5 bg-slate-50 font-bold text-xs uppercase tracking-wider text-slate-500">
              Assigned Students ({threads.length})
            </div>
            {threads.map(t => (
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
                {t.lastMessage && (
                  <p className="text-xs text-slate-600 truncate mt-1">{t.lastMessage}</p>
                )}
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
