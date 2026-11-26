import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Filter,
  AlertTriangle,
  Building2,
  ExternalLink,
  CheckCircle2,
  List,
  Grid,
} from 'lucide-react';
import { calendarService } from '../../services/calendarService';
import { CalendarEvent } from '../../shared/types';
import { formatDate } from '../../shared/utils';

export const UnifiedCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 26)); // Nov 26, 2026 (matching system current date)
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-11-28');

  // Filter types
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    deadline: true,
    assessment: true,
    interview: true,
    campus_visit: true,
    internship_milestone: true,
    document_deadline: true,
    parent_alert: true,
    cdc_event: true,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const list = await calendarService.getEvents();
    setEvents(list);
    // Initial selection
    const initial = list.filter(e => e.date === '2026-11-28');
    setSelectedDateEvents(initial);
  };

  const toggleFilter = (key: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredEvents = events.filter(e => activeFilters[e.type]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 26));
    setSelectedDateStr('2026-11-26');
    setSelectedDateEvents(filteredEvents.filter(e => e.date === '2026-11-26'));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    const dayEvts = filteredEvents.filter(e => e.date === dateStr);
    setSelectedDateEvents(dayEvts);
  };

  const getEventBadgeClass = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'deadline':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'assessment':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interview':
        return 'bg-[#142B4A] text-white border-blue-900';
      case 'campus_visit':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'internship_milestone':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'document_deadline':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'parent_alert':
        return 'bg-slate-100 text-slate-700 border-dashed border-slate-300';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Unified Recruitment & Academic Calendar</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Synchronized milestones for application deadlines, interviews, assessments, and parent reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'month' ? 'bg-white text-[#142B4A] shadow-xs' : 'text-slate-600'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'agenda' ? 'bg-white text-[#142B4A] shadow-xs' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Agenda
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-xl transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#142B4A]">
          <Filter className="w-3.5 h-3.5 text-[#2855A6]" />
          <span>FILTER EVENT CATEGORIES:</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { key: 'deadline', label: 'Application Deadlines', color: 'bg-rose-500' },
            { key: 'assessment', label: 'Online Assessments', color: 'bg-blue-500' },
            { key: 'interview', label: 'Interviews (Tech & HR)', color: 'bg-[#142B4A]' },
            { key: 'internship_milestone', label: 'Internship Milestones', color: 'bg-teal-500' },
            { key: 'document_deadline', label: 'Target / Document Deadlines', color: 'bg-amber-500' },
            { key: 'parent_alert', label: 'Parent Notification Dates', color: 'bg-slate-400' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                activeFilters[f.key]
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-100/60 border-slate-200 text-slate-400 line-through'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${f.color}`} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Calendar View & Selected Event Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Left/Center Area (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#142B4A]">
              {monthNames[month]} {year}
            </h2>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'month' ? (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 py-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty offset padding */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-24 p-1 bg-slate-50/40 rounded-xl" />
                ))}

                {/* Month Days */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = day === 26 && month === 10; // 26 Nov 2026
                  const isSelected = dateStr === selectedDateStr;
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr);
                  const hasDeadlineNear = day >= 26 && day <= 30 && dayEvents.some(e => e.type === 'deadline');

                  return (
                    <div
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`min-h-24 p-1.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#2855A6] bg-[#EAF2FF]/50 ring-2 ring-[#2855A6]/20'
                          : isToday
                          ? 'border-blue-400 bg-blue-50/40'
                          : hasDeadlineNear
                          ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-[#2855A6] text-white'
                              : isSelected
                              ? 'text-[#2855A6]'
                              : 'text-slate-700'
                          }`}
                        >
                          {day}
                        </span>

                        {hasDeadlineNear && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>

                      {/* Event chips */}
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map(evt => (
                          <div
                            key={evt.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border ${getEventBadgeClass(
                              evt.type
                            )}`}
                          >
                            {evt.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] font-bold text-slate-500 px-1">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Agenda List View */
            <div className="divide-y divide-slate-100">
              {filteredEvents.map(evt => (
                <div key={evt.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-[#2855A6] font-bold text-xs shrink-0 text-center w-14">
                      {formatDate(evt.date).split(' ')[0]} {formatDate(evt.date).split(' ')[1]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#142B4A]">{evt.title}</h4>
                      <p className="text-[11px] text-[#78869A]">{evt.venueOrLink || evt.time || evt.companyName}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEventBadgeClass(evt.type)}`}>
                    {evt.status || evt.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Date Details Panel (1/3) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider">
              Selected Day's Events
            </span>
            <h3 className="text-base font-bold text-[#142B4A] mt-0.5">
              {formatDate(selectedDateStr)}
            </h3>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#78869A]">
              <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No scheduled recruitment or academic deadlines for this date.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map(evt => (
                <div key={evt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEventBadgeClass(evt.type)}`}>
                      {evt.type.replace('_', ' ').toUpperCase()}
                    </span>
                    {evt.time && (
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {evt.time}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-[#142B4A]">{evt.title}</h4>

                  {evt.venueOrLink && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 truncate">
                      {evt.venueOrLink}
                    </p>
                  )}

                  {evt.status && (
                    <div className="text-[11px] text-[#2855A6] font-semibold">
                      Status: {evt.status}
                    </div>
                  )}

                  {evt.actionUrl && (
                    <button
                      onClick={() => navigate(evt.actionUrl!)}
                      className="w-full mt-2 py-1.5 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <span>{evt.actionLabel || 'View Details'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upcoming this week preview */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-2">
              Upcoming This Week
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-200">
                <span className="font-semibold text-amber-950">TCS NQT Deadline</span>
                <span className="text-[10px] font-bold text-amber-700">28 Nov</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-200">
                <span className="font-semibold text-rose-950">Infosys 9.5 LPA Deadline</span>
                <span className="text-[10px] font-bold text-rose-700">30 Nov</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-200">
                <span className="font-semibold text-blue-950">Accenture Assessment</span>
                <span className="text-[10px] font-bold text-blue-700">03 Dec</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
