"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  MapPin,
  StickyNote,
  ClipboardCheck,
  Trash2,
} from "lucide-react";
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
import { formatDateTime } from "@/lib/format";
import type { GroupSummary, LessonRow } from "@/lib/types";

type Mode = "create" | "edit";

export default function TeacherSchedulePage() {
  const { toast } = useToast();

  const [lessons, setLessons] = React.useState<LessonRow[]>([]);
  const [groups, setGroups] = React.useState<GroupSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("create");
  const [editId, setEditId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [form, setForm] = React.useState({
    groupId: "",
    title: "",
    startsAt: "",
    durationMin: "60",
    location: "",
    notes: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    try {
      setLessons(await api.get<LessonRow[]>(`/api/teacher/lessons?${qs.toString()}`));
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load schedule." });
    } finally {
      setLoading(false);
    }
  }, [from, to, toast]);

  React.useEffect(() => {
    api.get<GroupSummary[]>("/api/teacher/groups").then(setGroups).catch(() => setGroups([]));
    load();
  }, [load]);

  const openCreate = () => {
    setMode("create");
    setEditId(null);
    setForm({ groupId: groups[0]?.id ?? "", title: "", startsAt: "", durationMin: "60", location: "", notes: "" });
    setOpen(true);
  };

  const openEdit = (l: LessonRow) => {
    setMode("edit");
    setEditId(l.id);
    setForm({
      groupId: l.groupId,
      title: l.title,
      startsAt: l.startsAt.slice(0, 16),
      durationMin: String(l.durationMin),
      location: l.location ?? "",
      notes: l.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/api/teacher/lessons", form);
        toast({ kind: "success", title: "Lesson scheduled" });
      } else {
        await api.patch(`/api/teacher/lessons/${editId}`, form);
        toast({ kind: "success", title: "Lesson updated" });
      }
      setOpen(false);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not save lesson." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.del(`/api/teacher/lessons/${deleteId}`);
      toast({ kind: "success", title: "Lesson deleted" });
      setDeleteId(null);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not delete lesson." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Schedule"
        description="Plan your lessons and mark attendance."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden /> New lesson
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr]">
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={() => { setFrom(""); setTo(""); }}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No lessons in this range"
          description="Schedule your next session with one of your groups."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden /> New lesson</Button>}
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((l) => (
            <Card key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div
                className="flex h-14 w-20 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] font-semibold leading-tight"
                style={{ backgroundColor: `${l.groupColor}1a`, color: l.groupColor }}
              >
                <span className="text-sm">{new Date(l.startsAt).toLocaleDateString(undefined, { weekday: "short" })}</span>
                <span>{new Date(l.startsAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{l.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{l.groupName}</span>
                  <span>{formatDateTime(l.startsAt)}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden /> {l.location || "No location"}
                  </span>
                  {l.notes && (
                    <span className="flex items-center gap-1">
                      <StickyNote className="h-3 w-3" aria-hidden /> {l.notes}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {l.attendanceMarked ? (
                  <Badge tone="success">Marked</Badge>
                ) : (
                  <Link
                    href={`/teacher/schedule/attendance/${l.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-muted"
                  >
                    <ClipboardCheck className="h-4 w-4" aria-hidden /> Attendance
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(l.id)} aria-label="Delete lesson">
                  <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "create" ? "Schedule a lesson" : "Edit lesson"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{mode === "create" ? "Schedule" : "Save changes"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="groupId">Group *</Label>
            <Select id="groupId" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} options={groups.map((g) => ({ value: g.id, label: g.name }))} />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Reading comprehension" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="startsAt">Start *</Label>
              <Input id="startsAt" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="durationMin">Duration</Label>
              <Select id="durationMin" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} options={[{ value: "60", label: "60 min" }, { value: "90", label: "90 min" }, { value: "120", label: "120 min" }]} />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Classroom 3 / Online" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Topics to cover, materials needed…" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete this lesson?"
        description="Attendance records for this lesson will be removed too."
        loading={deleting}
      />
    </>
  );
}
