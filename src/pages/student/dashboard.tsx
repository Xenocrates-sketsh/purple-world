import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Wallet, MessageSquare, BookOpen, ReceiptText, GraduationCap, FileText } from "lucide-react";
import { onSnapshot, type Query } from "firebase/firestore";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { useChatUnread } from "@/hooks/useChatUnread";
import { useDoc } from "@/hooks/useFirestore";
import { getFirestoreDb } from "@/lib/firebase";
import { studentPaymentsQuery } from "@/lib/db/payments";
import { studentAnnouncementsQuery } from "@/lib/db/announcements";
import { allUnitsQuery, lessonsOfUnitQuery } from "@/lib/db/program";
import { paths } from "@/lib/db/paths";
import { formatRelative, formatMoney } from "@/lib/format";
import type { StudentDoc, ProgramLessonDoc, ProgramUnitDoc, PaymentDoc, AnnouncementDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";

/**
 * Aggregate the most recent program lessons across all units, restricted to
 * the student's group. Subscribes to the units collection once, then opens
 * a per-unit listener for each unit and merges the results.
 */
function useRecentProgramLessons(myGroupId: string | null, limit = 4) {
  const units = useQuery<ProgramUnitDoc>((db) => allUnitsQuery(db));
  const [perUnit, setPerUnit] = useState<Record<string, ProgramLessonDoc[]>>({});

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const ids = (units.docs ?? []).map((u) => u.id);
    if (ids.length === 0) {
      setPerUnit({});
      return () => {};
    }
    const db = getFirestoreDb();
    for (const unitId of ids) {
      const q: Query = lessonsOfUnitQuery(db, unitId);
      const off = onSnapshot(
        q,
        (snap) => {
          setPerUnit((prev) => ({
            ...prev,
            [unitId]: snap.docs.map((d) => d.data() as ProgramLessonDoc),
          }));
        },
        () => {
          setPerUnit((prev) => ({ ...prev, [unitId]: [] }));
        }
      );
      unsubs.push(off);
    }
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [units.docs]);

  const visible = useMemo(() => {
    const flat: { unitId: string; data: ProgramLessonDoc }[] = [];
    for (const [unitId, lessons] of Object.entries(perUnit)) {
      for (const data of lessons) {
        const g = data.assignedGroupIds ?? [];
        if (g.length === 0 || (myGroupId && g.includes(myGroupId))) {
          flat.push({ unitId, data });
        }
      }
    }
    return flat
      .sort((a, b) => (b.data.createdAt?.toMillis?.() ?? 0) - (a.data.createdAt?.toMillis?.() ?? 0))
      .slice(0, limit);
  }, [perUnit, myGroupId, limit]);

  const loading = units.loading || (
    (units.docs?.length ?? 0) > 0 && Object.keys(perUnit).length < (units.docs?.length ?? 0)
  );

  const unitTitleById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of units.docs ?? []) m[u.id] = u.data.title;
    return m;
  }, [units.docs]);

  return { loading, lessons: visible, unitTitleById };
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

  const newLessons = useRecentProgramLessons(groupId || null, 4);

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
              <CardHeader
                title="New lessons"
                description="Just dropped in by your teacher"
                action={
                  <Link to="/student/program" className="text-xs font-medium text-primary hover:underline">
                    View all
                  </Link>
                }
              />
              <CardContent>
                {newLessons.loading ? (
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
                      const unitLabel = newLessons.unitTitleById[row.unitId];
                      return (
                        <li key={`${row.unitId}:${row.id}`}>
                          <Link
                            to="/student/program"
                            className="flex items-start gap-3 py-3 transition-colors hover:bg-surface-muted/50"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                              <BookOpen className="h-5 w-5" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{row.data.title}</p>
                              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                {unitLabel ? <span>{unitLabel}</span> : null}
                                {fileCount > 0 ? (
                                  <span className="inline-flex items-center gap-1">
                                    <FileText className="h-3 w-3" aria-hidden />
                                    {fileCount} PDF
                                  </span>
                                ) : null}
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