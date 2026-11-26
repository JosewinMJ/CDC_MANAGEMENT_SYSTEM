# PROJECT: CAREER DEVELOPMENT CENTRE (CDC) – STUDENT PORTAL
## Detailed UI Specification & Requirements

### 1. PROJECT OVERVIEW
Design a complete, modern, professional and visually impressive Student Portal for a university's Career Development Centre (CDC) Management System.
The system is designed to manage student placement activities, internship coordination, student profiles, company recruitment opportunities and communication between students, faculty guides and the Career Development Centre.
I want this interface to look like an actual premium university or institutional web application, similar in quality to professionally developed college placement portals and modern enterprise SaaS dashboards.
Do not create a basic student dashboard or a generic admin template. Create a polished, realistic, fully structured university portal with excellent UI/UX.
The primary focus is the STUDENT PORTAL. Do not design the Guide Portal or Admin Portal at this stage.

---

### 2. DESIGN DIRECTION AND VISUAL IDENTITY
Create a sophisticated and professional university-style design.
Design inspiration:
- Modern university student information systems.
- Premium college placement portals.
- Professional enterprise dashboards.
- Contemporary SaaS web applications.
- Clean institutional websites.

#### Colour Palette
- Primary: Deep Navy Blue (`#142B4A`)
- Secondary: Royal Blue (`#2855A6`)
- Background: Very Light Grey (`#F5F7FA`)
- Cards: White (`#FFFFFF`)
- Accent: Soft Sky Blue (`#EAF2FF`)
- Text: Dark Charcoal (`#263445`)
- Secondary Text: Muted Grey (`#78869A`)
- Success: Soft Green
- Warning: Soft Amber
- Error: Soft Red

#### Typography
- Inter, Poppins or a similar modern font.
- Clear heading hierarchy, readable body text, consistent font sizes and weights.

#### Overall Appearance
- Minimalist but visually rich.
- Clean white cards with subtle shadows.
- Rounded corners (8–14px).
- Consistent spacing and alignment.
- Professional icons, high-quality tables and data visualizations.
- Balanced whitespace, consistent button styles, elegant hover and active states.

---

### 3. MAIN APPLICATION LAYOUT
Desktop-first responsive web application. Recommended desktop frame: 1440 × 1000 px.

#### LEFT SIDEBAR
At the top:
- University/Institution logo placeholder
- CAREER DEVELOPMENT CENTRE - Student Portal

Navigation sections:
- **OVERVIEW**
  - Dashboard
  - Calendar *(Added)*
- **MY PROFILE**
  - Personal Information *(including Parent/Guardian card)*
  - Academic Details
  - Skills & Projects *(including Coding Profile card)*
  - Resume & Documents
  - Internship History
  - Placement History
- **PLACEMENTS**
  - Upcoming Companies
  - Company Eligibility
  - My Applications
  - Interview Schedules
- **INTERNSHIPS**
  - Internship Opportunities
  - Register Internship
  - My Internships
- **SKILL DEVELOPMENT** *(Added - Daily Coding Challenge)*
  - DSA Dashboard
  - Topic Progress
  - Solved Problems
  - Posted Questions
  - Weekly Reports
  - Register LeetCode
- **COMMUNICATION**
  - Notices & Announcements
  - Parent Alerts *(Added)*
- **Bottom:**
  - Help & Support
  - Settings
  - Logout

#### TOP NAVIGATION BAR
- Breadcrumb navigation.
- Search field.
- Notification bell with unread count.
- Help icon.
- Student profile picture/avatar, student name, registration number, dropdown menu.

---

### 4. STUDENT DASHBOARD
- **Welcome Section**: "Good Morning, Sneha!", subtitle, current academic year, department, programme, profile completion percentage.
- **Statistic Cards**: Eligible Companies (12), Active Applications (5), Upcoming Interviews (2), Internship Status (In Progress).
- **Profile Completion Section**: Circular progress ring (85%), section breakdown, "Complete My Profile" button.
- **Upcoming Recruitment Drives**: Table with logo, company, role, package/CTC, eligibility badge, deadline, "View Details".
- **Application Progress**: Horizontal timeline/stepper across applied, assessment, shortlisted, interview, selected.
- **Upcoming Events and Deadlines**: Assessments, technical interviews, deadlines, visits with dates and status.
- **Recent Notices**: Announcements from CDC and guide with priority indicator and read/unread status.
- **Quick Actions**: Upload Resume, Browse Companies, Check Eligibility, Register Internship, View Applications, Register LeetCode, View DSA Progress.
- **Added Dashboard Widgets**: Internship Track progress card (Tracks 1/2/3 status), "Not yet applied – parent will be notified" warning banner, Mini Calendar widget, compact DSA Progress card.

---

