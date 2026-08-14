import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Wallet, MessageSquare, BookOpen, ReceiptText, GraduationCap } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { useChatUnread } from "@/hooks/useChatUnread";
import { useDoc } from "@/hooks/useFirestore";
import { lessonsByGroupQuery } from "@/lib/db/schedule";
import { studentPaymentsQuery } from "@/lib/db/payments";
import { studentAnnouncementsQuery } from "@/lib/db/announcements";
import { paths } from "@/lib/db/paths";
import { formatTime, formatDateShort, formatRelative, toDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";

export function StudentDashboardPage() {
  const { user, userDoc } = useAuth();
  const uid = user?.uid ?? "";
  const studentId = userDoc?.studentId ?? "";
  const groupId = userDoc?.groupId ?? "";

  const student = useDoc(studentId ? paths.students(studentId) : null);
  const lessons = useQuery(
    (db) => (groupId ? lessonsByGroupQuery(db, groupId) : null),
    [groupId]
  );
  const payments = useQuery(
    (db) => (studentId ? studentPaymentsQuery(db, studentId) : null),
    [studentId]
  );
  const announcements = useQuery(
    (db) =>
      studentId
        ? studentAnnouncementsQuery(db, ["all", `group:${groupId}`, `student:${studentId}`])
        : null,
    [groupId, studentId]
  );
  const { unreadCount, unreadCountLoading } = useChatUnread(uid);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return (lessons.docs ?? [])
      .filter((l) => toDate(l.data.startsAt)!.getTime() + 60 * 60 * 1000 > now)
      .sort((a, b) => toDate(a.data.startsAt)!.getTime() - toDate(b.data.startsAt)!.getTime())
      .slice(0, 4);
  }, [lessons.docs]);

  const unpaid = (payments.docs ?? []).filter((p) => p.data.status === "due");
  const unpaidTotal = unpaid.reduce((sum, p) => sum + (p.data.amount ?? 0), 0);

  const name = user?.displayName?.split(" ")[0] || "there";

  return (
    <div>
      <PageHeader
        title={`Hi ${name} 👋`}
        description={
          student.doc?.data.stream
            ? `${student.doc.data.stream} stream ${student.doc.data.bacInfo.year ? `· class of ${student.doc.data.bacInfo.year}` : ""}`
            : "Welcome to Purple World English"
        }
      />

      {!studentId ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Your account isn't linked to a student record yet. Your teacher will send you a{" "}
            sign-up invite soon.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link to="/student/payments" className="card p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Balance</span>
              </div>
              <p className="mt-1 text-lg font-bold text-foreground">{formatMoney(unpaidTotal)}</p>
              <p className="mt-0.5 text-xs">
                {unpaid.length === 0 ? (
                  <span className="text-success">All settled</span>
                ) : (
                  <span className="text-warning">{unpaid.length} outstanding</span>
                )}
              </p>
            </Link>
            <Link to="/student/grades" className="card p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Target</span>
              </div>
              <p className="mt-1 text-lg font-bold text-foreground">
                {student.doc?.data.bacInfo.targetScore ?? "—"}
                <span className="text-sm font-normal text-muted-foreground"> /20</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">BAC English goal</p>
            </Link>
            <Link to="/student/exercises" className="card p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Homework</span>
              </div>
              <p className="mt-1 text-lg font-bold text-foreground">Check</p>
              <p className="mt-0.5 text-xs text-muted-foreground">your exercises</p>
            </Link>
            <Link to="/student/chat" className="card p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Messages</span>
              </div>
              <p className="mt-1 text-lg font-bold text-foreground">{unreadCountLoading ? "…" : unreadCount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {unreadCount > 0 ? "unread messages" : "all caught up"}
              </p>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Upcoming lessons" />
              <CardContent>
                {lessons.loading ? (
                  <SkeletonList count={2} />
                ) : upcoming.length === 0 ? (
                  <EmptyState icon={CalendarClock} title="Nothing scheduled" description="Your next lessons will appear here." />
                ) : (
                  <ul className="divide-y divide-border">
                    {upcoming.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
                          {formatDateShort(l.data.startsAt).split(" ")[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{l.data.title}</p>
                          <p className="text-xs text-muted-foreground">
                          {formatTime(l.data.startsAt)} · {l.data.durationMin} min
                        </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatRelative(l.data.startsAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Latest news"
                action={<Badge variant="primary">Announcements</Badge>}
              />
              <CardContent>
                {announcements.loading ? (
                  <SkeletonList count={2} />
                ) : (announcements.docs ?? []).length === 0 ? (
                  <EmptyState icon={ReceiptText} title="No news yet" description="Announcements from your teacher show up here." />
                ) : (
                  <ul className="space-y-3">
                    {(announcements.docs ?? []).slice(0, 4).map((a) => (
                      <li key={a.id} className="rounded-xl bg-surface-muted p-3">
                        <p className="text-sm font-semibold text-foreground">{a.data.title}</p>
                        <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground">{a.data.body}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatRelative(a.data.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}