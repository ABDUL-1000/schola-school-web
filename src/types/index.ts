export type UserRole = "STUDENT" | "TEACHER" | "SCHOOL" | "ADMIN" | "APP_ADMIN";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMetadata {
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface PaginatedResponse<T> {
  pagination: PaginationMetadata;
  data: T[];
}

export interface BaseUser {
  id: string;
  fullname: string;
  email: string | null;
  phone: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
  fcmToken?: string | null;
}

export interface Student extends BaseUser {
  schoolId: string;
  classId: string;
  regNumber: string;
}

export type StaffRole = "TEACHER" | "ADMIN";

export interface Teacher extends BaseUser {
  schoolId: string;
  roles: StaffRole;
  isVerified: boolean;
}

export type SchoolType = "SINGLE_BRANCH" | "MULTI_BRANCH";

export interface School extends BaseUser {
  schoolName: string;
  slug: string;
  schoolType: SchoolType | null;
  schoolCategory?: ("NURSERY" | "PRIMARY" | "SECONDARY" | "COMBINED")[] | null;
  curriculumType?: "NIGERIAN" | "BRITISH" | "AMERICAN" | "MIXED" | null;
  address: string | null;
  logo: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  isVerified: boolean;
}

export type User = (Student | Teacher | School) & { role: UserRole };

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null; // accessToken
  refreshToken?: string | null; // May be in cookie
  hasRole: (role: UserRole) => boolean;
  isStudent: () => boolean;
  isTeacher: () => boolean;
  isSchool: () => boolean;
  login: (data: { user: User; token: string; refreshToken?: string }) => void;
  logout: () => void;
}

export interface LoginCredentials {
  email?: string;
  identifier?: string;
  password: string;
}

export interface LoginResponse {
  student?: Student;
  teacher?: Teacher;
  school?: School;
  staff?: Staff;
  accessToken?: string; // Legacy/fallback
  refreshToken?: string; // Legacy/fallback
  tokens: AuthTokens;
  slug?: string;
  [key: string]: any;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// --- Teacher & Class Types ---

export interface SubjectAssignment {
  id: string;
  teacherId: string;
  classId: string;
  schoolId: string;
  subjectId: string;
  days: string; // "Monday,Wednesday,Friday"
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    level: string | null;
  };
  subject?: {
    id: string;
    name: string;
  };
}

export interface ClassLead {
  id: string;
  staffId: string;
  classId: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    level: string | null;
  };
}

// --- Exam & Question Types ---

export interface ExamOption {
  id?: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface ExamAttachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
}

export interface ExamQuestion {
  id?: string;
  text: string;
  explanation?: string | null;
  questionType:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILE_UPLOAD";
  allocatedScore: string | number;
  orderIndex: number;
  options: ExamOption[];
  attachments: ExamAttachment[];
}

export interface ExamSection {
  id?: string;
  title: string;
  instructions?: string | null;
  type: "OBJECTIVE" | "THEORY" | "PRACTICAL";
  orderIndex: number;
  answerAll: boolean;
  maxQuestionsToAnswer?: number | null;
  questions: ExamQuestion[];
}

export interface QuestionOption {
  id: string;
  text: string;
  questionId: string;
  isCorrect: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  examId: string;
  sectionId: string;
  text: string;
  explanation?: string | null;
  allocatedScore: string | number;
  questionType:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILE_UPLOAD";
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  options?: QuestionOption[];
  attachments?: any[]; // For now, can refine later
}

export type ExamType = "TEST" | "QUIZ" | "FINAL";
export type ExamStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export interface Exam {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  createdBy: string;
  title: string;
  description: string | null;
  instructions: string | null;
  passcode: string | null;
  allocatedTime: number | null; // in minutes
  totalScore: string | number;
  passingScore: string | number | null;
  type: ExamType;
  status: ExamStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: Question[]; // Legacy/Simple
  sections?: ExamSection[]; // New Nested Structure
  teacher?: {
    fullname: string;
  };
  class?: {
    name: string;
  };
  subject?: {
    name: string;
  };
  _count?: {
    questions: number;
    attempts: number;
  };
}

export interface SchoolExamMetrics {
  totalExams: number;
  pendingApproval: number;
  approvedExams: number;
  typeStats: Record<ExamType, number>;
  statusStats: Record<ExamStatus, number>;
}

// --- Assignment Types ---

export type AssignmentType = "NORMAL" | "PROJECT";
export type AssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export interface Assignment {
  id: string;
  schoolId: string;
  branchId: string;
  classId: string;
  subjectId: string;
  staffId: string;
  title: string;
  description: string | null;
  instructions: string | null;
  passcode: string | null;
  allocatedTime: number | null;
  dueDate: string;
  totalScore: string | number;
  passingScore: string | number | null;
  type: AssignmentType;
  status: AssignmentStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  sections?: ExamSection[]; // Reusing ExamSection structure as they are identical in DB
  questions?: Question[];
  class?: {
    name: string;
  };
  subject?: {
    name: string;
  };
  teacher?: {
    fullname: string;
  };
  _count?: {
    questions: number;
    attempts: number;
  };
}

// --- Lesson Note Types ---

export interface LessonNote {
  id: string;
  schoolId: string;
  branchId: string;
  staffId: string;
  classId: string;
  subjectId: string;
  topic: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    fullname: string;
    email: string | null;
  };
  class?: {
    id: string;
    name: string;
    level: string | null;
  };
  subject?: {
    id: string;
    name: string;
  };
}

export interface LessonNoteDTO {
  classId: string;
  subjectId: string;
  topic: string;
  content: string;
  date: string;
}

// --- Branches & Staff Types ---

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  isHQ: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchDTO {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  isHQ?: boolean;
}

export interface Staff extends BaseUser {
  schoolId: string;
  branchId: string;
  roles: StaffRole;
  branch?: {
    name: string;
  };
  managedClasses?: ClassLead[];
  subjectAssignments?: SubjectAssignment[];
}

export interface CreateStaffDTO {
  branchId: string;
  fullname: string;
  email: string;
  phone: string;
  roles?: StaffRole;
  jobTitle?: string;
  departmentId?: string;
  profileImage?: string;
}

export interface RegistrationState {
  email: string | null;
  verificationToken: string | null;
  setEmail: (email: string | null) => void;
  setVerificationToken: (token: string | null) => void;
  reset: () => void;
}

// --- Dashboard Types ---

export interface TeacherDashboardStats {
  totalClasses: number;
  totalSubjects: number;
  totalStudents: number;
  submissionRate: number;
  attendanceRate: number;
  pendingApprovals: number;
  assignments: number;
  exams: number;
}
