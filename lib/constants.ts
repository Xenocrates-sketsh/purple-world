export const ATTENDANCE_STATUS = [
  { value: "present", label: "Present", color: "success" },
  { value: "absent", label: "Absent", color: "danger" },
  { value: "late", label: "Late", color: "warning" },
  { value: "excused", label: "Excused", color: "info" },
] as const;

export const ASSESSMENT_TYPES = [
  { value: "exercise", label: "Exercise" },
  { value: "test", label: "Test" },
  { value: "homework", label: "Homework" },
  { value: "quiz", label: "Quiz" },
  { value: "exam", label: "Exam" },
  { value: "other", label: "Other" },
] as const;

export const EXERCISE_CATEGORIES = [
  { value: "grammar", label: "Grammar" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "reading", label: "Reading Comprehension" },
  { value: "writing", label: "Writing" },
  { value: "listening", label: "Listening" },
  { value: "bac_preparation", label: "BAC Preparation" },
  { value: "mixed", label: "Mixed" },
] as const;

export const EXERCISE_DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

export const ANNOUNCEMENT_CATEGORIES = [
  { value: "new_lesson", label: "New lesson" },
  { value: "schedule_change", label: "Schedule change" },
  { value: "new_exercise", label: "New exercise" },
  { value: "exam_reminder", label: "Exam reminder" },
  { value: "payment_reminder", label: "Payment reminder" },
  { value: "general", label: "General" },
  { value: "bac_info", label: "BAC information" },
] as const;

export const NOTIFICATION_LABELS: Record<string, string> = {
  message: "New message",
  new_exercise: "New exercise",
  new_announcement: "New announcement",
  upcoming_lesson: "Upcoming lesson",
  payment_due: "Payment due",
  new_grade: "New grade",
  schedule_change: "Schedule change",
};

export const STREAMS = [
  "Sciences",
  "Mathematics",
  "Literature & Philosophy",
  "Foreign Languages",
  "Management & Economics",
  "Experimental Sciences",
  "Other",
] as const;

export const GROUP_COLORS = [
  { value: "#7c3aed", label: "Purple" },
  { value: "#2563eb", label: "Blue" },
  { value: "#059669", label: "Green" },
  { value: "#d97706", label: "Amber" },
  { value: "#e11d48", label: "Rose" },
  { value: "#0d9488", label: "Teal" },
  { value: "#4f46e5", label: "Indigo" },
  { value: "#c026d3", label: "Fuchsia" },
] as const;

export const SESSION_DURATION_MIN = 60;

export function labelFor(
  list: readonly { value: string; label: string }[],
  value: string
): string {
  return list.find((i) => i.value === value)?.label ?? value;
}
