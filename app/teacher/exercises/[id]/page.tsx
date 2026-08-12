"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, FileText, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import { EXERCISE_CATEGORIES, labelFor } from "@/lib/constants";

interface ExerciseDetail {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  category: string;
  difficulty: string;
  deadline: string | null;
  attachmentUrl: string | null;
  archived: boolean;
  createdAt: string;
  assignments: {
    groupIds: string[];
    studentIds: string[];
    detail: { kind: "group" | "student"; name: string }[];
  };
  submissions: {
    id: string;
    studentId: string;
    studentName: string;
    content: string;
    attachmentUrl: string | null;
    submittedAt: string;
    status: string;
    grade: string | null;
    feedback: string | null;
    gradedAt: string | null;
  }[];
}

export default function TeacherExerciseReviewPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [e, setE] = React.useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [grades, setGrades] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ExerciseDetail>(`/api/teacher/exercises/${params.id}`);
      setE(data);
      const g: Record<string, string> = {};
      const f: Record<string, string> = {};
      for (const s of data.submissions) {
        g[s.id] = s.grade ?? "";
        f[s.id] = s.feedback ?? "";
      }
      setGrades(g);
      setFeedback(f);
    } catch (err) {
      toast({ kind: "error", title: err instanceof Error ? err.message : "Could not load exercise." });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const grade = async (submissionId: string) => {
    setSavingId(submissionId);
    try {
      await api.patch(`/api/teacher/exercises/${params.id}/submissions/${submissionId}`, {
        grade: grades[submissionId],
        feedback: feedback[submissionId],
      });
      toast({ kind: "success", title: "Submission graded & student notified" });
      load();
    } catch (err) {
      toast({ kind: "error", title: err instanceof Error ? err.message : "Could not save grade." });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!e)
    return (
      <EmptyState
        icon={ArrowLeft}
        title="Exercise not found"
        action={<Link href="/teacher/exercises"><Button variant="outline">Back to exercises</Button></Link>}
      />
    );

  const pending = e.submissions.filter((s) => s.status !== "graded");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/exercises"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Back to exercises"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{e.title}</h1>
            <p className="text-sm text-muted-foreground">
              {labelFor(EXERCISE_CATEGORIES, e.category)} · {e.difficulty}
              {e.deadline ? ` · due ${formatDate(e.deadline)}` : ""}
            </p>
          </div>
        </div>
        {pending.length > 0 && <Badge tone="warning">{pending.length} awaiting grade</Badge>}
      </div>

      {(e.description || e.instructions) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" aria-hidden /> Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {e.description && <p className="text-foreground">{e.description}</p>}
            {e.instructions && (
              <p className="whitespace-pre-wrap rounded-xl bg-surface-muted/60 p-3 text-muted-foreground">
                {e.instructions}
              </p>
            )}
            {e.attachmentUrl && (
              <a href={e.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Open attachment
              </a>
            )}
            {e.assignments.detail.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {e.assignments.detail.map((a, i) => (
                  <Badge key={i} tone="primary">
                    {a.kind === "group" ? "Group" : "Student"}: {a.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Submissions ({e.submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {e.submissions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No submissions yet"
              description="Student answers will appear here."
            />
          ) : (
            <ul className="space-y-4">
              {e.submissions.map((s) => (
                <li key={s.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.studentName} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.studentName}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(s.submittedAt)}</p>
                      </div>
                    </div>
                    {s.status === "graded" ? (
                      <Badge tone="success">
                        <CheckCircle2 className="h-3 w-3" aria-hidden /> Graded{s.grade ? ` · ${s.grade}/20` : ""}
                      </Badge>
                    ) : s.status === "late" ? (
                      <Badge tone="warning">
                        <Clock className="h-3 w-3" aria-hidden /> Late
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Submitted</Badge>
                    )}
                  </div>
                  {s.content && (
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-muted/60 p-3 text-sm text-foreground">
                      {s.content}
                    </p>
                  )}
                  {s.attachmentUrl && (
                    <a href={s.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary underline">
                      Open attachment
                    </a>
                  )}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      placeholder="Grade /20"
                      className="sm:w-32"
                      aria-label={`Grade for ${s.studentName}`}
                      value={grades[s.id] ?? ""}
                      onChange={(ev) => setGrades((p) => ({ ...p, [s.id]: ev.target.value }))}
                    />
                    <Textarea
                      rows={1}
                      placeholder="Feedback (optional)"
                      className="flex-1"
                      aria-label={`Feedback for ${s.studentName}`}
                      value={feedback[s.id] ?? ""}
                      onChange={(ev) => setFeedback((p) => ({ ...p, [s.id]: ev.target.value }))}
                    />
                    <Button size="sm" onClick={() => grade(s.id)} loading={savingId === s.id}>
                      <Send className="h-4 w-4" aria-hidden /> Save
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}