# Cross-Portal Workflow Mapping
*End-to-End Operational Workflows Across Student, Guide, and Admin Portals*

This document maps the four fundamental cross-portal workflows defined in Section 6 of the Functional Requirements Report to their data statuses, responsible portal screens, and role state transitions.

---

## 1. Workflow 1: Placement Recruitment Lifecycle (Report §6.1)

```
[Admin Portal] Create Drive & Role Criteria
      │
      ▼
[System Engine] Automatic Eligibility Evaluation (ELIGIBLE / NOT_ELIGIBLE / PENDING)
      │
      ▼
[Student Portal] Explore Opportunities → View Eligibility Breakdown → Submit Application
      │
      ▼
[Admin Portal] Review Applicants → Advance Stages (Assessment → Shortlisted → Interview → Selected)
      │
      ▼
[Student Portal] Track Status on Recruitment Timeline & Interview Schedules
```

### State Transition & Portal Ownership Table:
| Stage / Status | Originating Portal & Role | Target Portal & Role | Action Screen | Next State |
|---|---|---|---|---|
| **Drive Creation** | Admin (`ROLE_ADMIN_PLACEMENT`) | System & Student | Admin: `/admin/drives/create` | Drives published with `EligibilityCriteria` |
| **Eligibility Assessment** | System (`eligibility.ts`) | Student | Student: `/student/eligibility` | `ELIGIBLE`, `NOT_ELIGIBLE`, or `PENDING_VERIFICATION` |
| **Application Submitted** | Student (`ROLE_STUDENT`) | Admin & Guide | Student: `/student/companies/:id` | `APPLIED` |
| **Assessment Scheduled** | Admin (`ROLE_ADMIN_PLACEMENT`) | Student | Admin: `/admin/applications` (or Demo Controls) | `ASSESSMENT_SCHEDULED` |
| **Candidate Shortlisted** | Admin (`ROLE_ADMIN_PLACEMENT`) | Student | Admin: `/admin/applications` (or Demo Controls) | `SHORTLISTED` |
| **Interview Scheduled** | Admin (`ROLE_ADMIN_PLACEMENT`) | Student | Admin: `/admin/interviews/schedule` | `INTERVIEW_SCHEDULED` |
| **Final Selection** | Admin (`ROLE_ADMIN_SUPER`) | Student & Guide | Admin: `/admin/applications` (or Demo Controls) | `SELECTED` (or `NOT_SELECTED`) |

---

## 2. Workflow 2: Three-Track Internship Submission & Approval (Report §6.2 & Spec §A)

```
[Student Portal] Register Track (Track 1 / 2 / 3) + Upload Offer Letter
      │  (Status: PENDING_GUIDE_REVIEW)
      ▼
[Guide Portal] Faculty Mentor Review → Remarks & Recommendation
      │  (Status: PENDING_CDC_APPROVAL if approved; REJECTED if declined)
      ▼
[Admin Portal] CDC Internship Coordinator Verification → Final Decision
      │  (Status: APPROVED)
      ▼
[Student Portal] In-Progress Milestones → Submit Completion Certificate & Final Report
      │
      ▼
[Admin Portal] Final Audit & Academic Credits Awarded (Status: COMPLETED)
```

### State Transition & Portal Ownership Table:
| Stage / Status | Originating Portal & Role | Target Portal & Role | Action Screen | Responsible Actor & Remarks |
|---|---|---|---|---|
| **Registration & Submission** | Student (`ROLE_STUDENT`) | Guide Portal | Student: `/student/internships/register` | Student submits company info, stipend, duration & offer letter |
| `PENDING_GUIDE_REVIEW` | System | Faculty Guide | Guide: `/guide/internships/review` | Awaiting mentor academic evaluation |
| `GUIDE_APPROVED` / `PENDING_CDC_APPROVAL` | Faculty Guide (`ROLE_GUIDE`) | CDC Admin Portal | Guide: `/guide/internships/review` (or Demo Controls) | Guide records remarks (e.g. syllabus alignment) |
| `APPROVED` | CDC Coordinator (`ROLE_ADMIN_INTERNSHIP`) | Student & Guide | Admin: `/admin/internships` (or Demo Controls) | CDC Coordinator verifies accreditation and signs off |
| `REJECTED` | Guide or CDC Admin | Student | Guide/Admin review modal | Mandatory rejection reason communicated in stepper |
| `IN_PROGRESS` | Student & Guide | System | Student: `/student/internships/my-internships` | Student active in internship engagement |
| `COMPLETED` | Student (`ROLE_STUDENT`) | CDC Admin Portal | Student: `/student/internships/my-internships` | Student uploads Completion Certificate & Final Report |

---

## 3. Workflow 3: Profile Verification & Academic Correction Requests (Report §6.3 & §7)

```
[Student Portal] Student Views Verified Academic Data → Requests Correction with Proof
      │  (Status: CORRECTION_PENDING)
      ▼
[Guide Portal] Faculty Guide Reviews Discrepancy & Endorses Request
      │
      ▼
[Admin Portal] CDC Placement Director Verifies Marksheet & Approves Adjustment
      │
      ▼
[System Engine] Automatic Eligibility Recalculation across all active recruitment drives
```

### State Transition & Portal Ownership Table:
| Stage / Status | Originating Portal & Role | Target Portal & Role | Action Screen | Effect on System |
|---|---|---|---|---|
| **Initial Record Verification** | CDC Admin (`ROLE_ADMIN_SUPER`) | Student Profile | Admin: `/admin/students/:id/verify` | Sets `academicRecord.verificationStatus = VERIFIED` |
| **Correction Requested** | Student (`ROLE_STUDENT`) | Admin & Guide | Student: `/student/profile/academic` | Creates ticket; sets `correctionPending = true` |
| **Correction Audit Review** | CDC Admin (`ROLE_ADMIN_SUPER`) | Student Portal | Admin: `/admin/corrections` (or Demo Controls) | Updates CGPA/marks in official record |
| **Recalculate Eligibility** | System (`eligibility.ts`) | Student & Admin | Automatic trigger via `storage.ts` reactive store | Re-evaluates student for all drives |

---

## 4. Workflow 4: Notice Distribution & Compliance Notifications (Report §6.4 & Spec §B)

```
[Admin / Guide Portal] Compose Notice with Target Audience (Branch, Year, Batch)
      │
      ▼
[System Engine] Dispatch Notice + Trigger Unread Count in TopBar & Notification Bell
      │
      ▼
[Student Portal] Notice Read by Student → Timestamp recorded in readByStudentIds
      │
   (If eligible unapplied deadline reaches 3 days / 1 day cutoff)
      ▼
[Automated Daemon] Dispatch Parent Alert to Verified WhatsApp Contact
```

### State Transition & Portal Ownership Table:
| Stage / Status | Originating Portal & Role | Target Portal & Role | Action Screen | Details & Delivery Route |
|---|---|---|---|---|
| **Notice Composition** | Admin or Faculty Guide | Student Portal | Admin/Guide: `/admin/notices/create` (or Demo Controls) | Sets category, priority (`High`/`Urgent`), attachments |
| **Notice Delivery** | System | Student Portal | TopBar Bell & `/student/notices` | Displays unread dot and flyout panel |
| **Mark as Read** | Student (`ROLE_STUDENT`) | System | Student: `/student/notices` | Appends `student.id` to `readByStudentIds` |
| **Parent Alert Trigger** | Automated Scheduler Daemon | Parent Phone | Student: `/student/parent-alerts` (or Demo Controls) | Dispatches 3-day, 1-day, or deadline-day WhatsApp notice |
