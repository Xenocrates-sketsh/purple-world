"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Plus, Users, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { labelFor, STREAMS } from "@/lib/constants";
import type { GroupSummary, StudentSummary } from "@/lib/types";

export default function TeacherStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = React.useState<StudentSummary[]>([]);
  const [groups, setGroups] = React.useState<GroupSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("");
  const [groupId, setGroupId] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const loadGroups = React.useCallback(() => {
    api
      .get<GroupSummary[]>("/api/teacher/groups")
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (filter) qs.set("filter", filter);
    if (groupId) qs.set("groupId", groupId);
    try {
      const data = await api.get<StudentSummary[]>(
        `/api/teacher/students?${qs.toString()}`
      );
      setStudents(data);
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load students." });
    } finally {
      setLoading(false);
    }
  }, [search, filter, groupId, toast]);

  React.useEffect(() => {
    loadGroups();
    load();
  }, [load, loadGroups]);

  const submitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    try {
      await api.post("/api/teacher/students", data);
      setCreateOpen(false);
      toast({ kind: "success", title: "Student added" });
      load();
    } catch (err) {
      toast({ kind: "error", title: err instanceof Error ? err.message : "Could not add student." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Students"
        description="Manage everyone in your classes."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add student
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, student number…"
              className="pl-9"
              aria-label="Search students"
            />
          </div>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="sm:w-40"
            aria-label="Filter students"
            options={[
              { value: "", label: "All students" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "unpaid", label: "Unpaid" },
              { value: "overdue", label: "Overdue" },
              { value: "no_group", label: "No group" },
            ]}
          />
          <Select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="sm:w-40"
            aria-label="Group"
            options={[{ value: "", label: "All groups" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]}
          />
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description={search || filter || groupId ? "Try adjusting your filters." : "Add your first student to get started."}
          action={
            !search && !filter && !groupId ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Add student
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border" role="list">
            {students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/teacher/students/${s.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <Avatar name={s.fullName} src={s.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{s.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.studentNo} · {s.email || "No email yet"}
                    </p>
                  </div>
                  <div className="hidden flex-col items-end gap-1 sm:flex">
                    {s.groupName ? (
                      <Badge tone="primary">{s.groupName}</Badge>
                    ) : (
                      <Badge tone="warning">No group</Badge>
                    )}
                    {s.paymentStatus === "overdue" && <Badge tone="danger">Overdue</Badge>}
                    {s.paymentStatus === "due" && <Badge tone="warning">Due</Badge>}
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {s.unreadMessages! > 0 && (
                      <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden />
                    )}
                    {s.attendanceRate === null || s.attendanceRate === undefined
                      ? "—"
                      : `${Math.round(s.attendanceRate)}%`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add a student"
        description="You can add students now, or let them register with your group's join code."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-student-form" type="submit" loading={saving}>
              Add student
            </Button>
          </>
        }
      >
        <form id="create-student-form" onSubmit={submitCreate} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full name *</Label>
            <Input id="fullName" name="fullName" required placeholder="e.g. Amine Benali" />
          </div>
          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" name="email" type="email" placeholder="so the student can link their account" />
          </div>
          <div>
            <Label htmlFor="groupId">Group</Label>
            <Select id="groupId" name="groupId" options={[{ value: "", label: "No group yet" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]} />
          </div>
          <div>
            <Label htmlFor="stream">Stream</Label>
            <Select id="stream" name="stream" options={[{ value: "", label: "Not set" }, ...STREAMS.map((s) => ({ value: s, label: s }))]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="05 55 01 23 45" />
            </div>
            <div>
              <Label htmlFor="parentPhone">Parent phone</Label>
              <Input id="parentPhone" name="parentPhone" placeholder="05 55 00 00 00" />
            </div>
          </div>
          <div>
            <Label htmlFor="school">School</Label>
            <Input id="school" name="school" placeholder="e.g. Lycée Okba" />
          </div>
          <Textarea name="notes" placeholder="Private notes (optional)" aria-label="Private notes (optional)" />
        </form>
      </Modal>
    </>
  );
}