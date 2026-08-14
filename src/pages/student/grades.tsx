import { useMemo } from "react";
import { GraduationCap, TrendingUp, Target } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { studentResultsQuery } from "@/lib/db/assessments";
import { allAssessmentsQuery } from "@/lib/db/assessments";
import { useDoc } from "@/hooks/useFirestore";
import { paths } from "@/lib/db/paths";
import { formatDate } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";

export function StudentGradesPage() {
  const { userDoc } = useAuth();
  const studentId = userDoc?.studentId ?? "";
  const student = useDoc(studentId ? paths.students(studentId) : null);
  const results = useQuery((db) => studentResultsQuery(db, studentId), [studentId]);
  const assessments = useQuery(allAssessmentsQuery);

  const byId = useMemo(() => new Map(assessments.docs?.map((a) => [a.id, a.data])), [assessments.docs]);

  const rows = useMemo(
    () =>
      (results.docs ?? [])
        .map((r) => ({
          id: r.id,
          score: r.data.score,
          feedback: r.data.feedback,
          createdAt: r.data.createdAt,
          assessment: byId.get(r.data.assessmentId) ?? null,
        }))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()),
    [results.docs, byId]
  );

  const average =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + r.score, 0) / rows.length
      : null;
  const target = student.doc?.data.bacInfo.targetScore ?? null;
  const achieved = target != null && average != null ? average >= target : null;

  const tone = achieved === true ? "success" : achieved === false ? "warning" : "neutral";

  return (
    <div>
      <PageHeader title="My grades" description="Your performance across assessments." />

      {rows.length > 0 ? (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Average"
            tone="primary"
            icon={<TrendingUp className="h-5 w-5" aria-hidden />}
            value={average != null ? Number(average.toFixed(2)) + " / 20" : "—"}
          />
          <StatCard
            label="BAC target"
            tone={tone}
            icon={<Target className="h-5 w-5" aria-hidden />}
            value={target != null ? target + " / 20" : "Not set"}
          />
          <StatCard
            label="Assessments"
            tone="info"
            icon={<GraduationCap className="h-5 w-5" aria-hidden />}
            value={rows.length}
            hint={target != null ? (achieved ? "You're on track" : "Keep pushing toward your target") : undefined}
          />
        </div>
      ) : null}

      {results.loading ? (
        <SkeletonList count={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No grades yet"
          description="Grades from your teacher will appear here after your first assessment."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-4">
                  <span
                    className={
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold " +
                      (r.score >= 10 ? "bg-success-soft text-success" : "bg-danger-soft text-danger")
                    }
                  >
                    {r.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {r.assessment?.title ?? "Assessment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.createdAt)} · {r.assessment?.type}
                    </p>
                    {r.feedback ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">“{r.feedback}”</p>
                    ) : null}
                  </div>
                  <Badge
                    variant={r.score >= (r.assessment?.maxScore ?? 20) / 2 ? "success" : "danger"}
                  >
                    {r.score} / {r.assessment?.maxScore ?? 20}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}