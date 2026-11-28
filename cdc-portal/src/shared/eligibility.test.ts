import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from './eligibility';
import {
  Student,
  AcademicRecord,
  CodingProfile,
  EligibilityCriteria,
  EligibilityStatus,
  DocumentVerificationStatus,
  NotificationChannel,
  CodingTrackingStatus,
} from './types';

const mockAcademicRecord: AcademicRecord = {
  degree: 'B.Tech',
  programme: 'Undergraduate',
  department: 'Computer Science and Engineering',
  branch: 'CSE',
  academicYear: '2026-2027',
  graduationYear: 2027,
  tenthPercentage: 92.4,
  twelfthPercentage: 89.6,
  currentCgpa: 8.42,
  activeBacklogs: 0,
  historicalBacklogs: 0,
  semesterResults: [
    { semesterNumber: 1, gpa: 8.2, credits: 21, backlogs: 0 },
    { semesterNumber: 2, gpa: 8.5, credits: 22, backlogs: 0 },
    { semesterNumber: 3, gpa: 8.4, credits: 24, backlogs: 0 },
    { semesterNumber: 4, gpa: 8.6, credits: 23, backlogs: 0 },
  ],
  verificationStatus: DocumentVerificationStatus.VERIFIED,
};

const mockStudent: Student = {
  id: 'stud-101',
  regNumber: '21BCE1042',
  fullName: 'User',
  email: 'user@vitstudent.ac.in',
  phone: '+91 94451 98765',
  dob: '2004-05-14',
  gender: 'Female',
  address: 'No. 42, Green Avenue, Chennai, Tamil Nadu',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  academicYear: '2026-2027',
  assignedGuideId: 'guide-201',
  assignedGuideName: 'Dr. K. Ramanathan',
  assignedGuideEmail: 'k.ramanathan@vit.ac.in',
  parentContact: {
    name: 'Rajesh R',
    relationship: 'Father',
    phone: '+91 98401 23456',
    isVerified: true,
    email: 'rajesh.r@example.com',
    preferredChannel: NotificationChannel.WHATSAPP,
    consentGiven: true,
  },
  academicRecord: mockAcademicRecord,
  skills: {
    technicalSkills: ['Data Structures', 'Algorithms', 'Web Development'],
    nonTechnicalSkills: ['Problem Solving', 'Communication'],
    programmingLanguages: ['Java', 'TypeScript', 'Python'],
    toolsAndTechnologies: ['React', 'Git', 'Tailwind CSS'],
    projects: [],
    certifications: [],
    achievements: [],
  },
  documents: [],
  leetcodeUsername: 'user_dev',
};

const mockCodingProfile: CodingProfile = {
  username: 'user_dev',
  fullName: 'User',
  regNumber: '21BCE1042',
  classSection: 'CSE-A',
  trackingStatus: CodingTrackingStatus.OK,
  programStartDate: '2026-08-01',
  lastUpdated: '2026-11-25T23:42:00Z',
  totalSolved: 48,
  easySolved: 24,
  mediumSolved: 20,
  hardSolved: 4,
  solvedThisWeek: 7,
  weeklyTarget: 10,
  postedQuestionsDone: 4,
  postedQuestionsTotal: 6,
  lastSolvedDate: '2026-11-25',
  streakDays: 12,
  dailySolveTrend: [],
  topicStats: [],
  solvedProblems: [],
  postedQuestions: [],
  weeklyReports: [],
  activityMap: [],
};

describe('evaluateEligibility', () => {
  const standardCriteria: EligibilityCriteria = {
    minCgpa: 7.5,
    minTenthMarks: 75,
    minTwelfthMarks: 75,
    maxActiveBacklogs: 0,
    maxHistoricalBacklogs: 0,
    allowedBranches: ['CSE', 'ISE', 'IT'],
    allowedDegrees: ['B.Tech'],
    allowedGraduationYears: [2027],
  };

  it('evaluates student as ELIGIBLE when all criteria are satisfied', () => {
    const result = evaluateEligibility(mockStudent, mockAcademicRecord, mockCodingProfile, standardCriteria);
    expect(result.overallStatus).toBe(EligibilityStatus.ELIGIBLE);
    expect(result.criteriaBreakdown.cgpa.passed).toBe(true);
    expect(result.criteriaBreakdown.branch.passed).toBe(true);
    expect(result.criteriaBreakdown.academicVerification.passed).toBe(true);
  });

  it('evaluates student as NOT_ELIGIBLE when CGPA is below threshold', () => {
    const highCgpaCriteria: EligibilityCriteria = {
      ...standardCriteria,
      minCgpa: 8.5, // User has 8.42
    };
    const result = evaluateEligibility(mockStudent, mockAcademicRecord, mockCodingProfile, highCgpaCriteria);
    expect(result.overallStatus).toBe(EligibilityStatus.NOT_ELIGIBLE);
    expect(result.criteriaBreakdown.cgpa.passed).toBe(false);
    expect(result.summaryReason).toContain('CGPA 8.42 is below the required 8.5');
  });

  it('evaluates student as NOT_ELIGIBLE when active backlogs exceed maximum', () => {
    const studentWithBacklogs: AcademicRecord = {
      ...mockAcademicRecord,
      activeBacklogs: 1,
    };
    const result = evaluateEligibility(mockStudent, studentWithBacklogs, mockCodingProfile, standardCriteria);
    expect(result.overallStatus).toBe(EligibilityStatus.NOT_ELIGIBLE);
    expect(result.criteriaBreakdown.activeBacklogs.passed).toBe(false);
  });

  it('evaluates student as PENDING_VERIFICATION when academic data is unverified', () => {
    const unverifiedRecord: AcademicRecord = {
      ...mockAcademicRecord,
      verificationStatus: DocumentVerificationStatus.PENDING_VERIFICATION,
    };
    const result = evaluateEligibility(mockStudent, unverifiedRecord, mockCodingProfile, standardCriteria);
    expect(result.overallStatus).toBe(EligibilityStatus.PENDING_VERIFICATION);
    expect(result.criteriaBreakdown.academicVerification.passed).toBe(false);
    expect(result.summaryReason).toContain('pending verification');
  });

  it('evaluates optional coding practice threshold correctly', () => {
    const criteriaWithCoding: EligibilityCriteria = {
      ...standardCriteria,
      minCodingProblemsSolved: 50, // User has 48
    };
    const result = evaluateEligibility(mockStudent, mockAcademicRecord, mockCodingProfile, criteriaWithCoding);
    expect(result.overallStatus).toBe(EligibilityStatus.NOT_ELIGIBLE);
    expect(result.criteriaBreakdown.codingPractice?.passed).toBe(false);
    expect(result.summaryReason).toContain('Solved 48 problems');

    // With 50 solved
    const resultPass = evaluateEligibility(
      mockStudent,
      mockAcademicRecord,
      { ...mockCodingProfile, totalSolved: 52 },
      criteriaWithCoding
    );
    expect(resultPass.overallStatus).toBe(EligibilityStatus.ELIGIBLE);
    expect(resultPass.criteriaBreakdown.codingPractice?.passed).toBe(true);
  });
});
