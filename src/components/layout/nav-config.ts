import {
  Settings,
  MessageSquare,
  ClipboardList,
  Megaphone,
  CalendarClock,
  GraduationCap,
  CalendarDays,
  UserRoundCheck,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** exact match, badge hook, or on mobile primary */
  exact?: boolean;
}

/** Teacher portal navigation (bottom-bar = primary mobile items). */
export const teacherPrimaryNav: NavItem[] = [
  { to: "/teacher", label: "Home", icon: GraduationCap, exact: true },
  { to: "/teacher/students", label: "Students", icon: GraduationCap },
  { to: "/teacher/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/teacher/chat", label: "Messages", icon: MessageSquare },
];

export const teacherSecondaryNav: NavItem[] = [
  { to: "/teacher/arrivals", label: "New Arrivals", icon: UserRoundCheck },
  { to: "/teacher/groups", label: "Groups", icon: CalendarClock },
  { to: "/teacher/grades", label: "Grades", icon: ClipboardList },
  { to: "/teacher/exercises", label: "Exercises", icon: ClipboardList },
  { to: "/teacher/announcements", label: "Announcements", icon: Megaphone },
  { to: "/teacher/lessons", label: "Lessons", icon: BookOpen },
  { to: "/teacher/settings", label: "Settings", icon: Settings },
];

export const studentPrimaryNav: NavItem[] = [
  { to: "/student", label: "Home", icon: GraduationCap, exact: true },
  { to: "/student/announcements", label: "News", icon: Megaphone },
  { to: "/student/exercises", label: "Exercises", icon: ClipboardList },
  { to: "/student/chat", label: "Messages", icon: MessageSquare },
  { to: "/student/grades", label: "Grades", icon: GraduationCap },
];

export const studentSecondaryNav: NavItem[] = [
  { to: "/student/group", label: "My Group", icon: CalendarClock },
  { to: "/student/lessons", label: "Lessons", icon: BookOpen },
  { to: "/student/profile", label: "Profile", icon: GraduationCap },
  { to: "/student/settings", label: "Settings", icon: Settings },
];
