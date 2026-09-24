import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, Plus } from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import {
  allLessonResourcesQuery,
  createLessonResource,
  updateLessonResource,
  deleteLessonResource,
} from "@/lib/db/lessonResources";
import { allGroupsQuery } from "@/lib/db/groups";
import { allStudentsQuery } from "@/lib/db/students";
import { fanOutNotifications } from "@/lib/db/announcements";
import { uploadLessonFile } from "@/lib/supabase";
import type { LessonResourceDoc, GroupDoc, StudentDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";
import { LessonList } from "./lessons/lesson-list";
import { LessonFormModal } from "./lessons/lesson-form-modal";

export function TeacherLessonsPage() {
  const { toast } = useToast();
  const lessons = useQuery<LessonResourceDoc>(allLessonResourcesQuery);
  const groups = useQuery<GroupDoc>(allGroupsQuery);
  const students = useQuery<StudentDoc>(allStudentsQuery);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const groupName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const g of groups.docs ?? []) m[g.id] = g.data.name;
    return m;
  }, [groups.docs]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setAttachments([]);
    setAssignedGroupIds([]);
    setOpen(true);
  }

  function openEdit(l: { id: string; data: LessonResourceDoc }) {
    setEditing({ id: l.id });
    setTitle(l.data.title);
    setAttachments(l.data.attachmentUrls ?? []);
    setAssignedGroupIds(l.data.assignedGroupIds ?? []);
    setOpen(true);
  }

  function tryClose() {
    if (uploadingFile) return;
    if (!editing && attachments.length > 0) {
      setConfirmDiscard(true);
      return;
    }
    setOpen(false);
  }

  function discardAndClose() {
    setConfirmDiscard(false);
    setOpen(false);
  }

  function toggleGroup(id: string) {
    setAssignedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  async function onPickFile(file: File) {
    setUploadingFile(true);
    try {
      const url = await uploadLessonFile(file);
      setAttachments((prev) => [...prev, url]);
      toast("File attached", { variant: "success" });
    } catch {
      toast("Could not upload the file", { variant: "error" });
    } finally {
      setUploadingFile(false);
    }
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((u) => u !== url));
  }

  async function notifyStudents(titleText: string) {
    const showToAll = assignedGroupIds.length === 0;
    const uids = (students.docs ?? [])
      .filter((s) => {
        if (!s.data.linkedUid) return false;
        if (showToAll) return true;
        return s.data.groupId != null && assignedGroupIds.includes(s.data.groupId);
      })
      .map((s) => s.data.linkedUid as string);
    if (uids.length === 0) return;
    await fanOutNotifications(uids, {
      type: "new_lesson",
      title: "New lesson",
      body: titleText,
      link: "/student/lessons",
    });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        attachmentUrls: attachments,
        assignedGroupIds,
      };
      if (editing) {
        await updateLessonResource(editing.id, payload);
        toast("Lesson updated", { variant: "success" });
      } else {
        await createLessonResource(payload);
        void notifyStudents(title.trim());
        toast("Lesson added", { variant: "success" });
      }
      setOpen(false);
    } catch {
      toast("Could not save lesson", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteLessonResource(toDelete.id);
      toast("Lesson deleted", { variant: "info" });
      setToDelete(null);
    } catch {
      toast("Could not delete", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const sorted = useMemo(
    () =>
      [...(lessons.docs ?? [])].sort(
        (a, b) => (b.data.createdAt?.toMillis?.() ?? 0) - (a.data.createdAt?.toMillis?.() ?? 0)
      ),
    [lessons.docs]
  );

  return (
    <div>
      <PageHeader
        title="Lessons"
        description="PDF lessons for your groups — title, groups, file. That's it."
        action={
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            New lesson
          </Button>
        }
      />

      {lessons.loading ? (
        <SkeletonList count={3} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons yet"
          description="Add your first PDF lesson for your groups."
          action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New lesson</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <LessonList
              items={sorted}
              groupName={groupName}
              onEdit={openEdit}
              onDeleteAsk={(l) => setToDelete({ id: l.id, title: l.data.title })}
            />
          </CardContent>
        </Card>
      )}

      <LessonFormModal
        open={open}
        editing={editing != null}
        title={title}
        attachments={attachments}
        assignedGroupIds={assignedGroupIds}
        groups={groups}
        saving={saving}
        uploadingFile={uploadingFile}
        onClose={tryClose}
        onTitle={setTitle}
        onToggleGroup={toggleGroup}
        onPickFile={onPickFile}
        onRemoveAttachment={removeAttachment}
        onSave={onSave}
      />

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard the attached file?"
        description="You attached a PDF but didn't add the lesson. The file will be removed from the lesson and you can re-upload it later."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={discardAndClose}
        onCancel={() => setConfirmDiscard(false)}
      />

      <ConfirmDialog
        open={toDelete != null}
        title="Delete lesson?"
        description={toDelete ? `"${toDelete.title}" will be removed.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
