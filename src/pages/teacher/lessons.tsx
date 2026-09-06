import { useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Paperclip,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

const LESSON_ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip";

function attachmentName(url: string): string {
  try {
    const name = decodeURIComponent(url.split("/").pop() ?? "");
    return name.replace(/^[0-9]+-[a-z0-9]{6}-/, "");
  } catch {
    return url.split("/").pop() ?? "Attachment";
  }
}

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
            <ul className="divide-y divide-border">
              {sorted.map((l) => {
                const groupLabel =
                  l.data.assignedGroupIds.length === 0
                    ? "All groups"
                    : l.data.assignedGroupIds.map((gid) => groupName[gid] ?? "Group").join(", ");
                return (
                  <li key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <BookOpen className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{l.data.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.data.attachmentUrls.length} file{l.data.attachmentUrls.length === 1 ? "" : "s"} · {groupLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Edit lesson"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                        onClick={() => openEdit(l)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete lesson"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        onClick={() => setToDelete({ id: l.id, title: l.data.title })}
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
        onClose={tryClose}
        title={editing ? "Edit lesson" : "New lesson"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={tryClose} disabled={uploadingFile}>Cancel</Button>
            <Button onClick={onSave} loading={saving} disabled={uploadingFile}>
              {editing ? "Save lesson" : "Add lesson"}
            </Button>
          </>
        }
      >
        <form onSubmit={onSave} className="space-y-4">
          <Field label="Lesson title" htmlFor="les-title" required>
            <Input
              id="les-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Past simple — worksheet 3"
              required
            />
          </Field>

          <Field
            label="Which groups will see this lesson?"
            hint="Leave empty to show it to every group."
          >
            {groups.docs == null ? (
              <SkeletonList count={1} />
            ) : (groups.docs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups yet. The lesson will be visible to everyone.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(groups.docs ?? []).map((g) => {
                  const on = assignedGroupIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroup(g.id)}
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
            label="Files (PDF)"
            hint="The lesson content lives in the PDF."
            htmlFor="lesson-file-input"
          >
            <div className="space-y-2">
              {attachments.length > 0 ? (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {attachments.map((url) => (
                    <li key={url} className="flex items-center gap-2 px-3 py-2">
                      <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {attachmentName(url)}
                      </span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                        aria-label={`Open ${attachmentName(url)}`}
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                      <button
                        type="button"
                        aria-label={`Remove ${attachmentName(url)}`}
                        onClick={() => removeAttachment(url)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <label
                htmlFor="lesson-file-input"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" aria-hidden />
                {uploadingFile ? "Uploading…" : "Attach a PDF"}
                <input
                  id="lesson-file-input"
                  type="file"
                  accept={LESSON_ACCEPT}
                  className="hidden"
                  disabled={uploadingFile}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onPickFile(f);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </Field>
        </form>
      </Modal>

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
