import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Users, Search, CheckCircle2 } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { allStudentsQuery, createStudent, setStudentActive } from "@/lib/db/students";
import { allGroupsQuery } from "@/lib/db/groups";
import { BAC_STREAMS } from "@/lib/constants";
import type { StudentDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

function StudentRow({
  s,
  groupName,
  onToggleActive,
}: {
  s: { id: string; data: StudentDoc };
  groupName?: string;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  return (
    <Link
      to={`/teacher/students/${s.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
    >
      <Avatar name={s.data.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {s.data.name}
          {s.data.stream ? <span className="ml-2 text-xs text-muted-foreground">· {s.data.stream}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {s.data.studentNo} · {groupName ?? "No group"}
        </p>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        {s.data.linkedUid != null ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" aria-hidden /> Linked
          </Badge>
        ) : (
          <Badge variant="warning">Invite pending</Badge>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={s.data.active}
          aria-label={`Set ${s.data.name} active`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleActive(s.id, !s.data.active);
          }}
          className={
            "relative h-5 w-9 rounded-full transition-colors " +
            (s.data.active ? "bg-primary" : "bg-surface-muted")
          }
        >
          <span
            className={
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all " +
              "shadow-sm " +
              (s.data.active ? "left-4" : "left-0.5")
            }
          />
        </button>
      </div>
    </Link>
  );
}

export function TeacherStudentsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const students = useQuery<StudentDoc>(allStudentsQuery);
  const groups = useQuery(allGroupsQuery);
  const groupsById = useDocMap(groups.docs);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [school, setSchool] = useState("");
  const [stream, setStream] = useState("");
  const [groupId, setGroupId] = useState("");
  const [bacYear, setBacYear] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = students.docs ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((s) =>
      (s.data.name + " " + s.data.studentNo + " " + (s.data.stream ?? "")).toLowerCase().includes(needle)
    );
  }, [students.docs, q]);

  async function onToggleActive(id: string, active: boolean) {
    try {
      await setStudentActive(id, active);
      toast(active ? "Student marked active" : "Student deactivated", { variant: "info" });
    } catch {
      toast("Could not update the student", { variant: "error" });
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !studentNo.trim()) {
      setError("Name and student number are required.");
      return;
    }
    setSaving(true);
    try {
      const id = await createStudent({
        name: name.trim(),
        studentNo: studentNo.trim(),
        phone: phone.trim() || null,
        parentPhone: parentPhone.trim() || null,
        school: school.trim() || null,
        stream: stream || null,
        groupId: groupId || null,
        active: true,
        bacInfo: {
          year: bacYear.trim() || null,
          targetScore: targetScore ? Number(targetScore) : null,
        },
        avatarUrl: null,
        registeredAt: null,
        linkedUid: null,
        inviteCode: null,
      });
      toast("Student added — next, create their sign-up invite", { variant: "success" });
      setOpen(false);
      navigate(`/teacher/students/${id}`);
    } catch {
      toast("Could not add the student", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Students"
        description="Add students and send them a sign-up invite."
        action={
          <Button onClick={() => setOpen(true)} leftIcon={<UserPlus className="h-4 w-4" aria-hidden />}>
            Add student
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="pl-9"
          placeholder="Search by name, number or stream…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {students.loading ? (
            <div className="p-5">
              <SkeletonList count={5} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={q ? "No matches" : "No students yet"}
              description={q ? "Try a different search." : "Add your first student to get started."}
              action={
                !q ? (
                  <Button onClick={() => setOpen(true)} leftIcon={<UserPlus className="h-4 w-4" aria-hidden />}>
                    Add student
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto scrollbar-thin">
              {filtered.map((s) => (
                <StudentRow
                  key={s.id}
                  s={s}
                  groupName={groupsById.get(s.data.groupId ?? "")?.name}
                  onToggleActive={onToggleActive}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a student"
        description="You'll create their sign-up invite right after."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} loading={saving} leftIcon={<UserPlus className="h-4 w-4" aria-hidden />}>
              Add student
            </Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="s-name" required>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmed Benali" required />
            </Field>
            <Field label="Student number" htmlFor="s-no" required>
              <Input id="s-no" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="2025-014" required />
            </Field>
            <Field label="Phone" htmlFor="s-phone">
              <Input id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0550 00 00 00" />
            </Field>
            <Field label="Parent phone" htmlFor="s-parent">
              <Input id="s-parent" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="0660 00 00 00" />
            </Field>
            <Field label="School" htmlFor="s-school">
              <Input id="s-school" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Lycee…" />
            </Field>
            <Field label="BAC stream" htmlFor="s-stream">
              <Select id="s-stream" value={stream} onChange={(e) => setStream(e.target.value)}>
                <option value="">No stream</option>
                {BAC_STREAMS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="BAC year" htmlFor="s-year">
              <Input id="s-year" value={bacYear} onChange={(e) => setBacYear(e.target.value)} placeholder="2026" />
            </Field>
            <Field label="Target BAC score" htmlFor="s-target" hint="BAC English score /20">
              <Input id="s-target" type="number" min={0} max={20} step={0.25} value={targetScore} onChange={(e) => setTargetScore(e.target.value)} placeholder="15" />
            </Field>
          </div>
          <Field label="Group" htmlFor="s-group">
            <Select id="s-group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">No group yet</option>
              {(groups.docs ?? []).map((g) => (
                <option key={g.id} value={g.id}>{g.data.name}</option>
              ))}
            </Select>
          </Field>
          {error ? (
            <p role="alert" className="text-sm font-medium text-danger">{error}</p>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}