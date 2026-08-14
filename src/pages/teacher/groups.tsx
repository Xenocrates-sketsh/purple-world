import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Trash2, Users } from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import { allGroupsQuery, createGroup, deleteGroup } from "@/lib/db/groups";
import { allStudentsQuery } from "@/lib/db/students";
import { DEFAULT_GROUP_COLORS, DAY_LABELS } from "@/lib/constants";
import type { GroupDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/toast";

export function TeacherGroupsPage() {
  const { toast } = useToast();
  const groups = useQuery(allGroupsQuery);
  const students = useQuery(allStudentsQuery);
  const studentsByGroup = new Map<string, number>();
  for (const s of students.docs ?? []) {
    const key = s.data.groupId ?? "";
    studentsByGroup.set(key, (studentsByGroup.get(key) ?? 0) + 1);
  }

  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_GROUP_COLORS[0]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || null,
        color,
        scheduleSlots: [],
      });
      toast("Group created — add its weekly schedule slots next", { variant: "success" });
      setOpen(false);
      setName("");
      setDescription("");
    } catch {
      toast("Could not create group", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteGroup(toDelete.id);
      toast("Group deleted", { variant: "info" });
      setToDelete(null);
    } catch {
      toast("Could not delete group", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Groups & classes"
        description="Concrete groups with their own weekly schedule."
        action={
          <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            New group
          </Button>
        }
      />

      {groups.loading ? (
        <SkeletonList count={3} />
      ) : (groups.docs ?? []).length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No groups yet"
          description="Create your first group (e.g. 'Bac 2026 – Session A')."
          action={
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New group</Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(groups.docs ?? []).map((g) => (
            <Link
              key={g.id}
              to={`/teacher/groups/${g.id}`}
              className="card group transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3 p-5 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: g.data.color }}
                    aria-hidden
                  />
                  <h3 className="font-semibold text-foreground">{g.data.name}</h3>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${g.data.name}`}
                  className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger focus:opacity-100 group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setToDelete({ id: g.id, name: g.data.name });
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="px-5 pb-4">
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {g.data.description || "No description"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="neutral" className="gap-1">
                    <Users className="h-3 w-3" aria-hidden />
                    {studentsByGroup.get(g.id) ?? 0}
                  </Badge>
                  <Badge variant="neutral">
                    {g.data.scheduleSlots.length} slot{g.data.scheduleSlots.length === 1 ? "" : "s"}
                  </Badge>
                  {g.data.scheduleSlots.length > 0 ? (
                    <span>
                      {DAY_LABELS[g.data.scheduleSlots[0].day].slice(0, 3)}{" "}
                      {g.data.scheduleSlots[0].startTime}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New group"
        description="You'll set the weekly schedule slots next."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onCreate} loading={saving} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>Create group</Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="space-y-4">
          <Field label="Group name" htmlFor="g-name" required>
            <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bac 2026 – Session A" required />
          </Field>
          <Field label="Description" htmlFor="g-desc">
            <Textarea id="g-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional notes about this class…" />
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {DEFAULT_GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Use color ${c}`}
                  onClick={() => setColor(c)}
                  className={
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 " +
                    (color === c ? "border-foreground" : "border-transparent")
                  }
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete != null}
        title="Delete group?"
        description={toDelete ? `${toDelete.name} will be removed. Students stay in the roster but lose their group.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}