// LocalStorage-backed reactive database repository
import {
  Student,
  Company,
  Application,
  Interview,
  Internship,
  Notice,
  ParentAlert,
  CalendarEvent,
  CodingProfile,
  AuditLogEntry,
  AcademicCorrectionRequest,
} from '../shared/types';
import {
  INITIAL_STUDENT,
  INITIAL_COMPANIES,
  INITIAL_APPLICATIONS,
  INITIAL_INTERVIEWS,
  INITIAL_INTERNSHIPS,
  INITIAL_NOTICES,
  INITIAL_PARENT_ALERTS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_CODING_PROFILE,
  INITIAL_AUDIT_LOG,
} from '../mocks/initialData';

const STORAGE_KEYS = {
  STUDENT: 'cdc_student',
  COMPANIES: 'cdc_companies',
  APPLICATIONS: 'cdc_applications',
  INTERVIEWS: 'cdc_interviews',
  INTERNSHIPS: 'cdc_internships',
  NOTICES: 'cdc_notices',
  PARENT_ALERTS: 'cdc_parent_alerts',
  CALENDAR: 'cdc_calendar_events',
  CODING: 'cdc_coding_profile',
  AUDIT: 'cdc_audit_log',
  CORRECTIONS: 'cdc_corrections',
};

// Event emitter pattern for real-time reactivity across components
type Listener = () => void;
const listeners: Record<string, Listener[]> = {};

export function subscribeToStore(key: string, callback: Listener) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(l => l !== callback);
  };
}

function notifySubscribers(key: string) {
  if (listeners[key]) {
    listeners[key].forEach(fn => fn());
  }
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifySubscribers(key);
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export const db = {
  getStudent: (): Student => getItem(STORAGE_KEYS.STUDENT, INITIAL_STUDENT),
  setStudent: (data: Student) => setItem(STORAGE_KEYS.STUDENT, data),

  getCompanies: (): Company[] => getItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES),
  setCompanies: (data: Company[]) => setItem(STORAGE_KEYS.COMPANIES, data),

  getApplications: (): Application[] => getItem(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS),
  setApplications: (data: Application[]) => setItem(STORAGE_KEYS.APPLICATIONS, data),

  getInterviews: (): Interview[] => getItem(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS),
  setInterviews: (data: Interview[]) => setItem(STORAGE_KEYS.INTERVIEWS, data),

  getInternships: (): Internship[] => getItem(STORAGE_KEYS.INTERNSHIPS, INITIAL_INTERNSHIPS),
  setInternships: (data: Internship[]) => setItem(STORAGE_KEYS.INTERNSHIPS, data),

  getNotices: (): Notice[] => getItem(STORAGE_KEYS.NOTICES, INITIAL_NOTICES),
  setNotices: (data: Notice[]) => setItem(STORAGE_KEYS.NOTICES, data),

  getParentAlerts: (): ParentAlert[] => getItem(STORAGE_KEYS.PARENT_ALERTS, INITIAL_PARENT_ALERTS),
  setParentAlerts: (data: ParentAlert[]) => setItem(STORAGE_KEYS.PARENT_ALERTS, data),

  getCalendarEvents: (): CalendarEvent[] => getItem(STORAGE_KEYS.CALENDAR, INITIAL_CALENDAR_EVENTS),
  setCalendarEvents: (data: CalendarEvent[]) => setItem(STORAGE_KEYS.CALENDAR, data),

  getCodingProfile: (): CodingProfile => getItem(STORAGE_KEYS.CODING, INITIAL_CODING_PROFILE),
  setCodingProfile: (data: CodingProfile) => setItem(STORAGE_KEYS.CODING, data),

  getAuditLog: (): AuditLogEntry[] => getItem(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOG),
  setAuditLog: (data: AuditLogEntry[]) => setItem(STORAGE_KEYS.AUDIT, data),

  getCorrections: (): AcademicCorrectionRequest[] => getItem(STORAGE_KEYS.CORRECTIONS, []),
  setCorrections: (data: AcademicCorrectionRequest[]) => setItem(STORAGE_KEYS.CORRECTIONS, data),

  resetAll: () => {
    localStorage.clear();
    Object.values(STORAGE_KEYS).forEach(k => notifySubscribers(k));
  },
};
