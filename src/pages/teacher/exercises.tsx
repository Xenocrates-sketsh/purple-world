import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Pencil, Trash2, Archive, ArchiveRestore, CheckCircle2 } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { allExercisesQuery, createExercise, updateExercise, deleteExercise, setExerciseArchived } from "@/lib/db/exercises";
import { allGroupsQuery } from "@/lib/db/groups";
import { allStudentsQuery } from "@/lib/db/students";
import { fanOutNotifications } from "@/lib/db/announcements";
import { Timestamp } from "firebase/firestore";
import { EXERCISE_CATEGORIES, EXERCISE_DIFFICULTIES } from "@/lib/constants";
import type { ExerciseCategory, ExerciseDifficulty, ExerciseDoc } from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/format";
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

interface FormState {
  title: string;
  description: string;
  instructions: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  deadlineDate: string;
  deadlineTime: string;
  attachmentUrl: string;
  assignedGroupIds: string[];
  assignedStudentIds: string[];
}

const emptyForm: FormState = {
  title: "",
  description: "",
  instructions: "",
  category: "grammar",
  difficulty: "medium",
  deadlineDate: "",
  deadlineTime: "18:00",
  attachmentUrl: "",
  assignedGroupIds: [],
  assignedStudentIds: [],
};

function CategoryDot({ c }: { c: ExerciseCategory }) {
  return <Badge variant="primary">{EXERCISE_CATEGORIES.find((x) => x.value === c)?.label ?? c}</Badge>;
}

