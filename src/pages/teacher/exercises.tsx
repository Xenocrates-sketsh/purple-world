import { useState, type FormEvent } from "react";
import { Plus, FileText, Archive, ArchiveRestore } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { allExercisesQuery, createExercise, updateExercise, deleteExercise, setExerciseArchived } from "@/lib/db/exercises";
import { allGroupsQuery } from "@/lib/db/groups";
import { allStudentsQuery } from "@/lib/db/students";
import { fanOutNotifications } from "@/lib/db/announcements";
import { Timestamp } from "firebase/firestore";
import type { ExerciseDoc, GroupDoc, StudentDoc } from "@/lib/types";
import { uploadLessonFile } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";
import {
  ExerciseList,
  ExerciseFormModal,
  emptyExerciseForm,
  type ExerciseFormState,
} from "./exercises/exercise-parts";

export function TeacherExercisesPage() {
  const { toast } = useToast();
  const exercises = useQuery<ExerciseDoc>(allExercisesQuery);
  const groups = useQuery<GroupDoc>(allGroupsQuery);
  const groupsById = useDocMap(groups.docs);
  const students = useQuery<StudentDoc>(allStudentsQuery);

  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; data: ExerciseDoc } | null>(null);
  const [form, setForm] = useState<ExerciseFormState>(emptyExerciseForm);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function onPickExerciseFile(file: File) {
    setUploadingFile(true);
    try {
      const url = await uploadLessonFile(file);
      setForm((f) => ({ ...f, attachments: [...f.attachments, url] }));
      toast("File attached", { variant: "success" });
    } catch {
      toast("Could not upload the file", { variant: "error" });
    } finally {
      setUploadingFile(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyExerciseForm);
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
      attachments: x.data.attachmentUrls ?? [],
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
        attachmentUrls: form.attachments,
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

  async function notifyAssignedStudents(_exerciseId: string, _action: "created") {
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
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ExerciseList
              items={visible}
              groupsById={groupsById}
              onEdit={openEdit}
              onToggleArchive={onToggleArchive}
              onDeleteAsk={(x) => setToDelete({ id: x.id, title: x.data.title })}
            />
          </CardContent>
        </Card>
      )}

      <div className="mt-4 flex justify-center">
        <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New exercise</Button>
      </div>

      <ExerciseFormModal
        open={open}
        editing={editing != null}
        form={form}
        groups={groups}
        students={students}
        saving={saving}
        uploadingFile={uploadingFile}
        onClose={() => setOpen(false)}
        onForm={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={onSubmit}
        onPickFile={onPickExerciseFile}
        onRemoveAttachment={(url) => setForm((f) => ({ ...f, attachments: f.attachments.filter((u) => u !== url) }))}
      />

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
