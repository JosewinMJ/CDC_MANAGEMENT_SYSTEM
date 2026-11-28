import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, RefreshCw, Send, UserCheck } from 'lucide-react';
import { apiRequest } from '../../services/apiClient';
import { formatDateTime } from '../../shared/utils';

interface MentorMsg {
  id: number;
  sender_role: 'STUDENT' | 'GUIDE';
  sender_name: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export const MentorChatPage: React.FC = () => {
  const [guide, setGuide] = useState<{ id: number; name: string; email: string; department?: string } | null>(null);
  const [messages, setMessages] = useState<MentorMsg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadChat = async (scroll = false) => {
    try {
      const res = await apiRequest<{ guide: any; messages: MentorMsg[] }>('/chat/messages', { portal: 'student' });
      setGuide(res.guide);
      setMessages(res.messages);
      setError('');
      if (scroll) {
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load mentor chat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat(true);
    const id = setInterval(() => loadChat(false), 8000);
    return () => clearInterval(id);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending || !guide) return;
    setSending(true);
    setError('');
    try {
      await apiRequest('/chat/messages', {
        method: 'POST',
        portal: 'student',
        body: JSON.stringify({ message: text.trim() }),
      });
      setText('');
      await loadChat(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message failed to send.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading Mentor Chat...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EAF2FF] text-[#2855A6] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#142B4A]">Direct Mentor Chat</h1>
            <p className="text-xs text-[#78869A]">
              {guide ? `Assigned Mentor: ${guide.name} (${guide.email})` : 'No faculty guide assigned yet'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => loadChat(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#2855A6] hover:bg-blue-50 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {!guide ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Your faculty guide has not been assigned by the CDC Administrator yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[520px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#F5F7FA]/60">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <span>Start a conversation with {guide.name}.</span>
              </div>
            ) : (
              messages.map(m => {
                const isMine = m.sender_role === 'STUDENT';
                return (
                  <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                        isMine
                          ? 'bg-[#2855A6] text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      <div className={`text-[10px] font-bold mb-0.5 ${isMine ? 'text-blue-200' : 'text-[#2855A6]'}`}>
                        {isMine ? 'You' : m.sender_name}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {formatDateTime(m.created_at)}
                      {isMine && m.read_at ? ' · Read by mentor' : ''}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Message ${guide.name}...`}
              maxLength={2000}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              required
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2855A6] hover:bg-[#142B4A] disabled:opacity-50 text-white text-xs font-bold transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
