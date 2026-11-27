import React, { useState, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { codingChallengeService } from '../../services/codingChallengeService';
import { SolvedProblem, ProblemDifficulty } from '../../shared/types';
import { formatDateTime } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const SolvedProblemsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [problems, setProblems] = useState<SolvedProblem[]>([]);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');

  const [showLogForm, setShowLogForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customDiff, setCustomDiff] = useState<ProblemDifficulty>(ProblemDifficulty.MEDIUM);
  const [customTopic, setCustomTopic] = useState('Arrays');

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    const profile = await codingChallengeService.getCodingProfile();
    setProblems(profile.solvedProblems);
  };

  const handleLogCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await codingChallengeService.logCustomSolve({
        title: customTitle.trim(),
        leetcodeUrl: customUrl.trim() || undefined,
        difficulty: customDiff,
        topics: [customTopic],
      });
      setCustomTitle('');
      setCustomUrl('');
      setShowLogForm(false);
      await loadProblems();
      showToast({
        type: 'success',
        title: 'Problem Logged',
        message: 'Added to your CDC Daily Coding record.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Unable to Log Problem',
        message: err instanceof Error ? err.message : 'Please check inputs.',
      });
    }
  };

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = difficultyFilter === 'ALL' || p.difficulty === difficultyFilter;
    const matchesTopic = topicFilter === 'ALL' || p.topics.includes(topicFilter);
    return matchesSearch && matchesDiff && matchesTopic;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Solved Problems History</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Verified acceptance record synchronized from LeetCode &amp; CDC Batch Challenges
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://leetcode.com/problemset/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#142B4A] hover:bg-slate-50"
          >
            <span>Open LeetCode</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setShowLogForm(v => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2855A6] text-white text-xs font-bold hover:bg-[#142B4A]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log LeetCode Solve</span>
          </button>
        </div>
      </div>

      {showLogForm && (
        <form onSubmit={handleLogCustom} className="bg-white rounded-2xl border border-[#2855A6]/30 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs shadow-xs">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-600 mb-1">Problem Title *</label>
            <input required placeholder="e.g. 53. Maximum Subarray" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">LeetCode Link</label>
            <input type="url" placeholder="https://leetcode.com/problems/..." value={customUrl} onChange={e => setCustomUrl(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Difficulty</label>
              <select value={customDiff} onChange={e => setCustomDiff(e.target.value as ProblemDifficulty)} className="w-full px-2 py-2 rounded-lg border border-slate-300 bg-white">
                <option value={ProblemDifficulty.EASY}>Easy</option>
                <option value={ProblemDifficulty.MEDIUM}>Medium</option>
                <option value={ProblemDifficulty.HARD}>Hard</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Topic</label>
              <select value={customTopic} onChange={e => setCustomTopic(e.target.value)} className="w-full px-2 py-2 rounded-lg border border-slate-300 bg-white">
                <option value="Arrays">Arrays</option>
                <option value="Strings">Strings</option>
                <option value="Hashing">Hashing</option>
                <option value="Two Pointers">Two Pointers</option>
                <option value="Stacks & Queues">Stacks &amp; Queues</option>
                <option value="Trees & BST">Trees &amp; BST</option>
                <option value="Graphs">Graphs</option>
                <option value="Dynamic Programming">Dynamic Programming</option>
              </select>
            </div>
          </div>
          <button type="submit" className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Save Solve</button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search problems by name or problem number..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F5F7FA] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="p-2 text-xs bg-[#F5F7FA] border border-slate-200 rounded-xl text-slate-700 font-semibold"
          >
            <option value="ALL">All Difficulties</option>
            <option value={ProblemDifficulty.EASY}>Easy</option>
            <option value={ProblemDifficulty.MEDIUM}>Medium</option>
            <option value={ProblemDifficulty.HARD}>Hard</option>
          </select>

          <select
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
            className="p-2 text-xs bg-[#F5F7FA] border border-slate-200 rounded-xl text-slate-700 font-semibold"
          >
            <option value="ALL">All Topics</option>
            <option value="Arrays">Arrays</option>
            <option value="Strings">Strings</option>
            <option value="Hashing">Hashing</option>
            <option value="Two Pointers">Two Pointers</option>
            <option value="Sorting & Searching">Sorting &amp; Searching</option>
            <option value="Dynamic Programming">Dynamic Programming</option>
            <option value="Stacks & Queues">Stacks &amp; Queues</option>
            <option value="Trees & BST">Trees &amp; BST</option>
            <option value="Graphs">Graphs</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Problem Title</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Difficulty</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Program Topics</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Solved Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProblems.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">
                    <a
                      href={p.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#2855A6] hover:underline flex items-center gap-1.5"
                    >
                      <span>{p.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        p.difficulty === ProblemDifficulty.EASY
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.difficulty === ProblemDifficulty.MEDIUM
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {p.topics.map(t => (
                        <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                    {formatDateTime(p.solvedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
