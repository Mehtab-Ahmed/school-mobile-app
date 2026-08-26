export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'DRIVER';

export interface AuthUser {
  id?: number;
  userId: number;
  fullName: string;
  email?: string;
  loginId?: string;
  primaryRole: UserRole;
  roles: UserRole[];
  schoolId?: number;
  schoolSlug?: string;
  schoolName?: string;
  forcePasswordChange?: boolean;
}

/** Backend returns a flat response — no nested user object */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  // Flat user fields (same level as tokens)
  userId: number;
  schoolId?: number;
  email?: string;
  loginId?: string;
  schoolSlug?: string;
  schoolName?: string;
  fullName: string;
  primaryRole: UserRole;
  roles: UserRole[];
  forcePasswordChange?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
}

export interface Student {
  id: number;
  admissionNumber: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    profilePicture?: string;
  };
  classSection?: {
    id: number;
    grade?: { id: number; name: string };
    section?: { id: number; name: string };
  };
  dateOfBirth?: string;
  bloodGroup?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface Teacher {
  id: number;
  employeeId: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  designation?: string;
  qualification?: string;
  subjects?: Subject[];
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  grade?: { id: number; name: string };
}

export interface ClassSection {
  id: number;
  grade: { id: number; name: string };
  section: { id: number; name: string };
  classTeacher?: {
    firstName: string;
    lastName: string;
  };
  roomNumber?: string;
  capacity?: number;
}

export interface AttendanceRecord {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED';
}

export interface AttendanceSummary {
  studentId: number;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  attendancePercentage: number;
}

export interface FeePayment {
  id: number;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  feeCategory?: { name: string };
  paidAmount?: number;
  dueAmount?: number;
}

export interface StudentFeeSummary {
  studentId: number;
  studentName: string;
  totalFee: number;
  totalPaid: number;
  totalBalance: number;
  overdueAmount: number;
  payments: FeePayment[];
}

export interface Homework {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  subject?: Subject;
  classSection?: ClassSection;
  teacher?: { firstName: string; lastName: string };
  status?: string;
}

export interface HomeworkSubmission {
  id: number;
  homework: Homework;
  submittedAt?: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  grade?: string;
  remarks?: string;
}

export interface Exam {
  id: number;
  name: string;
  examType: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  subject?: Subject;
  totalMarks?: number;
  passingMarks?: number;
}

export interface ExamMark {
  id: number;
  exam: Exam;
  marksObtained?: number;
  totalMarks: number;
  grade?: string;
  remarks?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  targetAudience: string;
  createdAt: string;
  publishedAt?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface LeaveApplication {
  id: number;
  leaveType: { name: string; color?: string };
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  totalDays?: number;
}

export interface LeaveBalance {
  leaveTypeName: string;
  totalLeaves: number;
  usedLeaves: number;
  remainingLeaves: number;
}

export interface TimetableEntry {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject?: Subject;
  teacher?: { firstName: string; lastName: string };
  classSection?: ClassSection;
}

export interface AdminDashboard {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalFeeCollected: number;
  totalFeePending: number;
  overduePayments: number;
  totalBooks: number;
  booksIssued: number;
  overdueBooks: number;
  pendingLeaveRequests: number;
  studentsByGrade: Record<string, number>;
  lastPayrollNetAmount?: number;
  lastPayrollMonth?: string;
}

export interface TeacherDashboard {
  teacherName: string;
  totalClasses: number;
  totalStudents: number;
  pendingHomework: number;
  todayClasses: ClassSection[];
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  subject?: { name: string };
  availableCopies: number;
  totalCopies: number;
}

export interface BookIssue {
  id: number;
  book: Book;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
  finePaid?: boolean;
}

export interface RouteStop {
  id: number;
  name: string;
  sequence: number;
  morningPickupTime?: string;
  eveningDropTime?: string;
}

export interface StudentTransport {
  id: number;
  route: {
    id: number;
    name: string;
    vehicle?: { make: string; model: string; registrationNumber: string };
  };
  stop: RouteStop;
  pickupType: string;
  boardingStop?: RouteStop;
  dropStop?: RouteStop;
}
