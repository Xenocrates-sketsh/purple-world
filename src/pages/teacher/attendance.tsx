import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save, ListChecks } from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import { useDoc } from "@/hooks/useFirestore";
import { attendanceOfLessonQuery, markAttendanceForLesson } from "@/lib/db/schedule";
import { studentsByGroupQuery } from "@/lib/db/students";
import { paths } from "@/lib/db/paths";
import { ATTENDANCE_STATUSES } from "@/lib/constants";
import type { AttendanceStatus } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

export function TeacherAttendancePage() {
  const { lessonId = "" } = useParams();
  const { toast } = useToast();
  const lesson = useDoc(paths.lessons(lessonId));
  const groupId = lesson.doc?.data.groupId ?? "";

  const members = useQuery((db) => studentsByGroupQuery(db, groupId), [groupId]);
  const existing = useQuery((db) => attendanceOfLessonQuery(db, lessonId), [lessonId]);

  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  // Prefill with any recorded marks for this lesson.
  useEffect(() => {
    const next: Record<string, AttendanceStatus> = {};
    for (const m of members.docs ?? []) next[m.id] = "present";
    for (const a of existing.docs ?? []) {
      next[a.id] = a.data.status;
    }
    setStatuses(next);
  }, [members.docs, existing.docs]);

  function markAll(status: AttendanceStatus) {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const m of members.docs ?? []) next[m.id] = status;
      return next;
    });
  }

  async function onSave() {
    setSaving(true);
    try {
      await markAttendanceForLesson(
        lessonId,
        (members.docs ?? []).map((m) => ({ studentId: m.id, status: statuses[m.id] ?? "present" }))
      );
      toast("Attendance saved", { variant: "success" });
    } catch {
      toast("Could not save attendance", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (lesson.loading) return <SkeletonList count={2} />;
  if (!lesson.doc) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Lesson not found"
        action={<Link to="/teacher/schedule" className="btn-secondary btn-sm">Back to schedule</Link>}
      />
    );
  }

  const attended = (existing.docs ?? []).length;

  return (
    <div>
      <Link to="/teacher/schedule" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Schedule
      </Link>

      <PageHeader
        title={lesson.doc.data.title}
        description={`${formatDate(lesson.doc.data.startsAt)} · ${formatTime(lesson.doc.data.startsAt)} · ${lesson.doc.data.durationMin} min`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => markAll("present")}>All present</Button>
            <Button onClick={onSave} loading={saving} leftIcon={<Save className="h-4 w-4" aria-hidden />}>
              Save attendance
            </Button>
          </div>
        }
      />

      {members.loading ? (
        <SkeletonList count={5} />
      ) : (members.docs ?? []).length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No students in this group"
          description="Assign students to the group from their profile page, then return here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {members.docs?.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Avatar name={s.data.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{s.data.name}</p>
                    <p className="text-xs text-muted-foreground">{s.data.studentNo}</p>
                  </div>
                  <div className="flex gap-1.5" role="radiogroup" aria-label={`Attendance for ${s.data.name}`}>
                    {ATTENDANCE_STATUSES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={statuses[s.id] === opt.value}
                        onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt.value }))}
                        className={
                          "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors " +
                          (statuses[s.id] === opt.value
                            ? opt.value === "present"
                              ? "bg-success text-success-soft border border-success"
                              : opt.value === "absent"
                                ? "bg-danger text-white border border-danger"
                                : opt.value === "late"
                                  ? "bg-warning text-warning-soft border border-warning"
                                  : "bg-info text-info-soft border border-info"
                            : "bg-surface-muted text-muted-foreground hover:bg-surface-muted")
                        }
                        title={opt.label}
                      >
                        {opt.short}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              {attended > 0 ? `${attended} already recorded` : "No attendance recorded yet"} · shorthand: P present · A absent · L late · E excused
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}