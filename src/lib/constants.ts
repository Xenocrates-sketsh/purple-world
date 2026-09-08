import type {
  AnnouncementType,
  AssessmentType,
  AttendanceStatus,
  ExerciseCategory,
  ExerciseDifficulty,
  NotificationType,
} from "./types";

import applePng from "@/assets/fruits/apple.png";
import bananaPng from "@/assets/fruits/banana.png";
import grapesPng from "@/assets/fruits/grapes.png";
import orangePng from "@/assets/fruits/orange.png";
import watermelonPng from "@/assets/fruits/watermelon.png";
import pineapplePng from "@/assets/fruits/pineapple.png";
import strawberryPng from "@/assets/fruits/strawberry.png";
import blueberryPng from "@/assets/fruits/blueberry.png";
import lemonPng from "@/assets/fruits/lemon.png";
import kiwiPng from "@/assets/fruits/kiwi.png";
import pearPng from "@/assets/fruits/pear.png";
import peachPng from "@/assets/fruits/peach.png";
import cherriesPng from "@/assets/fruits/cherries.png";
import coconutPng from "@/assets/fruits/coconut.png";
import pomegranatePng from "@/assets/fruits/pomegranate.png";
import mangoPng from "@/assets/fruits/mango.png";
import greengrapesPng from "@/assets/fruits/greengrapes.png";
import figPng from "@/assets/fruits/fig.png";
import raspberryPng from "@/assets/fruits/raspberry.png";
import apricotPng from "@/assets/fruits/apricot.png";
// Legacy SVG set — kept ONLY so older avatarKey picks (carrot, broccoli,
// corn, avocado, cucumber, pepper, cherry) still resolve instead of
// breaking. Never shown in the picker.
import cherrySvg from "@/assets/avatars/cherry.svg";
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
 * Preset avatars for students. The `img` field is a bundled PNG (kawaii fruit
 * set, cropped from the teacher-supplied sheet) — no runtime network, no
 * storage uploads. `emoji` is a fallback glyph when an image can't render.
 * The `key` is what we persist (users/avatarKey, students/avatarKey).
 */
export const FRUIT_AVATARS: { key: string; emoji: string; label: string; img: string }[] = [
  { key: "apple", emoji: "🍎", label: "Apple", img: applePng },
  { key: "banana", emoji: "🍌", label: "Banana", img: bananaPng },
  { key: "grapes", emoji: "🍇", label: "Grapes", img: grapesPng },
  { key: "orange", emoji: "🍊", label: "Orange", img: orangePng },
  { key: "watermelon", emoji: "🍉", label: "Watermelon", img: watermelonPng },
  { key: "pineapple", emoji: "🍍", label: "Pineapple", img: pineapplePng },
  { key: "strawberry", emoji: "🍓", label: "Strawberry", img: strawberryPng },
  { key: "blueberry", emoji: "🫐", label: "Blueberry", img: blueberryPng },
  { key: "lemon", emoji: "🍋", label: "Lemon", img: lemonPng },
  { key: "kiwi", emoji: "🥝", label: "Kiwi", img: kiwiPng },
  { key: "pear", emoji: "🍐", label: "Pear", img: pearPng },
  { key: "peach", emoji: "🍑", label: "Peach", img: peachPng },
  { key: "cherries", emoji: "🍒", label: "Cherries", img: cherriesPng },
  { key: "coconut", emoji: "🥥", label: "Coconut", img: coconutPng },
  { key: "pomegranate", emoji: "❤️", label: "Pomegranate", img: pomegranatePng },
  { key: "mango", emoji: "🥭", label: "Mango", img: mangoPng },
  { key: "greengrapes", emoji: "🍇", label: "Green grapes", img: greengrapesPng },
  { key: "fig", emoji: "🟣", label: "Fig", img: figPng },
  { key: "raspberry", emoji: "🍇", label: "Raspberry", img: raspberryPng },
  { key: "apricot", emoji: "🟠", label: "Apricot", img: apricotPng },
];

/** Older SVG picks, kept resolvable so existing avatarKey values never break. */
const LEGACY_FRUIT_AVATARS: { key: string; emoji: string; label: string; img: string }[] = [
  { key: "cherry", emoji: "🍒", label: "Cherry", img: cherrySvg },
  { key: "carrot", emoji: "🥕", label: "Carrot", img: carrotSvg },
  { key: "broccoli", emoji: "🥦", label: "Broccoli", img: broccoliSvg },
  { key: "corn", emoji: "🌽", label: "Corn", img: cornSvg },
  { key: "avocado", emoji: "🥑", label: "Avocado", img: avocadoSvg },
  { key: "cucumber", emoji: "🥒", label: "Cucumber", img: cucumberSvg },
  { key: "pepper", emoji: "🫑", label: "Pepper", img: pepperSvg },
];

export const fruitAvatarByKey = (key: string | null | undefined) =>
  FRUIT_AVATARS.find((a) => a.key === key) ??
  LEGACY_FRUIT_AVATARS.find((a) => a.key === key) ??
  null;

/** The bundled image for a fruit key, or null if unknown. */
export const fruitAvatarSrc = (key: string | null | undefined) =>
  fruitAvatarByKey(key)?.img ?? null;