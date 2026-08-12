"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardCheck, Plus, Trash2, Edit, ChevronRight } from "lucide-react";
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
import { ASSESSMENT_TYPES, labelFor } from "@/lib/constants";
import type { AssessmentRow, GroupSummary } from "@/lib/types";

type Mode = "create" | "edit";

export default function TeacherGradesPage() {
  const { toast } = useToast();
  const [assessments, setAssessments] = React.useState<AssessmentRow[]>([]);
  const [groups, setGroups] = React.useState<GroupSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState<Mode>("create");
  const [editId, setEditId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    type: "test",
    groupId: "",
    date: "",
    maxScore: "20",
    description: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setAssessments(await api.get<AssessmentRow[]>("/api/teacher/assessments"));
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load assessments." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    api.get<GroupSummary[]>("/api/teacher/groups").then(setGroups).catch(() => setGroups([]));
    load();
  }, [load]);

  const openCreate = () => {
    setMode("create");
    setEditId(null);
    setForm({ title: "", type: "test", groupId: "", date: "", maxScore: "20", description: "" });
    setOpen(true);
  };

  const openEdit = (a: AssessmentRow) => {
    setMode("edit");
    setEditId(a.id);
    setForm({
      title: a.title,
      type: a.type,
      groupId: a.groupId ?? "",
      date: a.date,
      maxScore: a.maxScore,
      description: a.description ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/api/teacher/assessments", form);
        toast({ kind: "success", title: "Assessment created" });
      } else {
        await api.patch(`/api/teacher/assessments/${editId}`, form);
        toast({ kind: "success", title: "Assessment updated" });
      }
      setOpen(false);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not save assessment." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.del(`/api/teacher/assessments/${deleteId}`);
      toast({ kind: "success", title: "Assessment deleted" });
      setDeleteId(null);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not delete assessment." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Grades"
        description="Create assessments and record student results."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden /> New assessment
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments yet"
          description="Create your first assessment to start recording grades."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden /> New assessment</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border" role="list">
            {assessments.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <ClipboardCheck className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(a.date)} · {labelFor(ASSESSMENT_TYPES, a.type)}
                    {a.groupName ? ` · ${a.groupName}` : ""}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Badge tone="primary">{a.resultCount} graded</Badge>
                  <Badge tone="neutral">{a.maxScore} pts</Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)} aria-label="Edit assessment">
                    <Edit className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(a.id)} aria-label="Delete assessment">
                    <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </Button>
                  <Link
                    href={`/teacher/grades/${a.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Enter grades <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "create" ? "New assessment" : "Edit assessment"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{mode === "create" ? "Create" : "Save changes"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Unit 4 Test" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={ASSESSMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="groupId">Group</Label>
              <Select id="groupId" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} options={[{ value: "", label: "All students" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]} />
            </div>
            <div>
              <Label htmlFor="maxScore">Max score</Label>
              <Input id="maxScore" type="number" min="0" step="0.5" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete this assessment?"
        description="All recorded grades for it will be deleted."
        loading={deleting}
      />
    </>
  );
}