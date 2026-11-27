import { apiRequest } from './apiClient';
import {
  CodingProfile,
  CodingTrackingStatus,
  PostedQuestion,
  ProblemDifficulty,
} from '../shared/types';

export const codingChallengeService = {
  async getCodingProfile(): Promise<CodingProfile> {
    return apiRequest<CodingProfile>('/coding-challenge/profile', { portal: 'student' });
  },

  async verifyLeetCodeUsername(input: string): Promise<{
    status: CodingTrackingStatus;
    easy?: number;
    medium?: number;
    hard?: number;
    total?: number;
    message: string;
  }> {
    return apiRequest('/coding-challenge/verify-username', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify({ username: input }),
    });
  },

  async registerLeetCode(username: string): Promise<CodingProfile> {
    return apiRequest<CodingProfile>('/coding-challenge/register-username', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify({ username }),
    });
  },

  async toggleSolvePostedQuestion(questionId: string): Promise<PostedQuestion | null> {
    return apiRequest<PostedQuestion>(`/coding-challenge/posted-questions/${questionId}/toggle`, {
      method: 'POST',
      portal: 'student',
    });
  },

  async logCustomSolve(payload: {
    title: string;
    leetcodeUrl?: string;
    difficulty: ProblemDifficulty;
    topics?: string[];
  }): Promise<CodingProfile> {
    return apiRequest<CodingProfile>('/coding-challenge/log-solve', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify(payload),
    });
  },

  async addMockSolve(): Promise<CodingProfile> {
    return this.logCustomSolve({
      title: '704. Binary Search',
      leetcodeUrl: 'https://leetcode.com/problems/binary-search',
      difficulty: ProblemDifficulty.EASY,
      topics: ['Arrays', 'Sorting & Searching'],
    });
  },
};
