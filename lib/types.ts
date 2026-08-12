export type Role = "teacher" | "student";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  studentId?: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  color: string;
  inviteCode: string;
  memberCount?: number;
}

export interface StudentSummary {
  id: string;
  profileId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  studentNo: string;
  groupId: string | null;
  groupName: string | null;
  phone: string | null;
  parentPhone: string | null;
  school: string | null;
  stream: string | null;
  active: boolean;
  registeredAt: string;
  paymentStatus?: string;
  attendanceRate?: number;
  unreadMessages?: number;
}

export interface PaymentRow {
  id: string;
  studentId: string;
  amount: string | null;
  dueDate: string;
  paidDate: string | null;
  status: "paid" | "overdue" | "due";
  notes: string | null;
  createdAt: string;
  student?: StudentSummary;
}

export interface AttendanceRow {
  id?: string;
  lessonId: string;
  studentId: string;
  status: "present" | "absent" | "late" | "excused";
  markedAt?: string;
}

export interface LessonRow {
  id: string;
  groupId: string;
  groupName?: string;
  groupColor?: string;
  title: string;
  startsAt: string;
  durationMin: number;
  location: string | null;
  notes: string | null;
  attendanceMarked?: boolean;
}

export interface AssessmentRow {
  id: string;
  title: string;
  type: string;
  groupId: string | null;
  groupName?: string | null;
  date: string;
  maxScore: string;
  description: string | null;
  resultCount?: number;
}

export interface ResultRow {
  id: string;
  assessmentId: string;
  studentId: string;
  score: string;
  feedback: string | null;
}

export interface ExerciseRow {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  category: string;
  difficulty: string;
  deadline: string | null;
  attachmentUrl: string | null;
  archived: boolean;
  createdAt: string;
  assignedCount?: number;
  submissionCount?: number;
  pendingCount?: number;
  submitted?: boolean;
  graded?: boolean;
  grade?: string | null;
}

export interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  category: string;
  target: "all" | "group" | "student";
  groupId: string | null;
  studentId: string | null;
  groupName?: string | null;
  studentName?: string | null;
  createdAt: string;
}

export interface MessageRow {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface ProgramUnitRow {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: ProgramLessonRow[];
}

export interface ProgramLessonRow {
  id: string;
  unitId: string;
  title: string;
  position: number;
  content: string | null;
  grammar: string | null;
  vocabulary: string | null;
  reading: string | null;
  writing: string | null;
  listening: string | null;
}

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface TeacherDashboardData {
  totals: {
    students: number;
    active: number;
    unpaid: number;
    overdue: number;
  };
  todayLessons: LessonRow[];
  upcomingLessons: LessonRow[];
  recentAnnouncements: AnnouncementRow[];
  pendingSubmissions: number;
  unreadMessages: number;
  gradeAverage: number | null;
}

export interface StudentDashboardData {
  profile: StudentSummary;
  group: GroupSummary | null;
  nextLesson: LessonRow | null;
  latestAnnouncements: AnnouncementRow[];
  latestGrades: { id: string; title: string; score: string; maxScore: string; date: string }[];
  pendingExercises: number;
  unreadMessages: number;
  paymentStatus: string | null;
  attendance: { rate: number; present: number; absent: number; late: number; excused: number } | null;
}

export interface StudentStats {
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
    recent: { lesson: string; date: string; status: string }[];
  };
  payments: {
    current: PaymentRow | null;
    history: PaymentRow[];
  };
  grades: {
    average: number | null;
    overall: number | null;
    byType: Record<string, { count: number; average: number | null }>;
    progress: { assessment: string; date: string; score: number; maxScore: number }[];
  };
  exercises: {
    completed: number;
    pending: number;
    late: number;
    graded: number;
  };
}
