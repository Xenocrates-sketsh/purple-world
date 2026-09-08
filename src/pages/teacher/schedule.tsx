import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, CalendarDays, Clock, Pencil, Trash2, MapPin, ListChecks } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { allLessonsQuery, lessonsByGroupQuery, createLesson, updateLesson, deleteLesson } from "@/lib/db/schedule";
import { allGroupsQuery } from "@/lib/db/groups";
import { Timestamp } from "firebase/firestore";
import { formatDate, formatTime, formatWeekday } from "@/lib/format";
import type { LessonDoc, GroupDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

interface LessonForm {
  groupId: string;
  title: string;
  date: string;
  time: string;
  durationMin: string;
  location: string;
  notes: string;
}

const emptyForm: LessonForm = {
  groupId: "",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  time: "17:00",
  durationMin: "90",
  location: "",
  notes: "",
};

export function TeacherSchedulePage() {
  const { toast } = useToast();
  const groups = useQuery<GroupDoc>(allGroupsQuery);
  const groupsById = useDocMap(groups.docs);
  const [groupId, setGroupId] = useState("");
  const lessons = useQuery<LessonDoc>(
    (db) => (groupId ? lessonsByGroupQuery(db, groupId) : allLessonsQuery(db)),
    [groupId]
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; data: LessonDoc } | null>(null);
  const [form, setForm] = useState<LessonForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const byDay = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: { id: string; data: LessonDoc }[] }>();
    for (const l of lessons.docs ?? []) {
      const d = l.data.startsAt.toDate();
      const key = formatDate(d);
      const entry = map.get(key) ?? { key, label: `${formatWeekday(d)}, ${formatDate(d)}`, items: [] };
      entry.items.push({ id: l.id, data: l.data });
      entry.items.sort((a, b) => a.data.startsAt.toMillis() - b.data.startsAt.toMillis());
      map.set(key, entry);
    }
    // Newest day first (the query has no orderBy — see db/schedule.ts).
    return [...map.values()].sort(
      (a, b) => b.items[0].data.startsAt.toMillis() - a.items[0].data.startsAt.toMillis()
    );
  }, [lessons.docs]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, groupId: groupId || "" });
    setOpen(true);
  }

  function openEdit(l: { id: string; data: LessonDoc }) {
    const d = l.data.startsAt.toDate();
    setEditing(l);
    setForm({
      groupId: l.data.groupId,
      title: l.data.title,
      date: d.toISOString().slice(0, 10),
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      durationMin: String(l.data.durationMin),
      location: l.data.location ?? "",
      notes: l.data.notes ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.groupId) {
      toast("Pick a group and give the lesson a title", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const [h, m] = form.time.split(":").map(Number);
      const startsAt = new Date(form.date);
      startsAt.setHours(h, m, 0, 0);
      const payload = {
        groupId: form.groupId,
        title: form.title.trim(),
        startsAt: Timestamp.fromDate(startsAt),
        durationMin: Number(form.durationMin) || 60,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        await updateLesson(editing.id, payload);
        toast("Lesson updated", { variant: "success" });
      } else {
        await createLesson(payload);
        toast("Lesson added", { variant: "success" });
      }
      setOpen(false);
    } catch {
      toast("Could not save the lesson", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteLesson(toDelete.id);
      toast("Lesson deleted", { variant: "info" });
      setToDelete(null);
    } catch {
      toast("Could not delete the lesson", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Concrete, dated lessons — mark attendance after each one."
        action={
          <Button onClick={openCreate} leftIcon={<CalendarPlus className="h-4 w-4" aria-hidden />}>
            New lesson
          </Button>
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

      {lessons.loading ? (
        <SkeletonList count={3} />
      ) : byDay.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No lessons planned"
          description={groupId ? "This group has no lessons yet." : "Plan your first lesson."}
          action={<Button onClick={openCreate} leftIcon={<CalendarPlus className="h-4 w-4" aria-hidden />}>New lesson</Button>}
        />
      ) : (
        <div className="space-y-6">
          {byDay.map((day) => (
            <section key={day.key}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{day.label}</h2>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {day.items.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                          <Clock className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{l.data.title}</p>
                          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{formatTime(l.data.startsAt)} · {l.data.durationMin} min</span>
                            <span className="inline-flex items-center gap-1">
                              {groupsById.get(l.data.groupId)?.name ?? "Group"}
                            </span>
                            {l.data.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" aria-hidden /> {l.data.location}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link to={`/teacher/schedule/attendance/${l.id}`} className="btn-ghost btn-sm">
                            <ListChecks className="h-4 w-4" aria-hidden /> Attendance
                          </Link>
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
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit lesson" : "New lesson"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} loading={saving}>
              {editing ? "Save changes" : "Add lesson"}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Group" htmlFor="l-group" required>
            <Select id="l-group" value={form.groupId} onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))} required>
              <option value="">Select group…</option>
              {(groups.docs ?? []).map((g) => (
                <option key={g.id} value={g.id}>{g.data.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Title" htmlFor="l-title" required>
            <Input id="l-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Unit 3 – Reading comprehension" required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" htmlFor="l-date" required>
              <Input id="l-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </Field>
            <Field label="Time" htmlFor="l-time" required>
              <Input id="l-time" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} required />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duration (min)" htmlFor="l-dur">
              <Input id="l-dur" type="number" min={15} step={5} value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} />
            </Field>
            <Field label="Location" htmlFor="l-loc">
              <Input id="l-loc" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Classroom, Zoom…" />
            </Field>
          </div>
          <Field label="Notes" htmlFor="l-notes">
            <Textarea id="l-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete != null}
        title="Delete lesson?"
        description={toDelete ? `"${toDelete.title}" and its attendance records will be removed.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}