import React, { useState, useEffect } from 'react';
import {
  CheckSquare2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Filter,
  Users,
  Sparkles,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { codingChallengeService } from '../../services/codingChallengeService';
import { PostedQuestion, ProblemDifficulty } from '../../shared/types';
import { formatDate } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const PostedQuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<PostedQuestion[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SOLVED' | 'UNSOLVED'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');

  const { showToast } = useNotification();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const profile = await codingChallengeService.getCodingProfile();
    setQuestions(profile.postedQuestions);
  };

  const handleToggleSolve = async (question: PostedQuestion) => {
    const updated = await codingChallengeService.toggleSolvePostedQuestion(question.id);
    if (updated?.isSolved) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      showToast({
        type: 'success',
        title: 'Posted Question Completed!',
        message: `Marked "${question.title}" as completed.`,
      });
    } else {
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: `Marked "${question.title}" as pending.`,
      });
    }
    loadQuestions();
  };

  const solvedCount = questions.filter(q => q.isSolved).length;

  const filteredQuestions = questions.filter(q => {
    const matchesStatus =
      statusFilter === 'ALL' || (statusFilter === 'SOLVED' ? q.isSolved : !q.isSolved);
    const matchesDiff =
      difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
    return matchesStatus && matchesDiff;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">CDC / Faculty Posted Batch Questions</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Curated problem sets assigned for regular placement and coding assessment preparation
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
          <span className="text-slate-500 font-semibold">Your Progress:</span>
          <span className="font-extrabold text-[#2855A6] text-sm">
            {solvedCount} of {questions.length} Completed
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="p-2 bg-[#F5F7FA] border border-slate-200 rounded-xl font-semibold"
          >
            <option value="ALL">All Questions</option>
            <option value="SOLVED">Completed (Solved)</option>
            <option value="UNSOLVED">Pending (Not Solved)</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="p-2 bg-[#F5F7FA] border border-slate-200 rounded-xl font-semibold"
          >
            <option value="ALL">All Difficulties</option>
            <option value={ProblemDifficulty.EASY}>Easy</option>
            <option value={ProblemDifficulty.MEDIUM}>Medium</option>
            <option value={ProblemDifficulty.HARD}>Hard</option>
          </select>
        </div>

        <span className="text-slate-400 text-[11px]">
          Note: Problems count only if accepted after program start date.
        </span>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Posted Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Problem Title</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Difficulty</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Due Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Batch Acceptance</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">My Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{formatDate(q.postedDate)}</td>

                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">
                    <a
                      href={q.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#2855A6] hover:underline flex items-center gap-1.5"
                    >
                      <span>{q.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        q.difficulty === ProblemDifficulty.EASY
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.difficulty === ProblemDifficulty.MEDIUM
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-rose-700">{formatDate(q.dueDate)}</td>

                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {q.solvedByCount} / {q.totalStudents} Students
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleSolve(q)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 ${
                        q.isSolved
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-[#2855A6] text-white hover:bg-[#142B4A]'
                      }`}
                    >
                      {q.isSolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Solved ({formatDate(q.solvedAt)})</span>
                        </>
                      ) : (
                        <span>Mark as Solved</span>
                      )}
                    </button>
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
