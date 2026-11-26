import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppShell } from './components/layout/AppShell';

// Features
import { StudentDashboard } from './features/dashboard/StudentDashboard';
import { UnifiedCalendarPage } from './features/calendar/UnifiedCalendarPage';
import { ProfileLayout } from './features/profile/ProfileLayout';
import { CompanyListPage } from './features/companies/CompanyListPage';
import { CompanyDetailPage } from './features/companies/CompanyDetailPage';
import { EligibilityCheckerPage } from './features/eligibility/EligibilityCheckerPage';
import { MyApplicationsPage } from './features/applications/MyApplicationsPage';
import { InterviewSchedulesPage } from './features/interviews/InterviewSchedulesPage';

import { InternshipLayout } from './features/internships/InternshipLayout';
import { MyInternshipsPage } from './features/internships/MyInternshipsPage';
import { RegisterInternshipPage } from './features/internships/RegisterInternshipPage';
import { InternshipOpportunitiesPage } from './features/internships/InternshipOpportunitiesPage';

import { DailyCodingDashboard } from './features/daily-coding/DailyCodingDashboard';
import { TopicProgressPage } from './features/daily-coding/TopicProgressPage';
import { SolvedProblemsPage } from './features/daily-coding/SolvedProblemsPage';
import { PostedQuestionsPage } from './features/daily-coding/PostedQuestionsPage';
import { WeeklyReportsPage } from './features/daily-coding/WeeklyReportsPage';
import { RegisterLeetCodePage } from './features/daily-coding/RegisterLeetCodePage';

import { NoticesPage } from './features/notices/NoticesPage';
import { ParentAlertsPage } from './features/parent-alerts/ParentAlertsPage';

// Future portal placeholders
import { GuidePlaceholderPage } from './placeholders/GuidePlaceholderPage';
import { AdminPlaceholderPage } from './placeholders/AdminPlaceholderPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* App Shell Wrapper for Student Portal */}
            <Route path="/student" element={<AppShell />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="calendar" element={<UnifiedCalendarPage />} />
              <Route path="profile/*" element={<ProfileLayout />} />
              
              <Route path="companies" element={<CompanyListPage />} />
              <Route path="companies/:id" element={<CompanyDetailPage />} />
              <Route path="eligibility" element={<EligibilityCheckerPage />} />
              
              <Route path="applications" element={<MyApplicationsPage />} />
              <Route path="interviews" element={<InterviewSchedulesPage />} />
              
              {/* Internships with nested layout */}
              <Route path="internships" element={<InternshipLayout />}>
                <Route index element={<Navigate to="my-internships" replace />} />
                <Route path="my-internships" element={<MyInternshipsPage />} />
                <Route path="register" element={<RegisterInternshipPage />} />
                <Route path="opportunities" element={<InternshipOpportunitiesPage />} />
              </Route>

              {/* Daily Coding Challenge (LeetCode Tracker) */}
              <Route path="daily-coding">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DailyCodingDashboard />} />
                <Route path="topics" element={<TopicProgressPage />} />
                <Route path="solved" element={<SolvedProblemsPage />} />
                <Route path="posted" element={<PostedQuestionsPage />} />
                <Route path="weekly" element={<WeeklyReportsPage />} />
                <Route path="register" element={<RegisterLeetCodePage />} />
              </Route>

              <Route path="notices" element={<NoticesPage />} />
              <Route path="parent-alerts" element={<ParentAlertsPage />} />

              {/* Help & Support Info View */}
              <Route
                path="help"
                element={
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-3xl mx-auto space-y-4">
                    <h1 className="text-xl font-bold text-[#142B4A]">CDC Placement Help & FAQ</h1>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      For placement queries, contact the CDC Helpdesk at <code>cdc.helpdesk@vit.ac.in</code> or visit the Placement Block Room 201 during office hours (9:00 AM – 5:00 PM IST).
                    </p>
                  </div>
                }
              />

              {/* Settings Info View */}
              <Route
                path="settings"
                element={
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-3xl mx-auto space-y-4">
                    <h1 className="text-xl font-bold text-[#142B4A]">Account & Notification Settings</h1>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Notification preferences for WhatsApp, SMS, and Email are active. Parent alert contact can be adjusted in Profile → Personal Information.
                    </p>
                  </div>
                }
              />
            </Route>

            {/* Guide Portal Routes (Sections 4 of report) */}
            <Route path="/guide" element={<GuidePlaceholderPage />} />
            <Route path="/guide/*" element={<GuidePlaceholderPage />} />

            {/* Admin Portal Routes (Sections 5 of report) */}
            <Route path="/admin" element={<AdminPlaceholderPage />} />
            <Route path="/admin/*" element={<AdminPlaceholderPage />} />

            {/* Root & Catch-all Redirects */}
            <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
