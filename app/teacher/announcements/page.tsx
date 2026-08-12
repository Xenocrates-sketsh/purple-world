"use client";

import * as React from "react";
import { Megaphone, Plus, Trash2, Send } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { ANNOUNCEMENT_CATEGORIES, labelFor } from "@/lib/constants";
import type { AnnouncementRow, GroupSummary, StudentSummary } from "@/lib/types";

export default function TeacherAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = React.useState<AnnouncementRow[]>([]);
  const [groups, setGroups] = React.useState<GroupSummary[]>([]);
  const [students, setStudents] = React.useState<StudentSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    content: "",
    category: "general",
    target: "all",
    groupId: "",
    studentId: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setAnnouncements(await api.get<AnnouncementRow[]>("/api/teacher/announcements"));
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load announcements." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    Promise.all([
      api.get<GroupSummary[]>("/api/teacher/groups"),
      api.get<StudentSummary[]>("/api/teacher/students?filter=active"),
    ])
      .then(([g, s]) => {
        setGroups(g);
        setStudents(s);
      })
      .catch(() => {});
    load();
  }, [load]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/teacher/announcements", form);
      setOpen(false);
      toast({ kind: "success", title: "Announcement sent to students" });
      load();
    } catch (err) {
      toast({ kind: "error", title: err instanceof Error ? err.message : "Could not send announcement." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.del(`/api/teacher/announcements/${deleteId}`);
      toast({ kind: "success", title: "Announcement deleted" });
      setDeleteId(null);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not delete announcement." });
    } finally {
      setDeleting(false);
    }
  };

  const targetLabel = (a: AnnouncementRow) => {
    if (a.target === "all") return "All students";
    if (a.target === "group") return a.groupName ?? "Group";
    return a.studentName ?? "Student";
  };

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Send news to everyone, a group, or one student."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New announcement
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Share news with your students."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden /> New announcement</Button>}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{labelFor(ANNOUNCEMENT_CATEGORIES, a.category)}</Badge>
                    <Badge tone="neutral">{targetLabel(a)}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(a.id)} aria-label="Delete announcement">
                      <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h2 className="text-base font-semibold text-foreground">{a.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New announcement"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="announcement-form" loading={saving}>
              <Send className="h-4 w-4" aria-hidden /> Send
            </Button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Test moved to Thursday" />
          </div>
          <div>
            <Label htmlFor="content">Message *</Label>
            <Textarea id="content" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="What should your students know?" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
            </div>
            <div>
              <Label htmlFor="target">Send to</Label>
              <Select id="target" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value, groupId: "", studentId: "" })} options={[{ value: "all", label: "All students" }, { value: "group", label: "A group" }, { value: "student", label: "One student" }]} />
            </div>
          </div>
          {form.target === "group" && (
            <div>
              <Label htmlFor="groupId">Group *</Label>
              <Select id="groupId" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} options={groups.map((g) => ({ value: g.id, label: g.name }))} />
            </div>
          )}
          {form.target === "student" && (
            <div>
              <Label htmlFor="studentId">Student *</Label>
              <Select id="studentId" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} options={students.map((s) => ({ value: s.id, label: s.fullName }))} />
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete this announcement?"
        description="Students who already saw it will still have their notification."
        loading={deleting}
      />
    </>
  );
}