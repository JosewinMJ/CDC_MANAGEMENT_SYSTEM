import { db } from './storage';
import { Notice, NoticeCategory, NoticePriority, CalendarEvent, UserRole } from '../shared/types';

export const noticeService = {
  async getNotices(): Promise<Notice[]> {
    return Promise.resolve(db.getNotices());
  },

  async markAsRead(noticeId: string): Promise<Notice | null> {
    const student = db.getStudent();
    const notices = db.getNotices();
    const notice = notices.find(n => n.id === noticeId);
    if (!notice) return null;

    if (!notice.readByStudentIds.includes(student.id)) {
      notice.readByStudentIds.push(student.id);
      db.setNotices(notices);
    }
    return Promise.resolve(notice);
  },

  async markAllAsRead(): Promise<boolean> {
    const student = db.getStudent();
    const notices = db.getNotices();
    notices.forEach(n => {
      if (!n.readByStudentIds.includes(student.id)) {
        n.readByStudentIds.push(student.id);
      }
    });
    db.setNotices(notices);
    return Promise.resolve(true);
  },

  // Mock function for Guide/Admin simulator
  async publishNoticeMock(noticeData: {
    title: string;
    content: string;
    category: NoticeCategory;
    priority: NoticePriority;
    isImportant: boolean;
    publisherName: string;
    publisherRole: 'CDC Administrator' | 'Placement Coordinator' | 'Faculty Guide';
  }): Promise<Notice> {
    const student = db.getStudent();
    const notices = db.getNotices();
    const newNotice: Notice = {
      ...noticeData,
      id: `not-${Date.now()}`,
      publishedDate: new Date().toISOString(),
      readByStudentIds: [],
      academicYear: student.academicYear,
    };

    notices.unshift(newNotice);
    db.setNotices(notices);

    // Audit log
    const auditLogs = db.getAuditLog();
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorUserId: 'admin-01',
      actorName: noticeData.publisherName,
      actorRole: UserRole.ADMIN_PLACEMENT,
      action: 'PUBLISHED_NOTICE',
      entityType: 'Notice',
      entityId: newNotice.id,
      details: `Published notice: "${newNotice.title}" [${newNotice.category}]`,
      academicYear: student.academicYear,
    });
    db.setAuditLog(auditLogs);

    return Promise.resolve(newNotice);
  },
};

export const calendarService = {
  async getEvents(): Promise<CalendarEvent[]> {
    return Promise.resolve(db.getCalendarEvents());
  },

  async addEvent(event: Omit<CalendarEvent, 'id' | 'academicYear'>): Promise<CalendarEvent> {
    const student = db.getStudent();
    const events = db.getCalendarEvents();
    const newEvent: CalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`,
      academicYear: student.academicYear,
    };
    events.push(newEvent);
    db.setCalendarEvents(events);
    return Promise.resolve(newEvent);
  },
};
