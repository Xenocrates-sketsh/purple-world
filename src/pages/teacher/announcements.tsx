import { useState, type FormEvent } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { allAnnouncementsQuery, createAnnouncement, deleteAnnouncement, fanOutNotifications } from "@/lib/db/announcements";
import { allGroupsQuery } from "@/lib/db/groups";
import { allStudentsQuery } from "@/lib/db/students";
import { ANNOUNCEMENT_TYPES } from "@/lib/constants";
import type { AnnouncementTarget, AnnouncementType, AnnouncementDoc, GroupDoc, StudentDoc } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/format";
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

const TYPE_TONES: Record<AnnouncementType, "primary" | "success" | "warning" | "info" | "danger" | "neutral"> = {
  new_lesson: "primary",
  schedule_change: "warning",
  new_exercise: "primary",
  exam_reminder: "danger",
  payment_reminder: "warning",
  general: "neutral",
  bac_info: "success",
};

export function TeacherAnnouncementsPage() {
  const { toast } = useToast();
  const announcements = useQuery<AnnouncementDoc>(allAnnouncementsQuery);
  const groups = useQuery<GroupDoc>(allGroupsQuery);
  const groupsById = useDocMap(groups.docs);
  const students = useQuery<StudentDoc>(allStudentsQuery);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<AnnouncementType>("general");
  const [target, setTarget] = useState<AnnouncementTarget>("all");
  const [groupId, setGroupId] = useState("");
  const [studentId, setStudentId] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast("Announcements need a title and a message", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const recipientKeys = ["all"];
      if (target === "group" && groupId) recipientKeys.push(`group:${groupId}`);
      if (target === "student" && studentId) recipientKeys.push(`student:${studentId}`);

      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        type,
        target,
        groupId: target === "group" ? groupId || null : null,
        studentId: target === "student" ? studentId || null : null,
        recipientKeys,
      });

      // Notify linked students in scope.
      const linked = new Set<string>();
      for (const s of students.docs ?? []) {
        if (!s.data.linkedUid) continue;
        if (target === "all") linked.add(s.data.linkedUid);
        else if (target === "group" && s.data.groupId === groupId) linked.add(s.data.linkedUid);
        else if (target === "student" && s.id === studentId) linked.add(s.data.linkedUid);
      }
      void fanOutNotifications([...linked], {
        type:
          type === "schedule_change"
            ? "schedule_change"
            : type === "new_exercise"
              ? "new_exercise"
              : type === "exam_reminder"
                ? "new_grade"
                : "new_announcement",
        title: title.trim(),
        body: body.trim().slice(0, 120),
        link: "/student/announcements",
      });

      toast("Announcement published", { variant: "success" });
      setOpen(false);
      setTitle("");
      setBody("");
    } catch {
      toast("Could not publish announcement", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(toDelete.id);
      toast("Announcement deleted", { variant: "info" });
      setToDelete(null);
    } catch {
      toast("Could not delete announcement", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const targetLabel = (a: { target: AnnouncementTarget; groupId: string | null; studentId: string | null }): string => {
    if (a.target === "group") return a.groupId ? `Group: ${groupsById.get(a.groupId)?.name ?? "—"}` : "Group";
    if (a.target === "student") return "Individual student";
    return "Everyone";
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Broadcast news to everyone, a group, or one student."
        action={
          <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            New announcement
          </Button>
        }
      />

      {announcements.loading ? (
        <SkeletonList count={4} />
      ) : (announcements.docs ?? []).length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Share schedule changes, exam reminders or good news."
          action={
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
              New announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {(announcements.docs ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{a.data.title}</h3>
                    <Badge variant={TYPE_TONES[a.data.type]}>
                      {ANNOUNCEMENT_TYPES.find((t) => t.value === a.data.type)?.label ?? a.data.type}
                    </Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{a.data.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {targetLabel(a.data)} · {formatDateTime(a.data.createdAt)} ({formatRelative(a.data.createdAt)})
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Delete announcement"
                  className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  onClick={() => setToDelete({ id: a.id, title: a.data.title })}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New announcement"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} loading={saving} leftIcon={<Megaphone className="h-4 w-4" aria-hidden />}>
              Publish
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" htmlFor="a-title" required>
            <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam reminder — Unit 3 in-class test" required />
          </Field>
          <Field label="Message" htmlFor="a-body" required>
            <Textarea id="a-body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="a-type">
              <Select id="a-type" value={type} onChange={(e) => setType(e.target.value as AnnouncementType)}>
                {ANNOUNCEMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Send to" htmlFor="a-target">
              <Select id="a-target" value={target} onChange={(e) => setTarget(e.target.value as AnnouncementTarget)}>
                <option value="all">Everyone</option>
                <option value="group">A specific group</option>
                <option value="student">One student</option>
              </Select>
            </Field>
          </div>
          {target === "group" ? (
            <Field label="Group" htmlFor="a-group" required>
              <Select id="a-group" value={groupId} onChange={(e) => setGroupId(e.target.value)} required>
                <option value="">Select group…</option>
                {(groups.docs ?? []).map((g) => (
                  <option key={g.id} value={g.id}>{g.data.name}</option>
                ))}
              </Select>
            </Field>
          ) : null}
          {target === "student" ? (
            <Field label="Student" htmlFor="a-student" required>
              <Select id="a-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">Select student…</option>
                {(students.docs ?? []).filter((s) => s.data.active).map((s) => (
                  <option key={s.id} value={s.id}>{s.data.name}</option>
                ))}
              </Select>
            </Field>
          ) : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete != null}
        title="Delete announcement?"
        description={toDelete ? `"${toDelete.title}" will be removed from the feed.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}