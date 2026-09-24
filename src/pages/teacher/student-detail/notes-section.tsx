import { Pencil, FileText } from "lucide-react";

import type { QueryState } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import type { NoteEntryDoc } from "@/lib/types";

interface NotesSectionProps {
  notes: QueryState<NoteEntryDoc>;
  noteOpen: boolean;
  noteText: string;
  editingNoteId: string | null;
  title?: string;
  description?: string;
  placeholder?: string;
  addLabel?: string;
  onOpenAdd: () => void;
  onOpenEdit: (id: string, content: string) => void;
  onCloseNote: () => void;
  onNoteText: (v: string) => void;
  onSubmitNote: (e: React.FormEvent) => void;
  onDeleteNote: (id: string) => void;
}

export function StudentNotesSection(props: NotesSectionProps) {
  const { notes } = props;
  const title = props.title ?? "Private notes";
  const description = props.description ?? "Only you can see these";
  const placeholder = props.placeholder ?? "Homework habits, strengths, next steps…";
  const addLabel = props.addLabel ?? "Add note";
  return (
    <>
      <Card>
        <CardHeader
          title={title}
          description={description}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={props.onOpenAdd}
              leftIcon={<Pencil className="h-4 w-4" aria-hidden />}
            >
              {addLabel}
            </Button>
          }
        />
        <CardContent className="px-3 py-2">
          {notes.loading ? (
            <SkeletonList count={2} />
          ) : (notes.docs ?? []).length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No notes yet"
              description="Jot down observations, goals or reminders about this student."
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
                        onClick={() => props.onOpenEdit(n.id, n.data.content)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-md px-2 py-0.5 text-xs text-danger hover:bg-danger-soft"
                        onClick={() => props.onDeleteNote(n.id)}
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

      <Modal
        open={props.noteOpen}
        onClose={props.onCloseNote}
        title={props.editingNoteId ? "Edit note" : "Add a note"}
        description="Private — students can never see this."
        footer={
          <>
            <Button variant="ghost" onClick={props.onCloseNote}>Cancel</Button>
            <Button onClick={props.onSubmitNote}>{props.editingNoteId ? "Save note" : "Add note"}</Button>
          </>
        }
      >
        <form onSubmit={props.onSubmitNote}>
          <Field label="Note">
            <Textarea value={props.noteText} onChange={(e) => props.onNoteText(e.target.value)} rows={4} placeholder={placeholder} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
