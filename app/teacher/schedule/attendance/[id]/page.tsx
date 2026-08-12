"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { ATTENDANCE_STATUS, labelFor } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "late" | "excused";

interface AttendanceData {
  lesson: { id: string; title: string; startsAt: string; groupName: string };
  students: { id: string; fullName: string; status: Status | null }[];
}

const toneFor: Record<Status, string> = {
  present: "bg-success-soft text-success border-success/40",
  absent: "bg-danger-soft text-danger border-danger/40",
  late: "bg-warning-soft text-warning border-warning/40",
  excused: "bg-info-soft text-info border-info/40",
};

export default function TeacherAttendancePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<AttendanceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const [statuses, setStatuses] = React.useState<Record<string, Status>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<AttendanceData>(`/api/teacher/lessons/${params.id}/attendance`);
      setData(d);
      const init: Record<string, Status> = {};
      for (const s of d.students) if (s.status) init[s.id] = s.status;
      setStatuses(init);
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load attendance." });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const setAll = (status: Status) => {
    if (!data) return;
    const next: Record<string, Status> = {};
    for (const s of data.students) next[s.id] = status;
    setStatuses(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const records = Object.entries(statuses).map(([studentId, status]) => ({ studentId, status }));
      await api.put(`/api/teacher/lessons/${params.id}/attendance`, { records });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ kind: "success", title: "Attendance saved" });
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not save attendance." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!data)
    return (
      <EmptyState
        icon={ArrowLeft}
        title="Lesson not found"
        action={<Link href="/teacher/schedule"><Button variant="outline">Back to schedule</Button></Link>}
      />
    );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/schedule"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Back to schedule"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{data.lesson.title}</h1>
            <p className="text-sm text-muted-foreground">
              {data.lesson.groupName} · {formatDateTime(data.lesson.startsAt)}
            </p>
          </div>
        </div>
        <Button onClick={save} loading={saving}>
          {saved ? <Check className="h-4 w-4" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {saved ? "Saved" : "Save attendance"}
        </Button>
      </div>

      {data.students.length === 0 ? (
        <EmptyState
          icon={ArrowLeft}
          title="No students in this group"
          description="Add students to this group to mark attendance."
          action={<Link href="/teacher/groups"><Button variant="outline">Manage groups</Button></Link>}
        />
      ) : (
        <>
          <Card className="mb-4 p-3">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mark everyone
            </p>
            <div className="flex flex-wrap gap-2">
              {ATTENDANCE_STATUS.map((s) => (
                <Button key={s.value} variant="outline" size="sm" onClick={() => setAll(s.value as Status)}>
                  {labelFor(ATTENDANCE_STATUS, s.value)}
                </Button>
              ))}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border" role="list">
              {data.students.map((s) => (
                <li key={s.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.fullName} size="sm" />
                    <p className="text-sm font-medium text-foreground">{s.fullName}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Attendance for ${s.fullName}`}>
                    {ATTENDANCE_STATUS.map((opt) => {
                      const active = statuses[s.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt.value as Status }))}
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                            active ? toneFor[opt.value as Status] : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                          )}
                        >
                          {labelFor(ATTENDANCE_STATUS, opt.value)}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </>
  );
}