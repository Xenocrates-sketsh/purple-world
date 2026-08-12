"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  ClipboardCheck,
  MessageSquare,
  CalendarDays,
  Megaphone,
  ArrowRight,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDate, formatTime, timeAgo } from "@/lib/format";
import { ANNOUNCEMENT_CATEGORIES, labelFor } from "@/lib/constants";
import type { TeacherDashboardData } from "@/lib/types";

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  href: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="card-surface flex items-center gap-4 rounded-2xl p-4 shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

export default function TeacherDashboardPage() {
  const [data, setData] = React.useState<TeacherDashboardData | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    api
      .get<TeacherDashboardData>("/api/teacher/dashboard")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <EmptyState icon={CalendarDays} title="Could not load your dashboard." />;
  }
  if (!data) {
    return <Spinner className="py-24" />;
  }

  return (
    <>
      <PageHeader
        title="Good day, Hafsa 👋"
        description="Here's a snapshot of your classes today."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Students"
          value={data.totals.active}
          href="/teacher/students"
          icon={Users}
          tone="bg-primary-soft text-primary"
        />
        <StatCard
          label="Payments pending"
          value={data.totals.unpaid}
          href="/teacher/payments"
          icon={Wallet}
          tone="bg-warning-soft text-warning"
        />
        <StatCard
          label="Submissions to grade"
          value={data.pendingSubmissions}
          href="/teacher/exercises"
          icon={ClipboardCheck}
          tone="bg-success-soft text-success"
        />
        <StatCard
          label="Unread messages"
          value={data.unreadMessages}
          href="/teacher/chat"
          icon={MessageSquare}
          tone="bg-info-soft text-info"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
              Today&apos;s lessons
            </h2>
            <Link
              href="/teacher/schedule"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Full schedule <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <CardContent>
            {data.todayLessons.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing scheduled today"
                description="Enjoy the break or plan tomorrow's lesson."
              />
            ) : (
              <ul className="divide-y divide-border" role="list">
                {data.todayLessons.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-3">
                    <div
                      className="flex h-10 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] leading-tight font-semibold"
                      style={{ backgroundColor: `${l.groupColor}1a`, color: l.groupColor }}
                    >
                      <span>{formatTime(l.startsAt)}</span>
                      {l.durationMin === 90 && <span>· 1h30</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{l.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.groupName}
                        {l.location ? ` · ${l.location}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/schedule?lesson=${l.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Attendance
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="px-5 pb-2 pt-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
              Average grade
            </h2>
          </div>
          <CardContent>
            {data.gradeAverage === null ? (
              <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
            ) : (
              <div>
                <p className="text-4xl font-bold text-foreground">
                  {data.gradeAverage}
                  <span className="text-base font-medium text-muted-foreground"> /20</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Across all graded assessments.
                </p>
              </div>
            )}
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Payments overdue
              </p>
              <p className="mt-1 text-lg font-semibold text-danger">{data.totals.overdue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Megaphone className="h-4 w-4 text-primary" aria-hidden />
            Latest announcements
          </h2>
          <Link
            href="/teacher/announcements"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Compose <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <CardContent>
          {data.recentAnnouncements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Share news with your students or groups."
            />
          ) : (
            <ul className="divide-y divide-border" role="list">
              {data.recentAnnouncements.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{a.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{a.content}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone="neutral">{labelFor(ANNOUNCEMENT_CATEGORIES, a.category)}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
            Upcoming lessons
          </h2>
        </div>
        <CardContent>
          {data.upcomingLessons.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming lessons"
              description="Schedule your next lesson from the schedule page."
            />
          ) : (
            <ul className="divide-y divide-border" role="list">
              {data.upcomingLessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{l.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.groupName} · {formatDate(l.startsAt)} · {formatTime(l.startsAt)}
                    </p>
                  </div>
                  <Badge tone="info">{formatDate(l.startsAt)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}