import type {
  AnnouncementType,
  AssessmentType,
  AttendanceStatus,
  ExerciseCategory,
  ExerciseDifficulty,
  NotificationType,
} from "./types";

import appleSvg from "@/assets/avatars/apple.svg";
import bananaSvg from "@/assets/avatars/banana.svg";
import orangeSvg from "@/assets/avatars/orange.svg";
import lemonSvg from "@/assets/avatars/lemon.svg";
import grapesSvg from "@/assets/avatars/grapes.svg";
import watermelonSvg from "@/assets/avatars/watermelon.svg";
import strawberrySvg from "@/assets/avatars/strawberry.svg";
import mangoSvg from "@/assets/avatars/mango.svg";
import pineappleSvg from "@/assets/avatars/pineapple.svg";
import kiwiSvg from "@/assets/avatars/kiwi.svg";
import cherrySvg from "@/assets/avatars/cherry.svg";
import blueberrySvg from "@/assets/avatars/blueberry.svg";
import carrotSvg from "@/assets/avatars/carrot.svg";
import broccoliSvg from "@/assets/avatars/broccoli.svg";
import cornSvg from "@/assets/avatars/corn.svg";
import avocadoSvg from "@/assets/avatars/avocado.svg";
import cucumberSvg from "@/assets/avatars/cucumber.svg";
import pepperSvg from "@/assets/avatars/pepper.svg";

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

/**
 * Preset avatars for students. The `img` field is the bundled SVG (Twemoji,
 * CC-BY 4.0) inlined as a data URI — no runtime network, no storage uploads.
 * `emoji` is a fallback glyph when an image can't render. The `key` is what we
 * persist (users/avatarKey, students/avatarKey).
 */
export const FRUIT_AVATARS: { key: string; emoji: string; label: string; img: string }[] = [
  { key: "apple", emoji: "🍎", label: "Apple", img: appleSvg },
  { key: "banana", emoji: "🍌", label: "Banana", img: bananaSvg },
  { key: "orange", emoji: "🍊", label: "Orange", img: orangeSvg },
  { key: "lemon", emoji: "🍋", label: "Lemon", img: lemonSvg },
  { key: "grapes", emoji: "🍇", label: "Grapes", img: grapesSvg },
  { key: "watermelon", emoji: "🍉", label: "Watermelon", img: watermelonSvg },
  { key: "strawberry", emoji: "🍓", label: "Strawberry", img: strawberrySvg },
  { key: "mango", emoji: "🥭", label: "Mango", img: mangoSvg },
  { key: "pineapple", emoji: "🍍", label: "Pineapple", img: pineappleSvg },
  { key: "kiwi", emoji: "🥝", label: "Kiwi", img: kiwiSvg },
  { key: "cherry", emoji: "🍒", label: "Cherry", img: cherrySvg },
  { key: "blueberry", emoji: "🫐", label: "Blueberry", img: blueberrySvg },
  { key: "carrot", emoji: "🥕", label: "Carrot", img: carrotSvg },
  { key: "broccoli", emoji: "🥦", label: "Broccoli", img: broccoliSvg },
  { key: "corn", emoji: "🌽", label: "Corn", img: cornSvg },
  { key: "avocado", emoji: "🥑", label: "Avocado", img: avocadoSvg },
  { key: "cucumber", emoji: "🥒", label: "Cucumber", img: cucumberSvg },
  { key: "pepper", emoji: "🫑", label: "Pepper", img: pepperSvg },
];

export const fruitAvatarByKey = (key: string | null | undefined) =>
  FRUIT_AVATARS.find((a) => a.key === key) ?? null;

/** The bundled SVG image for a fruit key (data URI), or null if unknown. */
export const fruitAvatarSrc = (key: string | null | undefined) =>
  fruitAvatarByKey(key)?.img ?? null;