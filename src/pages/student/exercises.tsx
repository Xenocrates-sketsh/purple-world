import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, CheckCircle2, Clock, Upload, FileText } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { allExercisesQuery, studentSubmissionsQuery, upsertSubmission } from "@/lib/db/exercises";
import { EXERCISE_CATEGORIES, EXERCISE_DIFFICULTIES } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import type { ExerciseDoc, SubmissionDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

export function StudentExercisesPage() {
  const { userDoc } = useAuth();
  const { toast } = useToast();
  const studentId = userDoc?.studentId ?? "";
  const groupId = userDoc?.groupId ?? "";

  const exercises = useQuery<ExerciseDoc>((db) => allExercisesQuery(db));
  const submissions = useQuery<SubmissionDoc>(
    (db) => (studentId ? studentSubmissionsQuery(db, studentId) : null),
    [studentId]
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const submissionByExercise = useMemo(() => {
    const map = new Map<string, SubmissionDoc>();
    for (const s of submissions.docs ?? []) {
      // collectionGroup doc lives at exercises/{exerciseId}/submissions/{studentId}
      const exerciseId = s.ref?.parent?.parent?.id;
      if (exerciseId) map.set(exerciseId, s.data);
    }
    return map;
  }, [submissions.docs]);

  const assigned = useMemo(() => {
    return (exercises.docs ?? [])
      .filter((x) => {
        const ex = x.data;
        return (
          !ex.archived &&
          (ex.assignedGroupIds.includes(groupId) ||
            ex.assignedStudentIds.includes(studentId) ||
            (ex.assignedGroupIds.length === 0 && ex.assignedStudentIds.length === 0))
        );
      })
      .map((x) => ({ id: x.id, ...x.data }));
  }, [exercises.docs, groupId, studentId]);

  const sorted = useMemo(
    () => [...assigned].sort((a, b) => (b.deadline?.toMillis() ?? 0) - (a.deadline?.toMillis() ?? 0)),
    [assigned]
  );

  const open = sorted.find((ex) => ex.id === openId) ?? null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!openId) return;
    if (!content.trim() && !attachmentUrl.trim()) {
      toast("Add text or an attachment", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await upsertSubmission(openId, studentId, {
        content: content.trim() || null,
        attachmentUrl: attachmentUrl.trim() || null,
        status: "submitted",
      });
      toast("Submitted — nice!", { variant: "success" });
      setOpenId(null);
      setContent("");
      setAttachmentUrl("");
    } catch {
      toast("Could not submit", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Exercises" description="Homework and practice tasks." />

      {!studentId ? (
        <EmptyState
          icon={BookOpen}
          title="No exercises yet"
          description="Once your account is linked to your student record, assigned work appears here."
        />
      ) : exercises.loading ? (
        <SkeletonList count={4} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing assigned right now"
          description="Homeworks your teacher assigns will show up here."
        />
      ) : (
        <div className="grid gap-4">
          {sorted.map((ex) => {
            const sub = submissionByExercise.get(ex.id);
            const overdue = ex.deadline && ex.deadline.toMillis() < Date.now() && !sub;
            return (
              <Card key={ex.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{ex.title}</h3>
                        <Badge variant="neutral">
                          {EXERCISE_CATEGORIES.find((c) => c.value === ex.category)?.label ?? ex.category}
                        </Badge>
                        <Badge variant={ex.difficulty === "hard" ? "danger" : ex.difficulty === "medium" ? "warning" : "success"}>
                          {EXERCISE_DIFFICULTIES.find((d) => d.value === ex.difficulty)?.label ?? ex.difficulty}
                        </Badge>
                      </div>
                      {ex.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{ex.description}</p>
                      ) : null}
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {ex.deadline ? (
                          <span className={`inline-flex items-center gap-1 ${overdue ? "text-danger" : ""}`}>
                            <Clock className="h-3.5 w-3.5" aria-hidden />
                            Due {formatRelative(ex.deadline)}
                          </span>
                        ) : (
                          <span>No deadline</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" aria-hidden />
                          {ex.attachmentUrls.length > 0
                            ? `${ex.attachmentUrls.length} attachment${ex.attachmentUrls.length === 1 ? "" : "s"}`
                            : "No attachments"}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {sub?.status === "graded" ? (
                        <Badge variant="success">Graded · {sub.grade ?? "—"}/20</Badge>
                      ) : sub ? (
                        <Badge variant="primary">Submitted</Badge>
                      ) : overdue ? (
                        <Badge variant="danger">Overdue</Badge>
                      ) : (
                        <Badge variant="warning">To do</Badge>
                      )}
                      <Button
                        size="sm"
                        leftIcon={<Upload className="h-4 w-4" aria-hidden />}
                        onClick={() => {
                          setOpenId(ex.id);
                          setContent(sub?.content ?? "");
                          setAttachmentUrl(sub?.attachmentUrl ?? "");
                        }}
                      >
                        {sub?.status === "graded" ? "View" : sub ? "Update" : "Submit"}
                      </Button>
                    </div>
                  </div>

                  {sub?.status === "graded" ? (
                    <div className="mt-4 rounded-xl bg-surface-muted p-4">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">Score: {sub.grade ?? "—"}/20</span>
                      </p>
                      {sub.feedback ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{sub.feedback}</p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">No written feedback.</p>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open != null}
        onClose={() => setOpenId(null)}
        title={open ? (submissionByExercise.get(open.id) ? "Update submission" : "Submit exercise") : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpenId(null)}>Cancel</Button>
            <Button onClick={onSubmit} loading={saving} disabled={!content.trim() && !attachmentUrl.trim()}>
              Submit
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {open?.instructions ? (
            <div className="rounded-xl bg-primary-soft p-4 text-sm text-foreground">
              <p className="font-medium">{open.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{open.instructions}</p>
            </div>
          ) : null}
          <Field label="Your answer">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Write your answer here…" />
          </Field>
          <Field label="Attachment link (optional)">
            <Input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            You can update your answer until it's graded.
          </p>
        </form>
      </Modal>
    </div>
  );
}