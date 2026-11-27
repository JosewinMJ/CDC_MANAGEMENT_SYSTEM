import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Code2,
  UserCheck,
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
import {
  codingChallengeService,
  LiveCodingProfileResponse,
} from '../../services/codingChallengeService';
import { CodingTrackingStatus, ProblemDifficulty } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDateTime, formatDate } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const DailyCodingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [coding, setCoding] = useState<LiveCodingProfileResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    try {
      const profile = await codingChallengeService.getCodingProfile();
      setCoding(profile);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Unable to load coding profile',
        message: err instanceof Error ? err.message : 'Please try refreshing.',
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncLeetCode = async () => {
    if (!coding?.username) {
      navigate('/student/daily-coding/register');
      return;
    }
    setIsSyncing(true);
    try {
      const updated = await codingChallengeService.syncFromLeetCode();
      setCoding(updated);
      showToast({
        type: 'success',
        title: 'LeetCode Sync Complete',
        message: `Synced @${updated.username}: imported ${updated.syncedNewCount ?? 0} new accepted solve(s).`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'LeetCode Sync Failed',
        message: err instanceof Error ? err.message : 'Could not sync right now.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!coding) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        Loading your Daily Coding Challenge &amp; LeetCode stats...
      </div>
    );
  }

  const pieData = [
    { name: 'Easy', value: coding.easySolved || 0, color: '#10B981' },
    { name: 'Medium', value: coding.mediumSolved || 0, color: '#F59E0B' },
    { name: 'Hard', value: coding.hardSolved || 0, color: '#EF4444' },
  ];

  const weeklyData = [
    { week: 'This Week', solved: coding.solvedThisWeek },
  ];

  const isBelowTarget = coding.solvedThisWeek < coding.weeklyTarget;
  const totalNonZero = Math.max(1, coding.totalSolved);

  return (
    <div className="space-y-6">
      {/* 1. Top Strip with Live LeetCode Sync */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#142B4A]">Daily Coding Challenge (LeetCode Tracker)</span>
          <span className="text-slate-300">|</span>
          {coding.username ? (
            <a
              href={`https://leetcode.com/u/${encodeURIComponent(coding.username)}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono font-bold text-[#2855A6] hover:underline"
            >
              @{coding.username} <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={() => navigate('/student/daily-coding/register')}
              className="text-rose-600 font-bold hover:underline"
            >
              Link LeetCode Username &rarr;
            </button>
          )}
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Last Synced: {formatDateTime(coding.lastUpdated)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge
            status={coding.trackingStatus}
            label={coding.trackingStatus === CodingTrackingStatus.OK ? 'LeetCode Linked' : 'Not Linked'}
          />
          <button
            onClick={() => navigate('/student/daily-coding/register')}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{coding.username ? 'Change Handle' : 'Link LeetCode'}</span>
          </button>
          <button
            onClick={handleSyncLeetCode}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2855A6] hover:bg-[#142B4A] text-white font-bold rounded-lg transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live from LeetCode'}</span>
          </button>
        </div>
      </div>

      {/* Live LeetCode Problem of the Day + Direct Practice Access */}
      {coding.leetcodeDaily && (
        <div className="bg-gradient-to-r from-[#142B4A] to-[#2855A6] rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-200">
              <Code2 className="w-4 h-4" />
              Today&apos;s Official LeetCode Problem ({coding.leetcodeDaily.date})
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-white">
                {coding.leetcodeDaily.difficulty}
              </span>
            </div>
            <div className="text-base font-bold">{coding.leetcodeDaily.title}</div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {coding.leetcodeDaily.topics.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-blue-100">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href={coding.leetcodeDaily.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#142B4A] hover:bg-blue-50 text-xs font-bold transition"
            >
              <span>Solve on LeetCode</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://leetcode.com/problemset/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition"
            >
              <span>Browse LeetCode Problemset</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Alert banner when below weekly target */}
      {isBelowTarget && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-xs flex items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong>Weekly Target Alert:</strong> You have solved <strong>{coding.solvedThisWeek} of {coding.weeklyTarget}</strong> problems this week. {coding.weeklyTarget - coding.solvedThisWeek} more needed before Sunday midnight reset.
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
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
            CDC Tracked Solves
          </span>
          <div className="text-2xl font-black text-[#142B4A] mt-1">{coding.totalSolved}</div>
          <span className="text-[11px] text-slate-500 font-medium">
            LeetCode Total: {coding.leetcodeTotal ?? coding.totalSolved}
          </span>
        </div>

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

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
            CDC Posted Questions
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {coding.postedQuestionsDone} of {coding.postedQuestionsTotal}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Batch assignments</span>
        </div>

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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                Daily Solved Cumulative Growth
              </h3>
              <p className="text-[11px] text-[#78869A]">Progression across the last 7 days</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +{coding.solvedThisWeek} this week
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={coding.dailySolveTrend}>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
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
              <span className="text-[10px] text-slate-400">Easy ({Math.round((coding.easySolved / totalNonZero) * 100)}%)</span>
            </div>
            <div className="text-center">
              <span className="text-amber-600 font-bold block">{coding.mediumSolved}</span>
              <span className="text-[10px] text-slate-400">Medium ({Math.round((coding.mediumSolved / totalNonZero) * 100)}%)</span>
            </div>
            <div className="text-center">
              <span className="text-rose-600 font-bold block">{coding.hardSolved}</span>
              <span className="text-[10px] text-slate-400">Hard ({Math.round((coding.hardSolved / totalNonZero) * 100)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Solves & Weekly Target Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                Recent Problem Solves
              </h3>
              <p className="text-[11px] text-[#78869A]">Verified problems tracked in CDC database</p>
            </div>
            <button
              onClick={() => navigate('/student/daily-coding/solved')}
              className="text-xs font-bold text-[#2855A6] hover:underline"
            >
              All Solves ({coding.totalSolved}) &rarr;
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
              Weekly Reports &rarr;
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
