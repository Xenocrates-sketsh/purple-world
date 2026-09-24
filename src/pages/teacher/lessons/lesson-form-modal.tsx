import { Paperclip } from "lucide-react";

import type { QueryState } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SkeletonList } from "@/components/ui/skeleton";
import { AttachmentList } from "@/components/attachment-list";
import { ATTACHMENT_ACCEPT } from "@/lib/attachments";
import type { GroupDoc } from "@/lib/types";

export function LessonFormModal({
  open,
  editing,
  title,
  attachments,
  assignedGroupIds,
  groups,
  saving,
  uploadingFile,
  onClose,
  onTitle,
  onToggleGroup,
  onPickFile,
  onRemoveAttachment,
  onSave,
}: {
  open: boolean;
  editing: boolean;
  title: string;
  attachments: string[];
  assignedGroupIds: string[];
  groups: QueryState<GroupDoc>;
  saving: boolean;
  uploadingFile: boolean;
  onClose: () => void;
  onTitle: (v: string) => void;
  onToggleGroup: (id: string) => void;
  onPickFile: (f: File) => void;
  onRemoveAttachment: (url: string) => void;
  onSave: (e: React.FormEvent) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit lesson" : "New lesson"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={uploadingFile}>Cancel</Button>
          <Button onClick={onSave} loading={saving} disabled={uploadingFile}>
            {editing ? "Save lesson" : "Add lesson"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSave} className="space-y-4">
        <Field label="Lesson title" htmlFor="les-title" required>
          <Input
            id="les-title"
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Past simple — worksheet 3"
            required
          />
        </Field>

        <Field
          label="Which groups will see this lesson?"
          hint="Leave empty to show it to every group."
        >
          {groups.docs == null ? (
            <SkeletonList count={1} />
          ) : (groups.docs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups yet. The lesson will be visible to everyone.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(groups.docs ?? []).map((g) => {
                const on = assignedGroupIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onToggleGroup(g.id)}
                    className={
                      "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                      (on
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface-muted text-muted-foreground hover:text-foreground")
                    }
                  >
                    {g.data.name} {on ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        <Field
          label="Files (PDF)"
          hint="The lesson content lives in the PDF."
          htmlFor="lesson-file-input"
        >
          <div className="space-y-2">
            <AttachmentList urls={attachments} onRemove={onRemoveAttachment} />
            <label
              htmlFor="lesson-file-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <Paperclip className="h-4 w-4" aria-hidden />
              {uploadingFile ? "Uploading…" : "Attach a PDF"}
              <input
                id="lesson-file-input"
                type="file"
                accept={ATTACHMENT_ACCEPT}
                className="hidden"
                disabled={uploadingFile}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickFile(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </Field>
      </form>
    </Modal>
  );
}
