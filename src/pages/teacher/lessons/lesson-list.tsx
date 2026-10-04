import { useState } from "react";
import { BookOpen, Pencil, Trash2, ExternalLink, ChevronDown } from "lucide-react";

import type { LessonResourceDoc } from "@/lib/types";
import { attachmentName } from "@/lib/attachments";
import { cn } from "@/lib/cn";

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
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="divide-y divide-border">
      {items.map((l) => {
        const groupLabel =
          l.data.assignedGroupIds.length === 0
            ? "All groups"
            : l.data.assignedGroupIds.map((gid) => groupName[gid] ?? "Group").join(", ");
        const isOpen = openId === l.id;
        const files = l.data.attachmentUrls ?? [];
        return (
          <li key={l.id}>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : l.id)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <BookOpen className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{l.data.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {files.length} file{files.length === 1 ? "" : "s"} · {groupLabel}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
              <div className="flex shrink-0 items-center gap-1">
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
            </div>
            {isOpen ? (
              <div className="animate-fade-in space-y-3 px-5 pb-4 pl-[76px]">
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents attached yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {files.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-primary-soft"
                        >
                          <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                            {attachmentName(url)}
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
