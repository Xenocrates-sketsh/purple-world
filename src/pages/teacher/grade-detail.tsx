import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save, ClipboardList } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { useDoc } from "@/hooks/useFirestore";
import { resultsOfAssessmentQuery, setResult } from "@/lib/db/assessments";
import { allGroupsQuery } from "@/lib/db/groups";
import { allStudentsQuery, studentsByGroupQuery } from "@/lib/db/students";
import { paths } from "@/lib/db/paths";
import { formatDate } from "@/lib/format";
import type { AssessmentDoc, GroupDoc, StudentDoc, AssessmentResultDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

interface Row {
  score: string;
  feedback: string;
}

export function TeacherGradeDetailPage() {
  const { assessmentId = "" } = useParams();
  const { toast } = useToast();
  const assessment = useDoc<AssessmentDoc>(paths.assessments(assessmentId));
  const groups = useQuery<GroupDoc>(allGroupsQuery);
  const groupsById = useDocMap(groups.docs);

  const fixedGroupId = assessment.doc?.data.groupId ?? "";
  const [altGroupId, setAltGroupId] = useState("");
  const effectiveGroup = fixedGroupId || altGroupId;

  const allStudents = useQuery<StudentDoc>(
    (db) => allStudentsQuery(db),
    []
  );
  const groupStudents = useQuery<StudentDoc>(
    (db) => studentsByGroupQuery(db, effectiveGroup),
    [effectiveGroup]
  );
  const roster = effectiveGroup
    ? (groupStudents.docs ?? [])
    : (allStudents.docs ?? []).filter((s) => s.data.active);

  const existing = useQuery<AssessmentResultDoc>((db) => resultsOfAssessmentQuery(db, assessmentId), [assessmentId]);

  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);

  // Seed the grid with any already-entered results.
  useEffect(() => {
    const next: Record<string, Row> = {};
    for (const r of existing.docs ?? []) {
      next[r.id] = { score: String(r.data.score), feedback: r.data.feedback ?? "" };
    }
    setRows(next);
  }, [existing.docs]);

  async function onSave() {
    const toWrite = roster.filter((s) => rows[s.id] && rows[s.id].score.trim() !== "");
    if (toWrite.length === 0) {
      toast("Enter at least one score first", { variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const maxScore = assessment.doc?.data.maxScore ?? 20;
      for (const s of toWrite) {
        const r = rows[s.id];
        const score = Math.max(0, Math.min(maxScore, Number(r.score)));
        await setResult(assessmentId, s.id, {
          assessmentId,
          score,
          feedback: r.feedback.trim() || null,
        });
      }
      toast(`${toWrite.length} grade${toWrite.length === 1 ? "" : "s"} saved`, { variant: "success" });
    } catch {
      toast("Could not save grades", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (assessment.loading) return <SkeletonList count={2} />;
  if (!assessment.doc) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Assessment not found"
        action={<Link to="/teacher/grades" className="btn-secondary btn-sm">Back to grades</Link>}
      />
    );
  }

  const maxScore = assessment.doc.data.maxScore;

  return (
    <div>
      <Link to="/teacher/grades" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Grades
      </Link>

      <PageHeader
        title={assessment.doc.data.title}
        description={`${assessment.doc.data.type} · ${formatDate(assessment.doc.data.date)} · max ${maxScore}`}
        action={
          <Button onClick={onSave} loading={saving} leftIcon={<Save className="h-4 w-4" aria-hidden />}>
            Save grades
          </Button>
        }
      />

      {!fixedGroupId ? (
        <div className="mb-4 max-w-xs">
          <Select value={altGroupId} onChange={(e) => setAltGroupId(e.target.value)}>
            <option value="">All active students</option>
            {(groups.docs ?? []).map((g) => (
              <option key={g.id} value={g.id}>{g.data.name}</option>
            ))}
          </Select>
        </div>
      ) : (
        <div className="mb-4">
          <Badge variant="info">Group: {groupsById.get(fixedGroupId)?.name ?? "—"}</Badge>
        </div>
      )}

      {roster.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No students to grade"
          description="Add students to your roster (or to this group) first."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {roster.map((s) => {
                const row = rows[s.id] ?? { score: "", feedback: "" };
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Avatar name={s.data.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{s.data.name}</p>
                      <p className="text-xs text-muted-foreground">{s.data.studentNo}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        aria-label={`Score for ${s.data.name}`}
                        type="number"
                        min={0}
                        max={maxScore}
                        step={0.25}
                        value={row.score}
                        className="h-9 w-20"
                        placeholder="–"
                        onChange={(e) =>
                          setRows((prev) => ({
                            ...prev,
                            [s.id]: { ...(prev[s.id] ?? { feedback: "" }), score: e.target.value },
                          }))
                        }
                      />
                      <span className="text-xs text-muted-foreground">/ {maxScore}</span>
                    </div>
                    <Input
                      aria-label={`Feedback for ${s.data.name}`}
                      value={row.feedback}
                      className="h-9 min-w-40 flex-1"
                      placeholder="Feedback"
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [s.id]: { ...(prev[s.id] ?? { score: "" }), feedback: e.target.value },
                        }))
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}