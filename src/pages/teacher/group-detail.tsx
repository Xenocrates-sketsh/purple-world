import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Users } from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import { updateGroup } from "@/lib/db/groups";
import { studentsByGroupQuery } from "@/lib/db/students";
import { notesQuery, addNote, updateNote, deleteNote } from "@/lib/db/notes";
import { paths } from "@/lib/db/paths";
import type { ScheduleSlot, GroupDoc, StudentDoc, NoteEntryDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";
import { useDoc } from "@/hooks/useFirestore";
import { StudentNotesSection } from "./student-detail/notes-section";
import { GroupScheduleCard, GroupMembersCard } from "./group-detail/group-cards";
import { GroupEditModal, GroupSlotModal } from "./group-detail/group-modals";

function toMinutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function TeacherGroupDetailPage() {
  const { groupId = "" } = useParams();
  const { toast } = useToast();
  const group = useDoc<GroupDoc>(paths.groups(groupId));
  const members = useQuery<StudentDoc>((db) => studentsByGroupQuery(db, groupId), [groupId]);
  const notes = useQuery<NoteEntryDoc>((db) => notesQuery(db, `group:${groupId}`), [groupId]);

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
  if (!group.doc || !data) {
    return (
      <EmptyState
        icon={Users}
        title="Group not found"
        action={<Link to="/teacher/groups" className="btn-secondary btn-sm">Back to groups</Link>}
      />
    );
  }

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
          <GroupScheduleCard
            slots={slots}
            onAddSlot={() => setSlotOpen(true)}
            onDeleteSlot={onDeleteSlot}
          />
          <GroupMembersCard members={members} />
        </div>

        <div className="space-y-6">
          <StudentNotesSection
            notes={notes}
            noteOpen={noteOpen}
            noteText={noteText}
            editingNoteId={editingNoteId}
            title="Teacher notes"
            description="Private — only you can see these"
            placeholder="Keep reminders about this class here…"
            addLabel="Add"
            onOpenAdd={() => { setEditingNoteId(null); setNoteText(""); setNoteOpen(true); }}
            onOpenEdit={(id, content) => { setEditingNoteId(id); setNoteText(content); setNoteOpen(true); }}
            onCloseNote={() => setNoteOpen(false)}
            onNoteText={setNoteText}
            onSubmitNote={onSaveNote}
            onDeleteNote={onDeleteNote}
          />
        </div>
      </div>

      <GroupEditModal
        open={editOpen}
        desc={desc}
        saving={saving}
        onClose={() => setEditOpen(false)}
        onDesc={setDesc}
        onSave={onSaveInfo}
      />

      <GroupSlotModal
        open={slotOpen}
        day={day}
        startTime={startTime}
        endTime={endTime}
        location={location}
        onClose={() => setSlotOpen(false)}
        onDay={setDay}
        onStartTime={setStartTime}
        onEndTime={setEndTime}
        onLocation={setLocation}
        onSave={onAddSlot}
      />
    </div>
  );
}
