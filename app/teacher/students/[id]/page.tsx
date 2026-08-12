"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Phone,
  School,
  BookOpen,
  MessageSquare,
  UserX,
  Save,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDate, formatNumber, formatAmount } from "@/lib/format";
import { ASSESSMENT_TYPES, ATTENDANCE_STATUS, labelFor } from "@/lib/constants";

interface Detail {
  id: string;
  profileId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  studentNo: string;
  groupId: string | null;
  groupName: string | null;
  groupColor: string | null;
  phone: string | null;
  parentPhone: string | null;
  school: string | null;
  stream: string | null;
  active: boolean;
  registeredAt: string;
  paymentStatus: string | null;
  notes: string;
  stats: {
    attendance: {
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      rate: number | null;
      recent: { lesson: string; date: string; status: string }[];
    };
    payments: {
      id: string;
      amount: string | null;
      dueDate: string;
      paidDate: string | null;
      status: string;
      notes: string | null;
    }[];
    grades: {
      id: string;
      assessmentId: string;
      title: string;
      type: string;
      date: string;
      score: string;
      maxScore: string;
      feedback: string | null;
    }[];
    exercises: {
      completed: number;
      pending: number;
      late: number;
      graded: number;
    };
    gradeStats: { average: number | null; count: number };
  };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "paid")
    return (
      <Badge tone="success">
        <CheckCircle2 className="h-3 w-3" aria-hidden /> Paid
      </Badge>
    );
  if (status === "overdue")
    return (
      <Badge tone="danger">
        <XCircle className="h-3 w-3" aria-hidden /> Overdue
      </Badge>
    );
  if (status === "due")
    return (
      <Badge tone="warning">Due</Badge>
    );
  return <Badge tone="neutral">No payment due</Badge>;
}

export default function TeacherStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [d, setD] = React.useState<Detail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deactivating, setDeactivating] = React.useState(false);
  const [deactivatingOpen, setDeactivatingOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Detail>(`/api/teacher/students/${params.id}`);
      setD(data);
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load student." });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const saveNote = async () => {
    setSaving(true);
    try {
      await api.put(`/api/teacher/students/${params.id}/notes`, { content: d?.notes ?? "" });
      toast({ kind: "success", title: "Notes saved" });
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not save notes." });
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setDeactivating(true);
    try {
      await api.del(`/api/teacher/students/${params.id}`);
      toast({ kind: "success", title: "Student deactivated" });
      router.push("/teacher/students");
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not deactivate." });
      setDeactivating(false);
    }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!d)
    return <EmptyState icon={UserX} title="Student not found" action={<Link href="/teacher/students"><Button variant="outline">Back</Button></Link>} />;

  const stats = d.stats;

  return (
    <>
      <PageHeader
        title={d.fullName}
        description={`${d.studentNo} · joined ${formatDate(d.registeredAt)}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/teacher/chat/${d.id}`}>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4" aria-hidden /> Message
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setDeactivatingOpen(true)}>
              <UserX className="h-4 w-4" aria-hidden /> Deactivate
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardContent className="flex flex-col items-center py-6 text-center">
              <Avatar name={d.fullName} src={d.avatarUrl} size="xl" />
              <h2 className="mt-3 text-lg font-semibold text-foreground">{d.fullName}</h2>
              {d.groupName ? (
                <Badge tone="primary" className="mt-1">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.groupColor ?? "#7c3aed" }} />
                  {d.groupName}
                </Badge>
              ) : (
                <Badge tone="warning" className="mt-1">No group</Badge>
              )}
              <div className="mt-5 w-full space-y-2 text-left text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" aria-hidden /> {d.email || "No email"}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" aria-hidden /> {d.phone || "No phone"}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <School className="h-4 w-4" aria-hidden /> {d.school || "No school"}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" aria-hidden /> {d.stream || "No stream"}
                </p>
              </div>
              <div className="mt-4 w-full">
                <StatusBadge status={d.paymentStatus ?? ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xl font-bold text-foreground">
                    {stats.attendance.rate === null ? "—" : `${stats.attendance.rate}%`}
                  </p>
                  <p className="text-xs text-muted-foreground">Present rate</p>
                </div>
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xl font-bold text-foreground">{stats.attendance.total}</p>
                  <p className="text-xs text-muted-foreground">Total sessions</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {ATTENDANCE_STATUS.map((s) => (
                  <Badge key={s.value} tone={s.color === "success" ? "success" : s.color === "danger" ? "danger" : s.color === "warning" ? "warning" : "info"}>
                    {labelFor(ATTENDANCE_STATUS, s.value)}: {s.value === "present" ? stats.attendance.present : s.value === "absent" ? stats.attendance.absent : s.value === "late" ? stats.attendance.late : stats.attendance.excused}
                  </Badge>
                ))}
              </div>
              {stats.attendance.recent.length > 0 && (
                <ul className="divide-y divide-border text-xs">
                  {stats.attendance.recent.map((r, i) => (
                    <li key={i} className="flex items-center justify-between py-1.5">
                      <span className="truncate text-muted-foreground">{r.lesson}</span>
                      <Badge tone="neutral">{labelFor(ATTENDANCE_STATUS, r.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Private notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={d.notes}
                onChange={(e) => setD({ ...d, notes: e.target.value })}
                placeholder="Anything worth remembering about this student…"
                rows={5}
              />
              <Button className="mt-3 w-full" onClick={saveNote} loading={saving}>
                <Save className="h-4 w-4" aria-hidden /> Save notes
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xl font-bold text-foreground">
                    {stats.gradeStats.average === null ? "—" : `${stats.gradeStats.average}/20`}
                  </p>
                  <p className="text-xs text-muted-foreground">Average grade</p>
                </div>
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xl font-bold text-foreground">{stats.exercises.completed}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xl font-bold text-danger">{stats.exercises.late}</p>
                  <p className="text-xs text-muted-foreground">Late / missing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grades</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.grades.length === 0 ? (
                <EmptyState icon={XCircle} title="No grades yet" />
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {stats.grades.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{g.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {labelFor(ASSESSMENT_TYPES, g.type)} · {formatDate(g.date)}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-foreground">
                        {formatNumber(g.score)} / {formatNumber(g.maxScore)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.payments.length === 0 ? (
                <EmptyState icon={XCircle} title="No payments recorded" />
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {stats.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{formatAmount(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(p.dueDate)}
                          {p.paidDate ? ` · paid ${formatDate(p.paidDate)}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={deactivatingOpen}
        onClose={() => setDeactivatingOpen(false)}
        title="Deactivate student"
        description={`${d.fullName} will keep their records but be hidden from active lists.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeactivatingOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deactivate} loading={deactivating}>
              Deactivate
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This cannot be undone from this screen, but you can reactivate the student later.
        </p>
      </Modal>
    </>
  );
}
