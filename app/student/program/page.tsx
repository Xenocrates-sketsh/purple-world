"use client";

import * as React from "react";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import type { ProgramUnitRow } from "@/lib/types";

export default function StudentProgramPage() {
  const [units, setUnits] = React.useState<ProgramUnitRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openUnits, setOpenUnits] = React.useState<Set<string>>(new Set());
  const [openLesson, setOpenLesson] = React.useState<string | null>(null);

  React.useEffect(() => {
    api
      .get<ProgramUnitRow[]>("/api/program")
      .then((u) => {
        setUnits(u);
        if (u.length > 0) {
          setOpenUnits(new Set([u[0].id]));
          if (u[0].lessons.length > 0) setOpenLesson(u[0].lessons[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleUnit = (id: string) =>
    setOpenUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const lesson = units.flatMap((u) => u.lessons).find((l) => l.id === openLesson);

  if (loading) return <Spinner className="py-24" />;

  const sections = lesson
    ? ([
        { key: "grammar", label: "Grammar", body: lesson.grammar },
        { key: "vocabulary", label: "Vocabulary", body: lesson.vocabulary },
        { key: "reading", label: "Reading", body: lesson.reading },
        { key: "writing", label: "Writing", body: lesson.writing },
        { key: "listening", label: "Listening", body: lesson.listening },
      ] as const)
    : [];

  return (
    <>
      <PageHeader title="BAC Program" description="Study the official curriculum with your teacher." />

      {units.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Program not published yet"
          description="Check back soon — your teacher is preparing the curriculum."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="space-y-2">
            {units.map((u) => (
              <Card key={u.id}>
                <button
                  onClick={() => toggleUnit(u.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                  aria-expanded={openUnits.has(u.id)}
                >
                  {openUnits.has(u.id) ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {u.position}. {u.title}
                    </p>
                    {u.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{u.description}</p>}
                  </div>
                </button>
                {openUnits.has(u.id) && (
                  <ul className="border-t border-border pb-2" role="list">
                    {u.lessons.length === 0 && (
                      <li className="px-4 py-2 text-xs text-muted-foreground">No lessons yet.</li>
                    )}
                    {u.lessons.map((l) => (
                      <li key={l.id}>
                        <button
                          onClick={() => setOpenLesson(l.id)}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                            openLesson === l.id
                              ? "bg-primary-soft font-medium text-primary"
                              : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                          }`}
                        >
                          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">
                            {l.position}. {l.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>

          <Card className="p-5">
            {!lesson ? (
              <EmptyState icon={BookOpen} title="Select a lesson" description="Pick a lesson from the list to start studying." />
            ) : (
              <>
                <h2 className="text-lg font-bold text-foreground">{lesson.title}</h2>
                {lesson.content && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{lesson.content}</p>
                )}
                <div className="mt-5 space-y-4">
                  {sections
                    .filter((s) => s.body)
                    .map((s) => (
                      <div key={s.key} className="rounded-2xl border border-border p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">{s.label}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{s.body}</p>
                      </div>
                    ))}
                  {sections.every((s) => !s.body) && !lesson.content && (
                    <p className="text-sm text-muted-foreground">This lesson has no content yet.</p>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}