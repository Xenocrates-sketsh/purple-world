import { BookOpen, Pencil, Trash2 } from "lucide-react";

import type { LessonResourceDoc } from "@/lib/types";

export function LessonList({
  items,
  groupName,
  onEdit,
  onDeleteAsk,
}: {
  items: { id: string; data: LessonResourceDoc }[];
  groupName: Record<string, string>;
  onEdit: (l: { id: string; data: LessonResourceDoc }) => void;
  onDeleteAsk: (l: { id: string; data: LessonResourceDoc }) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {items.map((l) => {
        const groupLabel =
          l.data.assignedGroupIds.length === 0
            ? "All groups"
            : l.data.assignedGroupIds.map((gid) => groupName[gid] ?? "Group").join(", ");
        return (
          <li key={l.id} className="flex items-center gap-3 px-5 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{l.data.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {l.data.attachmentUrls.length} file{l.data.attachmentUrls.length === 1 ? "" : "s"} · {groupLabel}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Edit lesson"
                className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                onClick={() => onEdit(l)}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Delete lesson"
                className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                onClick={() => onDeleteAsk(l)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