export function TeacherExercisesPage() {
  const { toast } = useToast();
  const exercises = useQuery(allExercisesQuery);
  const groups = useQuery(allGroupsQuery);
  const groupsById = useDocMap(groups.docs);
  const students = useQuery(allStudentsQuery);

  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; data: ExerciseDoc } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  function toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(x: { id: string; data: ExerciseDoc }) {
    setEditing(x);
    setForm({
      title: x.data.title,
      description: x.data.description ?? "",
      instructions: x.data.instructions ?? "",
      category: x.data.category,
      difficulty: x.data.difficulty,
      deadlineDate: x.data.deadline ? x.data.deadline.toDate().toISOString().slice(0, 10) : "",
      deadlineTime: x.data.deadline
        ? `${String(x.data.deadline.toDate().getHours()).padStart(2, "0")}:${String(x.data.deadline.toDate().getMinutes()).padStart(2, "0")}`
        : "18:00",
      attachmentUrl: x.data.attachmentUrls[0] ?? "",
      assignedGroupIds: x.data.assignedGroupIds,
      assignedStudentIds: x.data.assignedStudentIds,
    });
    setOpen(true);
  }

  function deadlineFromForm(): Date | null {
    const { deadlineDate, deadlineTime } = form;
    if (!deadlineDate) return null;
    const [h, m] = deadlineTime.split(":").map(Number);
    const d = new Date(deadlineDate);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Give the exercise a title", { variant: "error" });
      return;
    }
    if (form.assignedGroupIds.length === 0 && form.assignedStudentIds.length === 0) {
      toast("Assign the exercise to at least one group or student", { variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const dl = deadlineFromForm();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        instructions: form.instructions.trim() || null,
        category: form.category,
        difficulty: form.difficulty,
        deadline: dl ? Timestamp.fromDate(dl) : null,
        assignedGroupIds: form.assignedGroupIds,
        assignedStudentIds: form.assignedStudentIds,
        attachmentUrls: form.attachmentUrl.trim() ? [form.attachmentUrl.trim()] : [],
      };
      if (editing) {
        await updateExercise(editing.id, payload);
        toast("Exercise updated", { variant: "success" });
      } else {
        const id = await createExercise({ ...payload, archived: false });
        await notifyAssignedStudents(id, "created");
        toast("Exercise published", { variant: "success" });
      }
      setOpen(false);
    } catch {
      toast("Could not save the exercise", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function notifyAssignedStudents(exerciseId: string, action: "created") {
    const members = new Set<string>();
    for (const gid of form.assignedGroupIds) {
      for (const s of students.docs ?? []) {
        if (s.data.groupId === gid) members.add(s.id);
      }
    }
    for (const sid of form.assignedStudentIds) members.add(sid);
    const uids = (students.docs ?? [])
      .filter((s) => members.has(s.id) && s.data.linkedUid)
      .map((s) => s.data.linkedUid as string);
    void fanOutNotifications(uids, {
      type: "new_exercise",
      title: "New exercise assigned",
      body: form.title.trim(),
      link: "/student/exercises",
    });
  }

  async function onToggleArchive(x: { id: string; data: ExerciseDoc }) {
    try {
      await setExerciseArchived(x.id, !x.data.archived);
      toast(x.data.archived ? "Exercise restored" : "Exercise archived", { variant: "info" });
    } catch {
      toast("Could not update exercise", { variant: "error" });
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteExercise(toDelete.id);
      toast("Exercise deleted", { variant: "info" });
      setToDelete(null);
    } catch {
      toast("Could not delete exercise", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const visible = (exercises.docs ?? []).filter((x) => (showArchived ? x.data.archived : !x.data.archived));
  const assignedLabel = (x: ExerciseDoc): string => {
    if (x.assignedGroupIds.length > 0)
      return x.assignedGroupIds.map((g) => groupsById.get(g)?.name ?? "Group").join(", ");
    return `${x.assignedStudentIds.length} student${x.assignedStudentIds.length === 1 ? "" : "s"}`;
  };

  return (
    <div>
      <PageHeader
        title="Exercises"
        description="Homework, worksheets and BAC practice — assigned to groups or students."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived((v) => !v)}
              leftIcon={showArchived ? <ArchiveRestore className="h-4 w-4" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}
            >
              {showArchived ? "Show active" : "Archived"}
            </Button>
            <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New exercise</Button>
          </div>
        }
      />

      {exercises.loading ? (
        <SkeletonList count={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={showArchived ? "No archived exercises" : "No exercises yet"}
          description={showArchived ? "Archived exercises appear here." : "Create and assign your first exercise."}
          action={!showArchived ? (
            <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New exercise</Button>
          ) : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {visible.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{x.data.title}</p>
                    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{assignedLabel(x.data)}</span>
                      <span>{x.data.difficulty}</span>
                      <span>
                        {x.data.deadline
                          ? `Due ${formatRelative(x.data.deadline)}`
                          : "No deadline"}
                      </span>
                    </p>
                  </div>
                  {x.data.archived ? <Badge variant="neutral">archived</Badge> : <CategoryDot c={x.data.category} />}
                  <div className="flex items-center gap-1">
                    <Link to={`/teacher/exercises/${x.id}`} className="btn-ghost btn-sm">
                      <CheckCircle2 className="h-4 w-4" aria-hidden /> View
                    </Link>
                    <button
                      type="button"
                      aria-label="Edit exercise"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                      onClick={() => openEdit(x)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={x.data.archived ? "Restore exercise" : "Archive exercise"}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                      onClick={() => onToggleArchive(x)}
                    >
                      {x.data.archived ? <ArchiveRestore className="h-4 w-4" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}
                    </button>
                    <button
                      type="button"
                      aria-label="Delete exercise"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      onClick={() => setToDelete({ id: x.id, title: x.data.title })}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit exercise" : "New exercise"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} loading={saving}>{editing ? "Save changes" : "Publish"}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" htmlFor="x-title" required>
            <Input id="x-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="BAC writing: formal letter" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="x-cat">
              <Select id="x-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExerciseCategory }))}>
                {EXERCISE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Difficulty" htmlFor="x-diff">
              <Select id="x-diff" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as ExerciseDifficulty }))}>
                {EXERCISE_DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Assign to groups">
            {groups.docs == null ? (
              <SkeletonList count={1} />
            ) : (groups.docs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Create a group first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(groups.docs ?? []).map((g) => {
                  const on = form.assignedGroupIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, assignedGroupIds: toggleId(f.assignedGroupIds, g.id) }))}
                      className={
                        "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                        (on
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-surface-muted text-muted-foreground hover:text-foreground")
                      }
                    >
                      {g.data.name} {on ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>
          <Field
            hint="Students assigned directly, in addition to groups."
          >
            {students.docs == null ? (
              <SkeletonList count={1} />
            ) : (students.docs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No students yet.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-border p-2 scrollbar-thin">
                {(students.docs ?? []).filter((s) => s.data.active).map((s) => {
                  const on = form.assignedStudentIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-muted">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setForm((f) => ({ ...f, assignedStudentIds: toggleId(f.assignedStudentIds, s.id) }))}
                        className="h-4 w-4 accent-violet-600"
                      />
                      <span className={on ? "text-foreground" : "text-muted-foreground"}>{s.data.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Deadline date">
              <Input type="date" value={form.deadlineDate} onChange={(e) => setForm((f) => ({ ...f, deadlineDate: e.target.value }))} />
            </Field>
            <Field label="Deadline time">
              <Input type="time" value={form.deadlineTime} onChange={(e) => setForm((f) => ({ ...f, deadlineTime: e.target.value }))} />
            </Field>
          </div>
          <Field label="Attachment URL" hint="Optional link to a PDF, image, or Google doc.">
            <Input value={form.attachmentUrl} onChange={(e) => setForm((f) => ({ ...f, attachmentUrl: e.target.value }))} placeholder="https://…" />
          </Field>
          <Field label="Description" htmlFor="x-desc">
            <Textarea id="x-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </Field>
          <Field label="Instructions" htmlFor="x-instr">
            <Textarea id="x-instr" value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} rows={4} placeholder="What should students do?" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete != null}
        title="Delete exercise?"
        description={toDelete ? `"${toDelete.title}" and all its submissions will be removed.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}