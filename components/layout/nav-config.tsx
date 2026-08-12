import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UsersRound,
  ClipboardCheck,
  FileText,
  Megaphone,
  MessageSquare,
  BookOpen,
  Settings,
  Wallet,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: string;
  match?: string[];
}

export const TEACHER_NAV: NavItem[] = [
  {
    href: "/teacher",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "Overview",
    match: ["/teacher"],
  },
  {
    href: "/teacher/schedule",
    label: "Schedule",
    icon: CalendarDays,
    section: "Overview",
  },
  {
    href: "/teacher/students",
    label: "Students",
    icon: Users,
    section: "Students",
    match: ["/teacher/students"],
  },
  {
    href: "/teacher/groups",
    label: "Groups",
    icon: UsersRound,
    section: "Students",
  },
  {
    href: "/teacher/payments",
    label: "Payments",
    icon: Wallet,
    section: "Students",
  },
  {
    href: "/teacher/grades",
    label: "Grades",
    icon: ClipboardCheck,
    section: "Teaching",
  },
  {
    href: "/teacher/exercises",
    label: "Exercises",
    icon: FileText,
    section: "Teaching",
  },
  {
    href: "/teacher/announcements",
    label: "Announcements",
    icon: Megaphone,
    section: "Teaching",
  },
  {
    href: "/teacher/program",
    label: "BAC Program",
    icon: BookOpen,
    section: "Teaching",
  },
  {
    href: "/teacher/chat",
    label: "Messages",
    icon: MessageSquare,
    section: "Communication",
    match: ["/teacher/chat"],
  },
  {
    href: "/teacher/settings",
    label: "Settings",
    icon: Settings,
    section: "Settings",
  },
];

export const STUDENT_NAV: NavItem[] = [
  {
    href: "/student",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "Overview",
    match: ["/student"],
  },
  {
    href: "/student/grades",
    label: "My Grades",
    icon: ClipboardCheck,
    section: "Overview",
  },
  {
    href: "/student/group",
    label: "My Group",
    icon: UsersRound,
    section: "Overview",
  },
  {
    href: "/student/exercises",
    label: "Exercises",
    icon: FileText,
    section: "Learning",
  },
  {
    href: "/student/program",
    label: "BAC Program",
    icon: BookOpen,
    section: "Learning",
  },
  {
    href: "/student/announcements",
    label: "Announcements",
    icon: Megaphone,
    section: "Learning",
  },
  {
    href: "/student/payments",
    label: "Payments",
    icon: Wallet,
    section: "Overview",
  },
  {
    href: "/student/chat",
    label: "Messages",
    icon: MessageSquare,
    section: "Communication",
  },
  {
    href: "/student/profile",
    label: "Profile",
    icon: UserRound,
    section: "Settings",
  },
  {
    href: "/student/settings",
    label: "Settings",
    icon: Settings,
    section: "Settings",
  },
];

export const TEACHER_MOBILE = [
  TEACHER_NAV[0],
  TEACHER_NAV[1],
  TEACHER_NAV.find((n) => n.href === "/teacher/chat")!,
];

export const STUDENT_MOBILE = [
  STUDENT_NAV[0],
  STUDENT_NAV.find((n) => n.href === "/student/exercises")!,
  STUDENT_NAV.find((n) => n.href === "/student/chat")!,
];

export function groupNav(nav: NavItem[]) {
  const sections: { name: string; items: NavItem[] }[] = [];
  for (const item of nav) {
    const existing = sections.find((s) => s.name === item.section);
    if (existing) existing.items.push(item);
    else sections.push({ name: item.section, items: [item] });
  }
  return sections;
}
