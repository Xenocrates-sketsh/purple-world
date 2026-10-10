import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

import type { QueryState } from "@/hooks/useFirestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import type { AssessmentDoc, AssessmentResultDoc } from "@/lib/types";

export function StudentGradesCard({
  results,
  assessmentsById,
}: {
  results: QueryState<AssessmentResultDoc>;
  assessmentsById: Map<string, AssessmentDoc>;
}) {
  return (
    <Card>
      <CardHeader
        title="Recent grades"
        action={
          <Link to="/teacher/grades" className="text-sm font-medium text-primary hover:underline">
            All grades
          </Link>
        }
      />
      <CardContent className="p-0">
        {results.loading ? (
          <div className="p-5"><SkeletonList count={3} /></div>
        ) : (results.docs ?? []).length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No grades yet"
            description="Grades you record under Assessments will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {(results.docs ?? []).slice(0, 6).map((r) => {
              const ass = assessmentsById.get(r.data.assessmentId) ?? null;
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {ass?.title ?? "Assessment"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.data.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {r.data.score} / {ass?.maxScore ?? "…"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
