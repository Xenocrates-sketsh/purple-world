"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  Check,
  CalendarDays,
  Megaphone,
  Trash2,
  Edit,
  UsersRound,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDateTime, formatDate } from "@/lib/format";
import { GROUP_COLORS, ANNOUNCEMENT_CATEGORIES, labelFor } from "@/lib/constants";

interface Detail {
  id: string;
  name: string;
  description: string | null;
  color: string;
  inviteCode: string;
  createdAt: string;
  members: {
    id: string;
    fullName: string;
    email: string;
    studentNo: string;
    active: boolean;
  }[];
  lessons: {
    id: string;
    title: string;
    startsAt: string;
    location: string | null;
  }[];
  announcements: {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
  }[];
}

export default function TeacherGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [d, setD] = React.useState<Detail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", description: "", color: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Detail>(`/api/teacher/groups/${params.id}`);
      setD(data);
      setForm({ name: data.name, description: data.description ?? "", color: data.color });
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load group." });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const copy = async () => {
    if (!d) return;
    try {
      await navigator.clipboard.writeText(d.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ kind: "error", title: "Could not copy." });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/teacher/groups/${params.id}`, form);
      setEditOpen(false);
      toast({ kind: "success", title: "Group updated" });
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not update group." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.del(`/api/teacher/groups/${params.id}`);
      toast({ kind: "success", title: "Group deleted" });
      router.push("/teacher/groups");
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not delete group." });
      setDeleting(false);
    }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!d)
    return (
      <EmptyState
        icon={XCircle}
        title="Group not found"
        action={<Link href="/teacher/groups"><Button variant="outline">Back to groups</Button></Link>}
      />
    );

  return (
    <>
      <PageHeader
        title={d.name}
        description={`Created ${formatDate(d.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4" aria-hidden /> Edit
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student join code
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted/60 p-3">
              <code className="flex-1 text-center text-2xl font-bold tracking-[0.3em] text-primary">
                {d.inviteCode}
              </code>
              <button
                onClick={copy}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Copy join code"
              >
                {copied ? <Check className="h-5 w-5 text-success" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Share this code with your students — they use it when signing up.
            </p>
            {d.description && (
              <p className="mt-4 rounded-xl bg-surface-muted/60 p-3 text-sm text-muted-foreground">
                {d.description}
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-primary" aria-hidden /> Members ({d.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {d.members.length === 0 ? (
                <EmptyState icon={UsersRound} title="No students yet" description="Share the join code to add members." />
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {d.members.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/teacher/students/${m.id}`}
                        className="flex items-center gap-3 py-2.5 transition-colors hover:bg-surface-muted"
                      >
                        <Avatar name={m.fullName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{m.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.studentNo}</p>
                        </div>
                        {!m.active && <Badge tone="neutral">Inactive</Badge>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden /> Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {d.lessons.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No lessons yet" />
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {d.lessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(l.startsAt)}</p>
                      </div>
                      {l.location && <Badge tone="neutral">{l.location}</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" aria-hidden /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {d.announcements.length === 0 ? (
                <EmptyState icon={Megaphone} title="No announcements" />
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {d.announcements.map((a) => (
                    <li key={a.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                        <Badge tone="neutral">{labelFor(ANNOUNCEMENT_CATEGORIES, a.category)}</Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{a.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit group"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Group name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.value })}
                  aria-label={c.label}
                  className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: form.color === c.value ? `0 0 0 3px var(--background), 0 0 0 5px ${c.value}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
        title="Delete this group?"
        description={`Students will be removed from "${d.name}" but keep their accounts. This cannot be undone.`}
        loading={deleting}
      />
    </>
  );
}