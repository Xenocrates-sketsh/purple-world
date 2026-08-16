import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Save, Send, CheckCircle2, Clock } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { useDoc } from "@/hooks/useFirestore";
import { submissionsOfExerciseQuery, gradeSubmission } from "@/lib/db/exercises";
import { allStudentsQuery } from "@/lib/db/students";
import { paths } from "@/lib/db/paths";
import { formatRelative } from "@/lib/format";
import type { ExerciseDoc, StudentDoc, SubmissionDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

function StatusBadge({ s }: { s: SubmissionDoc | null }) {
  if (!s) return <Badge variant="neutral">Not submitted</Badge>;
  if (s.status === "graded")
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" aria-hidden /> Graded · {s.grade}
      </Badge>
    );
  return <Badge variant={s.status === "late" ? "warning" : "info"}>{s.status === "late" ? "Late" : "Submitted"}</Badge>;
}

export function TeacherExerciseDetailPage() {
  const { exerciseId = "" } = useParams();
  const { toast } = useToast();
  const exercise = useDoc<ExerciseDoc>(paths.exercises(exerciseId));
  const students = useQuery<StudentDoc>(allStudentsQuery);
  const submissions = useQuery<SubmissionDoc>((db) => submissionsOfExerciseQuery(db, exerciseId), [exerciseId]);

  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, { grade: string; feedback: string }> = {};
    for (const s of submissions.docs ?? []) {
      next[s.id] = { grade: s.data.grade?.toString() ?? "", feedback: s.data.feedback ?? "" };
    }
    setGrades(next);
  }, [submissions.docs]);

  const data = exercise.doc?.data;
  const submissionsById = useDocMap(submissions.docs);

  const roster = useMemo(() => {
    if (!data) return [];
    const memberIds = new Set<string>([...data.assignedStudentIds]);
    if (data.assignedGroupIds.length > 0) {
      for (const s of students.docs ?? []) {
        if (s.data.groupId && data.assignedGroupIds.includes(s.data.groupId)) memberIds.add(s.id);
      }
    }
    const byName = (students.docs ?? []).filter((s) => memberIds.has(s.id));
    return [...byName].sort((a, b) => a.data.name.localeCompare(b.data.name));
  }, [data, students.docs]);

  async function onGrade(studentId: string) {
    const g = grades[studentId];
    if (!g || g.grade.trim() === "") return;
    setSavingId(studentId);
    try {
      const maxScore = 20;
      await gradeSubmission(exerciseId, studentId, Math.max(0, Math.min(maxScore, Number(g.grade))), g.feedback.trim() || null);
      toast("Grade saved", { variant: "success" });
    } catch {
      toast("Could not save grade", { variant: "error" });
    } finally {
      setSavingId(null);
    }
  }

  if (exercise.loading) return <SkeletonList count={2} />;
  if (!exercise.doc || !data) {
    return (
      <EmptyState
        icon={FileText}
        title="Exercise not found"
        action={<Link to="/teacher/exercises" className="btn-secondary btn-sm">Back to exercises</Link>}
      />
    );
  }

  return (
    <div>
      <Link to="/teacher/exercises" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Exercises
      </Link>

      <PageHeader
        title={data.title}
        description={
          data.deadline
            ? `Due ${formatRelative(data.deadline)} · ${data.difficulty}`
            : `${data.difficulty} · no deadline`
        }
        action={data.attachmentUrls[0] ? (
          <a href={data.attachmentUrls[0]} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
            Open attachment
          </a>
        ) : undefined}
      />

      {(data.description || data.instructions) && (
        <Card className="mb-6">
          <CardContent className="space-y-3">
            {data.description ? <p className="text-sm text-foreground">{data.description}</p> : null}
            {data.instructions ? (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</p>
                <p className="whitespace-pre-wrap text-sm text-foreground">{data.instructions}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Assigned students ({roster.length})
        </h2>
        <span className="text-xs text-muted-foreground">
          {(submissions.docs ?? []).filter((s) => s.data.status === "submitted" || s.data.status === "late").length} awaiting grade
        </span>
      </div>

      {roster.length === 0 ? (
        <EmptyState icon={FileText} title="No assigned students" description="Assign this exercise to groups or students." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {roster.map((s) => {
                const sub = submissionsById.get(s.id) ?? null;
                return (
                  <li key={s.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar name={s.data.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{s.data.name}</p>
                        <p className="text-xs text-muted-foreground">{s.data.studentNo}</p>
                      </div>
                      <StatusBadge s={sub} />
                    </div>

                    {sub ? (
                      <div className="mt-3 rounded-xl bg-surface-muted p-3">
                        {sub.content ? (
                          <p className="whitespace-pre-wrap text-sm text-foreground">{sub.content}</p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">No text submitted</p>
                        )}
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden /> Submitted {formatRelative(sub.submittedAt)}
                          {sub.attachmentUrl ? (
                            <>
                              {" · "}
                              <a href={sub.attachmentUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                View attachment
                              </a>
                            </>
                          ) : null}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <div>
                        <label htmlFor={`g-${s.id}`} className="mb-1 block text-xs font-medium text-muted-foreground">
                          Grade /20
                        </label>
                        <Input
                          id={`g-${s.id}`}
                          type="number"
                          min={0}
                          max={20}
                          step={0.25}
                          className="h-9 w-24"
                          value={grades[s.id]?.grade ?? ""}
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [s.id]: { ...(prev[s.id] ?? { feedback: "" }), grade: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="min-w-40 flex-1">
                        <label htmlFor={`f-${s.id}`} className="mb-1 block text-xs font-medium text-muted-foreground">
                          Feedback
                        </label>
                        <Input
                          id={`f-${s.id}`}
                          className="h-9"
                          value={grades[s.id]?.feedback ?? ""}
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [s.id]: { ...(prev[s.id] ?? { grade: "" }), feedback: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onGrade(s.id)}
                        loading={savingId === s.id}
                        disabled={!sub}
                        leftIcon={sub ? <Save className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                      >
                        {sub ? "Save grade" : "Awaiting submission"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}