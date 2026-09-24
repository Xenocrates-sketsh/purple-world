import { FileText, Pencil, Trash2, Archive, ArchiveRestore, CheckCircle2, Paperclip } from "lucide-react";
import { Link } from "react-router-dom";

import type { QueryState } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { SkeletonList } from "@/components/ui/skeleton";
import { AttachmentList } from "@/components/attachment-list";
import { ATTACHMENT_ACCEPT } from "@/lib/attachments";
import { EXERCISE_CATEGORIES, EXERCISE_DIFFICULTIES } from "@/lib/constants";
import type { ExerciseCategory, ExerciseDifficulty, ExerciseDoc, GroupDoc, StudentDoc } from "@/lib/types";
import { formatRelative } from "@/lib/format";

export interface ExerciseFormState {
  title: string;
  description: string;
  instructions: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  deadlineDate: string;
  deadlineTime: string;
  attachments: string[];
  assignedGroupIds: string[];
  assignedStudentIds: string[];
}

export const emptyExerciseForm: ExerciseFormState = {
  title: "",
  description: "",
  instructions: "",
  category: "grammar",
  difficulty: "medium",
  deadlineDate: "",
  deadlineTime: "18:00",
  attachments: [],
  assignedGroupIds: [],
  assignedStudentIds: [],
};

export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function CategoryDot({ c }: { c: ExerciseCategory }) {
  return <Badge variant="primary">{EXERCISE_CATEGORIES.find((x) => x.value === c)?.label ?? c}</Badge>;
}

export function assignedLabel(
  x: ExerciseDoc,
  groupsById: Map<string, GroupDoc>
): string {
  if (x.assignedGroupIds.length > 0)
    return x.assignedGroupIds.map((g) => groupsById.get(g)?.name ?? "Group").join(", ");
  return `${x.assignedStudentIds.length} student${x.assignedStudentIds.length === 1 ? "" : "s"}`;
}

interface Row {
  id: string;
  data: ExerciseDoc;
}

export function ExerciseList({
  items,
  groupsById,
  onEdit,
  onToggleArchive,
  onDeleteAsk,
}: {
  items: Row[];
  groupsById: Map<string, GroupDoc>;
  onEdit: (x: Row) => void;
  onToggleArchive: (x: Row) => void;
  onDeleteAsk: (x: Row) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {items.map((x) => (
        <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{x.data.title}</p>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>{assignedLabel(x.data, groupsById)}</span>
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
              onClick={() => onEdit(x)}
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
              onClick={() => onDeleteAsk(x)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ExerciseFormModal({
  open,
  editing,
  form,
  groups,
  students,
  saving,
  uploadingFile,
  onClose,
  onForm,
  onSubmit,
  onPickFile,
  onRemoveAttachment,
}: {
  open: boolean;
  editing: boolean;
  form: ExerciseFormState;
  groups: QueryState<GroupDoc>;
  students: QueryState<StudentDoc>;
  saving: boolean;
  uploadingFile: boolean;
  onClose: () => void;
  onForm: (patch: Partial<ExerciseFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPickFile: (f: File) => void;
  onRemoveAttachment: (url: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit exercise" : "New exercise"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={saving} disabled={uploadingFile}>{editing ? "Save changes" : "Publish"}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Title" htmlFor="x-title" required>
          <Input id="x-title" value={form.title} onChange={(e) => onForm({ title: e.target.value })} placeholder="BAC writing: formal letter" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="x-cat">
            <Select id="x-cat" value={form.category} onChange={(e) => onForm({ category: e.target.value as ExerciseCategory })}>
              {EXERCISE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty" htmlFor="x-diff">
            <Select id="x-diff" value={form.difficulty} onChange={(e) => onForm({ difficulty: e.target.value as ExerciseDifficulty })}>
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
                    onClick={() => onForm({ assignedGroupIds: toggleId(form.assignedGroupIds, g.id) })}
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
        <Field hint="Students assigned directly, in addition to groups.">
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
                      onChange={() => onForm({ assignedStudentIds: toggleId(form.assignedStudentIds, s.id) })}
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
            <Input type="date" value={form.deadlineDate} onChange={(e) => onForm({ deadlineDate: e.target.value })} />
          </Field>
          <Field label="Deadline time">
            <Input type="time" value={form.deadlineTime} onChange={(e) => onForm({ deadlineTime: e.target.value })} />
          </Field>
        </div>
        <Field label="Files (PDF)" htmlFor="exercise-file-input" hint="Optional. The exercise sheet / worksheet — drag in a PDF or image.">
          <div className="space-y-2">
            <AttachmentList urls={form.attachments} onRemove={onRemoveAttachment} />
            <label
              htmlFor="exercise-file-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <Paperclip className="h-4 w-4" aria-hidden />
              {uploadingFile ? "Uploading…" : "Attach a file"}
              <input
                id="exercise-file-input"
                type="file"
                accept={ATTACHMENT_ACCEPT}
                className="hidden"
                disabled={uploadingFile}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickFile(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </Field>
        <Field label="Description" htmlFor="x-desc">
          <Textarea id="x-desc" value={form.description} onChange={(e) => onForm({ description: e.target.value })} rows={2} />
        </Field>
        <Field label="Instructions" htmlFor="x-instr">
          <Textarea id="x-instr" value={form.instructions} onChange={(e) => onForm({ instructions: e.target.value })} rows={4} placeholder="What should students do?" />
        </Field>
      </form>
    </Modal>
  );
}
