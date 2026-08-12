"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ASSESSMENT_TYPES, labelFor } from "@/lib/constants";

interface AssessmentDetail {
  id: string;
  title: string;
  type: string;
  groupId: string | null;
  groupName: string | null;
  date: string;
  maxScore: string;
  description: string | null;
  results: {
    id: string;
    studentId: string;
    studentName: string;
    studentNo: string;
    score: string;
    feedback: string | null;
  }[];
}

export default function TeacherGradeEntryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [a, setA] = React.useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [scores, setScores] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState<Record<string, string>>({});
  const [roster, setRoster] = React.useState<{ id: string; fullName: string }[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<AssessmentDetail>(`/api/teacher/assessments/${params.id}`);
      setA(data);
      const s: Record<string, string> = {};
      const f: Record<string, string> = {};
      for (const r of data.results) {
        s[r.studentId] = r.score;
        f[r.studentId] = r.feedback ?? "";
      }
      setScores(s);
      setFeedback(f);
      if (data.groupId) {
        const members = await api.get<{ id: string; fullName: string }[]>(
          `/api/teacher/groups/${data.groupId}`
        );
        setRoster(members.map((m) => ({ id: m.id, fullName: m.fullName })));
      } else {
        const students = await api.get<
          { id: string; fullName: string }[]
        >(`/api/teacher/students?filter=active`);
        setRoster(students.map((m) => ({ id: m.id, fullName: m.fullName })));
      }
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load assessment." });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const results = roster
        .filter((s) => scores[s.id] !== undefined && scores[s.id] !== "")
        .map((s) => ({
          studentId: s.id,
          score: scores[s.id],
          feedback: feedback[s.id] ?? "",
        }));
      await api.put(`/api/teacher/assessments/${params.id}/results`, { results });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ kind: "success", title: "Grades saved & students notified" });
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not save grades." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!a)
    return (
      <EmptyState
        icon={ArrowLeft}
        title="Assessment not found"
        action={<Link href="/teacher/grades"><Button variant="outline">Back to grades</Button></Link>}
      />
    );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/grades"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Back to grades"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{a.title}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(a.date)} · {labelFor(ASSESSMENT_TYPES, a.type)}
              {a.groupName ? ` · ${a.groupName}` : ""} · max {a.maxScore}
            </p>
          </div>
        </div>
        <Button onClick={save} loading={saving}>
          {saved ? <Check className="h-4 w-4" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {saved ? "Saved" : "Save grades"}
        </Button>
      </div>

      {roster.length === 0 ? (
        <EmptyState
          icon={ArrowLeft}
          title="No students to grade"
          description={a.groupId ? "Add students to this group first." : "Add students first."}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border" role="list">
            {roster.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={s.fullName} size="sm" />
                  <p className="truncate text-sm font-medium text-foreground">{s.fullName}</p>
                </div>
                <div className="flex flex-col gap-2 sm:w-[60%] sm:flex-row sm:items-center sm:gap-3">
                  <Input
                    type="number"
                    min="0"
                    max={a.maxScore}
                    step="0.5"
                    placeholder="Score"
                    className="sm:w-28"
                    aria-label={`Score for ${s.fullName}`}
                    value={scores[s.id] ?? ""}
                    onChange={(e) => setScores((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  />
                  <Textarea
                    rows={1}
                    placeholder="Feedback (optional)"
                    className="flex-1"
                    aria-label={`Feedback for ${s.fullName}`}
                    value={feedback[s.id] ?? ""}
                    onChange={(e) => setFeedback((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}