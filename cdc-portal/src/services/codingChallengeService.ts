import { db } from './storage';
import {
  CodingProfile,
  CodingTrackingStatus,
  ProblemDifficulty,
  SolvedProblem,
  PostedQuestion,
  TopicStat,
  WeeklyReport,
} from '../shared/types';

export const codingChallengeService = {
  async getCodingProfile(): Promise<CodingProfile> {
    return Promise.resolve(db.getCodingProfile());
  },

  async verifyLeetCodeUsername(input: string): Promise<{
    status: CodingTrackingStatus;
    easy?: number;
    medium?: number;
    hard?: number;
    total?: number;
    message: string;
  }> {
    const cleaned = input.trim().replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?leetcode\.com\/(u\/)?/, '').replace(/\/$/, '');

    if (!cleaned) {
      return {
        status: CodingTrackingStatus.NO_USERNAME_GIVEN,
        message: 'Please provide a valid LeetCode profile handle or link.',
      };
    }

    if (cleaned.toLowerCase() === 'invalid_user_test') {
      return {
        status: CodingTrackingStatus.USERNAME_NOT_FOUND,
        message: 'LeetCode profile does not exist. Ensure your account is public and spelled correctly.',
      };
    }

    if (cleaned.toLowerCase() === 'duplicate_user_test') {
      return {
        status: CodingTrackingStatus.DUPLICATE_USERNAME,
        message: 'This LeetCode handle is already registered by another student (Reg No: 21BCE0899).',
      };
    }

    // Default valid mock verification
    return {
      status: CodingTrackingStatus.OK,
      easy: 24,
      medium: 20,
      hard: 4,
      total: 48,
      message: 'Username verified successfully – Easy 24 · Medium 20 · Hard 4',
    };
  },

  async registerLeetCode(username: string): Promise<CodingProfile> {
    const profile = db.getCodingProfile();
    const cleaned = username.trim().replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?leetcode\.com\/(u\/)?/, '').replace(/\/$/, '');

    const updatedProfile: CodingProfile = {
      ...profile,
      username: cleaned,
      trackingStatus: CodingTrackingStatus.OK,
      lastUpdated: new Date().toISOString(),
    };

    db.setCodingProfile(updatedProfile);

    // Also update student profile
    const student = db.getStudent();
    db.setStudent({
      ...student,
      leetcodeUsername: cleaned,
    });

    return Promise.resolve(updatedProfile);
  },

  async toggleSolvePostedQuestion(questionId: string): Promise<PostedQuestion | null> {
    const profile = db.getCodingProfile();
    const qIndex = profile.postedQuestions.findIndex(q => q.id === questionId);
    if (qIndex === -1) return null;

    const question = profile.postedQuestions[qIndex];
    question.isSolved = !question.isSolved;
    question.solvedAt = question.isSolved ? new Date().toISOString() : undefined;
    if (question.isSolved) {
      question.solvedByCount = (question.solvedByCount || 0) + 1;
      profile.postedQuestionsDone += 1;
      profile.totalSolved += 1;
      profile.solvedThisWeek += 1;
      if (question.difficulty === ProblemDifficulty.EASY) profile.easySolved += 1;
      else if (question.difficulty === ProblemDifficulty.MEDIUM) profile.mediumSolved += 1;
      else if (question.difficulty === ProblemDifficulty.HARD) profile.hardSolved += 1;
    } else {
      question.solvedByCount = Math.max(0, (question.solvedByCount || 1) - 1);
      profile.postedQuestionsDone = Math.max(0, profile.postedQuestionsDone - 1);
      profile.totalSolved = Math.max(0, profile.totalSolved - 1);
      profile.solvedThisWeek = Math.max(0, profile.solvedThisWeek - 1);
    }

    profile.postedQuestions[qIndex] = question;
    db.setCodingProfile(profile);

    return Promise.resolve(question);
  },

  async addMockSolve(): Promise<CodingProfile> {
    const profile = db.getCodingProfile();
    const newSolve: SolvedProblem = {
      id: `sp-${Date.now()}`,
      title: '704. Binary Search',
      leetcodeUrl: 'https://leetcode.com/problems/binary-search',
      difficulty: ProblemDifficulty.EASY,
      topics: ['Arrays', 'Sorting & Searching'],
      solvedAt: new Date().toISOString(),
    };

    profile.totalSolved += 1;
    profile.easySolved += 1;
    profile.solvedThisWeek += 1;
    profile.lastSolvedDate = new Date().toISOString().split('T')[0];
    profile.solvedProblems.unshift(newSolve);
    profile.dailySolveTrend.push({
      date: 'Today',
      count: profile.totalSolved,
    });

    db.setCodingProfile(profile);
    return Promise.resolve(profile);
  },
};
