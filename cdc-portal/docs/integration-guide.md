# CDC System Integration Guide
*Architecture, Reuse Strategy & Implementation Checklist for Guide and Admin Portals*

This guide explains how to build and integrate the **Guide Portal** (Faculty Mentoring) and **Admin Portal** (CDC Placement Administration) directly into this single, unified codebase without rewriting any existing code.

---

## 1. Architectural Foundations Already in Place

The Student Portal was designed with strict domain isolation and shared contracts:
1. **Single Application, Role-Based Routing**:
   - The route hierarchy already defines `/student/*`, `/guide/*`, and `/admin/*` in [src/App.tsx](file:///c:/Users/Sneha/OneDrive/Documents/cdc-portal/src/App.tsx).
   - [AuthContext.tsx](file:///c:/Users/Sneha/OneDrive/Documents/cdc-portal/src/context/AuthContext.tsx) already supports switching active roles: `STUDENT`, `GUIDE`, `ADMIN_SUPER`, `ADMIN_PLACEMENT`, `ADMIN_INTERNSHIP`, and `ADMIN_STAFF`.
2. **Shared Domain Models**:
   - All data models in [src/shared/types/index.ts](file:///c:/Users/Sneha/OneDrive/Documents/cdc-portal/src/shared/types/index.ts) (`User`, `Student`, `Faculty`, `AcademicRecord`, `Company`, `JobRole`, `Application`, `Internship`, `Notice`, `ParentAlert`, `CodingProfile`, `AuditLogEntry`) are completely shared across all three portals.
   - Every record carries `academicYear` (e.g. `2026-2027`) to satisfy Report Section 5.9.
3. **Shared Service Layer**:
   - All services in [src/services/](file:///c:/Users/Sneha/OneDrive/Documents/cdc-portal/src/services/) (`studentService`, `internshipService`, `companyService`, `noticeService`, etc.) already expose methods for Guide and Admin roles (such as `reviewInternshipMock`, `advanceApplicationStageMock`, `verifyDocumentMock`, `publishNoticeMock`).
4. **Shared UI Component Library**:
   - The central theme tokens in [src/shared/theme.ts](file:///c:/Users/Sneha/OneDrive/Documents/cdc-portal/src/shared/theme.ts) and components in [src/components/common/](file:///c:/Users/Sneha/OneDrive/Documents/cdc-portal/src/components/common/) (`StatCard`, `DataTable`, `StatusBadge`, `ProgressRing`, `StepperTimeline`, `FileUploader`, `Modal`, `Tabs`) are ready to be used by the Guide and Admin interfaces.

---

## 2. Checklist for Building the Guide Portal (Report Section 4)

| Task | Functional Report Reference | Implementation Location | Reuse Strategy |
|---|---|---|---|
| **Guide Shell & Sidebar** | §2 & §4 | `/src/features/guide/layout/GuideShell.tsx` | Reuse `TopBar`, customize `Sidebar` navigation for Guide |
| **Guide Dashboard** | §4.1 | `/src/features/guide/dashboard/GuideDashboard.tsx` | Reuse `StatCard` (assigned students, pending reviews, active internships) |
| **Assigned Students Roster** | §4.2 & §4.3 | `/src/features/guide/students/AssignedStudentsPage.tsx` | Use `studentService.getStudentProfile()` filtered by `assignedGuideId` |
| **Student Mentoring & Confidential Notes** | §4.5 & §4.6 | `/src/features/guide/students/StudentDetailView.tsx` | Private mentoring notes with `isConfidential: true` (hidden from students) |
| **Internship Review Interface** | §4.4 | `/src/features/guide/internships/InternshipReviewPage.tsx` | Use `internshipService.reviewInternshipMock()` with guide remarks |
| **Notice Publishing for Mentees** | §4.5 | `/src/features/guide/notices/PublishGuideNoticeModal.tsx` | Use `noticeService.publishNoticeMock()` with category `GUIDE` |

---

## 3. Checklist for Building the Admin Portal (Report Section 5)

| Task | Functional Report Reference | Implementation Location | Reuse Strategy |
|---|---|---|---|
| **Admin Shell & Sidebar** | §2 & §5 | `/src/features/admin/layout/AdminShell.tsx` | Admin navigation with Super Admin, Placement & Internship tabs |
| **CDC Executive Dashboard** | §5.1 | `/src/features/admin/dashboard/AdminDashboard.tsx` | Reuse `StatCard`, Recharts analytics for placed vs unplaced |
| **Student Master Records** | §5.2 | `/src/features/admin/students/StudentMasterPage.tsx` | Full student table with academic verification actions |
| **Faculty & Guide Assignment** | §5.3 | `/src/features/admin/faculty/FacultyGuideMappingPage.tsx` | Reassign students to faculty guides with audit logging |
| **Drive & Role Management** | §5.4 | `/src/features/admin/drives/DriveManagementPage.tsx` | Add companies with multiple roles and `EligibilityCriteria` |
| **Eligibility Configuration** | §5.5 | `/src/features/admin/eligibility/CriteriaConfigPage.tsx` | Configures CGPA, backlog, and optional LeetCode thresholds |
| **Coordinator Final Internship Approval** | §5.6 | `/src/features/admin/internships/CoordinatorApprovalPage.tsx` | Coordinator verification of Guide-approved internships |
| **Institutional Notice Distribution** | §5.7 | `/src/features/admin/notices/BroadcastNoticePage.tsx` | Publish by department, year, or priority |
| **Academic Year Archival** | §5.9 | `/src/features/admin/academic-years/YearSwitchPage.tsx` | Query past records by `academicYear` without overwriting |
| **Placement Analytics & Reports** | §5.10 | `/src/features/admin/reports/PlacementReportsPage.tsx` | Highest CTC, average CTC, department placement percentages |
| **MOU & Consultancy Records** | §5.11 | `/src/features/admin/mou/MouRecordsPage.tsx` | Industry partner collaborations and agreement dates |

---

## 4. How to Plug In New Routes

In [src/App.tsx](file:///c:/Users/Sneha/OneDrive/Documents/cdc-portal/src/App.tsx), simply replace the placeholder components with the new feature page components:

```tsx
// Before (Placeholder):
<Route path="/guide/*" element={<GuidePlaceholderPage />} />
<Route path="/admin/*" element={<AdminPlaceholderPage />} />

// After (Implemented):
<Route path="/guide" element={<GuideShell />}>
  <Route index element={<GuideDashboard />} />
  <Route path="students" element={<AssignedStudentsPage />} />
  <Route path="internships" element={<InternshipReviewPage />} />
</Route>

<Route path="/admin" element={<AdminShell />}>
  <Route index element={<AdminDashboard />} />
  <Route path="students" element={<StudentMasterPage />} />
  <Route path="drives" element={<DriveManagementPage />} />
  <Route path="internships" element={<CoordinatorApprovalPage />} />
</Route>
```
No database migrations, type refactorings, or theme rewriting are required.
