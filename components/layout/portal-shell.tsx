"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, MoreHorizontal, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/lib/auth-context";
import {
  groupNav,
  TEACHER_NAV,
  STUDENT_NAV,
  TEACHER_MOBILE,
  STUDENT_MOBILE,
  type NavItem,
} from "./nav-config";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function isActive(pathname: string, item: NavItem) {
  if (item.match?.includes(pathname)) return true;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function NavList({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">
      {groupNav(nav).map((section) => (
        <div key={section.name}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.name}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-soft text-primary"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PortalShell({
  role,
  children,
}: {
  role: "teacher" | "student";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [drawer, setDrawer] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const nav = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  const mobile = role === "teacher" ? TEACHER_MOBILE : STUDENT_MOBILE;

  React.useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-12 w-12 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your space…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href={role === "teacher" ? "/teacher" : "/student"}>
            <Logo />
          </Link>
        </div>
        <NavList nav={nav} pathname={pathname} />
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={user.fullName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {role === "teacher" ? "Teacher" : "Student"}
              </p>
            </div>
            <ThemeToggle className="h-8 w-8" />
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass-nav sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
        <button
          onClick={() => setDrawer(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={role === "teacher" ? "/teacher" : "/student"}>
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell role={role} />
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
        aria-label="Quick navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {mobile.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setDrawer(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            More
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setDrawer(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r border-border bg-surface"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <Logo />
                <button
                  onClick={() => setDrawer(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavList nav={nav} pathname={pathname} onNavigate={() => setDrawer(false)} />
              <div className="flex items-center justify-between border-t border-border p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.fullName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
                    <p className="text-xs capitalize text-muted-foreground">{role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
