import { useState, type FormEvent } from "react";
import { BookOpen, Plus, Pencil, Trash2, ChevronDown, ChevronUp, ListOrdered, GraduationCap } from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import {
  allUnitsQuery,
  lessonsOfUnitQuery,
  createUnit,
  updateUnit,
  deleteUnit,
  createProgramLesson,
  updateProgramLesson,
  deleteProgramLesson,
  reorderUnits,
  reorderProgramLessons,
} from "@/lib/db/program";
import type { ProgramUnitDoc, ProgramLessonDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

type LessonSectionKey = "content" | "grammar" | "vocabulary" | "reading" | "writing" | "listening";

const LESSON_SECTIONS: { key: LessonSectionKey; label: string }[] = [
  { key: "content", label: "Lesson content" },
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "listening", label: "Listening" },
];

export function TeacherProgramPage() {
  const { toast } = useToast();
  const units = useQuery<ProgramUnitDoc>(allUnitsQuery);
  const [expanded, setExpanded] = useState<string | null>(null);
  const lessons = useQuery<ProgramLessonDoc>(
    (db) => (expanded ? lessonsOfUnitQuery(db, expanded) : null),
    [expanded]
  );

  const [unitOpen, setUnitOpen] = useState(false);
  const [unitTitle, setUnitTitle] = useState("");
  const [unitDesc, setUnitDesc] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState<{ id: string; data: ProgramUnitDoc } | null>(null);

  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSections, setLessonSections] = useState<Record<string, string>>({});
  const [editingLesson, setEditingLesson] = useState<{ id: string; unitId: string } | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<{ kind: "unit" | "lesson"; id: string; unitId?: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const expandedUnit = units.docs?.find((u) => u.id === expanded) ?? null;

  function openAddUnit() {
    setEditingUnit(null);
    setUnitTitle("");
    setUnitDesc("");
    setUnitOpen(true);
  }

  function openEditUnit(u: { id: string; data: ProgramUnitDoc }) {
    setEditingUnit(u);
    setUnitTitle(u.data.title);
    setUnitDesc(u.data.description ?? "");
    setUnitOpen(true);
  }

  async function onSaveUnit(e: FormEvent) {
    e.preventDefault();
    if (!unitTitle.trim()) return;
    setSavingUnit(true);
    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, { title: unitTitle.trim(), description: unitDesc.trim() || null });
        toast("Unit updated", { variant: "success" });
      } else {
        const maxOrder = Math.max(0, ...(units.docs ?? []).map((u) => u.data.order));
        await createUnit({ title: unitTitle.trim(), description: unitDesc.trim() || null, order: maxOrder + 1 });
        toast("Unit added", { variant: "success" });
      }
      setUnitOpen(false);
    } catch {
      toast("Could not save unit", { variant: "error" });
    } finally {
      setSavingUnit(false);
    }
  }

  function openAddLesson() {
    if (!expanded) return;
    setEditingLesson(null);
    setLessonTitle("");
    setLessonSections({});
    setLessonOpen(true);
  }

  function openEditLesson(l: { id: string; data: ProgramLessonDoc }) {
    if (!expanded) return;
    setEditingLesson({ id: l.id, unitId: expanded });
    setLessonTitle(l.data.title);
    setLessonSections({
      content: l.data.content ?? "",
      grammar: l.data.grammar ?? "",
      vocabulary: l.data.vocabulary ?? "",
      reading: l.data.reading ?? "",
      writing: l.data.writing ?? "",
      listening: l.data.listening ?? "",
    });
    setLessonOpen(true);
  }

  async function onSaveLesson(e: FormEvent) {
    e.preventDefault();
    if (!expanded || !lessonTitle.trim()) return;
    setSavingLesson(true);
    try {
      const sections: Record<LessonSectionKey, string | null> = {} as Record<LessonSectionKey, string | null>;
      for (const s of LESSON_SECTIONS) {
        const val = lessonSections[s.key]?.trim();
        sections[s.key] = val ? val : null;
      }
      if (editingLesson) {
        await updateProgramLesson(expanded, editingLesson.id, { title: lessonTitle.trim(), ...sections });
        toast("Lesson updated", { variant: "success" });
      } else {
        const maxOrder = Math.max(0, ...(lessons.docs ?? []).map((l) => l.data.order));
        await createProgramLesson(expanded, { title: lessonTitle.trim(), order: maxOrder + 1, ...sections });
        toast("Lesson added", { variant: "success" });
      }
      setLessonOpen(false);
    } catch {
      toast("Could not save lesson", { variant: "error" });
    } finally {
      setSavingLesson(false);
    }
  }

  async function onConfirmDelete() {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      if (confirmTarget.kind === "unit") {
        await deleteUnit(confirmTarget.id);
        if (expanded === confirmTarget.id) setExpanded(null);
        toast("Unit deleted", { variant: "info" });
      } else {
        await deleteProgramLesson(confirmTarget.unitId!, confirmTarget.id);
        toast("Lesson deleted", { variant: "info" });
      }
      setConfirmTarget(null);
    } catch {
      toast("Could not delete", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  async function moveUnit(index: number, dir: -1 | 1) {
    const list = [...(units.docs ?? [])].sort((a, b) => a.data.order - b.data.order);
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const tmp = list[index];
    list[index] = list[target];
    list[target] = tmp;
    try {
      await reorderUnits(list.map((u, i) => ({ id: u.id, order: i })));
    } catch {
      toast("Could not reorder", { variant: "error" });
    }
  }

  async function moveLesson(index: number, dir: -1 | 1) {
    const list = [...(lessons.docs ?? [])].sort((a, b) => a.data.order - b.data.order);
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const tmp = list[index];
    list[index] = list[target];
    list[target] = tmp;
    try {
      await reorderProgramLessons(expanded!, list.map((l, i) => ({ id: l.id, order: i })));
    } catch {
      toast("Could not reorder", { variant: "error" });
    }
  }

  const sortedUnits = [...(units.docs ?? [])].sort((a, b) => a.data.order - b.data.order);
  const sortedLessons = [...(lessons.docs ?? [])].sort((a, b) => a.data.order - b.data.order);

  const renderLessonSection = (key: string) => {
    const meta = LESSON_SECTIONS.find((s) => s.key === key)!;
    return (
      <Field key={key} label={meta.label}>
        <Textarea
          rows={3}
          value={lessonSections[key] ?? ""}
          onChange={(e) => setLessonSections((prev) => ({ ...prev, [key]: e.target.value }))}
        />
      </Field>
    );
  };

  return (
    <div>
      <PageHeader
        title="Program"
        description="The shared curriculum — organized in units and lessons."
        action={
          <Button onClick={openAddUnit} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            New unit
          </Button>
        }
      />

      {units.loading ? (
        <SkeletonList count={3} />
      ) : sortedUnits.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No units yet"
          description="Build your syllabus unit by unit."
          action={<Button onClick={openAddUnit} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New unit</Button>}
        />
      ) : (
        <div className="space-y-4">
          {sortedUnits.map((u, ui) => {
            const active = expanded === u.id;
            return (
              <Card key={u.id}>
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    type="button"
                    aria-label="Move unit up"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-surface-muted disabled:opacity-30"
                    disabled={ui === 0}
                    onClick={() => moveUnit(ui, -1)}
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Move unit down"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-surface-muted disabled:opacity-30"
                    disabled={ui === sortedUnits.length - 1}
                    onClick={() => moveUnit(ui, 1)}
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{u.data.title}</h3>
                    {u.data.description ? (
                      <p className="text-sm text-muted-foreground">{u.data.description}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(active ? null : u.id)}
                    leftIcon={<ListOrdered className="h-4 w-4" aria-hidden />}
                  >
                    {active ? "Hide" : `${lessons.docs?.length ?? 0} lessons`}
                  </Button>
                  <button
                    type="button"
                    aria-label="Edit unit"
                    className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    onClick={() => openEditUnit(u)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete unit"
                    className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                    onClick={() => setConfirmTarget({ kind: "unit", id: u.id, label: u.data.title })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                {active ? (
                  <div className="border-t border-border px-5 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Lessons{expandedUnit ? ` · ${expandedUnit.data.title}` : ""}
                      </p>
                      <Button variant="secondary" size="sm" onClick={openAddLesson} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
                        Add lesson
                      </Button>
                    </div>
                    {lessons.loading ? (
                      <SkeletonList count={2} />
                    ) : sortedLessons.length === 0 ? (
                      <EmptyState icon={BookOpen} title="No lessons in this unit yet" />
                    ) : (
                      <ul className="space-y-2">
                        {sortedLessons.map((l, li) => (
                          <li key={l.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                              {li + 1}
                            </span>
                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{l.data.title}</p>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                aria-label="Move lesson up"
                                className="rounded p-1 text-muted-foreground hover:bg-surface-muted disabled:opacity-30"
                                disabled={li === 0}
                                onClick={() => moveLesson(li, -1)}
                              >
                                <ChevronUp className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                aria-label="Move lesson down"
                                className="rounded p-1 text-muted-foreground hover:bg-surface-muted disabled:opacity-30"
                                disabled={li === sortedLessons.length - 1}
                                onClick={() => moveLesson(li, 1)}
                              >
                                <ChevronDown className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                aria-label="Edit lesson"
                                className="rounded p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                                onClick={() => openEditLesson(l)}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                aria-label="Delete lesson"
                                className="rounded p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                                onClick={() => setConfirmTarget({ kind: "lesson", id: l.id, unitId: expanded, label: l.data.title })}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={unitOpen}
        onClose={() => setUnitOpen(false)}
        title={editingUnit ? "Edit unit" : "New unit"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setUnitOpen(false)}>Cancel</Button>
            <Button onClick={onSaveUnit} loading={savingUnit}>{editingUnit ? "Save" : "Create unit"}</Button>
          </>
        }
      >
        <form onSubmit={onSaveUnit} className="space-y-4">
          <Field label="Unit title" htmlFor="u-title" required>
            <Input id="u-title" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} placeholder="Unit 1 — The foundations" required />
          </Field>
          <Field label="Description" htmlFor="u-desc">
            <Textarea id="u-desc" value={unitDesc} onChange={(e) => setUnitDesc(e.target.value)} rows={3} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        title={editingLesson ? "Edit lesson" : "New lesson"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLessonOpen(false)}>Cancel</Button>
            <Button onClick={onSaveLesson} loading={savingLesson}>{editingLesson ? "Save lesson" : "Add lesson"}</Button>
          </>
        }
      >
        <form onSubmit={onSaveLesson} className="space-y-4">
          <Field label="Lesson title" htmlFor="l2-title" required>
            <Input id="l2-title" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Reading: The text of Unit 1" required />
          </Field>
          <div className="space-y-4">{LESSON_SECTIONS.map((s) => renderLessonSection(s.key))}</div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmTarget != null}
        title={`Delete ${confirmTarget?.kind}?`}
        description={confirmTarget ? `"${confirmTarget.label}" will be removed.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}