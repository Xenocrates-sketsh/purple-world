import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  Wallet,
  CalendarClock,
  MessageSquare,
  FileText,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { useChatUnread } from "@/hooks/useChatUnread";
import { allStudentsQuery } from "@/lib/db/students";
import { allGroupsQuery } from "@/lib/db/groups";
import { allPaymentsQuery } from "@/lib/db/payments";
import { allAnnouncementsQuery } from "@/lib/db/announcements";
import { formatTime, formatRelative, toDate } from "@/lib/format";
import type { LessonDoc, SubmissionDoc } from "@/lib/types";
import { PageHeader, StatCard } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { collection, collectionGroup, orderBy, query, where } from "firebase/firestore";

export function TeacherDashboardPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";

  const students = useQuery(allStudentsQuery);
  const groups = useQuery(allGroupsQuery);
  const payments = useQuery(allPaymentsQuery);
  const announcements = useQuery(allAnnouncementsQuery);
  const pending = useQuery<SubmissionDoc>(
    (db) =>
      query(
        collectionGroup(db, "submissions"),
        where("status", "in", ["submitted", "late"]),
        orderBy("submittedAt", "desc")
      ),
    []
  );
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const today = useQuery<LessonDoc>(
    (db) =>
      query(
        collection(db, "lessons"),
        where("startsAt", ">=", start),
        where("startsAt", "<", end),
        orderBy("startsAt", "asc")
      ),
    [start.getTime()]
  );
  const { unreadCount, unreadCountLoading } = useChatUnread(uid);

  const activeStudents = (students.docs ?? []).filter((s) => s.data.active).length;
  const duePayments = (payments.docs ?? []).filter(
    (p) => p.data.status === "due" && toDate(p.data.dueDate) != null && toDate(p.data.dueDate)! < new Date()
  ).length;
  const toReview = (pending.docs ?? []).length;

  const todayLessons = (today.docs ?? []).filter((l) => {
    const d = toDate(l.data.startsAt);
    return d != null && d >= start && d < end;
  });

  return (
    <div>
      <PageHeader
        title="Welcome back, Hafsa"
        description="A quick look at your classes today."
        action={
          <Link to="/teacher/schedule" className="btn-secondary btn-sm">
            <CalendarClock className="h-4 w-4" aria-hidden /> Schedule
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Students"
          value={students.loading ? "…" : `${activeStudents} active`}
          hint={`${(students.docs ?? []).length} total`}
          icon={<Users className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Groups"
          value={groups.loading ? "…" : (groups.docs ?? []).length}
          icon={<BookOpen className="h-5 w-5" aria-hidden />}
          tone="info"
        />
        <StatCard
          label="Payments due"
          value={payments.loading ? "…" : duePayments}
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          tone={duePayments > 0 ? "warning" : "success"}
          hint={duePayments > 0 ? "overdue" : "all settled"}
        />
        <StatCard
          label="Unread chats"
          value={unreadCountLoading ? "…" : unreadCount}
          icon={<MessageSquare className="h-5 w-5" aria-hidden />}
          tone={unreadCount > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Today's lessons"
              action={
                <Link to="/teacher/schedule" className="text-sm font-medium text-primary hover:underline">
                  Full schedule
                </Link>
              }
            />
            <CardContent>
              {today.loading ? (
                <SkeletonList count={2} />
              ) : todayLessons.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No lessons today"
                  description="Enjoy the breather — or plan ahead from the schedule."
                  action={
                    <Link to="/teacher/schedule" className="btn-secondary btn-sm">
                      Open schedule
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {todayLessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{l.data.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(l.data.startsAt)} · {l.data.durationMin} min
                        </p>
                      </div>
                      <Link
                        to={`/teacher/schedule/attendance/${l.id}`}
                        className="btn-ghost btn-sm shrink-0"
                      >
                        Attendance <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader
              title="Submissions to review"
              description={toReview > 0 ? `${toReview} waiting for your feedback` : undefined}
              action={
                <Link to="/teacher/exercises" className="text-sm font-medium text-primary hover:underline">
                  Exercises
                </Link>
              }
            />
            <CardContent>
              {pending.loading ? (
                <SkeletonList count={2} />
              ) : toReview === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Nothing to review"
                  description="New submissions will show up here."
                />
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
                  <FileText className="h-5 w-5 shrink-0" aria-hidden />
                  <span>
                    <strong>{toReview}</strong> submission{toReview === 1 ? "" : "s"} need grading.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader title="Recent announcements" />
            <CardContent className="px-3 py-2">
              {announcements.loading ? (
                <SkeletonList count={3} />
              ) : (announcements.docs ?? []).length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No announcements yet"
                  action={
                    <Link to="/teacher/announcements" className="btn-secondary btn-sm">
                      Write one
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-1">
                  {(announcements.docs ?? []).slice(0, 5).map((a) => (
                    <li key={a.id}>
                      <Link
                        to="/teacher/announcements"
                        className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-muted"
                      >
                        <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {a.data.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {formatRelative(a.data.createdAt)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
