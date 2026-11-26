# CDC Management System – API Contract Specification
*Centralized Career Development Centre API Documentation*

This document defines the REST API contract for all service operations in the Career Development Centre (CDC) System. When swapping out the current reactive localStorage mock client for a live backend (Node.js, Spring Boot, or Django), each frontend service method maps 1-to-1 to these endpoints.

---

## 1. Authentication & Role Permissions Summary

| Role Code | Description | Permitted Endpoints |
|---|---|---|
| `ROLE_STUDENT` | Candidate student | View own profile, submit applications, submit internship records, view notices, view coding stats |
| `ROLE_GUIDE` | Faculty mentor | View assigned students, approve/reject assigned student internships with remarks, publish mentor notices |
| `ROLE_ADMIN_SUPER` | CDC Placement Director | Broad access, verify official academic records, manage multi-year configurations |
| `ROLE_ADMIN_PLACEMENT` | Placement Coordinator | Manage drives, update recruitment stages, schedule interviews, dispatch parent alerts |
| `ROLE_ADMIN_INTERNSHIP` | Internship Coordinator | Final verification of internships, verify completion certificates and credit awards |

---

## 2. Service Endpoints Specification

### 2.1 Student & Profile Service (`studentService`, `profileService`)

#### `GET /api/v1/students/me`
- **Description**: Fetch current authenticated student's full profile.
- **Allowed Roles**: `ROLE_STUDENT`
- **Request**: None (Bearer token in header)
- **Response**:
```json
{
  "id": "stud-21bce1042",
  "regNumber": "21BCE1042",
  "fullName": "Sneha R",
  "email": "sneha.r2023@vitstudent.ac.in",
  "phone": "+91 94451 98765",
  "dob": "2004-05-14",
  "gender": "Female",
  "address": "No. 42, Green Avenue, Chennai, Tamil Nadu",
  "academicYear": "2026-2027",
  "assignedGuideId": "guide-201",
  "assignedGuideName": "Dr. K. Ramanathan",
  "academicRecord": { ... },
  "skills": { ... }
}
```

#### `PATCH /api/v1/students/me/personal`
- **Description**: Update permitted personal contact fields.
- **Allowed Roles**: `ROLE_STUDENT`
- **Request**:
```json
{
  "phone": "+91 94451 98765",
  "address": "No. 42, Green Avenue, Chennai, Tamil Nadu"
}
```
- **Response**: Updated `Student` object.

#### `POST /api/v1/students/me/academic-correction`
- **Description**: File an academic correction ticket (Report §3.2 & §7).
- **Allowed Roles**: `ROLE_STUDENT`
- **Request**:
```json
{
  "field": "currentCgpa",
  "currentValue": "8.42",
  "requestedValue": "8.55",
  "reason": "Revaluation result updated in October 2026",
  "supportingDocName": "Revaluation_GradeSheet.pdf"
}
```
- **Response**: `AcademicCorrectionRequest` with status `PENDING` and ticket ID.

---

### 2.2 Documents Service (`documentService`)

#### `GET /api/v1/students/me/documents`
- **Description**: List all student repository documents with verification statuses.
- **Allowed Roles**: `ROLE_STUDENT`, `ROLE_GUIDE`, `ROLE_ADMIN_*`

#### `POST /api/v1/students/me/documents`
- **Description**: Upload a document to student repository.
- **Allowed Roles**: `ROLE_STUDENT`
- **Request**: `multipart/form-data` (file, category: 'Resume' | '10th Marksheet' | etc.)
- **Response**: `Document` object with `verificationStatus: "PENDING_VERIFICATION"`.

#### `PATCH /api/v1/documents/:id/verification`
- **Description**: Verify or reject student document with remarks.
- **Allowed Roles**: `ROLE_GUIDE`, `ROLE_ADMIN_*`
- **Request**:
```json
{
  "status": "VERIFIED", // or "REJECTED"
  "remarks": "Verified against institutional mark sheets"
}
```

---

### 2.3 Company & Eligibility Service (`companyService`, `eligibilityService`)

#### `GET /api/v1/companies`
- **Description**: Retrieve active recruitment drives and multiple job roles.
- **Allowed Roles**: `ROLE_STUDENT`, `ROLE_GUIDE`, `ROLE_ADMIN_*`
- **Query Params**: `?academicYear=2026-2027&search=...`

#### `GET /api/v1/companies/:id`
- **Description**: Get full details of a specific company, including all roles and recruitment schedules.

