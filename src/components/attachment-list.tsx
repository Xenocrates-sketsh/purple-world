import { FileText, X, ExternalLink } from "lucide-react";

import { attachmentName } from "@/lib/attachments";

/** Shared uploaded-file list with open + remove actions. */
export function AttachmentList({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove: (url: string) => void;
}) {
  if (urls.length === 0) return null;
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {urls.map((url) => (
        <li key={url} className="flex items-center gap-2 px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
            {attachmentName(url)}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            aria-label={`Open ${attachmentName(url)}`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
          <button
            type="button"
            aria-label={`Remove ${attachmentName(url)}`}
            onClick={() => onRemove(url)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
