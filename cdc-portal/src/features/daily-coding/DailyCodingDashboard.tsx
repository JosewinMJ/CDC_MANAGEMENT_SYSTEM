import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BarChart2,
  RefreshCw,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { codingChallengeService } from '../../services/codingChallengeService';
import { db, subscribeToStore } from '../../services/storage';
import { CodingProfile, ProblemDifficulty } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDateTime, formatDate } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const DailyCodingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [coding, setCoding] = useState<CodingProfile>(db.getCodingProfile());
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    const profile = await codingChallengeService.getCodingProfile();
    setCoding(profile);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore('cdc_coding_profile', loadData);
    return () => unsub();
  }, []);

  const handleSimulateSolve = async () => {
    setIsSyncing(true);
    await codingChallengeService.addMockSolve();
    await loadData();
    setIsSyncing(false);
    showToast({
      type: 'success',
      title: 'Solved Problem Recorded',
      message: 'New solve synchronized from LeetCode. Daily counts updated.',
    });
  };

  // Pie chart data
  const pieData = [
    { name: 'Easy', value: coding.easySolved, color: '#10B981' },
    { name: 'Medium', value: coding.mediumSolved, color: '#F59E0B' },
    { name: 'Hard', value: coding.hardSolved, color: '#EF4444' },
  ];

  // Weekly bar data
  const weeklyData = [
    { week: 'Wk 13', solved: 6 },
    { week: 'Wk 14', solved: 11 },
    { week: 'Wk 15', solved: 12 },
    { week: 'This Wk', solved: coding.solvedThisWeek },
  ];

  const isBelowTarget = coding.solvedThisWeek < coding.weeklyTarget;

  return (
    <div className="space-y-6">
      {/* 1. Top Strip (UI Spec Section C) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#142B4A]">Daily Coding Challenge (DSA Tracker)</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Program Start: {formatDate(coding.programStartDate)}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Last Synced: {formatDateTime(coding.lastUpdated)}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#78869A] hidden sm:block">
            Auto-syncs nightly at 11:45 PM IST
          </span>
          <StatusBadge status={coding.trackingStatus} label="Profile Tracking: OK" />
          <button
            onClick={handleSimulateSolve}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#EAF2FF] hover:bg-blue-100 text-[#2855A6] font-bold rounded-lg transition"
            title="Simulate LeetCode webhook sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Simulate Solve</span>
          </button>
        </div>
      </div>

      {/* Alert banner when below weekly target */}
      {isBelowTarget && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-xs flex items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong>Weekly Target Alert:</strong> You have solved <strong>{coding.solvedThisWeek} of {coding.weeklyTarget}</strong> problems this week. {coding.weeklyTarget - coding.solvedThisWeek} solves needed before Sunday midnight reset.
            </div>
          </div>
          <button
            onClick={() => navigate('/student/daily-coding/posted')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition shrink-0"
          >
            Solve Posted Questions
          </button>
        </div>
      )}

      {/* 2. Five Statistic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Solved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
            Total Solved
          </span>
          <div className="text-2xl font-black text-[#142B4A] mt-1">{coding.totalSolved}</div>
          <span className="text-[11px] text-slate-500 font-medium">Since program start</span>
        </div>

        {/* E / M / H Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
            Difficulty Distribution
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              E: {coding.easySolved}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              M: {coding.mediumSolved}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
              H: {coding.hardSolved}
            </span>
          </div>
        </div>

        {/* This Week vs Target 10 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
            This Week Target
          </span>
          <div className="text-xl font-bold text-[#2855A6] mt-1">
            {coding.solvedThisWeek} / {coding.weeklyTarget}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${isBelowTarget ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (coding.solvedThisWeek / coding.weeklyTarget) * 100)}%` }}
            />
          </div>
        </div>

        {/* Posted Questions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
            CDC Posted Questions
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {coding.postedQuestionsDone} of {coding.postedQuestionsTotal}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Batch assignments</span>
        </div>

        {/* Last Solved & Streak */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
            Practice Streak
          </span>
          <div className="flex items-center gap-1.5 text-orange-600 text-xl font-black mt-1">
            <Flame className="w-5 h-5 fill-orange-500" />
            <span>{coding.streakDays} Days</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Last: {coding.lastSolvedDate}</span>
        </div>
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Solve Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                Daily Solved Cumulative Growth
              </h3>
              <p className="text-[11px] text-[#78869A]">Progression across recent practice days</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +{coding.solvedThisWeek} this week
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={coding.dailySolveTrend}>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#142B4A',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Cumulative Solves"
                  stroke="#2855A6"
                  strokeWidth={3}
                  dot={{ fill: '#2855A6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Difficulty Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
              Difficulty Distribution
            </h3>
            <p className="text-[11px] text-[#78869A] mt-0.5">Ratio of Easy vs Medium vs Hard</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-xl font-black text-[#142B4A]">{coding.totalSolved}</span>
              <span className="text-[9px] text-slate-400 block uppercase font-bold">Solved</span>
            </div>
          </div>

          <div className="flex items-center justify-around text-xs pt-2 border-t border-slate-100">
            <div className="text-center">
              <span className="text-emerald-600 font-bold block">{coding.easySolved}</span>
              <span className="text-[10px] text-slate-400">Easy (50%)</span>
            </div>
            <div className="text-center">
              <span className="text-amber-600 font-bold block">{coding.mediumSolved}</span>
              <span className="text-[10px] text-slate-400">Medium (42%)</span>
            </div>
            <div className="text-center">
              <span className="text-rose-600 font-bold block">{coding.hardSolved}</span>
              <span className="text-[10px] text-slate-400">Hard (8%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Solves & Weekly Target Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Solves Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                Recent Problem Solves
              </h3>
              <p className="text-[11px] text-[#78869A]">Last 5 algorithmic problems solved on LeetCode</p>
            </div>
            <button
              onClick={() => navigate('/student/daily-coding/solved')}
              className="text-xs font-bold text-[#2855A6] hover:underline"
            >
              All Solves ({coding.totalSolved}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {coding.solvedProblems.slice(0, 5).map(problem => (
              <div
                key={problem.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate flex-1">
                  <a
                    href={problem.leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#142B4A] hover:text-[#2855A6] hover:underline flex items-center gap-1.5 truncate"
                  >
                    <span>{problem.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </a>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {problem.topics.map(t => (
                      <span key={t} className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      problem.difficulty === ProblemDifficulty.EASY
                        ? 'bg-emerald-100 text-emerald-800'
                        : problem.difficulty === ProblemDifficulty.MEDIUM
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {formatDate(problem.solvedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Solves vs Target Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                Weekly Target Consistency (Target = 10)
              </h3>
              <p className="text-[11px] text-[#78869A]">Weekly resets on Sunday midnight</p>
            </div>
            <button
              onClick={() => navigate('/student/daily-coding/weekly')}
              className="text-xs font-bold text-[#2855A6] hover:underline"
            >
              Weekly Reports →
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 15]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#142B4A',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={10} stroke="#EF4444" strokeDasharray="3 3" label="Target (10)" />
                <Bar dataKey="solved" fill="#2855A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
