"use client";

import * as React from "react";
import { ClipboardCheck, Award } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ASSESSMENT_TYPES, labelFor } from "@/lib/constants";

interface GradeRow {
  id: string;
  title: string;
  type: string;
  date: string;
  score: string;
  maxScore: string;
  description: string | null;
  feedback: string | null;
}

interface GradesData {
  grades: GradeRow[];
  stats: {
    overall: number | null;
    count: number;
    byType: Record<string, { count: number; average: number | null }>;
  };
}

export default function StudentGradesPage() {
  const [data, setData] = React.useState<GradesData | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    api
      .get<GradesData>("/api/student/grades")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <EmptyState icon={ClipboardCheck} title="Could not load your grades." />;
  if (!data) return <Spinner className="py-24" />;

  return (
    <>
      <PageHeader title="My Grades" description="Your results across the year." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Award className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none text-foreground">
              {data.stats.overall === null ? "—" : `${data.stats.overall}/20`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Overall average</p>
          </div>
        </Card>
        {Object.entries(data.stats.byType).map(([type, v]) => (
          <Card key={type} className="p-4">
            <p className="text-2xl font-bold leading-none text-foreground">
              {v.average === null ? "—" : `${v.average}/20`}
            </p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {labelFor(ASSESSMENT_TYPES, type)} ({v.count})
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All results</CardTitle>
        </CardHeader>
        <CardContent>
          {data.grades.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No grades yet"
              description="Your teacher hasn't published any results yet."
            />
          ) : (
            <ul className="divide-y divide-border" role="list">
              {data.grades.map((g) => (
                <li key={g.id} className="py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{g.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {labelFor(ASSESSMENT_TYPES, g.type)} · {formatDate(g.date)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-foreground">
                        {g.score} <span className="text-sm font-medium text-muted-foreground">/ {g.maxScore}</span>
                      </p>
                    </div>
                  </div>
                  {g.feedback && (
                    <p className="mt-2 rounded-xl bg-surface-muted/60 p-3 text-sm text-muted-foreground">
                      {g.feedback}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}