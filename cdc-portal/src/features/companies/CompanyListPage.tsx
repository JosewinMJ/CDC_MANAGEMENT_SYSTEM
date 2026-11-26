import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Briefcase,
  MapPin,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { companyService } from '../../services/companyService';
import { applicationService } from '../../services/applicationService';
import { eligibilityService } from '../../services/eligibilityService';
import { db, subscribeToStore } from '../../services/storage';
import { Company, Application, EligibilityStatus } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const CompanyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [eligibilityMap, setEligibilityMap] = useState<Record<string, EligibilityStatus>>({});

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [eligibilityFilter, setEligibilityFilter] = useState<'ALL' | 'ELIGIBLE' | 'NOT_ELIGIBLE'>('ALL');
  const [sortBy, setSortBy] = useState<'deadline' | 'name' | 'ctc'>('deadline');

  const { showToast } = useNotification();

  const loadData = async () => {
    const comps = await companyService.getCompanies();
    const apps = await applicationService.getApplications();
    const summaries = await eligibilityService.getAllEligibilitySummaries();

    const map: Record<string, EligibilityStatus> = {};
    summaries.forEach(s => {
      // Key by roleId
      map[s.role.id] = s.result.overallStatus;
    });

    setCompanies(comps);
    setApplications(apps);
    setEligibilityMap(map);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore('cdc_applications', loadData);
    return () => unsub();
  }, []);

  const appliedRoleIds = applications.map(a => a.roleId);

  // Filter and sort companies
  const filteredCompanies = companies.filter(comp => {
    const matchesSearch =
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.roles.some(r => r.roleTitle.toLowerCase().includes(search.toLowerCase()) || r.requiredSkills.some(s => s.toLowerCase().includes(search.toLowerCase())));

    if (!matchesSearch) return false;

    if (eligibilityFilter !== 'ALL') {
      const hasMatchingRole = comp.roles.some(r => eligibilityMap[r.id] === eligibilityFilter);
      if (!hasMatchingRole) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Explore Recruitment Opportunities</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Active campus recruitment drives, company eligibility criteria, and deadlines
          </p>
        </div>

        <button
          onClick={() => navigate('/student/eligibility')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EAF2FF] hover:bg-blue-100 text-[#2855A6] text-xs font-bold rounded-xl border border-blue-200 transition self-start sm:self-auto"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Launch Eligibility Engine</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company name, job role, or technology skill..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F5F7FA] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={eligibilityFilter}
            onChange={e => setEligibilityFilter(e.target.value as any)}
            className="flex-1 md:flex-initial p-2 text-xs bg-[#F5F7FA] border border-slate-200 rounded-xl text-slate-700 font-semibold"
          >
            <option value="ALL">All Eligibility</option>
            <option value="ELIGIBLE">Eligible Only</option>
            <option value="NOT_ELIGIBLE">Not Eligible</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="flex-1 md:flex-initial p-2 text-xs bg-[#F5F7FA] border border-slate-200 rounded-xl text-slate-700 font-semibold"
          >
            <option value="deadline">Sort by Deadline Soonest</option>
            <option value="name">Sort by Company Name</option>
          </select>
        </div>
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCompanies.map(company => {
          const primaryRole = company.roles[0];
          const isEligible = company.roles.some(r => eligibilityMap[r.id] === EligibilityStatus.ELIGIBLE);
          const isApplied = company.roles.some(r => appliedRoleIds.includes(r.id));
          const hasMultipleRoles = company.roles.length > 1;

          return (
            <div
              key={company.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Card Top: Logo, Company Name, and Eligibility Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-12 h-12 object-contain p-1 border border-slate-200 rounded-xl bg-white shadow-2xs"
                    />
                    <div>
                      <h3 className="text-base font-bold text-[#142B4A] hover:text-[#2855A6]">
                        {company.name}
                      </h3>
                      <p className="text-xs text-[#78869A]">{company.website.replace('https://', '')}</p>
                    </div>
                  </div>

                  <StatusBadge
                    status={isEligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.NOT_ELIGIBLE}
                  />
                </div>

                {/* Roles summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{primaryRole.roleTitle}</span>
                    <span className="font-bold text-[#142B4A] text-sm">{primaryRole.packageCtc}</span>
                  </div>
                  {hasMultipleRoles && (
                    <span className="text-[10px] text-[#2855A6] font-semibold block mt-1">
                      +{company.roles.length - 1} more recruitment role(s) available
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {company.description}
                </p>

                {/* Criteria Snippet */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/60">
                  <div>
                    <span className="text-slate-400 block">Min CGPA:</span>
                    <span className="font-bold text-slate-800">{primaryRole.eligibilityCriteria.minCgpa}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Branches:</span>
                    <span className="font-bold text-slate-800">{primaryRole.eligibilityCriteria.allowedBranches.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Application Deadline:</span>
                    <span className="font-bold text-rose-700">{formatDate(company.applicationDeadline)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Work Location:</span>
                    <span className="font-bold text-slate-800 truncate block">{primaryRole.workLocation}</span>
                  </div>
                </div>

                {/* Required Skills Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {primaryRole.requiredSkills.map(s => (
                    <span
                      key={s}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigate(`/student/companies/${company.id}`)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#2855A6] hover:bg-[#EAF2FF] rounded-lg transition"
                >
                  View Full Details
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/student/eligibility?roleId=${primaryRole.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                  >
                    Check Criteria
                  </button>

                  {isApplied ? (
                    <span className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-lg">
                      Applied
                    </span>
                  ) : isEligible ? (
                    <button
                      onClick={() => navigate(`/student/companies/${company.id}`)}
                      className="px-4 py-1.5 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-lg shadow-xs transition"
                    >
                      Apply Now
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/student/eligibility?roleId=${primaryRole.id}`)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed"
                    >
                      Not Eligible
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
