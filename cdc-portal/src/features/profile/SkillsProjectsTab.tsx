import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  FolderGit2,
  Award,
  ExternalLink,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Student, CodingProfile } from '../../shared/types';
import { profileService, studentService } from '../../services/studentService';
import { codingChallengeService } from '../../services/codingChallengeService';
import { subscribeToStore } from '../../services/storeEvents';
import { useNotification } from '../../context/NotificationContext';

export const SkillsProjectsTab: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [coding, setCoding] = useState<CodingProfile | null>(null);
  const { showToast } = useNotification();

  const [newSkill, setNewSkill] = useState('');
  const [skillCategory, setSkillCategory] = useState<'technicalSkills' | 'programmingLanguages' | 'toolsAndTechnologies'>('technicalSkills');

  const loadData = async () => {
    const [profile, code] = await Promise.all([
      studentService.getStudentProfile(),
      codingChallengeService.getCodingProfile(),
    ]);
    setStudent(profile);
    setCoding(code);
  };

  useEffect(() => {
    loadData().catch(() => {});
    const unsub1 = subscribeToStore('cdc_student', loadData);
    const unsub2 = subscribeToStore('cdc_coding_profile', loadData);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  if (!student || !coding) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading skills and coding stats...</div>;
  }

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    const currentSkills = { ...student.skills };
    if (!currentSkills[skillCategory].includes(newSkill.trim())) {
      currentSkills[skillCategory] = [...currentSkills[skillCategory], newSkill.trim()];
      await profileService.updateSkills(currentSkills);
      await loadData();
      setNewSkill('');
      showToast({ type: 'success', title: 'Skill Added', message: `Added ${newSkill.trim()}` });
    }
  };

  const handleRemoveSkill = async (category: 'technicalSkills' | 'programmingLanguages' | 'toolsAndTechnologies', skillToRemove: string) => {
    const currentSkills = { ...student.skills };
    currentSkills[category] = currentSkills[category].filter(s => s !== skillToRemove);
    await profileService.updateSkills(currentSkills);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* 1. Daily Coding Challenge (LeetCode) Integration Card (UI Spec §H) */}
      <div className="bg-gradient-to-r from-slate-900 via-[#142B4A] to-[#2855A6] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300 bg-orange-500/20 px-2.5 py-0.5 rounded-full border border-orange-400/30">
                  Daily Coding Challenge Profile
                </span>
                <span className="text-xs text-blue-200">Tracking Status: OK</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">
                LeetCode: @{coding.username}
              </h3>
              <p className="text-xs text-blue-200/90 mt-0.5">
                Practice record evaluated by recruitment drives with algorithmic coding criteria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-black text-white">{coding.totalSolved}</div>
              <div className="text-[11px] text-blue-200">
                E: {coding.easySolved} · M: {coding.mediumSolved} · H: {coding.hardSolved}
              </div>
            </div>

            <button
              onClick={() => navigate('/student/daily-coding/dashboard')}
              className="px-4 py-2 bg-white hover:bg-blue-50 text-[#142B4A] text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <span>DSA Dashboard</span>
              <ChevronRight className="w-4 h-4 text-[#2855A6]" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Skills Inventory */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#142B4A]">Skills Inventory</h3>
            <p className="text-xs text-[#78869A] mt-0.5">
              Categorized competencies used for company recruitment keyword matching
            </p>
          </div>

          {/* Quick Add Skill Form */}
          <form onSubmit={handleAddSkill} className="flex items-center gap-2 text-xs">
            <select
              value={skillCategory}
              onChange={e => setSkillCategory(e.target.value as any)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="technicalSkills">Technical</option>
              <option value="programmingLanguages">Language</option>
              <option value="toolsAndTechnologies">Tool</option>
            </select>
            <input
              type="text"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              placeholder="e.g. Next.js"
              className="p-1.5 border border-slate-300 rounded-lg text-xs w-28 sm:w-36"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#2855A6] hover:bg-[#142B4A] text-white font-bold rounded-lg transition"
            >
              Add
            </button>
          </form>
        </div>

        {/* Programming Languages */}
        <div>
          <h4 className="text-xs font-bold text-[#78869A] uppercase tracking-wider mb-2">
            Programming Languages
          </h4>
          <div className="flex flex-wrap gap-2">
            {student.skills.programmingLanguages.map(lang => (
              <span
                key={lang}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2855A6] border border-blue-200"
              >
                {lang}
                <button
                  onClick={() => handleRemoveSkill('programmingLanguages', lang)}
                  className="hover:text-rose-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Technical Skills */}
        <div>
          <h4 className="text-xs font-bold text-[#78869A] uppercase tracking-wider mb-2">
            Technical & Core Domain Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {student.skills.technicalSkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill('technicalSkills', skill)}
                  className="hover:text-rose-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Tools and Technologies */}
        <div>
          <h4 className="text-xs font-bold text-[#78869A] uppercase tracking-wider mb-2">
            Tools, Frameworks & Cloud
          </h4>
          <div className="flex flex-wrap gap-2">
            {student.skills.toolsAndTechnologies.map(tool => (
              <span
                key={tool}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200"
              >
                {tool}
                <button
                  onClick={() => handleRemoveSkill('toolsAndTechnologies', tool)}
                  className="hover:text-rose-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Projects Showcase */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="text-base font-bold text-[#142B4A] mb-4">Featured Technical Projects</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {student.skills.projects.map(proj => (
            <div
              key={proj.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-bold text-[#142B4A] line-clamp-1">{proj.title}</h4>
                  {proj.featured && (
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-3 mb-3">{proj.description}</p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {proj.technologies.map(t => (
                    <span
                      key={t}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 text-xs">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#2855A6] font-semibold hover:underline"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      GitHub
                    </a>
                  )}
                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Certifications & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#2855A6]" />
            Official Certifications
          </h3>

          <div className="space-y-3">
            {student.skills.certifications.map(cert => (
              <div key={cert.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <h4 className="text-xs font-bold text-[#142B4A]">{cert.title}</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Issued by <strong>{cert.issuer}</strong> · {cert.issueDate}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Key Honours & Achievements
          </h3>

          <ul className="space-y-2.5 text-xs text-slate-700">
            {student.skills.achievements.map((ach, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{ach}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
