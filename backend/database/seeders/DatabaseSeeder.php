<?php

namespace Database\Seeders;

use App\Models\AcademicCorrection;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\CodingQuestion;
use App\Models\Company;
use App\Models\FacultyProfile;
use App\Models\Internship;
use App\Models\JobRole;
use App\Models\Notice;
use App\Models\StudentCodingSolve;
use App\Models\StudentDocument;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminPass = Hash::make('Admin@1234');
        $portalPass = Hash::make('Portal@1234');

        // 1. Admins
        $adminSuper = User::create([
            'name' => 'Dr. S. Varma (CDC Director)',
            'email' => 'cdc.admin@vit.ac.in',
            'password' => $adminPass,
            'role' => 'ADMIN_SUPER',
            'phone' => '+91 98765 00001',
            'department' => 'Career Development Centre',
            'is_active' => true,
        ]);

        // 2. Faculty / Guides
        $guide1 = User::create([
            'name' => 'Dr. K. Ramanathan',
            'email' => 'k.ramanathan@vit.ac.in',
            'password' => $portalPass,
            'role' => 'GUIDE',
            'phone' => '+91 98765 11001',
            'department' => 'CSE',
            'is_active' => true,
        ]);
        FacultyProfile::create([
            'user_id' => $guide1->id,
            'employee_id' => 'FAC-201',
            'designation' => 'Professor & Senior Faculty Guide',
            'coordinator_role' => 'faculty_guide',
            'assigned_batches' => '2026,2027',
            'can_manage_drives' => false,
            'can_verify_students' => true,
            'portal_active' => true,
        ]);

        $guide2 = User::create([
            'name' => 'Prof. Kavita Nair',
            'email' => 'kavita.nair@cdc.edu',
            'password' => $portalPass,
            'role' => 'GUIDE',
            'phone' => '+91 98765 11002',
            'department' => 'IT',
            'is_active' => true,
        ]);
        FacultyProfile::create([
            'user_id' => $guide2->id,
            'employee_id' => 'FAC-101',
            'designation' => 'Associate Professor',
            'coordinator_role' => 'dept_coordinator',
            'assigned_batches' => '2027',
            'can_manage_drives' => true,
            'can_verify_students' => true,
            'portal_active' => true,
        ]);

        // 3. Students (starting with Sneha R from Student Portal)
        $snehaUser = User::create([
            'name' => 'Sneha R',
            'email' => 'sneha.r2023@vitstudent.ac.in',
            'password' => $portalPass,
            'role' => 'STUDENT',
            'phone' => '+91 94451 98765',
            'department' => 'CSE',
            'avatar_url' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            'is_active' => true,
        ]);
        $snehaProfile = StudentProfile::create([
            'user_id' => $snehaUser->id,
            'reg_number' => '21BCE1042',
            'dob' => '2004-05-14',
            'gender' => 'Female',
            'address' => 'No. 42, Green Avenue, Chennai, Tamil Nadu',
            'academic_year' => '2026-2027',
            'assigned_guide_id' => $guide1->id,
            'degree' => 'B.Tech',
            'programme' => 'B.Tech Computer Science and Engineering',
            'branch' => 'CSE',
            'graduation_year' => 2027,
            'semester' => 7,
            'tenth_percentage' => 92.40,
            'twelfth_percentage' => 89.60,
            'current_cgpa' => 8.42,
            'active_backlogs' => 0,
            'historical_backlogs' => 0,
            'semester_results' => [
                ['semesterNumber' => 1, 'gpa' => 8.20, 'credits' => 22, 'backlogs' => 0],
                ['semesterNumber' => 2, 'gpa' => 8.35, 'credits' => 24, 'backlogs' => 0],
                ['semesterNumber' => 3, 'gpa' => 8.50, 'credits' => 24, 'backlogs' => 0],
                ['semesterNumber' => 4, 'gpa' => 8.61, 'credits' => 23, 'backlogs' => 0],
                ['semesterNumber' => 5, 'gpa' => 8.44, 'credits' => 24, 'backlogs' => 0],
            ],
            'verification_status' => 'VERIFIED',
            'verified_by' => 'Dr. S. Varma (Admin)',
            'verified_at' => now()->subDays(10),
            'placement_status' => 'shortlisted',
            'skills' => [
                'technicalSkills' => ['React', 'TypeScript', 'Laravel', 'MySQL', 'Docker'],
                'nonTechnicalSkills' => ['Technical Communication', 'Team Leadership'],
                'programmingLanguages' => ['TypeScript', 'Java', 'Python', 'PHP'],
                'toolsAndTechnologies' => ['Git', 'Vite', 'Postman', 'Linux'],
                'projects' => [],
                'certifications' => [],
                'achievements' => ['Smart India Hackathon Finalist 2025'],
            ],
            'parent_contact' => [
                'name' => 'Raghavan S',
                'relationship' => 'Father',
                'phone' => '+91 98400 12345',
                'isVerified' => true,
                'preferredChannel' => 'WhatsApp',
                'consentGiven' => true,
            ],
            'leetcode_username' => 'sneha_dev',
            'coding_stats' => [
                'totalSolved' => 148,
                'easySolved' => 74,
                'mediumSolved' => 58,
                'hardSolved' => 16,
                'trackingStatus' => 'OK',
            ],
        ]);

        $aaravUser = User::create([
            'name' => 'Aarav Kulkarni',
            'email' => 'aarav.k@vitstudent.ac.in',
            'password' => $portalPass,
            'role' => 'STUDENT',
            'phone' => '+91 98200 11001',
            'department' => 'CSE',
            'is_active' => true,
        ]);
        $aaravProfile = StudentProfile::create([
            'user_id' => $aaravUser->id,
            'reg_number' => '21BCE1088',
            'academic_year' => '2026-2027',
            'assigned_guide_id' => $guide1->id,
            'degree' => 'B.Tech',
            'programme' => 'B.Tech Computer Science and Engineering',
            'branch' => 'CSE',
            'graduation_year' => 2027,
            'semester' => 7,
            'tenth_percentage' => 94.00,
            'twelfth_percentage' => 91.50,
            'current_cgpa' => 9.15,
            'active_backlogs' => 0,
            'verification_status' => 'VERIFIED',
            'verified_by' => 'Dr. S. Varma (Admin)',
            'verified_at' => now()->subDays(12),
            'placement_status' => 'placed',
            'placed_company' => 'Google Cloud India',
            'package_lpa' => 24.50,
            'leetcode_username' => 'aarav_cp',
            'coding_stats' => ['totalSolved' => 310, 'easySolved' => 110, 'mediumSolved' => 155, 'hardSolved' => 45, 'trackingStatus' => 'OK'],
        ]);

        $rohanUser = User::create([
            'name' => 'Rohan Verma',
            'email' => 'rohan.v@vitstudent.ac.in',
            'password' => $portalPass,
            'role' => 'STUDENT',
            'phone' => '+91 98200 11003',
            'department' => 'IT',
            'is_active' => true,
        ]);
        StudentProfile::create([
            'user_id' => $rohanUser->id,
            'reg_number' => '21BIT0045',
            'academic_year' => '2026-2027',
            'assigned_guide_id' => $guide2->id,
            'degree' => 'B.Tech',
            'programme' => 'B.Tech Information Technology',
            'branch' => 'IT',
            'graduation_year' => 2027,
            'semester' => 7,
            'tenth_percentage' => 86.00,
            'twelfth_percentage' => 84.50,
            'current_cgpa' => 8.10,
            'active_backlogs' => 0,
            'verification_status' => 'PENDING_VERIFICATION',
            'placement_status' => 'unplaced',
            'leetcode_username' => 'rohan_it',
            'coding_stats' => ['totalSolved' => 92, 'easySolved' => 50, 'mediumSolved' => 38, 'hardSolved' => 4, 'trackingStatus' => 'OK'],
        ]);

        // 4. Student Documents & Academic Correction Ticket
        StudentDocument::create([
            'student_profile_id' => $snehaProfile->id,
            'name' => 'Sneha_R_Resume_2026.pdf',
            'category' => 'Resume',
            'file_url' => '/uploads/Sneha_R_Resume_2026.pdf',
            'file_size' => '640 KB',
            'verification_status' => 'VERIFIED',
            'verified_by' => 'Dr. K. Ramanathan',
            'verified_date' => now()->subDays(5),
        ]);

        AcademicCorrection::create([
            'student_profile_id' => $snehaProfile->id,
            'field' => 'currentCgpa',
            'current_value' => '8.42',
            'requested_value' => '8.55',
            'reason' => 'Revaluation grade sheet published for Sem 5 Distributed Systems',
            'supporting_doc_name' => 'Revaluation_GradeSheet.pdf',
            'status' => 'PENDING',
        ]);

        // 5. Companies & Multi-Role Drives
        $infosys = Company::create([
            'slug_code' => 'comp-infosys',
            'name' => 'Infosys Limited',
            'industry' => 'Enterprise IT & Consulting',
            'tier' => 'dream',
            'description' => 'Global leader in next-generation digital services and consulting.',
            'website' => 'https://www.infosys.com',
            'hr_name' => 'Ananya Rao',
            'hr_email' => 'campus@infosys.example',
            'location' => 'Bengaluru / Pune',
            'application_deadline' => now()->addDays(12)->toDateString(),
            'recruitment_schedule' => [
                ['stageName' => 'Online Assessment', 'date' => now()->addDays(15)->toDateString(), 'mode' => 'Online'],
                ['stageName' => 'Technical & HR Interview', 'date' => now()->addDays(20)->toDateString(), 'mode' => 'Campus Visit'],
            ],
            'departments' => ['CSE', 'IT', 'ECE'],
            'academic_year' => '2026-2027',
        ]);

        $infySp = JobRole::create([
            'company_id' => $infosys->id,
            'role_code' => 'role-infy-sp',
            'role_title' => 'Specialist Programmer (SP)',
            'package_ctc' => '9.5 LPA',
            'package_lpa' => 9.50,
            'job_type' => 'Full-time',
            'work_location' => 'Bengaluru',
            'description' => 'Full-stack & distributed backend engineering role.',
            'required_skills' => ['DSA', 'Java', 'React', 'SQL'],
            'eligibility_criteria' => [
                'minCgpa' => 8.0,
                'minTenthMarks' => 75,
                'minTwelfthMarks' => 75,
                'maxActiveBacklogs' => 0,
                'maxHistoricalBacklogs' => 2,
                'allowedBranches' => ['CSE', 'IT', 'ISE'],
                'allowedDegrees' => ['B.Tech', 'M.Tech'],
                'allowedGraduationYears' => [2027],
                'minCodingProblemsSolved' => 50,
            ],
        ]);

        $razorpay = Company::create([
            'slug_code' => 'comp-razorpay',
            'name' => 'Razorpay',
            'industry' => 'FinTech',
            'tier' => 'super_dream',
            'description' => 'India’s leading full-stack payments and banking platform.',
            'website' => 'https://razorpay.com',
            'hr_name' => 'Riya Kapoor',
            'hr_email' => 'talent@razorpay.example',
            'location' => 'Bengaluru',
            'application_deadline' => now()->addDays(18)->toDateString(),
            'departments' => ['CSE', 'IT', 'AIML'],
            'academic_year' => '2026-2027',
        ]);

        JobRole::create([
            'company_id' => $razorpay->id,
            'role_code' => 'role-rzp-sde1',
            'role_title' => 'Software Development Engineer - I',
            'package_ctc' => '21.0 LPA',
            'package_lpa' => 21.00,
            'job_type' => 'Internship + Full-time',
            'work_location' => 'Bengaluru',
            'description' => 'High-throughput payment microservices and developer APIs.',
            'required_skills' => ['Distributed Systems', 'Go/Java', 'MySQL', 'Redis'],
            'eligibility_criteria' => [
                'minCgpa' => 7.5,
                'minTenthMarks' => 70,
                'minTwelfthMarks' => 70,
                'maxActiveBacklogs' => 0,
                'maxHistoricalBacklogs' => 1,
                'allowedBranches' => ['CSE', 'IT', 'AIML', 'ECE'],
                'allowedDegrees' => ['B.Tech'],
                'allowedGraduationYears' => [2027],
                'minCodingProblemsSolved' => 100,
            ],
        ]);

        // 6. Applications
        Application::create([
            'student_profile_id' => $snehaProfile->id,
            'company_id' => $infosys->id,
            'job_role_id' => $infySp->id,
            'status' => 'SHORTLISTED',
            'next_stage' => 'Technical & HR Interview',
            'remarks' => 'Cleared online assessment with 94th percentile',
            'timeline' => [
                ['stage' => 'APPLIED', 'date' => now()->subDays(5)->toIso8601String(), 'completed' => true, 'remarks' => 'Submitted via Student Portal'],
                ['stage' => 'ASSESSMENT_SCHEDULED', 'date' => now()->subDays(3)->toIso8601String(), 'completed' => true, 'remarks' => 'Coding test completed'],
                ['stage' => 'SHORTLISTED', 'date' => now()->subDay()->toIso8601String(), 'completed' => true, 'remarks' => 'Shortlisted for interview'],
                ['stage' => 'INTERVIEW_SCHEDULED', 'date' => '', 'completed' => false],
                ['stage' => 'SELECTED', 'date' => '', 'completed' => false],
            ],
        ]);

        // 7. Internships (4-step workflow: Student -> Guide -> Coordinator -> Final Approval)
        Internship::create([
            'student_profile_id' => $snehaProfile->id,
            'track' => 'TRACK_2_HYBRID',
            'company_name' => 'Cognizant Technology Solutions',
            'company_contact_number' => '+91 44 4209 6000',
            'company_address' => 'DLF IT Park, Chennai',
            'job_role' => 'Software Engineer Intern',
            'is_stipend' => true,
            'stipend_amount' => 15000,
            'stipend_currency' => '₹',
            'mode' => 'Hybrid',
            'start_date' => '2026-12-15',
            'end_date' => '2027-03-15',
            'duration_weeks' => 12,
            'work_profile' => 'Cloud microservices and React dashboard integration.',
            'faculty_guide_id' => $guide1->id,
            'status' => 'PENDING_GUIDE_REVIEW',
            'steps' => [
                ['stepNumber' => 1, 'stepName' => 'Student Submission', 'assignedRole' => 'STUDENT', 'decision' => 'SUBMITTED', 'responsibleUserName' => 'Sneha R', 'decisionDate' => now()->subDays(2)->toIso8601String(), 'remarks' => 'Submitted offer letter'],
                ['stepNumber' => 2, 'stepName' => 'Faculty Guide Review', 'assignedRole' => 'GUIDE', 'decision' => 'PENDING', 'responsibleUserName' => 'Dr. K. Ramanathan'],
                ['stepNumber' => 3, 'stepName' => 'CDC Coordinator Verification', 'assignedRole' => 'ADMIN_INTERNSHIP', 'decision' => 'PENDING', 'responsibleUserName' => 'CDC Internship Coordinator'],
                ['stepNumber' => 4, 'stepName' => 'Final Approval', 'assignedRole' => 'ADMIN_SUPER', 'decision' => 'PENDING', 'responsibleUserName' => 'CDC Administration'],
            ],
        ]);

        // 8. Notices
        Notice::create([
            'title' => 'Razorpay SDE-1 Registrations Open',
            'content' => 'Eligible 2027 batch students (CGPA >= 7.5, 0 active backlogs) can apply via Upcoming Companies before the deadline.',
            'publisher_name' => $adminSuper->name,
            'publisher_role' => 'CDC Administrator',
            'category' => 'Placement',
            'priority' => 'Urgent',
            'is_important' => true,
            'target_portal' => 'all',
            'target_branches' => ['CSE', 'IT', 'AIML', 'ECE'],
            'read_by_student_ids' => [],
        ]);

        Notice::create([
            'title' => 'Faculty Guides: Review Pending Track 2 Internships',
            'content' => 'Faculty mentors are requested to verify student offer letters and record approval remarks in the Guide Portal.',
            'publisher_name' => $adminSuper->name,
            'publisher_role' => 'CDC Administrator',
            'category' => 'Internship',
            'priority' => 'High',
            'is_important' => true,
            'target_portal' => 'guide',
            'read_by_student_ids' => [],
        ]);

        // 9. Daily Coding Challenge Questions (Ready for Monday Student Practice)
        $codingQuestions = [
            ['title' => '1. Two Sum', 'leetcode_url' => 'https://leetcode.com/problems/two-sum/', 'difficulty' => 'Easy', 'topics' => ['Arrays', 'Hashing']],
            ['title' => '121. Best Time to Buy and Sell Stock', 'leetcode_url' => 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 'difficulty' => 'Easy', 'topics' => ['Arrays', 'Sliding Window']],
            ['title' => '20. Valid Parentheses', 'leetcode_url' => 'https://leetcode.com/problems/valid-parentheses/', 'difficulty' => 'Easy', 'topics' => ['Stacks & Queues', 'Strings']],
            ['title' => '56. Merge Intervals', 'leetcode_url' => 'https://leetcode.com/problems/merge-intervals/', 'difficulty' => 'Medium', 'topics' => ['Arrays', 'Sorting & Searching']],
            ['title' => '102. Binary Tree Level Order Traversal', 'leetcode_url' => 'https://leetcode.com/problems/binary-tree-level-order-traversal/', 'difficulty' => 'Medium', 'topics' => ['Trees & BST', 'Stacks & Queues']],
            ['title' => '146. LRU Cache', 'leetcode_url' => 'https://leetcode.com/problems/lru-cache/', 'difficulty' => 'Medium', 'topics' => ['Hashing', 'Linked List']],
            ['title' => '42. Trapping Rain Water', 'leetcode_url' => 'https://leetcode.com/problems/trapping-rain-water/', 'difficulty' => 'Hard', 'topics' => ['Two Pointers', 'Dynamic Programming']],
        ];
        foreach ($codingQuestions as $idx => $cq) {
            $qModel = CodingQuestion::create([
                'title' => $cq['title'],
                'leetcode_url' => $cq['leetcode_url'],
                'difficulty' => $cq['difficulty'],
                'topics' => $cq['topics'],
                'posted_date' => now()->toDateString(),
                'due_date' => now()->addDays(7)->toDateString(),
                'target_branches' => ['ALL'],
                'posted_by' => $adminSuper->id,
            ]);
            if ($idx < 2) {
                StudentCodingSolve::create([
                    'student_profile_id' => $snehaProfile->id,
                    'coding_question_id' => $qModel->id,
                    'title' => $qModel->title,
                    'leetcode_url' => $qModel->leetcode_url,
                    'difficulty' => $qModel->difficulty,
                    'topics' => $qModel->topics,
                    'solved_at' => now()->subDays(1),
                ]);
            }
        }

        AuditLog::create([
            'actor_user_id' => $adminSuper->id,
            'actor_name' => $adminSuper->name,
            'actor_role' => 'ADMIN_SUPER',
            'action' => 'INDUSTRIAL_SCHEMA_SEEDED',
            'entity_type' => 'System',
            'entity_id' => 'cdc_industrial',
            'details' => 'Initialized Laravel 12 industrial 3-portal database and seeded demo records.',
            'ip_address' => '127.0.0.1',
        ]);
    }
}
