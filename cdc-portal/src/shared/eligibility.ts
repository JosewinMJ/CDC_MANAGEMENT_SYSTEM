// Pure eligibility engine for Career Development Centre (CDC)
import {
  Student,
  AcademicRecord,
  CodingProfile,
  EligibilityCriteria,
  EligibilityResult,
  EligibilityStatus,
  DocumentVerificationStatus,
} from './types';

/**
 * Pure function to evaluate a student's eligibility for a company job role.
 * Considers verified academic details, backlogs, branch, graduation year, and optional coding threshold.
 * Returns overall status (ELIGIBLE, NOT_ELIGIBLE, PENDING_VERIFICATION) and detailed criteria breakdown.
 */
export function evaluateEligibility(
  student: Student,
  academicRecord: AcademicRecord,
  codingProfile: CodingProfile | null,
  criteria: EligibilityCriteria
): EligibilityResult {
  const breakdown: EligibilityResult['criteriaBreakdown'] = {
    cgpa: {
      studentValue: academicRecord.currentCgpa,
      requiredValue: `${criteria.minCgpa} minimum`,
      passed: academicRecord.currentCgpa >= criteria.minCgpa,
      reason: academicRecord.currentCgpa < criteria.minCgpa
        ? `CGPA ${academicRecord.currentCgpa} is below the required ${criteria.minCgpa}`
        : undefined,
    },
    tenthMarks: {
      studentValue: `${academicRecord.tenthPercentage}%`,
      requiredValue: `${criteria.minTenthMarks}% minimum`,
      passed: academicRecord.tenthPercentage >= criteria.minTenthMarks,
      reason: academicRecord.tenthPercentage < criteria.minTenthMarks
        ? `10th marks ${academicRecord.tenthPercentage}% is below the required ${criteria.minTenthMarks}%`
        : undefined,
    },
    twelfthMarks: {
      studentValue: `${academicRecord.twelfthPercentage}%`,
      requiredValue: `${criteria.minTwelfthMarks}% minimum`,
      passed: academicRecord.twelfthPercentage >= criteria.minTwelfthMarks,
      reason: academicRecord.twelfthPercentage < criteria.minTwelfthMarks
        ? `12th marks ${academicRecord.twelfthPercentage}% is below the required ${criteria.minTwelfthMarks}%`
        : undefined,
    },
    activeBacklogs: {
      studentValue: academicRecord.activeBacklogs,
      requiredValue: criteria.maxActiveBacklogs === 0 ? 'No active backlogs' : `Max ${criteria.maxActiveBacklogs} backlogs`,
      passed: academicRecord.activeBacklogs <= criteria.maxActiveBacklogs,
      reason: academicRecord.activeBacklogs > criteria.maxActiveBacklogs
        ? `Active backlogs (${academicRecord.activeBacklogs}) exceeds limit of ${criteria.maxActiveBacklogs}`
        : undefined,
    },
    historicalBacklogs: {
      studentValue: academicRecord.historicalBacklogs,
      requiredValue: criteria.maxHistoricalBacklogs === 0 ? 'No history of backlogs' : `Max ${criteria.maxHistoricalBacklogs} historical`,
      passed: academicRecord.historicalBacklogs <= criteria.maxHistoricalBacklogs,
      reason: academicRecord.historicalBacklogs > criteria.maxHistoricalBacklogs
        ? `Historical backlogs (${academicRecord.historicalBacklogs}) exceeds limit of ${criteria.maxHistoricalBacklogs}`
        : undefined,
    },
    branch: {
      studentValue: academicRecord.branch,
      requiredValue: criteria.allowedBranches.join(', '),
      passed: criteria.allowedBranches.includes(academicRecord.branch),
      reason: !criteria.allowedBranches.includes(academicRecord.branch)
        ? `Branch '${academicRecord.branch}' is not in allowed branches: ${criteria.allowedBranches.join(', ')}`
        : undefined,
    },
    graduationYear: {
      studentValue: academicRecord.graduationYear,
      requiredValue: criteria.allowedGraduationYears.join(', '),
      passed: criteria.allowedGraduationYears.includes(academicRecord.graduationYear),
      reason: !criteria.allowedGraduationYears.includes(academicRecord.graduationYear)
        ? `Graduation year ${academicRecord.graduationYear} not eligible`
        : undefined,
    },
    academicVerification: {
      studentValue: academicRecord.verificationStatus,
      requiredValue: 'VERIFIED',
      passed: academicRecord.verificationStatus === DocumentVerificationStatus.VERIFIED,
      reason: academicRecord.verificationStatus !== DocumentVerificationStatus.VERIFIED
        ? 'Official academic records are not yet verified by CDC administration'
        : undefined,
    },
  };

  // Optional coding practice criterion
  if (criteria.minCodingProblemsSolved !== undefined) {
    const solved = codingProfile?.totalSolved ?? 0;
    const passed = solved >= criteria.minCodingProblemsSolved;
    breakdown.codingPractice = {
      studentValue: `${solved} solved`,
      requiredValue: `${criteria.minCodingProblemsSolved} problems minimum`,
      passed,
      reason: !passed
        ? `Solved ${solved} problems, below the required ${criteria.minCodingProblemsSolved} problems`
        : undefined,
    };
  }

  // Determine overall status
  // 1. If academic verification is pending or rejected, whole eligibility is PENDING_VERIFICATION
  if (academicRecord.verificationStatus !== DocumentVerificationStatus.VERIFIED) {
    return {
      overallStatus: EligibilityStatus.PENDING_VERIFICATION,
      criteriaBreakdown: breakdown,
      summaryReason: 'Academic details are pending verification by the CDC. Please contact administration if correction is required.',
    };
  }

  // 2. Check if any criterion failed
  const failedCriteria = Object.entries(breakdown)
    .filter(([key, check]) => key !== 'academicVerification' && !check?.passed);

  if (failedCriteria.length > 0) {
    const reasons = failedCriteria
      .map(([_, check]) => check?.reason)
      .filter(Boolean)
      .join('; ');
    return {
      overallStatus: EligibilityStatus.NOT_ELIGIBLE,
      criteriaBreakdown: breakdown,
      summaryReason: reasons,
    };
  }

  return {
    overallStatus: EligibilityStatus.ELIGIBLE,
    criteriaBreakdown: breakdown,
  };
}
