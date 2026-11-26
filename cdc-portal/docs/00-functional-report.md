# CAREER DEVELOPMENT CENTRE
## Management System
### Functional Overview of the Student, Guide and Admin Portals
*A centralized platform for placement management, internship coordination and faculty mentoring*

## FUNCTIONAL REQUIREMENTS REPORT

### 1. Introduction
The Career Development Centre (CDC) Management System is a proposed centralized platform for managing student placement activities, internship records, faculty mentoring and related CDC operations. It is intended to provide students, faculty mentors and placement administrators with a common place to access and manage information relevant to career development.

The system is organized into three connected portals: the Student Portal, Guide Portal and Admin Portal. Each portal has a distinct set of responsibilities and access permissions. Information maintained in one part of the system can be made available to other authorized users where it is relevant to their role.

The purpose of this report is to describe the functionality of each portal and explain how the three portals support the institution's placement and internship activities.

---

### 2. Overall Portal Structure
| Portal | Primary users | Purpose |
|---|---|---|
| **Student Portal** | Students | Maintain personal and academic profiles, view companies, check eligibility, apply for opportunities, manage internship records and receive notices. |
| **Guide Portal** | Faculty mentors | Monitor assigned students, review their profiles and documents, guide their progress, review internship submissions and communicate with students. |
| **Admin Portal** | CDC administrators and placement coordinators | Manage student and faculty records, company information, recruitment drives, eligibility criteria, internship approvals, notices and institutional records. |

All three portals are intended to operate as parts of one institutional system. Users access the portal corresponding to their assigned role. Students see their own records, guides see students assigned to them, and authorized administrators have broader CDC management access.

---

### 3. Student Portal
The Student Portal is the student's personal interface for placement preparation and internship management. It will allow each student to maintain a comprehensive profile and access relevant opportunities and instructions from the CDC and assigned faculty guide.

#### 3.1 Student Dashboard
- Profile completion percentage and details that require updating.
- Number of eligible companies and upcoming recruitment opportunities.
- Application deadlines and upcoming tests, interviews or campus visits.
- Current internship status and pending internship actions.
- Important and unread notices from the CDC and assigned guide.
- Pending document submissions, verification requests and recent application updates.

#### 3.2 Student Profile Management
Students will be able to maintain the following information in their profile:
- **Personal information**: Name, registration number, institutional email, contact details and other approved personal information.
- **Academic information**: Degree, programme, department, branch, specialization, academic year, 10th and 12th marks, semester-wise results, CGPA and backlog information.
- **Professional information**: Technical and non-technical skills, projects, certifications, achievements and relevant experience.
- **Documents**: Resume, academic records, certificates, internship offer letters and completion documents.
- **Internship history**: Organization, role, duration, work profile, guide details, status and supporting documents.
- **Placement history**: Companies applied to, recruitment stages, outcomes and offers, in accordance with college placement policies.

Students should be able to update permitted fields and upload supporting documents. The portal should identify incomplete information and documents awaiting verification. Official academic information may be marked as verified and corrected through an authorized process.

#### 3.3 Upcoming Companies and Company Details
- Browse upcoming companies and active recruitment drives.
- View company profile, job role, job description, required skills and work location.
- View CTC/package, bond period and internship or full-time opportunity details, where provided.
- View eligible branches, academic requirements and other company-specific criteria.
- View application deadlines, recruitment stages, assessment dates, interview schedules and campus-visit information.
- Read company-specific instructions and related announcements.

#### 3.4 Company Eligibility Checker
The portal will compare the student's profile with the eligibility criteria specified for each recruitment drive. Criteria may include minimum CGPA, 10th and 12th marks, active or historical backlogs, eligible branches, degree or programme type, specialization, graduation year and additional company-specific requirements.

| Status | Description |
|---|---|
| **Eligible** | The available and verified student information satisfies all mandatory criteria. |
| **Not eligible** | One or more mandatory criteria are not satisfied. The portal should explain the reason. |
| **Pending verification** | Required information is missing, incomplete or awaiting verification. |

Eligibility should be recalculated when relevant student information or company criteria change. Different job roles within the same company may have different requirements. Eligibility is an assessment against stated criteria and does not guarantee shortlisting or selection.

#### 3.5 Placement Applications and Tracking
- View available recruitment drives and submit applications where enabled.
- Receive application confirmation and view submission deadlines.
- Track application progress, including assessment, shortlist, interview, selected, not selected or waitlisted status.
- View interview schedules, assessment instructions and relevant updates.
- Maintain a history of applications and outcomes.

