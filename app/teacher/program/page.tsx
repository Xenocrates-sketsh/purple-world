"use client";

import * as React from "react";
import { BookOpen, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { ProgramUnitRow } from "@/lib/types";

type UnitForm = { title: string; description: string };
type LessonForm = {
  title: string;
  content: string;
  grammar: string;
  vocabulary: string;
  reading: string;
  writing: string;
  listening: string;
};

const EMPTY_LESSON: LessonForm = { title: "", content: "", grammar: "", vocabulary: "", reading: "", writing: "", listening: "" };

export default function TeacherProgramPage() {
  const { toast } = useToast();
  const [units, setUnits] = React.useState<ProgramUnitRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const [unitOpen, setUnitOpen] = React.useState(false);
  const [unitForm, setUnitForm] = React.useState<UnitForm>({ title: "", description: "" });
  const [unitSaving, setUnitSaving] = React.useState(false);

  const [lessonOpen, setLessonOpen] = React.useState(false);
  const [lessonUnitId, setLessonUnitId] = React.useState<string | null>(null);
  const [lessonForm, setLessonForm] = React.useState<LessonForm>(EMPTY_LESSON);
  const [lessonSaving, setLessonSaving] = React.useState(false);

  const [deleteKind, setDeleteKind] = React.useState<{ kind: "unit" | "lesson"; id: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setUnits(await api.get<ProgramUnitRow[]>("/api/program"));
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load program." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleUnit = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const saveUnit = async () => {
    if (!unitForm.title.trim()) {
      toast({ kind: "error", title: "Unit title is required." });
      return;
    }
    setUnitSaving(true);
    try {
      await api.post("/api/teacher/program/units", unitForm);
      setUnitOpen(false);
      setUnitForm({ title: "", description: "" });
      toast({ kind: "success", title: "Unit added" });
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not add unit." });
    } finally {
      setUnitSaving(false);
    }
  };

  const openLesson = (unitId: string) => {
    setLessonUnitId(unitId);
    setLessonForm(EMPTY_LESSON);
    setLessonOpen(true);
  };

  const saveLesson = async () => {
    if (!lessonUnitId) return;
    if (!lessonForm.title.trim()) {
      toast({ kind: "error", title: "Lesson title is required." });
      return;
    }
    setLessonSaving(true);
    try {
      await api.post(`/api/teacher/program/units/${lessonUnitId}/lessons`, lessonForm);
      setLessonOpen(false);
      toast({ kind: "success", title: "Lesson added" });
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not add lesson." });
    } finally {
      setLessonSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteKind) return;
    setDeleting(true);
    try {
      if (deleteKind.kind === "unit") await api.del(`/api/teacher/program/units/${deleteKind.id}`);
      else await api.del(`/api/teacher/program/lessons/${deleteKind.id}`);
      toast({ kind: "success", title: deleteKind.kind === "unit" ? "Unit deleted" : "Lesson deleted" });
      setDeleteKind(null);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not delete." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="BAC Program"
        description="Structure the official curriculum into units and lessons."
        action={
          <Button onClick={() => setUnitOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New unit
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : units.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No units yet"
          description="Build your program around the official BAC curriculum."
          action={<Button onClick={() => setUnitOpen(true)}><Plus className="h-4 w-4" aria-hidden /> New unit</Button>}
        />
      ) : (
        <div className="space-y-3">
          {units.map((u) => (
            <Card key={u.id}>
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleUnit(u.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                  aria-expanded={expanded.has(u.id)}
                  aria-label={expanded.has(u.id) ? "Collapse unit" : "Expand unit"}
                >
                  {expanded.has(u.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold text-foreground">
                    {u.position}. {u.title}
                  </h2>
                  {u.description && <p className="truncate text-xs text-muted-foreground">{u.description}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">{u.lessons.length} lessons</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openLesson(u.id)}>
                  <Plus className="h-4 w-4" aria-hidden /> Lesson
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteKind({ kind: "unit", id: u.id })} aria-label="Delete unit">
                  <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Button>
              </div>
              {expanded.has(u.id) && (
                <div className="border-t border-border">
                  {u.lessons.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground">No lessons in this unit yet.</p>
                  ) : (
                    <ul className="divide-y divide-border" role="list">
                      {u.lessons.map((l) => (
                        <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                          <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                            {l.position}. {l.title}
                          </p>
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {[l.grammar, l.vocabulary, l.reading, l.writing, l.listening].filter(Boolean).length} sections
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteKind({ kind: "lesson", id: l.id })} aria-label="Delete lesson">
                            <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={unitOpen}
        onClose={() => setUnitOpen(false)}
        title="New unit"
        description="A unit is a chapter of the BAC program."
        footer={
          <>
            <Button variant="outline" onClick={() => setUnitOpen(false)}>Cancel</Button>
            <Button onClick={saveUnit} loading={unitSaving}>Add unit</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="unit-title">Title *</Label>
            <Input id="unit-title" value={unitForm.title} onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })} placeholder="e.g. Unit 1: Educational Systems" />
          </div>
          <div>
            <Label htmlFor="unit-desc">Description</Label>
            <Textarea id="unit-desc" rows={3} value={unitForm.description} onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })} placeholder="What this unit covers" />
          </div>
        </div>
      </Modal>

      <Modal
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        title="New lesson"
        description="Fill the sections you want to publish to students."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setLessonOpen(false)}>Cancel</Button>
            <Button onClick={saveLesson} loading={lessonSaving}>Add lesson</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="lesson-title">Title *</Label>
            <Input id="lesson-title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="e.g. Expressing cause and effect" />
          </div>
          <div>
            <Label htmlFor="lesson-content">Overview</Label>
            <Textarea id="lesson-content" rows={3} value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Introduction to the lesson" />
          </div>
          <div>
            <Label htmlFor="lesson-grammar">Grammar</Label>
            <Textarea id="lesson-grammar" rows={3} value={lessonForm.grammar} onChange={(e) => setLessonForm({ ...lessonForm, grammar: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lesson-vocabulary">Vocabulary</Label>
            <Textarea id="lesson-vocabulary" rows={3} value={lessonForm.vocabulary} onChange={(e) => setLessonForm({ ...lessonForm, vocabulary: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lesson-reading">Reading</Label>
            <Textarea id="lesson-reading" rows={3} value={lessonForm.reading} onChange={(e) => setLessonForm({ ...lessonForm, reading: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lesson-writing">Writing</Label>
            <Textarea id="lesson-writing" rows={3} value={lessonForm.writing} onChange={(e) => setLessonForm({ ...lessonForm, writing: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lesson-listening">Listening</Label>
            <Textarea id="lesson-listening" rows={3} value={lessonForm.listening} onChange={(e) => setLessonForm({ ...lessonForm, listening: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteKind !== null}
        onClose={() => setDeleteKind(null)}
        onConfirm={remove}
        title={deleteKind?.kind === "unit" ? "Delete this unit?" : "Delete this lesson?"}
        description={deleteKind?.kind === "unit" ? "All lessons inside it will be deleted too." : "Students will no longer see this lesson."}
        loading={deleting}
      />
    </>
  );
}