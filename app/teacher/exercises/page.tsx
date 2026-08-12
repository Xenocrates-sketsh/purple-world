"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Plus, Trash2, Edit, ChevronRight, Archive } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { EXERCISE_CATEGORIES, EXERCISE_DIFFICULTIES, labelFor } from "@/lib/constants";
import type { ExerciseRow, GroupSummary, StudentSummary } from "@/lib/types";

type Mode = "create" | "edit";

const DIFF_TONES: Record<string, "success" | "neutral" | "danger"> = {
  easy: "success",
  medium: "neutral",
  hard: "danger",
};

export default function TeacherExercisesPage() {
  const { toast } = useToast();
  const [exercises, setExercises] = React.useState<ExerciseRow[]>([]);
  const [groups, setGroups] = React.useState<GroupSummary[]>([]);
  const [students, setStudents] = React.useState<StudentSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showArchived, setShowArchived] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("create");
  const [editId, setEditId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    instructions: "",
    category: "mixed",
    difficulty: "medium",
    deadline: "",
    attachmentUrl: "",
    groupIds: [] as string[],
    studentIds: [] as string[],
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = showArchived ? "?archived=1" : "";
      setExercises(await api.get<ExerciseRow[]>(`/api/teacher/exercises${qs}`));
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load exercises." });
    } finally {
      setLoading(false);
    }
  }, [showArchived, toast]);

  React.useEffect(() => {
    Promise.all([
      api.get<GroupSummary[]>("/api/teacher/groups"),
      api.get<StudentSummary[]>("/api/teacher/students?filter=active"),
    ])
      .then(([g, s]) => {
        setGroups(g);
        setStudents(s);
      })
      .catch(() => {});
    load();
  }, [load]);

  const openCreate = () => {
    setMode("create");
    setEditId(null);
    setForm({ title: "", description: "", instructions: "", category: "mixed", difficulty: "medium", deadline: "", attachmentUrl: "", groupIds: [], studentIds: [] });
    setOpen(true);
  };

  const openEdit = (e: ExerciseRow) => {
    setMode("edit");
    setEditId(e.id);
    setForm({
      title: e.title,
      description: e.description ?? "",
      instructions: e.instructions ?? "",
      category: e.category,
      difficulty: e.difficulty,
      deadline: e.deadline ? e.deadline.slice(0, 16) : "",
      attachmentUrl: e.attachmentUrl ?? "",
      groupIds: [],
      studentIds: [],
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/api/teacher/exercises", form);
        toast({ kind: "success", title: "Exercise created" });
      } else {
        await api.patch(`/api/teacher/exercises/${editId}`, form);
        await api.put(`/api/teacher/exercises/${editId}/assignments`, form);
        toast({ kind: "success", title: "Exercise updated" });
      }
      setOpen(false);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not save exercise." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.del(`/api/teacher/exercises/${deleteId}`);
      toast({ kind: "success", title: "Exercise deleted" });
      setDeleteId(null);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not delete exercise." });
    } finally {
      setDeleting(false);
    }
  };

  const toggleArchived = async (e: ExerciseRow) => {
    try {
      await api.patch(`/api/teacher/exercises/${e.id}`, { archived: !e.archived });
      load();
    } catch (err) {
      toast({ kind: "error", title: err instanceof Error ? err.message : "Could not update exercise." });
    }
  };

  const toggleGroup = (id: string) =>
    setForm((f) => ({
      ...f,
      groupIds: f.groupIds.includes(id) ? f.groupIds.filter((g) => g !== id) : [...f.groupIds, id],
    }));
  const toggleStudent = (id: string) =>
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id) ? f.studentIds.filter((s) => s !== id) : [...f.studentIds, id],
    }));

  return (
    <>
      <PageHeader
        title="Exercises"
        description="Create, assign and grade exercises."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden /> New exercise
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
        </p>
        <Button variant={showArchived ? "secondary" : "outline"} size="sm" onClick={() => setShowArchived((v) => !v)}>
          <Archive className="h-4 w-4" aria-hidden /> {showArchived ? "Show active" : "Show archived"}
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={showArchived ? "No archived exercises" : "No exercises yet"}
          description="Create your first exercise to give your students homework."
          action={!showArchived ? <Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden /> New exercise</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3">
          {exercises.map((e) => (
            <Card key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <FileText className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{e.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <Badge tone="primary">{labelFor(EXERCISE_CATEGORIES, e.category)}</Badge>
                  <Badge tone={DIFF_TONES[e.difficulty] ?? "neutral"}>{e.difficulty}</Badge>
                  {e.deadline && <span>Due {formatDate(e.deadline)}</span>}
                  <span>{e.submissionCount} submissions</span>
                  {(e.pendingCount ?? 0) > 0 && <Badge tone="warning">{e.pendingCount} pending</Badge>}
                  {e.archived && <Badge tone="neutral">Archived</Badge>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(e)} aria-label="Edit exercise">
                  <Edit className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleArchived(e)} aria-label={e.archived ? "Unarchive" : "Archive"}>
                  <Archive className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(e.id)} aria-label="Delete exercise">
                  <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Button>
                <Link
                  href={`/teacher/exercises/${e.id}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Review <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "create" ? "New exercise" : "Edit exercise"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{mode === "create" ? "Create & assign" : "Save changes"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Past simple exercises" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short summary students see in the list" />
          </div>
          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea id="instructions" rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="The actual exercise or detailed instructions" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={EXERCISE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select id="difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} options={EXERCISE_DIFFICULTIES.map((d) => ({ value: d.value, label: d.label }))} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="attachmentUrl">Attachment link</Label>
              <Input id="attachmentUrl" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="https://…" />
            </div>
          </div>

          <div>
            <Label>Assign to groups</Label>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.groupIds.includes(g.id)
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
            {!form.groupIds.length && !form.studentIds.length && (
              <p className="mt-1 text-xs text-muted-foreground">If none selected, the exercise is available to all students.</p>
            )}
          </div>

          <div>
            <Label>Assign to specific students</Label>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active students yet.</p>
            ) : (
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto scrollbar-thin">
                {students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStudent(s.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.studentIds.includes(s.id)
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {s.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete this exercise?"
        description="All submissions for it will be deleted."
        loading={deleting}
      />
    </>
  );
}