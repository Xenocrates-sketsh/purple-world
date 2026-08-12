"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  MessageSquare,
  Wallet,
  ArrowRight,
  Megaphone,
  ClipboardCheck,
  BookOpen,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatTime, timeAgo } from "@/lib/format";
import type { StudentDashboardData } from "@/lib/types";

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
  icon: typeof FileText;
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

export default function StudentDashboardPage() {
  const [data, setData] = React.useState<StudentDashboardData | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    api
      .get<StudentDashboardData>("/api/student/dashboard")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <EmptyState icon={CalendarDays} title="Could not load your dashboard." />;
  }
  if (!data) {
    return <Spinner className="py-24" />;
  }

  const name = data.profile.fullName.split(" ")[0] || "there";

  return (
    <>
      <PageHeader
        title={`Hey ${name} 👋`}
        description={
          data.profile.groupName
            ? `Welcome to ${data.profile.groupName}.`
            : "You're not in a group yet."
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Pending exercises"
          value={data.pendingExercises}
          href="/student/exercises"
          icon={FileText}
          tone="bg-primary-soft text-primary"
        />
        <StatCard
          label="Unread messages"
          value={data.unreadMessages}
          href="/student/chat"
          icon={MessageSquare}
          tone="bg-info-soft text-info"
        />
        <StatCard
          label="Attendance"
          value={data.attendance ? `${data.attendance.rate}%` : "—"}
          href="/student/group"
          icon={UsersRound}
          tone="bg-success-soft text-success"
        />
        <StatCard
          label="Payment"
          value={data.paymentStatus === "overdue" ? "Overdue" : data.paymentStatus === "due" ? "Due" : data.paymentStatus === "paid" ? "Paid" : "—"}
          href="/student/payments"
          icon={Wallet}
          tone={data.paymentStatus === "overdue" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden /> Next lesson
            </h2>
          </div>
          <CardContent>
            {data.nextLesson ? (
              <div className="rounded-2xl border border-border p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-16 flex-col items-center justify-center rounded-xl text-xs font-semibold leading-tight"
                    style={{ backgroundColor: `${data.nextLesson.groupColor}1a`, color: data.nextLesson.groupColor }}
                  >
                    <span className="text-sm">
                      {new Date(data.nextLesson.startsAt).toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span>{formatTime(data.nextLesson.startsAt)}</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{data.nextLesson.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.nextLesson.groupName}
                      {data.nextLesson.location ? ` · ${data.nextLesson.location}` : ""}
                      {data.nextLesson.durationMin === 90 ? " · 1h30" : ""}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming lesson"
                description="Your teacher will schedule your next session soon."
              />
            )}

            <h2 className="mt-6 flex items-center gap-2 text-base font-semibold text-foreground">
              <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden /> Latest grades
            </h2>
            {data.latestGrades.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No grades published yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border" role="list">
                {data.latestGrades.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                    <p className="truncate text-sm font-medium text-foreground">{g.title}</p>
                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      {g.score} / {g.maxScore}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Megaphone className="h-4 w-4 text-primary" aria-hidden /> Announcements
              </h2>
              <Link
                href="/student/announcements"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                All <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <CardContent>
              {data.latestAnnouncements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing new.</p>
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {data.latestAnnouncements.map((a) => (
                    <li key={a.id} className="py-2.5">
                      <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{a.content}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">{timeAgo(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" aria-hidden /> BAC Program
              </h2>
              <Link
                href="/student/program"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Open <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Study the official curriculum with your teacher&apos;s lessons.
              </p>
            </CardContent>
          </Card>

          {data.attendance && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Attendance this year</p>
                  <Badge tone="success">{data.attendance.rate}%</Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${data.attendance.rate}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {data.attendance.present} present · {data.attendance.absent} absent · {data.attendance.late} late
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}