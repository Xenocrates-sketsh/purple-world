"use client";

import * as React from "react";
import { FileText, Send, CheckCircle2, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { EXERCISE_CATEGORIES, EXERCISE_DIFFICULTIES, labelFor } from "@/lib/constants";

interface ExerciseItem {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  category: string;
  difficulty: string;
  deadline: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  assigned: boolean;
  submitted: boolean;
  status: string | null;
  grade: string | null;
  feedback: string | null;
  submittedAt: string | null;
}

export default function StudentExercisesPage() {
  const { toast } = useToast();
  const [exercises, setExercises] = React.useState<ExerciseItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState<ExerciseItem | null>(null);
  const [form, setForm] = React.useState({ content: "", attachmentUrl: "" });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setExercises(await api.get<ExerciseItem[]>("/api/student/exercises"));
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load exercises." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openSubmit = (e: ExerciseItem) => {
    setActive(e);
    setForm({ content: "", attachmentUrl: "" });
  };

  const submit = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await api.post(`/api/student/exercises/${active.id}/submit`, form);
      toast({ kind: "success", title: "Submitted! Your teacher will review it." });
      setActive(null);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not submit." });
    } finally {
      setSaving(false);
    }
  };

  const isOverdue = (deadline: string | null) => !!deadline && new Date(deadline) < new Date();

  return (
    <>
      <PageHeader title="Exercises" description="Your homework, all in one place." />

      {loading ? (
        <Spinner />
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No exercises yet"
          description="When your teacher assigns exercises, they'll appear here."
        />
      ) : (
        <div className="space-y-3">
          {exercises.map((e) => (
            <Card key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <FileText className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{e.title}</p>
                  {e.submitted ? (
                    <Badge tone="success"><CheckCircle2 className="h-3 w-3" aria-hidden /> Submitted</Badge>
                  ) : e.deadline && isOverdue(e.deadline) ? (
                    <Badge tone="danger"><Clock3 className="h-3 w-3" aria-hidden /> Overdue</Badge>
                  ) : (
                    <Badge tone="neutral">To do</Badge>
                  )}
                  {e.status === "graded" && <Badge tone="primary">Graded{e.grade ? ` · ${e.grade}/20` : ""}</Badge>}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <Badge tone="neutral">{labelFor(EXERCISE_CATEGORIES, e.category)}</Badge>
                  <Badge tone="neutral">{labelFor(EXERCISE_DIFFICULTIES, e.difficulty)}</Badge>
                  {e.deadline && <span>Due {formatDate(e.deadline)}</span>}
                  {e.submittedAt && <span>Submitted {formatDate(e.submittedAt)}</span>}
                </p>
                {e.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
                {e.feedback && e.status === "graded" && (
                  <p className="mt-2 rounded-xl bg-success-soft/60 p-2.5 text-sm text-success">
                    Feedback: {e.feedback}
                  </p>
                )}
              </div>
              {!e.submitted ? (
                <Button className="shrink-0" onClick={() => openSubmit(e)}>
                  <Send className="h-4 w-4" aria-hidden /> Submit
                </Button>
              ) : e.status === "graded" || e.grade !== null ? (
                <Button variant="outline" className="shrink-0" onClick={() => openSubmit(e)}>
                  View
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active?.submitted ? "Your submission" : "Submit exercise"}
        size="lg"
        footer={
          <Button form="submit-form" type="submit" loading={saving} disabled={active?.submitted}>
            <Send className="h-4 w-4" aria-hidden /> Submit
          </Button>
        }
      >
        {active && (
          <form
            id="submit-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-base font-semibold text-foreground">{active.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {active.deadline ? `Due ${formatDate(active.deadline)}` : "No deadline"}
                · {labelFor(EXERCISE_CATEGORIES, active.category)}
              </p>
            </div>
            {active.instructions && (
              <p className="whitespace-pre-wrap rounded-xl bg-surface-muted/60 p-3 text-sm text-foreground">
                {active.instructions}
              </p>
            )}
            {active.attachmentUrl && (
              <a href={active.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                Open exercise attachment
              </a>
            )}
            {active.feedback && (
              <div className="rounded-xl bg-success-soft/60 p-3 text-sm text-success">
                Teacher feedback: {active.feedback}
              </div>
            )}
            {!active.submitted && (
              <>
                <div>
                  <Label htmlFor="content">Your answer *</Label>
                  <Textarea id="content" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your answer here…" />
                </div>
                <div>
                  <Label htmlFor="attachmentUrl">Attachment link (optional)</Label>
                  <Input id="attachmentUrl" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="https://…" />
                </div>
              </>
            )}
          </form>
        )}
      </Modal>
    </>
  );
}