#### 3.6 Internship Management
- View internship opportunities published by the CDC.
- Apply for internships listed in the portal.
- Register internships independently obtained by the student.
- Enter company name, role, work profile, duration, dates and stipend where applicable.
- Submit offer letters and other required documents.
- Track faculty guide review and coordinator approval.
- Upload completion certificates, internship reports and other required evidence.
- View current and previous internship records.

#### 3.7 Notices and Important Updates
Students will receive notices from authorized CDC administrators and their assigned faculty guide. Notices may relate to placement announcements, internship opportunities, deadlines, interview schedules, document submissions, academic requirements and general CDC instructions. Students should be able to identify unread notices and refer to previously published announcements.

---

### 4. Guide Portal – Faculty Mentor
The Guide Portal is intended for faculty members who act as mentors to assigned students. Each student will have a designated faculty guide. The guide will be able to view the students under their mentorship and monitor their academic, professional and placement-related progress.

#### 4.1 Guide Dashboard
- Total number of students assigned to the guide.
- Students with complete and incomplete profiles.
- Students with pending documents or profile updates.
- Students currently undertaking internships.
- Internship requests awaiting guide review.
- Relevant placement eligibility and recruitment updates for assigned students.
- Recent student activity and important notices.

#### 4.2 Assigned Student Profiles
Guides will be able to search and view the profiles of their assigned students. The information may include personal details permitted for mentoring, academic performance, semester-wise CGPA, backlog information, resumes, certificates, skills, projects, internship details, placement eligibility and placement application history.

#### 4.3 Student Progress Monitoring
- Identify missing resumes, academic details, certificates and required documents.
- View profile completion and document verification status.
- Add remarks and request corrections or updates from students.
- Monitor internship progress and placement-related preparation.
- Identify students who may require additional guidance.

#### 4.4 Internship Review
When an assigned student submits an internship request, the guide will be able to review the company information, internship role, duration, work profile and uploaded offer letter. The guide may approve, reject or request additional information, with appropriate remarks. Requests approved by the guide will be forwarded to the CDC coordinator for final verification.

#### 4.5 Notices and Student Communication
- Send notices to all assigned students or selected students.
- Communicate deadlines, document requirements, mentoring instructions and other updates.
- View previously published notices and, where available, read status.
- Maintain mentoring remarks that are accessible only to authorized faculty and CDC administrators.

#### 4.6 Access Restrictions
A guide should normally have access only to students assigned to them. Access to other student records should require additional authorization from the CDC administration. Confidential mentoring remarks should not be visible to students or unrelated faculty members.

---

### 5. Admin Portal – CDC and Placement Administration
The Admin Portal is the central management portal for the Career Development Centre. It will provide authorized placement administrators and coordinators with the ability to manage student information, faculty assignments, companies, recruitment drives, internship approvals, notices and institutional records.

#### 5.1 Admin Dashboard
- Total registered students, faculty members and companies.
- Upcoming recruitment drives and application deadlines.
- Number of eligible students, placed students and students not yet placed.
- Active internships and requests awaiting approval.
- Incomplete student profiles and pending document verification.
- Summaries by department, academic year and recruitment cycle.

#### 5.2 Student Records Management
- View and search all student profiles.
- Filter students by registration number, department, programme and academic year.
- Review academic information, resumes, certificates, internships and placement history.
- Identify missing, incomplete or unverified information.
- Update records where authorized and retain a record of significant changes.
- Maintain and export authorized student records and lists.

#### 5.3 Faculty and Guide Management
- View and manage faculty records.
- Assign a primary faculty guide to each student.
- Reassign students when required.
- View the number and list of students assigned to each guide.
- Manage faculty access and additional permissions.

#### 5.4 Company and Recruitment Drive Management
- Add, edit and maintain company profiles and contact information.
- Create multiple job roles or recruitment drives for the same company.
- Enter job descriptions, required skills, CTC/package, location and bond details.
- Specify internship, full-time or other opportunity types.
- Configure eligibility requirements for each role or drive.
- Set application deadlines and recruitment schedules.
- Publish, update, close and archive recruitment drives.
- Record recruitment outcomes and selection information.

#### 5.5 Eligibility Criteria Management
Authorized administrators will be able to configure mandatory and optional criteria for each recruitment drive. These may include academic thresholds, backlog restrictions, branches, programme type, specialization, graduation year and other company-specific requirements. Administrators should be able to review eligibility summaries and understand the reasons for ineligible or pending-verification results.

