import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { notificationsQuery, markNotificationRead, markAllNotificationsRead } from "@/lib/db/notifications";
import type { NotificationDoc } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  message: "New message",
  new_exercise: "New exercise",
  new_announcement: "Announcement",
  upcoming_lesson: "Upcoming lesson",
  payment_due: "Payment reminder",
  new_grade: "New grade",
  schedule_change: "Schedule change",
};

export function NotificationBell({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { docs } = useQuery<NotificationDoc>(
    user ? (db) => notificationsQuery(db, user.uid) : null,
    [user?.uid]
  );

  const items = docs ?? [];
  const unread = items.filter((n) => !n.data.read);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-notif-panel]")) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  async function handleMarkRead(id: string) {
    await markNotificationRead(user.uid, id);
  }

  async function handleMarkAll() {
    await markAllNotificationsRead(user.uid, unread.map((n) => n.id));
  }

  return (
    <div className="relative" data-notif-panel>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-border bg-surface p-2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`Notifications${unread.length ? ` (${unread.length} unread)` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="animate-fade-in-up absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unread.length > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              items.slice(0, 15).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.data.read) handleMarkRead(n.id);
                    setOpen(false);
                    onNavigate?.();
                  }}
                  disabled={!n.data.link}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-surface-muted",
                    !n.data.read && "bg-primary-soft/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.data.read ? "bg-transparent" : "bg-primary"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-foreground">
                      {TYPE_LABEL[n.data.type] ?? n.data.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                      {n.data.body ?? n.data.title}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatRelative(n.data.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}