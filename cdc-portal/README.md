# Career Development Centre (CDC) Management System

A production-grade, centralized institutional web application for managing student placement activities, 3-track internship coordination, company recruitment drives, faculty mentoring, and algorithmic coding practice.

---

## 🌟 Highlights of the Student Portal

- **Official University Design System**: Institutional color tokens (`#142B4A` Navy, `#2855A6` Royal Blue, `#F5F7FA` Grey, `#EAF2FF` Sky), clean typography, rounded cards (8–14px), and standardized status badges.
- **Student Dashboard**: Welcome banner, 4 stat cards, 85% circular profile completion ring, recruitment table, application progress, and impending deadline warnings.
- **Unified Recruitment & Academic Calendar**: Month, week, and agenda views with category filters (Deadlines, Assessments, Interviews, Milestones, Parent Alerts).
- **Comprehensive Profile Management (6 Tabs)**:
  - *Personal Information*: Details and Parent / Guardian notification card with 6-digit OTP verification simulation.
  - *Academic Details*: Verified marks, semester performance table, and interactive "Request Academic Correction" ticket modal.
  - *Skills & Projects*: Technical tags, project cards, and LeetCode Coding Profile integration card.
  - *Resume & Documents*: File repository with drag-and-drop uploader, preview, and download.
  - *Internship History*: Past and active records categorized by Track 1, 2, and 3.
  - *Placement History*: Application outcomes and offers.
- **Explore Opportunities & Company Details**:
  - Filter by branch, job type, and eligibility.
  - Multi-role job specifications per company (e.g. Infosys Specialist Programmer vs Systems Engineer, TCS Digital vs Ninja).
- **Company Eligibility Checker**: Pure, tested engine comparing student CGPA, 10th/12th marks, backlogs, branch, graduation year, and coding practice.
- **My Applications & Timeline**: Status tracking across Applied, Assessment Scheduled, Shortlisted, Interview Scheduled, and Selected.
- **Interview & Assessment Schedules**: Technical and HR rounds, venue details, and online proctored meeting links.
- **Internships (Three Structured Tracks)**:
  - *Track 1*: Summer Internship (After 2nd Year).
  - *Track 2*: Hybrid Internship (After 3rd Year) with Online/Offline/Hybrid mode selector.
  - *Track 3*: 4th Year Internship with independent 7th Semester (Odd) and 8th Semester (Even) records.
  - 5-step registration wizard with role dropdown + custom "Other" text input, stipend toggle, and document uploads.
  - Multi-stage approval workflow stepper: Student Submission → Faculty Guide Review → CDC Coordinator Verification → Final Approval with remarks.
  - Completion submission with certificate and final report.
- **Parent / Guardian Alert System**: Automated reminder scheduling (3 days before, 1 day before, and deadline day) when a student is eligible but has not applied, with WhatsApp message previews.
- **Daily Coding Challenge (LeetCode Tracker)**:
  - DSA Dashboard with daily trend line chart, difficulty donut chart, and weekly consistency bar chart with target 10 line.
  - 18 curated curriculum topics with progress bars.
  - Solved problems archive with search and filters.
  - CDC / Faculty batch-assigned posted questions with solve toggles.
  - Sunday reset weekly reports.
  - Register LeetCode onboarding with username verification check.
- **Interactive Dev-Only Demo Controls Drawer**: Collapsible floating simulator allowing real-time testing of Guide approvals, CDC Coordinator verifications, advancing application stages, document checks, and broadcasting notices.
- **Extensible Architecture**: Role-based routing structure (`/student/*`, `/guide/*`, `/admin/*`) with placeholder pages and shared domain models ready for future Guide and Admin portal implementation.

---

## 🚀 Quick Setup & Running Locally

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation Steps

```powershell
# 1. Navigate to the project directory
cd cdc-portal

# 2. Install dependencies (if not already installed)
npm install

# 3. Run automated tests (Eligibility engine)
npm test

# 4. Build production bundle to verify types
npm run build

# 5. Launch development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Testing the Cross-Portal Demo Controls

A floating **"Demo Controls"** button is pinned at the bottom-left of the screen. Open it to simulate actions from the Guide and Admin portals:
1. **Approve an Internship**: Select an internship, choose *Guide (Dr. Ramanathan) → APPROVE* with custom remarks, and see the approval stepper update immediately.
2. **Advance an Application**: Select Accenture or Deloitte, choose *INTERVIEW SCHEDULED* or *SELECTED*, and view the timeline update under My Applications.
3. **Verify a Document**: Mark a marksheet or resume as *VERIFIED* or *REJECTED*.
4. **Broadcast a Notice**: Publish an urgent announcement from CDC or Faculty Mentor and observe the TopBar notification bell update with an unread badge.
5. **Dispatch Parent Alert**: Force-send a scheduled WhatsApp reminder.

---

## 📚 Deliverable Documentation

- [Functional Requirements Report](docs/00-functional-report.md)
- [Student Portal UI Specification](docs/01-student-portal-ui-spec.md)
- [API Contract Specification](docs/api-contract.md)
- [Cross-Portal Workflow Map](docs/workflow-map.md)
- [Guide & Admin Integration Guide](docs/integration-guide.md)