#### 5.6 Internship Coordination and Final Approval
The Admin Portal will include a dedicated internship management section showing newly submitted requests, pending guide reviews, requests awaiting coordinator approval, approved internships, rejected requests and completed internships.
- Review student internship details and company information.
- View faculty remarks and recommendations.
- Verify offer letters and supporting documents.
- Approve, reject or request additional information.
- Record the decision, date and administrative remarks.
- Maintain official internship records and monitor completion certificates and reports.

#### 5.7 Notice Management
- Publish notices to all students, selected departments, academic years or individual students.
- Publish notices to all faculty members or selected faculty groups.
- Attach documents and instructions.
- Mark notices as important and specify publication or expiry dates.
- Maintain notice history and view read-status information where available.

#### 5.8 User Roles and Permissions
The Admin Portal should support different permission levels so that responsibilities can be assigned appropriately. Suggested roles include Super Administrator, Placement Coordinator, Internship Coordinator and authorized CDC staff. These are permission levels within the Admin Portal, not separate portals.

#### 5.9 Academic Year and Historical Records
The system should maintain records by academic year, such as 2024–2025, 2025–2026 and 2026–2027. Previous placement and internship records should remain available for authorized reference and reporting without being overwritten by current-year information.

#### 5.10 Placement Reports and Analytics
- Department-wise and academic-year-wise placement summaries.
- Company-wise recruitment and selection information.
- Number of unique students placed and total offers received.
- Highest and average CTC where reliable package information is available.
- Internship participation and completion summaries.
- Internship-to-pre-placement-offer conversions where applicable.
- Eligibility and application statistics.
- Reports suitable for institutional review and record keeping.

#### 5.11 MOU and Consultancy Records
The Admin Portal may also maintain records of institutional collaborations identified as part of CDC activities.
- MOU records: organization name, agreement date, expiry date, contact details, collaboration type, agreement document and current status.
- Consultancy records: industry partner, project details, faculty coordinator, duration, supporting documents and project status.

---

### 6. Workflows Connecting the Three Portals

#### 6.1 Placement Recruitment Workflow
1. The administrator creates a company profile and recruitment drive.
2. The administrator enters job details, eligibility criteria, deadlines and recruitment schedules.
3. The system assesses student profiles against the configured criteria.
4. Students view the opportunity and their individual eligibility result.
5. Eligible students submit applications within the permitted period.
6. The CDC updates recruitment stages and outcomes.
7. Students view their application status and final result.

#### 6.2 Internship Submission and Approval Workflow
1. The student enters internship details and uploads the offer letter and required documents.
2. The assigned faculty guide receives the submission for review.
3. The guide approves, rejects or requests additional information and records remarks.
4. Guide-approved submissions are forwarded to the CDC internship coordinator.
5. The coordinator verifies the submission and records the final decision.
6. Approved internship information is added to the student's official record.
7. After completion, the student submits the completion certificate and other required evidence.

#### 6.3 Student Profile Update Workflow
1. The student updates permitted profile information or submits a correction request.
2. The assigned guide can view the updated information.
3. Authorized CDC personnel verify information that requires official confirmation.
4. Relevant company eligibility assessments are updated when verified information changes.

#### 6.4 Notice Distribution Workflow
1. An authorized guide or administrator creates a notice.
2. The publisher selects the intended recipients and adds instructions or attachments.
3. The notice is published to the selected audience.
4. Students or faculty view the notice in their respective portals.
5. Publication, expiry and read status may be maintained for reference.

---

### 7. Access, Privacy and Record Integrity
- Students should access and update only their own permitted information.
- Guides should access students assigned to them unless additional access is authorized.
- CDC administrators should access records according to their assigned permissions.
- Official academic information should have a verification status and controlled correction process.
- Internship and placement decisions should retain the decision, responsible user, date and relevant remarks.
- Resumes, offer letters, certificates and other documents should be available only to authorized users.
- Historical placement and internship records should be protected from accidental modification.
- Important notices and administrative actions should have an identifiable publisher and publication date.

---

### 8. Expected Benefits
- **Centralized student information**: A consistent student profile accessible to authorized students, guides and CDC personnel.
- **Placement coordination**: Clear access to company information, recruitment schedules and application progress.
- **Eligibility assessment**: Reduced manual comparison of student profiles against company requirements.
- **Faculty mentoring**: Improved visibility into assigned students' academic and professional progress.
- **Internship administration**: A traceable process for student submission, guide review and coordinator approval.
- **Communication**: A common place for official notices, instructions and deadline reminders.
- **Institutional reporting**: More accessible placement and internship summaries across departments and academic years.
- **Historical records**: Improved continuity of placement, internship, MOU and consultancy information.
