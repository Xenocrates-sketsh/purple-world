import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, PenLine, Trash2, FileQuestion } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { allAssessmentsQuery, assessmentsByGroupQuery, createAssessment, updateAssessment, deleteAssessment } from "@/lib/db/assessments";
import { allGroupsQuery } from "@/lib/db/groups";
import { Timestamp } from "firebase/firestore";
import { ASSESSMENT_TYPES, MAX_ASSESSMENT_SCORE } from "@/lib/constants";
import type { AssessmentDoc, AssessmentType } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

const TYPE_TONES: Record<AssessmentType, "primary" | "success" | "warning" | "info" | "danger" | "neutral"> = {
  exercise: "primary",
  test: "info",
  homework: "neutral",
  quiz: "success",
  exam: "danger",
  other: "neutral",
};

interface FormState {
  title: string;
  type: AssessmentType;
  groupId: string;
  date: string;
  maxScore: string;
  description: string;
}

export function TeacherGradesPage() {
  const { toast } = useToast();
  const groups = useQuery(allGroupsQuery);
  const groupsById = useDocMap(groups.docs);
  const [groupId, setGroupId] = useState("");
  const assessments = useQuery(
    (db) => (groupId ? assessmentsByGroupQuery(db, groupId) : allAssessmentsQuery(db)),
    [groupId]
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; data: AssessmentDoc } | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    type: "exercise",
    groupId: "",
    date: new Date().toISOString().slice(0, 10),
    maxScore: String(MAX_ASSESSMENT_SCORE),
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      type: "exercise",
      groupId: groupId || "",
      date: new Date().toISOString().slice(0, 10),
      maxScore: String(MAX_ASSESSMENT_SCORE),
      description: "",
    });
    setOpen(true);
  }

  function openEdit(a: { id: string; data: AssessmentDoc }) {
    setEditing(a);
    const d = a.data.date.toDate();
    setForm({
      title: a.data.title,
      type: a.data.type,
      groupId: a.data.groupId ?? "",
      date: d.toISOString().slice(0, 10),
      maxScore: String(a.data.maxScore),
      description: a.data.description ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Give the assessment a title", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        groupId: form.groupId || null,
        date: Timestamp.fromDate(new Date(form.date)),
        maxScore: Number(form.maxScore) || MAX_ASSESSMENT_SCORE,
        description: form.description.trim() || null,
      };
      if (editing) {
        await updateAssessment(editing.id, payload);
        toast("Assessment updated", { variant: "success" });
      } else {
        await createAssessment(payload);
        toast("Assessment created", { variant: "success" });
      }
      setOpen(false);
    } catch {
      toast("Could not save assessment", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAssessment(toDelete.id);
      toast("Assessment deleted", { variant: "info" });
      setToDelete(null);
    } catch {
      toast("Could not delete assessment", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Grades & assessments"
        description="Record scores per student, per assessment."
        action={
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New assessment</Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">All groups</option>
          {(groups.docs ?? []).map((g) => (
            <option key={g.id} value={g.id}>{g.data.name}</option>
          ))}
        </Select>
      </div>

      {assessments.loading ? (
        <SkeletonList count={4} />
      ) : (assessments.docs ?? []).length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Create a test, exam or exercise and grade it per student."
          action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New assessment</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {(assessments.docs ?? []).map((a) => {
                const tone = TYPE_TONES[a.data.type];
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <PenLine className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{a.data.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.data.date)} · {groupsById.get(a.data.groupId ?? "")?.name ?? "Individual"} · max {a.data.maxScore}
                      </p>
                    </div>
                    <Badge variant={tone}>{a.data.type}</Badge>
                    <div className="flex items-center gap-1">
                      <Link to={`/teacher/grades/${a.id}`} className="btn-ghost btn-sm">
                        <FileQuestion className="h-4 w-4" aria-hidden /> Grade
                      </Link>
                      <button
                        type="button"
                        aria-label="Edit assessment"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                        onClick={() => openEdit(a)}
                      >
                        <PenLine className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete assessment"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        onClick={() => setToDelete({ id: a.id, title: a.data.title })}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit assessment" : "New assessment"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} loading={saving}>{editing ? "Save changes" : "Create"}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" htmlFor="t-title" required>
            <Input id="t-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Unit 3 test" required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" htmlFor="t-type">
              <Select id="t-type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AssessmentType }))}>
                {ASSESSMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Group" htmlFor="t-group">
              <Select id="t-group" value={form.groupId} onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}>
                <option value="">Individual (all students)</option>
                {(groups.docs ?? []).map((g) => (
                  <option key={g.id} value={g.id}>{g.data.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" htmlFor="t-date" required>
              <Input id="t-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </Field>
            <Field label="Max score" htmlFor="t-max">
              <Input id="t-max" type="number" min={1} value={form.maxScore} onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))} />
            </Field>
          </div>
          <Field label="Description" htmlFor="t-desc">
            <Textarea id="t-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete != null}
        title="Delete assessment?"
        description={toDelete ? `"${toDelete.title}" and all of its grades will be removed.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}