import { useMemo, useState } from "react";
import { ChevronDown, BookOpen, FileText, ExternalLink } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import {
  allGroupsLessonResourcesQuery,
  groupLessonResourcesQuery,
} from "@/lib/db/lessonResources";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useGraceLoading } from "@/hooks/useGraceLoading";
import { cn } from "@/lib/cn";
import type { LessonResourceDoc } from "@/lib/types";

function attachmentName(url: string): string {
  try {
    const name = decodeURIComponent(url.split("/").pop() ?? "");
    return name.replace(/^[0-9]+-[a-z0-9]{6}-/, "");
  } catch {
    return url.split("/").pop() ?? "Attachment";
  }
}

export function StudentLessonsPage() {
  const { userDoc } = useAuth();
  const myGroupId = userDoc?.groupId ?? null;
  // Two rule-provable queries merged client-side (see db/lessonResources.ts):
  // all-groups lessons + my group's lessons. An unconstrained list query is
  // denied outright because the rule depends on assignedGroupIds.
  const allGroups = useQuery<LessonResourceDoc>((db) => allGroupsLessonResourcesQuery(db));
  const myGroup = useQuery<LessonResourceDoc>(
    (db) => (myGroupId ? groupLessonResourcesQuery(db, myGroupId) : null),
    [myGroupId]
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const lessons = useMemo(() => {
    const seen = new Map<string, NonNullable<typeof allGroups.docs>[number]>();
    for (const d of [...(allGroups.docs ?? []), ...(myGroup.docs ?? [])]) {
      if (!seen.has(d.id)) seen.set(d.id, d);
    }
    return {
      docs: [...seen.values()],
      loading: allGroups.loading || myGroup.loading,
      error: allGroups.error ?? myGroup.error ?? null,
    };
  }, [allGroups.docs, allGroups.loading, allGroups.error, myGroup.docs, myGroup.loading, myGroup.error]);
  const lessonsBusy = useGraceLoading(lessons.loading);

  const visible = useMemo(() => {
    return [...(lessons.docs ?? [])].sort(
      (a, b) => (b.data.createdAt?.toMillis?.() ?? 0) - (a.data.createdAt?.toMillis?.() ?? 0)
    );
  }, [lessons.docs]);

  return (
    <div>
      <PageHeader
        title="Lessons"
        description="PDF lessons from your teacher — open any file to read or download."
      />
      {lessons.error ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger">
          Couldn't load lessons ({String((lessons.error as { code?: unknown })?.code ?? "unknown")}) — check your connection and pull to refresh. If it persists, tell your teacher.
        </p>
      ) : lessonsBusy ? (
        <SkeletonList count={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons for you yet"
          description="Lessons your teacher publishes for your group will appear here."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {visible.map((l) => {
              const isOpen = openId === l.id;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : l.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-surface-muted"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-bold text-primary">
                      <BookOpen className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {l.data.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {l.data.attachmentUrls?.length
                        ? `${l.data.attachmentUrls.length} file${l.data.attachmentUrls.length === 1 ? "" : "s"}`
                        : "No file"}
                    </span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-border bg-surface px-5 py-4">
                      {(l.data.attachmentUrls ?? []).length > 0 ? (
                        <ul className="space-y-1">
                          {(l.data.attachmentUrls ?? []).map((url, idx) => (
                            <li key={url}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                              >
                                <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                                <span className="min-w-0 flex-1 truncate">
                                  {attachmentName(url) || `File ${idx + 1}`}
                                </span>
                                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No files attached to this lesson yet.</p>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
