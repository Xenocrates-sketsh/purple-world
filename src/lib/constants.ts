import type {
  AnnouncementType,
  AssessmentType,
  AttendanceStatus,
  ExerciseCategory,
  ExerciseDifficulty,
  NotificationType,
} from "./types";

export const ATTENDANCE_STATUSES: {
  value: AttendanceStatus;
  label: string;
  short: string;
}[] = [
  { value: "present", label: "Present", short: "P" },
  { value: "absent", label: "Absent", short: "A" },
  { value: "late", label: "Late", short: "L" },
  { value: "excused", label: "Excused", short: "E" },
];

export const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: "exercise", label: "Exercise" },
  { value: "test", label: "Test" },
  { value: "homework", label: "Homework" },
  { value: "quiz", label: "Quiz" },
  { value: "exam", label: "Exam" },
  { value: "other", label: "Other" },
];

export const EXERCISE_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "grammar", label: "Grammar" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "reading", label: "Reading comprehension" },
  { value: "writing", label: "Writing" },
  { value: "listening", label: "Listening" },
  { value: "bac_preparation", label: "BAC preparation" },
  { value: "mixed", label: "Mixed" },
];

export const EXERCISE_DIFFICULTIES: { value: ExerciseDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string }[] = [
  { value: "new_lesson", label: "New lesson" },
  { value: "schedule_change", label: "Schedule change" },
  { value: "new_exercise", label: "New exercise" },
  { value: "exam_reminder", label: "Exam reminder" },
  { value: "payment_reminder", label: "Payment reminder" },
  { value: "general", label: "General" },
  { value: "bac_info", label: "Important BAC info" },
];

export const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: "message", label: "Message" },
  { value: "new_exercise", label: "New exercise" },
  { value: "new_announcement", label: "New announcement" },
  { value: "upcoming_lesson", label: "Upcoming lesson" },
  { value: "payment_due", label: "Payment due" },
  { value: "new_grade", label: "New grade" },
  { value: "schedule_change", label: "Schedule change" },
];

export const BAC_STREAMS = [
  "Scientific",
  "Mathematics",
  "Technical",
  "Literary & Philosophy",
  "Foreign Languages",
  "Management & Economics",
  "Experimental Science",
];

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const DEFAULT_GROUP_COLORS = [
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#4f46e5",
  "#0d9488",
];

export const MAX_ASSESSMENT_SCORE = 20;

export const GRADE_SCALE = 20;

export const PENDING_INVITE_TTL_DAYS = 14;

export const INVITE_CODE_LENGTH = 20;