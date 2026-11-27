import { apiRequest } from './apiClient';
import { Notice, NoticeCategory, NoticePriority, CalendarEvent } from '../shared/types';
import { db } from './storage';

function mapNotice(n: any): Notice {
  return {
    id: String(n.id),
    title: n.title,
    content: n.content,
    publisherName: n.publisher_name || 'CDC Administrator',
    publisherRole: n.publisher_role || 'CDC Administrator',
    publishedDate: n.created_at || new Date().toISOString(),
    expiryDate: n.expiry_date || undefined,
    category: (n.category as NoticeCategory) || NoticeCategory.GENERAL,
    priority: (n.priority as NoticePriority) || NoticePriority.NORMAL,
    isImportant: Boolean(n.is_important),
    readByStudentIds: n.read_by_student_ids || [],
    targetBranches: n.target_branches || [],
    academicYear: n.academic_year || '2026-2027',
  };
}

export const noticeService = {
  async getNotices(): Promise<Notice[]> {
    const raw = await apiRequest<any[]>('/notices', { portal: 'student' });
    return raw.map(mapNotice);
  },

  async markAsRead(noticeId: string): Promise<Notice | null> {
    const list = await this.getNotices();
    return list.find(n => n.id === noticeId) ?? null;
  },

  async markAllAsRead(): Promise<boolean> {
    return true;
  },

  async publishNoticeMock(noticeData: {
    title: string;
    content: string;
    category: NoticeCategory;
    priority: NoticePriority;
    isImportant: boolean;
    publisherName: string;
    publisherRole: 'CDC Administrator' | 'Placement Coordinator' | 'Faculty Guide';
  }): Promise<Notice> {
    const raw = await apiRequest<any>('/admin/notices', {
      method: 'POST',
      portal: 'admin',
      body: JSON.stringify({
        title: noticeData.title,
        content: noticeData.content,
        category: noticeData.category,
        priority: noticeData.priority,
        target_portal: 'all',
      }),
    });
    return mapNotice(raw);
  },
};

export const calendarService = {
  async getEvents(): Promise<CalendarEvent[]> {
    return Promise.resolve(db.getCalendarEvents());
  },

  async addEvent(event: Omit<CalendarEvent, 'id' | 'academicYear'>): Promise<CalendarEvent> {
    const events = db.getCalendarEvents();
    const newEvent: CalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`,
      academicYear: '2026-2027',
    };
    events.push(newEvent);
    db.setCalendarEvents(events);
    return Promise.resolve(newEvent);
  },
};
