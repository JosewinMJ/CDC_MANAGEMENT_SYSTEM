import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Building2,
  Calendar,
  Briefcase,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../shared/utils';

interface PublishedOpportunity {
  id: string;
  organization: string;
  logoUrl: string;
  role: string;
  duration: string;
  stipend: string;
  requiredSkills: string[];
  eligibility: string;
  deadline: string;
  description: string;
}

export const InternshipOpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const publishedList: PublishedOpportunity[] = [
    {
      id: 'opp-1',
      organization: 'Amazon Development Centre',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      role: 'Summer Software Development Engineer (SDE) Intern',
      duration: '8–10 Weeks (May – July 2027)',
      stipend: '₹80,000 / month',
      requiredSkills: ['Data Structures & Algorithms', 'Java / C++', 'Object-Oriented Design'],
      eligibility: 'B.Tech CSE/ISE with CGPA ≥ 8.0, 0 active backlogs',
      deadline: '2026-12-10',
      description: 'Design and implement distributed components across AWS infrastructure services and retail systems.',
    },
    {
      id: 'opp-2',
      organization: 'Intel India',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282020%29.svg',
      role: 'Firmware & Systems Software Intern',
      duration: '12 Weeks (Hybrid)',
      stipend: '₹45,000 / month',
      requiredSkills: ['C / C++', 'Computer Architecture', 'Linux OS Internals'],
      eligibility: 'B.Tech CSE/ECE with CGPA ≥ 7.5',
      deadline: '2026-12-05',
      description: 'Develop low-level device drivers, UEFI firmware, and system benchmarking utilities for edge platforms.',
    },
    {
      id: 'opp-3',
      organization: 'Goldman Sachs',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg',
      role: 'Engineering Summer Analyst',
      duration: '8 Weeks',
      stipend: '₹1,00,000 / month',
      requiredSkills: ['Algorithms', 'Java / Python', 'Financial Systems'],
      eligibility: 'All Engineering branches with CGPA ≥ 8.0',
      deadline: '2026-12-15',
      description: 'Build algorithmic trading platforms, quantitative financial risk models, and enterprise microservices.',
    },
  ];

  const handleApply = (opp: PublishedOpportunity) => {
    setAppliedIds(prev => [...prev, opp.id]);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    showToast({
      type: 'success',
      title: 'Opportunity Application Sent',
      message: `Your profile has been transmitted to ${opp.organization} via the CDC Portal.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#142B4A]">CDC-Published Internship Opportunities</h2>
          <p className="text-xs text-[#78869A] mt-0.5">
            Verified corporate internship recruitments vetted and published by the placement administration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedList.map(opp => {
          const isApplied = appliedIds.includes(opp.id);
          return (
            <div
              key={opp.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={opp.logoUrl}
                    alt={opp.organization}
                    className="w-10 h-10 object-contain p-1 border border-slate-200 rounded-xl bg-white shadow-2xs"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-[#142B4A]">{opp.organization}</h3>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Stipend: {opp.stipend}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800">{opp.role}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{opp.description}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Duration:</span>
                    <span className="font-semibold text-slate-800">{opp.duration}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Eligibility Criteria:</span>
                    <span className="font-semibold text-slate-800">{opp.eligibility}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Deadline:</span>
                    <span className="font-bold text-rose-700">{formatDate(opp.deadline)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {opp.requiredSkills.map(s => (
                    <span
                      key={s}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#2855A6] border border-blue-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                {isApplied ? (
                  <span className="w-full py-2 block text-center bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200">
                    Application Sent
                  </span>
                ) : (
                  <button
                    onClick={() => handleApply(opp)}
                    className="w-full py-2 bg-[#2855A6] hover:bg-[#142B4A] text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    Apply Through CDC
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
