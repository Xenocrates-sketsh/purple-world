import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  GraduationCap,
  Phone,
  School,
  GitBranch,
  UserPlus,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery, useDoc, useDocMap } from "@/hooks/useFirestore";
import { updateStudent, setStudentGroup, setStudentBlocked } from "@/lib/db/students";
import { allGroupsQuery } from "@/lib/db/groups";
import { studentPaymentsQuery } from "@/lib/db/payments";
import { allAssessmentsQuery, studentResultsQuery } from "@/lib/db/assessments";
import { notesQuery, addNote, updateNote, deleteNote } from "@/lib/db/notes";
import { findConversation, createConversation } from "@/lib/db/chat";
import { paths } from "@/lib/db/paths";
import { formatDate } from "@/lib/format";
import { normalizeDZPhone } from "@/lib/format";
import type { StudentDoc, GroupDoc, NoteEntryDoc, PaymentDoc, AssessmentDoc, AssessmentResultDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";
import { StudentNotesSection } from "./student-detail/notes-section";
import { StudentGradesCard, StudentPaymentsCard } from "./student-detail/grades-payments";
import { StudentActionsCard } from "./student-detail/actions-card";
import { StudentEditModal, type StudentFormState } from "./student-detail/edit-modal";
import { StudentInviteModal, StudentBlockModal } from "./student-detail/info-modals";

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
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const [form, setForm] = useState<StudentFormState | null>(null);

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
    const normPhone = form.phone.trim() ? normalizeDZPhone(form.phone) : null;
    if (form.phone.trim() && !normPhone) {
      toast("Phone must be a valid Algerian mobile: +213 followed by 5, 6 or 7, then 8 digits.", { variant: "error" });
      return;
    }
    const normParent = form.parentPhone.trim() ? normalizeDZPhone(form.parentPhone) : null;
    if (form.parentPhone.trim() && !normParent) {
      toast("Parent phone must be a valid Algerian mobile: +213 followed by 5, 6 or 7, then 8 digits.", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await updateStudent(studentId, {
        name: form.name.trim(),
        studentNo: form.studentNo.trim(),
        phone: normPhone,
        parentPhone: normParent,
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
      await setStudentGroup(studentId, groupId || null, data?.linkedUid ?? null);
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

  async function onToggleBlock() {
    if (!data) return;
    setBlocking(true);
    try {
      await setStudentBlocked(studentId, data.linkedUid, !data.blocked);
      toast(data.blocked ? "Student unblocked" : "Student blocked", { variant: "success" });
      setBlockOpen(false);
    } catch {
      toast("Could not update the block status", { variant: "error" });
    } finally {
      setBlocking(false);
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
            {data.linkedUid == null ? (
              <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus className="h-4 w-4" aria-hidden />}>
                Create account
              </Button>
            ) : null}
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
        {data.blocked ? <Badge variant="danger">Blocked</Badge> : null}
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

          <StudentNotesSection
            notes={notes}
            noteOpen={noteOpen}
            noteText={noteText}
            editingNoteId={editingNoteId}
            onOpenAdd={() => { setEditingNoteId(null); setNoteText(""); setNoteOpen(true); }}
            onOpenEdit={(id, content) => { setEditingNoteId(id); setNoteText(content); setNoteOpen(true); }}
            onCloseNote={() => setNoteOpen(false)}
            onNoteText={setNoteText}
            onSubmitNote={onAddNote}
            onDeleteNote={onDeleteNote}
          />

          <StudentGradesCard results={results} assessmentsById={assessmentsById} />
        </div>

        <div className="space-y-6">
          <StudentPaymentsCard payments={payments} />

          <StudentActionsCard
            blocked={data.blocked}
            onChat={onChat}
            onNewPayment={() => toast("Invoice sheet — coming soon", { variant: "info" })}
            onBlock={() => setBlockOpen(true)}
          />

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

      <StudentEditModal
        open={editOpen}
        form={form}
        saving={saving}
        onClose={() => setEditOpen(false)}
        onForm={(patch) => setForm((f) => (f ? { ...f, ...patch } : f))}
        onSave={onSave}
      />

      <StudentInviteModal
        open={inviteOpen}
        studentName={data?.name ?? "Student Name"}
        studentId={studentId}
        onClose={() => setInviteOpen(false)}
      />

      <StudentBlockModal
        open={blockOpen}
        blocked={data.blocked}
        name={data.name}
        blocking={blocking}
        onClose={() => setBlockOpen(false)}
        onConfirm={onToggleBlock}
      />
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
