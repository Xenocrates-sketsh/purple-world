import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Clock,
  Users,
  MapPin,
  FileText,
} from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import { updateGroup } from "@/lib/db/groups";
import { studentsByGroupQuery } from "@/lib/db/students";
import { notesQuery, addNote, updateNote, deleteNote } from "@/lib/db/notes";
import { paths } from "@/lib/db/paths";
import { DAY_LABELS } from "@/lib/constants";
import type { ScheduleSlot } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { useDoc } from "@/hooks/useFirestore";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

function toMinutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToClock(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function TeacherGroupDetailPage() {
  const { groupId = "" } = useParams();
  const { toast } = useToast();
  const group = useDoc(paths.groups(groupId));
  const members = useQuery((db) => studentsByGroupQuery(db, groupId), [groupId]);
  const notes = useQuery(notesQuery.bind(null, `group:${groupId}`), [groupId]);

  const [editOpen, setEditOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const [day, setDay] = useState<number>(0);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("18:30");
  const [location, setLocation] = useState("");

  const data = group.doc?.data;
  const slots = data?.scheduleSlots ?? [];

  async function onSaveInfo(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateGroup(groupId, { description: desc.trim() || null });
      toast("Group updated", { variant: "success" });
      setEditOpen(false);
    } catch {
      toast("Could not update group", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onSaveNote(e: FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      if (editingNoteId) {
        await updateNote(`group:${groupId}`, editingNoteId, noteText.trim());
      } else {
        await addNote(`group:${groupId}`, noteText.trim());
      }
      toast("Note saved", { variant: "success" });
      setNoteOpen(false);
      setNoteText("");
      setEditingNoteId(null);
    } catch {
      toast("Could not save note", { variant: "error" });
    }
  }

  async function onDeleteNote(entryId: string) {
    try {
      await deleteNote(`group:${groupId}`, entryId);
      toast("Note deleted", { variant: "info" });
    } catch {
      toast("Could not delete note", { variant: "error" });
    }
  }

  async function onAddSlot(e: FormEvent) {
    e.preventDefault();
    if (!data) return;
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      toast("End time must be after start time", { variant: "error" });
      return;
    }
    const slot: ScheduleSlot = {
      day: day as ScheduleSlot["day"],
      startTime,
      endTime,
      location: location.trim() || null,
      durationMin: toMinutes(endTime) - toMinutes(startTime),
    };
    try {
      await updateGroup(groupId, { scheduleSlots: [...slots, slot] });
      toast("Schedule slot added", { variant: "success" });
      setSlotOpen(false);
    } catch {
      toast("Could not add slot", { variant: "error" });
    }
  }

  async function onDeleteSlot(index: number) {
    try {
      await updateGroup(groupId, { scheduleSlots: slots.filter((_, i) => i !== index) });
      toast("Slot removed", { variant: "info" });
    } catch {
      toast("Could not remove slot", { variant: "error" });
    }
  }

  if (group.loading) return <SkeletonList count={2} />;
  if (!group.doc) {
    return (
      <EmptyState
        icon={Users}
        title="Group not found"
        action={<Link to="/teacher/groups" className="btn-secondary btn-sm">Back to groups</Link>}
      />
    );
  }

  const daySlots = DAY_LABELS.map((label, dayIdx) => ({
    label,
    items: slots.map((s, i) => ({ s, i })).filter((x) => x.s.day === dayIdx),
  })).filter((d) => d.items.length > 0);

  return (
    <div>
      <Link to="/teacher/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Groups
      </Link>

      <PageHeader
        title={data.name}
        description={data.description || "No description"}
        action={
          <Button variant="secondary" onClick={() => setEditOpen(true)} leftIcon={<Pencil className="h-4 w-4" aria-hidden />}>
            Edit info
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Weekly schedule"
              description="Recurring slots — lessons are created from these"
              action={
                <Button variant="ghost" size="sm" onClick={() => setSlotOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
                  Add slot
                </Button>
              }
            />
            <CardContent>
              {slots.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No schedule yet"
                  description="Add recurring weekly slots so lessons can be planned."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setSlotOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
                      Add first slot
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {daySlots.map((d) => (
                    <li key={d.label} className="rounded-xl border border-border p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d.label}</p>
                      <ul className="space-y-1.5">
                        {d.items.map(({ s, i }) => (
                          <li key={i} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
                              <span className="font-medium">
                                {s.startTime} – {s.endTime}
                              </span>
                              <span className="text-xs text-muted-foreground">({s.durationMin} min)</span>
                              {s.location ? (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" aria-hidden /> {s.location}
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              aria-label="Delete slot"
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                              onClick={() => onDeleteSlot(i)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={`Students in this group (${members.docs?.length ?? "…"})`} />
            <CardContent className="p-0">
              {members.loading ? (
                <div className="p-5"><SkeletonList count={3} /></div>
              ) : (members.docs ?? []).length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No students in this group yet"
                  description="Assign students from their profile page."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {members.docs?.map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/teacher/students/${s.id}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                      >
                        <Avatar name={s.data.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{s.data.name}</p>
                          <p className="text-xs text-muted-foreground">{s.data.studentNo}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{s.data.stream ?? ""}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Teacher notes"
              description="Private — only you can see these"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingNoteId(null);
                    setNoteText("");
                    setNoteOpen(true);
                  }}
                  leftIcon={<Plus className="h-4 w-4" aria-hidden />}
                >
                  Add
                </Button>
              }
            />
            <CardContent className="px-3 py-2">
              {notes.loading ? (
                <SkeletonList count={1} />
              ) : (notes.docs ?? []).length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No notes yet"
                  description="Reminders about this class, pacing, or anything else."
                />
              ) : (
                <ul className="space-y-1">
                  {(notes.docs ?? []).map((n) => (
                    <li key={n.id} className="rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-muted">
                      <p className="whitespace-pre-wrap text-sm text-foreground">{n.data.content}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDateTime(n.data.updatedAt)}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                            onClick={() => {
                              setEditingNoteId(n.id);
                              setNoteText(n.data.content);
                              setNoteOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-md px-2 py-0.5 text-xs text-danger hover:bg-danger-soft"
                            onClick={() => onDeleteNote(n.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={editingNoteId ? "Edit note" : "Add a note"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={onSaveNote}>{editingNoteId ? "Save note" : "Add note"}</Button>
          </>
        }
      >
        <form onSubmit={onSaveNote}>
          <Field label="Note">
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Keep reminders about this class here…" />
          </Field>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit group info"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={onSaveInfo} loading={saving}>Save</Button>
          </>
        }
      >
        <form onSubmit={onSaveInfo} className="space-y-4">
          <Field label="Description">
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={slotOpen}
        onClose={() => setSlotOpen(false)}
        title="Add a weekly slot"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSlotOpen(false)}>Cancel</Button>
            <Button onClick={onAddSlot} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>Add slot</Button>
          </>
        }
      >
        <form onSubmit={onAddSlot} className="space-y-4">
          <Field label="Day" htmlFor="sl-day">
            <Select
              id="sl-day"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            >
              {DAY_LABELS.map((label, i) => (
                <option key={label} value={i}>{label}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start" htmlFor="sl-start" required>
              <Input id="sl-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </Field>
            <Field label="End" htmlFor="sl-end" required>
              <Input id="sl-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </Field>
          </div>
          <Field label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Classroom, Zoom…" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}