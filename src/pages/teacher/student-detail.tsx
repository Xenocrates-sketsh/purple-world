import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  MessageSquare,
  GraduationCap,
  FileText,
  Phone,
  School,
  BookOpen,
  UserPlus,
  CreditCard,
  GitBranch,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery, useDoc, useDocMap } from "@/hooks/useFirestore";
import { updateStudent, setStudentGroup } from "@/lib/db/students";
import { allGroupsQuery } from "@/lib/db/groups";
import { studentPaymentsQuery } from "@/lib/db/payments";
import { allAssessmentsQuery, studentResultsQuery } from "@/lib/db/assessments";
import { notesQuery, addNote, updateNote, deleteNote } from "@/lib/db/notes";
import { findConversation, createConversation } from "@/lib/db/chat";
import { paths } from "@/lib/db/paths";
import { BAC_STREAMS } from "@/lib/constants";
import { formatDate, formatMoney, formatDateTime } from "@/lib/format";
import type { StudentDoc, GroupDoc, NoteEntryDoc, PaymentDoc, AssessmentDoc, AssessmentResultDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

export function TeacherStudentDetailPage() {
  const { studentId = "" } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const student = useDoc<StudentDoc>(paths.students(studentId));
  const groups = useQuery<GroupDoc>(allGroupsQuery);
  const notes = useQuery<NoteEntryDoc>((db) => notesQuery(db, studentId), [studentId]);
  const payments = useQuery<PaymentDoc>((db) => studentPaymentsQuery(db, studentId), [studentId]);
  const assessments = useQuery<AssessmentDoc>(allAssessmentsQuery);
  const assessmentsById = useDocMap(assessments.docs);
  const results = useQuery<AssessmentResultDoc>((db) => studentResultsQuery(db, studentId), [studentId]);

  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    studentNo: string;
    phone: string;
    parentPhone: string;
    school: string;
    stream: string;
    bacYear: string;
    targetScore: string;
  } | null>(null);

  const data = student.doc?.data;

  // Seed the edit form whenever the student doc arrives/changes.
  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        studentNo: data.studentNo,
        phone: data.phone ?? "",
        parentPhone: data.parentPhone ?? "",
        school: data.school ?? "",
        stream: data.stream ?? "",
        bacYear: data.bacInfo.year ?? "",
        targetScore: data.bacInfo.targetScore?.toString() ?? "",
      });
    }
  }, [student.doc?.id, student.doc?.data.name]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!data || !form) return;
    setSaving(true);
    try {
      await updateStudent(studentId, {
        name: form.name.trim(),
        studentNo: form.studentNo.trim(),
        phone: form.phone.trim() || null,
        parentPhone: form.parentPhone.trim() || null,
        school: form.school.trim() || null,
        stream: form.stream || null,
        bacInfo: {
          year: form.bacYear.trim() || null,
          targetScore: form.targetScore ? Number(form.targetScore) : null,
        },
      });
      toast("Student updated", { variant: "success" });
      setEditOpen(false);
    } catch {
      toast("Could not save changes", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onGroupChange(groupId: string) {
    try {
      await setStudentGroup(studentId, groupId || null);
      toast(groupId ? "Group updated" : "Removed from group", { variant: "success" });
    } catch {
      toast("Could not change group", { variant: "error" });
    }
  }

  async function onAddNote(e: FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      if (editingNoteId) {
        await updateNote(studentId, editingNoteId, noteText.trim());
      } else {
        await addNote(studentId, noteText.trim());
      }
      toast("Note saved", { variant: "success" });
      setNoteOpen(false);
      setNoteText("");
      setEditingNoteId(null);
    } catch {
      toast("Could not save note", { variant: "error" });
    }
  }

  async function onDeleteNote(entryId: string) {
    try {
      await deleteNote(studentId, entryId);
      toast("Note deleted", { variant: "info" });
    } catch {
      toast("Could not delete note", { variant: "error" });
    }
  }

  async function onChat() {
    if (!data?.linkedUid) {
      toast("This student has no account yet — create it from the admin tool first", { variant: "warning" });
      return;
    }
    const teacherUid = user?.uid ?? "";
    try {
      const existing = await findConversation([data.linkedUid, teacherUid]);
      if (!existing) {
        await createConversation(data.linkedUid, teacherUid, studentId);
      }
      navigate(`/teacher/chat/${studentId}`);
    } catch {
      toast("Could not open chat", { variant: "error" });
    }
  }

  if (student.loading) {
    return (
      <div className="space-y-4">
        <SkeletonList count={2} />
      </div>
    );
  }

  if (!student.doc || !data) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Student not found"
        action={
          <Link to="/teacher/students" className="btn-secondary btn-sm">
            Back to students
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link to="/teacher/students" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Students
      </Link>

      <PageHeader
        title={data.name}
        description={`${data.studentNo} · since ${formatDate(data.createdAt)}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)} leftIcon={<Pencil className="h-4 w-4" aria-hidden />}>
              Edit profile
            </Button>
            <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus className="h-4 w-4" aria-hidden />}>
              Create account
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {data.linkedUid != null ? (
          <Badge variant="success">Signed up</Badge>
        ) : (
          <Badge variant="warning">Account not created yet</Badge>
        )}
        <Badge variant={data.active ? "primary" : "neutral"}>{data.active ? "Active" : "Inactive"}</Badge>
        <Select
          aria-label="Group"
          className="h-9 w-auto py-0 text-sm"
          value={data.groupId ?? ""}
          onChange={(e) => onGroupChange(e.target.value)}
        >
          <option value="">No group</option>
          {(groups.docs ?? []).map((g) => (
            <option key={g.id} value={g.id}>{g.data.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Contact & school" />
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail icon={Phone} label="Phone" value={data.phone} />
              <Detail icon={Phone} label="Parent phone" value={data.parentPhone} />
              <Detail icon={School} label="School" value={data.school} />
              <Detail icon={GitBranch} label="BAC stream" value={data.stream} />
              <Detail icon={GraduationCap} label="BAC year" value={data.bacInfo.year} />
              <Detail
                icon={GraduationCap}
                label="Target score"
                value={data.bacInfo.targetScore != null ? `${data.bacInfo.targetScore} / 20` : null}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Private notes"
              description="Only you can see these"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingNoteId(null);
                    setNoteText("");
                    setNoteOpen(true);
                  }}
                  leftIcon={<Pencil className="h-4 w-4" aria-hidden />}
                >
                  Add note
                </Button>
              }
            />
            <CardContent className="px-3 py-2">
              {notes.loading ? (
                <SkeletonList count={2} />
              ) : (notes.docs ?? []).length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No notes yet"
                  description="Jot down observations, goals or reminders about this student."
                />
              ) : (
                <ul className="space-y-1">
                  {(notes.docs ?? []).map((n) => (
                    <li key={n.id} className="rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-muted">
                      <p className="whitespace-pre-wrap text-sm text-foreground">{n.data.content}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDateTime(n.data.updatedAt)}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                            onClick={() => {
                              setEditingNoteId(n.id);
                              setNoteText(n.data.content);
                              setNoteOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-md px-2 py-0.5 text-xs text-danger hover:bg-danger-soft"
                            onClick={() => onDeleteNote(n.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Recent grades"
              action={
                <Link to="/teacher/grades" className="text-sm font-medium text-primary hover:underline">
                  All grades
                </Link>
              }
            />
            <CardContent className="p-0">
              {results.loading ? (
                <div className="p-5"><SkeletonList count={3} /></div>
              ) : (results.docs ?? []).length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No grades yet"
                  description="Grades you record under Assessments will appear here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {(results.docs ?? []).slice(0, 6).map((r) => {
                    const ass = assessmentsById.get(r.data.assessmentId) ?? null;
                    return (
                      <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {ass?.title ?? "Assessment"}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(r.data.createdAt)}</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {r.data.score} / {ass?.maxScore ?? "…"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Payments"
              action={
                <Link to="/teacher/payments" className="text-sm font-medium text-primary hover:underline">
                  Manage
                </Link>
              }
            />
            <CardContent>
              {payments.docs == null ? (
                <SkeletonList count={1} />
              ) : (payments.docs ?? []).length === 0 ? (
                <EmptyState icon={CreditCard} title="No payment records" />
              ) : (
                <ul className="space-y-2">
                  {(payments.docs ?? []).slice(0, 4).map((p) => (
                    <li key={p.id} className="rounded-lg bg-surface-muted px-3 py-2 text-sm">
                      <span className="block font-medium text-foreground">{formatMoney(p.data.amount)}</span>
                      <span
                        className={
                          "block text-xs " +
                          (p.data.status === "paid"
                            ? "text-success"
                            : p.data.dueDate.toMillis() < Date.now()
                              ? "text-danger"
                              : "text-warning-foreground")
                        }
                      >
                        {p.data.status === "paid"
                          ? `Paid ${formatDate(p.data.paidDate)}`
                          : `Due ${formatDate(p.data.dueDate)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Quick actions" />
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button variant="secondary" onClick={onChat} leftIcon={<MessageSquare className="h-4 w-4" aria-hidden />}>
                Open chat
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast("Invoice sheet — coming soon", { variant: "info" })}
                leftIcon={<CreditCard className="h-4 w-4" aria-hidden />}
              >
                New payment
              </Button>
            </CardContent>
          </Card>

          {data.linkedUid == null && (
            <Card>
              <CardHeader title="Account not created yet" />
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  There is no open sign-up in this app. Create this student's account from the
                  admin tool so they can log in with an email and password.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit student"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={onSave} loading={saving}>Save changes</Button>
          </>
        }
      >
        <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input value={form?.name ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))} required />
          </Field>
          <Field label="Student number" required>
            <Input value={form?.studentNo ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, studentNo: e.target.value } : f))} required />
          </Field>
          <Field label="Phone">
            <Input value={form?.phone ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, phone: e.target.value } : f))} />
          </Field>
          <Field label="Parent phone">
            <Input value={form?.parentPhone ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, parentPhone: e.target.value } : f))} />
          </Field>
          <Field label="School">
            <Input value={form?.school ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, school: e.target.value } : f))} />
          </Field>
          <Field label="BAC stream">
            <Select value={form?.stream ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, stream: e.target.value } : f))}>
              <option value="">No stream</option>
              {BAC_STREAMS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </Field>
          <Field label="BAC year">
            <Input value={form?.bacYear ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, bacYear: e.target.value } : f))} />
          </Field>
          <Field label="Target score (/20)">
            <Input type="number" min={0} max={20} step={0.25} value={form?.targetScore ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, targetScore: e.target.value } : f))} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Create student account"
        description="Student accounts are created by the teacher, not by open sign-up. Run this on your computer:"
        footer={
          <Button variant="ghost" onClick={() => setInviteOpen(false)}>Close</Button>
        }
      >
        <div className="space-y-3">
          <Field label="Name" hint={`Student id: ${studentId}`}>
            <code className="block select-all rounded-lg bg-surface-muted px-3 py-2 font-mono text-sm text-foreground">
              node --experimental-strip-types scripts/create-student.ts \
                --name "{data?.name ?? "Student Name"}" \
                --email student@example.com --password "change-me" \
                --student-id {studentId}
            </code>
          </Field>
        </div>
      </Modal>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={editingNoteId ? "Edit note" : "Add a note"}
        description="Private — students can never see this."
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={onAddNote}>{editingNoteId ? "Save note" : "Add note"}</Button>
          </>
        }
      >
        <form onSubmit={onAddNote}>
          <Field label="Note">
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Homework habits, strengths, next steps…" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}