import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { codingChallengeService } from '../../services/codingChallengeService';
import { TopicStat } from '../../shared/types';

export const TopicProgressPage: React.FC = () => {
  const [topics, setTopics] = useState<TopicStat[]>([]);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    const profile = await codingChallengeService.getCodingProfile();
    setTopics(profile.topicStats);
  };

  const totalTopicSolves = topics.reduce((acc, t) => acc + t.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Program Topic Progress (18 Curated Topics)</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Structured algorithmic syllabus in teaching order with Easy, Medium, and Hard coverage
          </p>
        </div>
      </div>

      {/* Info Banner on Topic Multi-Tagging (UI Spec Section D) */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#2855A6] flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Topic Counting Principle:</strong> A single problem counts under every topic it belongs to (for example, <em>Two Sum</em> counts under both <strong>Arrays</strong> and <strong>Hashing</strong>). Therefore, the sum of topic counts ({totalTopicSolves}) naturally exceeds your unique total solved problems count.
        </span>
      </div>

      {/* Topics Expandable/Detailed List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Topic Name</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Progress Bar</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Easy</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Medium</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Hard</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Total Solved</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topics.map((topic, idx) => {
                const percent = Math.min(100, Math.round((topic.total / topic.targetCount) * 100));
                const isNotStarted = topic.total === 0;

                return (
                  <tr
                    key={topic.topicName}
                    className={`hover:bg-slate-50/80 transition ${
                      topic.isStrong ? 'bg-emerald-50/20' : isNotStarted ? 'bg-slate-50/40 opacity-70' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px] w-5">
                          {idx + 1}.
                        </span>
                        <span>{topic.topicName}</span>
                        {topic.isStrong && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                            Strongest
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3.5 px-4 w-48">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent >= 80 ? 'bg-emerald-500' : percent > 0 ? 'bg-[#2855A6]' : 'bg-slate-300'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold w-8">{percent}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                      {topic.easy}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-amber-700">
                      {topic.medium}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-rose-700">
                      {topic.hard}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-[#142B4A]">
                      {topic.total} / {topic.targetCount}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isNotStarted ? (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Not Started
                        </span>
                      ) : percent >= 80 ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Proficient
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
