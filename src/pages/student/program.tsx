import { useState } from "react";
import { ChevronDown, BookOpen, FileText, ExternalLink } from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import { allUnitsQuery, lessonsOfUnitQuery } from "@/lib/db/program";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { ProgramLessonDoc, ProgramUnitDoc } from "@/lib/types";

const SECTION_LABELS: { key: "content" | "grammar" | "vocabulary" | "reading" | "writing" | "listening"; label: string }[] = [
  { key: "content", label: "Lesson" },
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "listening", label: "Listening" },
];

function attachmentName(url: string): string {
  try {
    const name = decodeURIComponent(url.split("/").pop() ?? "");
    return name.replace(/^[0-9]+-[a-z0-9]{6}-/, "");
  } catch {
    return url.split("/").pop() ?? "Attachment";
  }
}

export function StudentProgramPage() {
  const units = useQuery<ProgramUnitDoc>((db) => allUnitsQuery(db));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (units.loading) {
    return (
      <div>
        <PageHeader title="Program" description="Our BAC English curriculum." />
        <SkeletonList count={3} />
      </div>
    );
  }

  if ((units.docs ?? []).length === 0) {
    return (
      <div>
        <PageHeader title="Program" description="Our BAC English curriculum." />
        <EmptyState
          icon={BookOpen}
          title="Program not published yet"
          description="Your teacher is still putting together the curriculum."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Program" description="Our BAC English curriculum — unit by unit." />
      <div className="space-y-6">
        {(units.docs ?? []).map((unit, unitIndex) => (
          <ProgramUnit
            key={unit.id}
            unitId={unit.id}
            index={unitIndex}
            title={`Unit ${unitIndex + 1} · ${unit.data.title}`}
            description={unit.data.description}
            expanded={expanded[unit.id] ?? unitIndex === 0}
            onToggle={() => setExpanded((e) => ({ ...e, [unit.id]: !(e[unit.id] ?? unitIndex === 0) }))}
          />
        ))}
      </div>
    </div>
  );
}

function ProgramUnit(props: {
  unitId: string;
  index: number;
  title: string;
  description: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const lessons = useQuery<ProgramLessonDoc>((db) => lessonsOfUnitQuery(db, props.unitId), [props.unitId]);
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader
        title={props.title}
        description={props.description ?? undefined}
        action={
          <button
            type="button"
            onClick={props.onToggle}
            aria-expanded={props.expanded}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            aria-label={props.expanded ? "Collapse unit" : "Expand unit"}
          >
            <ChevronDown className={cn("h-5 w-5 transition-transform", props.expanded && "rotate-180")} aria-hidden />
          </button>
        }
      />
      {props.expanded ? (
        <CardContent className="p-0">
          {lessons.loading ? (
            <div className="px-5 pb-5"><SkeletonList count={2} /></div>
          ) : (lessons.docs ?? []).length === 0 ? (
            <EmptyState title="No lessons yet" description="Coming soon." />
          ) : (
            <ul className="divide-y divide-border">
              {(lessons.docs ?? []).map((l, i) => {
                const isOpen = openLesson === l.id;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setOpenLesson(isOpen ? null : l.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-surface-muted"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {l.data.title}
                      </span>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                    </button>
                    {isOpen ? (
                      <div className="space-y-4 border-t border-border bg-surface px-5 py-4">
                        {SECTION_LABELS.map(({ key, label }) => {
                          const value = l.data[key];
                          if (!value) return null;
                          return (
                            <div key={key}>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {label}
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value}</p>
                            </div>
                          );
                        })}
                        {(l.data.attachmentUrls ?? []).length > 0 ? (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Files
                            </p>
                            <ul className="mt-1 space-y-1">
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
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}