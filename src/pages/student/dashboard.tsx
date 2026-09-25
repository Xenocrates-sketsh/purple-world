import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Wallet, MessageSquare, BookOpen, ReceiptText, GraduationCap, FileText, CalendarClock } from "lucide-react";
import { WelcomeTour, shouldShowWelcomeTour } from "@/components/welcome-tour";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { useChatUnread } from "@/hooks/useChatUnread";
import { useDoc } from "@/hooks/useFirestore";
import { studentPaymentsQuery } from "@/lib/db/payments";
import { lessonsByGroupQuery } from "@/lib/db/schedule";
import { studentAnnouncementsQuery } from "@/lib/db/announcements";
import {
  allGroupsLessonResourcesQuery,
  groupLessonResourcesQuery,
} from "@/lib/db/lessonResources";
import { paths } from "@/lib/db/paths";
import { formatRelative, formatMoney, formatTime, formatDateShort, toDate } from "@/lib/format";
import type { StudentDoc, LessonResourceDoc, LessonDoc, PaymentDoc, AnnouncementDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";

/**
 * Most recent PDF lessons for the student's group. Two rule-provable queries
 * merged client-side (see db/lessonResources.ts): an unconstrained list query
 * is denied outright because the rule depends on assignedGroupIds.
 */
function useRecentLessonResources(myGroupId: string | null, limit = 4) {
  const allGroups = useQuery<LessonResourceDoc>((db) => allGroupsLessonResourcesQuery(db));
  const myGroup = useQuery<LessonResourceDoc>(
    (db) => (myGroupId ? groupLessonResourcesQuery(db, myGroupId) : null),
    [myGroupId]
  );

  const merged = useMemo(() => {
    const seen = new Map<string, NonNullable<typeof allGroups.docs>[number]>();
    for (const d of [...(allGroups.docs ?? []), ...(myGroup.docs ?? [])]) {
      if (!seen.has(d.id)) seen.set(d.id, d);
    }
    return {
      docs: [...seen.values()],
      loading: allGroups.loading || myGroup.loading,
      error: allGroups.error ?? myGroup.error ?? null,
    };
  }, [allGroups.docs, allGroups.loading, allGroups.error, myGroup.docs, myGroup.loading, myGroup.error]);

  const visible = useMemo(() => {
    return merged.docs
      .sort((a, b) => (b.data.createdAt?.toMillis?.() ?? 0) - (a.data.createdAt?.toMillis?.() ?? 0))
      .slice(0, limit);
  }, [merged.docs, limit]);

  return { loading: merged.loading, lessons: visible, error: merged.error };
}

export function StudentDashboardPage() {
  const { user, userDoc } = useAuth();
  const uid = user?.uid ?? "";
  const studentId = userDoc?.studentId ?? "";
  const groupId = userDoc?.groupId ?? "";

  const student = useDoc<StudentDoc>(studentId ? paths.students(studentId) : null);
  const payments = useQuery<PaymentDoc>(
    (db) => (studentId ? studentPaymentsQuery(db, studentId) : null),
    [studentId]
  );
  const announcements = useQuery<AnnouncementDoc>(
    (db) =>
      studentId
        ? studentAnnouncementsQuery(db, ["all", `group:${groupId}`, `student:${studentId}`])
        : null,
    [groupId, studentId]
  );
  const { unreadCount, unreadCountLoading } = useChatUnread(uid);

  const newLessons = useRecentLessonResources(groupId || null, 4);

  // Dated schedule classes for the student's group. Rule-provable
  // (where groupId == myGroupId) with a covering composite index.
  const schedule = useQuery<LessonDoc>(
    (db) => (groupId ? lessonsByGroupQuery(db, groupId) : null),
    [groupId]
  );

  const upcoming = useMemo(() => {
    const now = Date.now();
    return (schedule.docs ?? [])
      .filter((l) => {
        const t = toDate(l.data.startsAt);
        return t && t.getTime() + 60 * 60 * 1000 > now;
      })
      .sort((a, b) => toDate(a.data.startsAt)!.getTime() - toDate(b.data.startsAt)!.getTime())
      .slice(0, 4);
  }, [schedule.docs]);

  const unpaid = (payments.docs ?? []).filter((p) => p.data.status === "due");
  const unpaidTotal = unpaid.reduce((sum, p) => sum + (p.data.amount ?? 0), 0);

  const name = user?.displayName?.split(" ")[0] || "there";
  const [tourOpen, setTourOpen] = useState(() => shouldShowWelcomeTour());

  return (
    <div>
      {tourOpen ? <WelcomeTour onDone={() => setTourOpen(false)} /> : null}
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
                <Wallet className="h-5 w-5" aria-hidden />
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
                <GraduationCap className="h-5 w-5" aria-hidden />
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
                <BookOpen className="h-5 w-5" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Homework</span>
              </div>
              <p className="mt-1 text-lg font-bold text-foreground">Check</p>
              <p className="mt-0.5 text-xs text-muted-foreground">your exercises</p>
            </Link>
            <Link to="/student/chat" className="card p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-5 w-5" aria-hidden />
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
              <CardHeader
                title="New lessons"
                description="Just dropped in by your teacher"
                action={
                  <Link to="/student/lessons" className="text-xs font-medium text-primary hover:underline">
                    View all
                  </Link>
                }
              />
              <CardContent>
                {newLessons.error ? (
                  <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger">
                    Couldn't load new lessons ({String((newLessons.error as { code?: unknown })?.code ?? "unknown")}) — check your connection and pull to refresh. If it persists, tell your teacher.
                  </p>
                ) : newLessons.loading ? (
                  <SkeletonList count={2} />
                ) : newLessons.lessons.length === 0 ? (
                  <EmptyState
                    icon={Sparkles}
                    title="Nothing new yet"
                    description="When your teacher publishes a lesson, it will show up here."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {newLessons.lessons.map((row) => {
                      const fileCount = row.data.attachmentUrls?.length ?? 0;
                      return (
                        <li key={row.id}>
                          <Link
                            to="/student/lessons"
                            className="flex items-start gap-3 py-3 transition-colors hover:bg-surface-muted/50"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                              <BookOpen className="h-5 w-5" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{row.data.title}</p>
                              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                {fileCount > 0 ? (
                                  <span className="inline-flex items-center gap-1">
                                    <FileText className="h-3 w-3" aria-hidden />
                                    {fileCount} PDF
                                  </span>
                                ) : (
                                  <span>No file yet</span>
                                )}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatRelative(row.data.createdAt)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Upcoming classes" description="Your scheduled sessions" />
              <CardContent>
                {schedule.error ? (
                  <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger">
                    Couldn't load classes ({String((schedule.error as { code?: unknown })?.code ?? "unknown")}) — check your connection and pull to refresh.
                  </p>
                ) : schedule.loading ? (
                  <SkeletonList count={2} />
                ) : upcoming.length === 0 ? (
                  <EmptyState icon={CalendarClock} title="Nothing scheduled" description="Your next classes will appear here." />
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