### 5. STUDENT PROFILE MANAGEMENT
- **Tab A. Personal Information**: Name, Reg No, institutional email, phone, DOB, gender, address, photo, plus Parent/Guardian card (Name, Relationship, Contact with OTP verification, Email, Channel, Consent checkbox, Edit flow).
- **Tab B. Academic Information**: Degree, Programme, Dept, Branch, Specialization, Academic Year, Graduation Year, 10th %, 12th %, Semester results table, Current CGPA, Backlogs, verification badges, and "Request Academic Correction" modal.
- **Tab C. Skills and Projects**: Technical skills, Non-technical skills, Programming languages, Tools, Project cards (title, description, tech, links), Certifications, Achievements, and Coding Profile card (LeetCode username, total solved, link).
- **Tab D. Resume and Documents**: Resume, 10th/12th/Semester marksheets, Certificates, Offer letters, Completion certificates, Reports. Statuses: Verified, Pending Verification, Rejected, Not Uploaded. Drag-and-drop upload.
- **Tab E. Internship History**: Historical and ongoing records grouped by track.
- **Tab F. Placement History**: Companies applied to, job role, applied date, recruitment stage, final outcome, offer details.

---

### 6. UPCOMING COMPANIES & DETAILS
- Company list with search, department/job type/package/eligibility filters, sorting.
- Company Cards: Logo, name, role, description, required skills, location, CTC, bond, eligibility summary, deadline, Apply / Details buttons.
- Company Details Page: Overview, job description, requirements, skills, salary details, location, bond info, eligibility requirements, recruitment stages, deadline, instructions, Apply CTA.

---

### 7. COMPANY ELIGIBILITY CHECKER
- Detailed eligibility comparison table: CGPA, 10th Marks, 12th Marks, Backlogs, Branch, Coding threshold.
- Statuses: ELIGIBLE, NOT ELIGIBLE, PENDING VERIFICATION.
- Breakdown with student value, company requirement, pass/fail status, and explanation for ineligibility.
- Informational note: "Eligibility does not guarantee shortlisting or selection."

---

### 8. PLACEMENT APPLICATIONS AND TRACKING
- My Applications table: Company, Job Role, Applied Date, Status, Next Stage, Action.
- Statuses: Applied, Assessment Scheduled, Shortlisted, Interview Scheduled, Selected, Not Selected, Waitlisted.
- Detailed modal/page recruitment timeline: submission confirmation, assessment instructions, shortlist result, interview schedule, final outcome.

---

### 9. INTERVIEW SCHEDULES
- Calendar and list views of interviews and online assessments.
- Company, role, date, time, round, venue/meeting link, instructions, status.

---

### 10. INTERNSHIP MODULE – THREE STRUCTURED TRACKS
- Track 1 (Summer Internship - After 2nd Year)
- Track 2 (Hybrid Internship - After 3rd Year) with Mode selector (Online/Offline/Hybrid)
- Track 3 (4th Year Internship - 7th Semester Odd / 8th Semester Even) with separate records, documents and statuses
- Common fields: Company name, contact, address, Role dropdown with "Other" text field, Stipend toggle (Yes/No with amount and currency), Duration, Work profile, Faculty Guide.
- Multi-step form: Company Info -> Internship Details -> Guide Details -> Documents -> Review & Submit.
- Approval workflow stepper: Student Submission -> Faculty Guide Review -> CDC Coordinator Verification -> Approved / Rejected (with remarks from each role).
- Document repository per track/semester: Verified, Pending, Rejected, Not Uploaded.
- Track Summary view and horizontal "Internship Journey" tracker.

---

### 11. PARENT / GUARDIAN ALERT SYSTEM
- Rules: Student is Eligible AND has not applied. Reminders at 3 days before, 1 day before, and deadline day. Final alert after deadline.
- Parent Alerts page: Summary cards (Alerts Sent, Scheduled Alerts, Pending Companies), Table (Company, Eligibility, Deadline, Alert Type, Sent To masked number, Channel, Sent Date/Time, Delivery Status).
- Message preview modal and OTP verification flow.
- Warning banners on dashboard, company details, eligibility pages.

---

### 12. UNIFIED CALENDAR
- Month, week, agenda views with previous/next and "Today" button.
- Color-coded event types: Application deadlines, Online assessments, Interviews, Campus visits, Internship milestones, Document deadlines, Parent alert dates, CDC events.
- Date click opens side panel with day events and action links. "Upcoming this week" list.

---

### 13. DAILY CODING CHALLENGE (LEETCODE TRACKER)
- Section "SKILL DEVELOPMENT" with:
  - DSA Dashboard: Stats, Daily solve trend chart, E/M/H donut chart, Weekly bar chart (target 10 line), Streak heatmap, Recent solves, Below target alert banner.
  - Topic Progress: 18 topics with progress bars, strongest topics, radar chart.
  - Solved Problems: Table with LeetCode links, difficulty badges, tags, date filter, pagination.
  - Posted Questions: CDC-assigned questions, solve statuses, calendar integration.
  - Weekly Reports: Sunday reset history, target met/below target badges, trend chart.
  - Register LeetCode: Form, username verification check, tracking status badges and fix guides.