#### `POST /api/v1/eligibility/evaluate`
- **Description**: Pure server-side evaluation comparing candidate against role criteria.
- **Allowed Roles**: `ROLE_STUDENT`, `ROLE_ADMIN_*`
- **Request**:
```json
{
  "roleId": "role-infy-sp"
}
```
- **Response**:
```json
{
  "overallStatus": "ELIGIBLE",
  "criteriaBreakdown": {
    "cgpa": { "studentValue": 8.42, "requiredValue": "8.0 minimum", "passed": true },
    "tenthMarks": { "studentValue": "92.4%", "requiredValue": "75% minimum", "passed": true },
    "twelfthMarks": { "studentValue": "89.6%", "requiredValue": "75% minimum", "passed": true },
    "activeBacklogs": { "studentValue": 0, "requiredValue": "No active backlogs", "passed": true },
    "branch": { "studentValue": "CSE", "requiredValue": "CSE, ISE, IT", "passed": true },
    "codingPractice": { "studentValue": "48 solved", "requiredValue": "50 problems minimum", "passed": false },
    "academicVerification": { "studentValue": "VERIFIED", "passed": true }
  }
}
```

---

### 2.4 Placement Applications Service (`applicationService`)

#### `GET /api/v1/applications/my-applications`
- **Description**: Fetch logged-in student's applications with recruitment timelines.
- **Allowed Roles**: `ROLE_STUDENT`

#### `POST /api/v1/applications`
- **Description**: Submit application for an eligible job role.
- **Allowed Roles**: `ROLE_STUDENT`
- **Request**:
```json
{
  "companyId": "comp-infosys",
  "roleId": "role-infy-sp"
}
```

#### `PATCH /api/v1/applications/:id/stage`
- **Description**: Advance candidate application to next recruitment stage (Report §6.1).
- **Allowed Roles**: `ROLE_ADMIN_PLACEMENT`, `ROLE_ADMIN_SUPER`
- **Request**:
```json
{
  "status": "SHORTLISTED",
  "remarks": "Cleared technical test with 95th percentile"
}
```

---

### 2.5 Internship Service (`internshipService`)

#### `GET /api/v1/internships/my-internships`
- **Description**: Fetch 3-track internship records, documents, and approval steps.
- **Allowed Roles**: `ROLE_STUDENT`

#### `POST /api/v1/internships/register`
- **Description**: Multi-step registration for Track 1, 2, or 3 (Report §6.2).
- **Allowed Roles**: `ROLE_STUDENT`
- **Request**:
```json
{
  "track": "TRACK_2_HYBRID",
  "semester": null,
  "companyName": "Cognizant Technology Solutions",
  "companyContactNumber": "+91 44 4209 6000",
  "companyAddress": "DLF IT Park, Chennai",
  "jobRole": "Software Engineer Intern",
  "isStipend": true,
  "stipendAmount": 15000,
  "stipendCurrency": "₹",
  "mode": "Hybrid",
  "startDate": "2026-12-15",
  "endDate": "2027-03-15",
  "durationWeeks": 12,
  "workProfile": "Microservices and cloud integration...",
  "facultyGuideId": "guide-201",
  "offerLetterDocName": "Cognizant_Offer.pdf"
}
```

#### `POST /api/v1/internships/:id/review`
- **Description**: Guide or Coordinator reviews submission with remarks.
- **Allowed Roles**: `ROLE_GUIDE`, `ROLE_ADMIN_INTERNSHIP`
- **Request**:
```json
{
  "role": "GUIDE",
  "decision": "APPROVED",
  "remarks": "Syllabus criteria met. Recommended for approval."
}
```

#### `POST /api/v1/internships/:id/completion`
- **Description**: Submit final certificate and report for credit approval.
- **Allowed Roles**: `ROLE_STUDENT`

---

### 2.6 Daily Coding Challenge Service (`codingChallengeService`)

#### `GET /api/v1/coding-challenge/profile`
- **Description**: Get coding statistics, 18-topic breakdown, solved history, and weekly status.
- **Allowed Roles**: `ROLE_STUDENT`, `ROLE_GUIDE`, `ROLE_ADMIN_*`

#### `POST /api/v1/coding-challenge/verify-username`
- **Description**: Simulate check on LeetCode public API for username existence.
- **Allowed Roles**: `ROLE_STUDENT`
- **Request**: `{ "username": "sneha_dev" }`

#### `POST /api/v1/coding-challenge/posted-questions/:id/toggle`
- **Description**: Mark a batch question as solved or pending.
- **Allowed Roles**: `ROLE_STUDENT`

---

### 2.7 Parent Alert Service (`parentAlertService`)

#### `GET /api/v1/parent-alerts`
- **Description**: Fetch parent alert log and scheduled reminders.
- **Allowed Roles**: `ROLE_STUDENT`, `ROLE_ADMIN_*`

#### `POST /api/v1/parent-alerts/verify-otp`
- **Description**: Authenticate parent contact phone with 6-digit OTP code.
- **Allowed Roles**: `ROLE_STUDENT`
- **Request**: `{ "otp": "123456" }`
