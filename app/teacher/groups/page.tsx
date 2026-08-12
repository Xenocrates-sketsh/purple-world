"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, UsersRound, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { GROUP_COLORS } from "@/lib/constants";
import type { GroupSummary } from "@/lib/types";

export default function TeacherGroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = React.useState<GroupSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [color, setColor] = React.useState<string>(GROUP_COLORS[0].value);
  const [copied, setCopied] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await api.get<GroupSummary[]>("/api/teacher/groups"));
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load groups." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast({ kind: "error", title: "Could not copy." });
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    try {
      const g = await api.post<GroupSummary>("/api/teacher/groups", { ...data, color });
      setCreateOpen(false);
      toast({ kind: "success", title: "Group created" });
      load();
    } catch (err) {
      toast({ kind: "error", title: err instanceof Error ? err.message : "Could not create group." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Groups"
        description="Create classes and share their join codes with students."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New group
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No groups yet"
          description="Create your first group to start adding students."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> New group
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id} className="flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: g.color }}
                >
                  {g.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {g.memberCount} {g.memberCount === 1 ? "student" : "students"}
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-foreground">{g.name}</h2>
              {g.description && (
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {g.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted/60 p-2.5">
                <code className="flex-1 text-center text-sm font-semibold tracking-widest text-primary">
                  {g.inviteCode}
                </code>
                <button
                  onClick={() => copyCode(g.inviteCode)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                  aria-label="Copy join code"
                >
                  {copied === g.inviteCode ? (
                    <Check className="h-4 w-4 text-success" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              <Link
                href={`/teacher/groups/${g.id}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-border bg-surface py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Open group
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New group"
        description="A join code will be generated for your students to sign up."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-group-form" type="submit" loading={saving}>
              Create group
            </Button>
          </>
        }
      >
        <form id="create-group-form" onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Group name *</Label>
            <Input id="name" name="name" required placeholder="e.g. BAC 2027 - Sciences" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} placeholder="Optional note about this group" />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Group color">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={color === c.value}
                  aria-label={c.label}
                  onClick={() => setColor(c.value)}
                  className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: color === c.value ? `0 0 0 3px var(--background), 0 0 0 5px ${c.value}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}