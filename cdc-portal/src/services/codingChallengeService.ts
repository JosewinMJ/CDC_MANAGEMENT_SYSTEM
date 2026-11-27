import { apiRequest } from './apiClient';
import {
  CodingProfile,
  CodingTrackingStatus,
  PostedQuestion,
  ProblemDifficulty,
} from '../shared/types';

export interface LeetCodeDailyQuestion {
  date: string;
  title: string;
  difficulty: string;
  url: string;
  topics: string[];
}

export interface LiveCodingProfileResponse extends CodingProfile {
  leetcodeDaily?: LeetCodeDailyQuestion;
  leetcodeTotal?: number;
  syncedNewCount?: number;
}

export const codingChallengeService = {
  async getCodingProfile(): Promise<LiveCodingProfileResponse> {
    return apiRequest<LiveCodingProfileResponse>('/coding-challenge/profile', { portal: 'student' });
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

  async registerLeetCode(username: string): Promise<LiveCodingProfileResponse> {
    return apiRequest<LiveCodingProfileResponse>('/coding-challenge/register-username', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify({ username }),
    });
  },

  async syncFromLeetCode(): Promise<LiveCodingProfileResponse> {
    return apiRequest<LiveCodingProfileResponse>('/coding-challenge/sync-leetcode', {
      method: 'POST',
      portal: 'student',
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
  }): Promise<LiveCodingProfileResponse> {
    return apiRequest<LiveCodingProfileResponse>('/coding-challenge/log-solve', {
      method: 'POST',
      portal: 'student',
      body: JSON.stringify(payload),
    });
  },
};
