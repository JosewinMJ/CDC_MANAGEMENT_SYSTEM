import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Code2,
  FileText,
  Briefcase,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabItem } from '../../components/common/Tabs';
import { db } from '../../services/storage';
import { Student } from '../../shared/types';
import { PersonalTab } from './PersonalTab';
import { AcademicTab } from './AcademicTab';
import { SkillsProjectsTab } from './SkillsProjectsTab';
import { DocumentsTab } from './DocumentsTab';
import { InternshipHistoryTab } from './InternshipHistoryTab';
import { PlacementHistoryTab } from './PlacementHistoryTab';

export const ProfileLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student>(db.getStudent());

  const currentTab = location.pathname.split('/')[3] || 'personal';

  const tabs: TabItem[] = [
    { id: 'personal', label: 'Personal Information', icon: <User className="w-4 h-4" /> },
    { id: 'academic', label: 'Academic Details', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills & Projects', icon: <Code2 className="w-4 h-4" /> },
    { id: 'documents', label: 'Resume & Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'internships', label: 'Internship History', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'placements', label: 'Placement History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={student.avatarUrl}
          alt={student.fullName}
          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#EAF2FF] shadow-xs"
        />

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-[#142B4A]">{student.fullName}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#2855A6]">
              {student.academicRecord.degree} {student.academicRecord.branch}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Profile
            </span>
          </div>

          <p className="text-xs text-[#78869A] mt-1">
            Reg No: <strong>{student.regNumber}</strong> · Class of {student.academicRecord.graduationYear} · Faculty Mentor: <strong>{student.assignedGuideName}</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span>Email: <strong className="text-slate-800">{student.email}</strong></span>
            <span>Phone: <strong className="text-slate-800">{student.phone}</strong></span>
            <span>CGPA: <strong className="text-emerald-700 font-bold">{student.academicRecord.currentCgpa}</strong></span>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={currentTab}
        onChange={tabId => navigate(`/student/profile/${tabId}`)}
      />

      {/* Tab Routes View */}
      <Routes>
        <Route path="personal" element={<PersonalTab />} />
        <Route path="academic" element={<AcademicTab />} />
        <Route path="skills" element={<SkillsProjectsTab />} />
        <Route path="documents" element={<DocumentsTab />} />
        <Route path="internships" element={<InternshipHistoryTab />} />
        <Route path="placements" element={<PlacementHistoryTab />} />
        <Route path="*" element={<Navigate to="personal" replace />} />
      </Routes>
    </div>
  );
};
