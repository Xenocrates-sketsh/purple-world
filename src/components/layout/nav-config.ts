import type { LucideIcon } from "lucide-react";

import iconHome from "@/assets/icons/home.png";
import iconStudents from "@/assets/icons/students.png";
import iconSchedule from "@/assets/icons/schedule.png";
import iconMessages from "@/assets/icons/messages.png";
import iconPayments from "@/assets/icons/payments.png";
import iconArrivals from "@/assets/icons/arrivals.png";
import iconGroups from "@/assets/icons/groups.png";
import iconGrades from "@/assets/icons/grades.png";
import iconExercises from "@/assets/icons/exercises.png";
import iconAnnouncements from "@/assets/icons/announcements.png";
import iconLessons from "@/assets/icons/lessons.png";
import iconSettings from "@/assets/icons/settings.png";
import iconNews from "@/assets/icons/news.png";
import iconProfile from "@/assets/icons/profile.png";

export interface NavItem {
  to: string;
  label: string;
  /** Lucide component or 3D PNG src (see AppIcon). */
  icon: LucideIcon | string;
  /** exact match, badge hook, or on mobile primary */
  exact?: boolean;
}

/** Teacher portal navigation (bottom-bar = primary mobile items). */
export const teacherPrimaryNav: NavItem[] = [
  { to: "/teacher", label: "Home", icon: iconHome, exact: true },
  { to: "/teacher/students", label: "Students", icon: iconStudents },
  { to: "/teacher/schedule", label: "Schedule", icon: iconSchedule },
  { to: "/teacher/chat", label: "Messages", icon: iconMessages },
  { to: "/teacher/payments", label: "Payments", icon: iconPayments },
];

export const teacherSecondaryNav: NavItem[] = [
  { to: "/teacher/arrivals", label: "New Arrivals", icon: iconArrivals },
  { to: "/teacher/groups", label: "Groups", icon: iconGroups },
  { to: "/teacher/grades", label: "Grades", icon: iconGrades },
  { to: "/teacher/exercises", label: "Exercises", icon: iconExercises },
  { to: "/teacher/announcements", label: "Announcements", icon: iconAnnouncements },
  { to: "/teacher/lessons", label: "Lessons", icon: iconLessons },
  { to: "/teacher/settings", label: "Settings", icon: iconSettings },
];

export const studentPrimaryNav: NavItem[] = [
  { to: "/student", label: "Home", icon: iconHome, exact: true },
  { to: "/student/announcements", label: "News", icon: iconNews },
  { to: "/student/exercises", label: "Exercises", icon: iconExercises },
  { to: "/student/chat", label: "Messages", icon: iconMessages },
  { to: "/student/grades", label: "Grades", icon: iconGrades },
];

export const studentSecondaryNav: NavItem[] = [
  { to: "/student/group", label: "My Group", icon: iconGroups },
  { to: "/student/payments", label: "Payments", icon: iconPayments },
  { to: "/student/lessons", label: "Lessons", icon: iconLessons },
  { to: "/student/profile", label: "Profile", icon: iconProfile },
  { to: "/student/settings", label: "Settings", icon: iconSettings },
];
