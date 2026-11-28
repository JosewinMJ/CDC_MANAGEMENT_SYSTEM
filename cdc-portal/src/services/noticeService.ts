import { apiRequest } from './apiClient';
import { notifyStore } from './storeEvents';
import { Notice, NoticeCategory, NoticePriority, CalendarEvent } from '../shared/types';

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
    const raw = await apiRequest<any>(`/notices/${noticeId}/read`, {
      method: 'POST',
      portal: 'student',
    });
    const mapped = mapNotice(raw);
    notifyStore('cdc_notices');
    return mapped;
  },

  async markAllAsRead(): Promise<boolean> {
    await apiRequest('/notices/read-all', { method: 'POST', portal: 'student' });
    notifyStore('cdc_notices');
    return true;
  },
};

export const calendarService = {
  async getEvents(): Promise<CalendarEvent[]> {
    return apiRequest<CalendarEvent[]>('/calendar/events', { portal: 'student' });
  },

  async addEvent(event: Omit<CalendarEvent, 'id' | 'academicYear'>): Promise<CalendarEvent> {
    return apiRequest<CalendarEvent>('/calendar/events', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify(event),
    });
  },
};
