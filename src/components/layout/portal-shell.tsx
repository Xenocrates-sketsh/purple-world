import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { ChatLauncher } from "./chat-launcher";
import { SilkBackground } from "@/components/silk-background";
import { fruitAvatarSrc } from "@/lib/constants";
import type { NavItem } from "./nav-config";

interface PortalShellProps {
  pageTitle: string;
  primaryNav: NavItem[];
  secondaryNav: NavItem[];
  children: ReactNode;
}

function isActivePath(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.to;
  return pathname.startsWith(item.to);
}

// The paths whose pages have a working notification link target; used to
// decide whether the notification body is clickable through Router.
export function PortalShell({ pageTitle, primaryNav, secondaryNav, children }: PortalShellProps) {
  const { user, userDoc, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeLabel =
    [...primaryNav, ...secondaryNav].find((n) => isActivePath(n, location.pathname))?.label ??
    pageTitle;

  const isChatRoute =
    location.pathname.startsWith("/teacher/chat") ||
    location.pathname.startsWith("/student/chat");

  async function handleLogout() {
    const { getAuth, signOut } = await import("firebase/auth");
    await signOut(getAuth());
    navigate("/");
  }

  function NavList({ items, onItemClick, className }: { items: NavItem[]; onItemClick?: () => void; className?: string }) {
    return (
      <nav className={cn("flex flex-col gap-1", className)} aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(item, location.pathname);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-6 w-6 shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  const allPrimary = [...primaryNav].slice(0, 5);
  const moreItems = [...secondaryNav];

  return (
    <div className="isolate min-h-screen bg-background">
      <SilkBackground />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface/60 p-4 lg:flex">
        <Brand subtitle className="px-2 py-2" />
        <NavList items={[...primaryNav, ...secondaryNav]} className="mt-6 flex-1" />
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center gap-2.5 px-2">
            <Avatar
              name={userDoc?.displayName ?? user?.email}
              src={userDoc?.avatarUrl ?? fruitAvatarSrc(userDoc?.avatarKey)}
              size="sm"
            />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {userDoc?.displayName ?? "Account"}
            </p>
              <p className="text-xs capitalize text-muted-foreground">{role}</p>
            </div>
            <ThemeToggle compact />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => navigate(role === "teacher" ? "/teacher/settings" : "/student/settings")}
            className="rounded-xl border border-border bg-surface p-1.5"
            aria-label="Account settings"
          >
            <Avatar
              name={userDoc?.displayName ?? user?.email}
              src={userDoc?.avatarUrl ?? fruitAvatarSrc(userDoc?.avatarKey)}
              className="h-7 w-7 text-xs"
            />
          </button>
        </div>
      </header>

      {/* Top bar (desktop) */}
      <div className="mx-auto flex w-full max-w-7xl flex-col lg:ml-64 lg:pr-0">
        <div className="hidden items-center justify-between border-b border-border px-6 py-4 lg:flex">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{activeLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
          <h2 className="mb-4 text-lg font-bold text-foreground lg:hidden">{activeLabel}</h2>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {allPrimary.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item, location.pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-7 w-7" aria-hidden />
                {item.label}
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-[11px] font-medium text-muted-foreground"
          >
            <Menu className="h-5 w-5" aria-hidden />
            More
          </button>
        </div>
      </nav>

      {/* More drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="More menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="animate-fade-in-up absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-surface-elevated p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">More</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-muted"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList items={moreItems} onItemClick={() => setDrawerOpen(false)} />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      ) : null}

      <ChatLauncher onChatRoute={isChatRoute} />
    </div>
  );
}