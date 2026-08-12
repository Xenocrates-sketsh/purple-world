"use client";

import * as React from "react";
import Link from "next/link";
import { Wallet, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatAmount, formatDate } from "@/lib/format";
import type { PaymentRow, StudentSummary } from "@/lib/types";

export default function TeacherPaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = React.useState<PaymentRow[]>([]);
  const [students, setStudents] = React.useState<StudentSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState("all");
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [form, setForm] = React.useState({ studentId: "", amount: "", dueDate: "", paidDate: "", notes: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (status !== "all") qs.set("status", status);
    try {
      setPayments(await api.get<PaymentRow[]>(`/api/teacher/payments?${qs.toString()}`));
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not load payments." });
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  React.useEffect(() => {
    api.get<StudentSummary[]>("/api/teacher/students?filter=active").then(setStudents).catch(() => setStudents([]));
    load();
  }, [load]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/teacher/payments", form);
      setOpen(false);
      toast({ kind: "success", title: "Payment recorded" });
      load();
    } catch (err) {
      toast({ kind: "error", title: err instanceof Error ? err.message : "Could not add payment." });
    } finally {
      setSaving(false);
    }
  };

  const togglePaid = async (p: PaymentRow) => {
    try {
      const res = await api.patch<{ status: string }>(`/api/teacher/payments/${p.id}`, {
        paidDate: p.paidDate ? null : new Date().toISOString().slice(0, 10),
      });
      toast({ kind: "success", title: res.status === "paid" ? "Marked as paid" : "Marked as unpaid" });
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not update payment." });
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.del(`/api/teacher/payments/${deleteId}`);
      toast({ kind: "success", title: "Payment deleted" });
      setDeleteId(null);
      load();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not delete payment." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description="Track who has paid and who is overdue."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Record payment
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-44"
            aria-label="Filter by status"
            options={[
              { value: "all", label: "All payments" },
              { value: "due", label: "Due" },
              { value: "overdue", label: "Overdue" },
              { value: "paid", label: "Paid" },
            ]}
          />
          <p className="text-sm text-muted-foreground">{payments.length} payments</p>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments found"
          description="Record the first payment for one of your students."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Record payment</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border" role="list">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/teacher/students/${p.studentId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={p.student?.fullName ?? "?"} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{p.student?.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Due {formatDate(p.dueDate)} · {p.notes || formatAmount(p.amount)}
                    </p>
                  </div>
                </Link>
                <span className="hidden text-sm font-semibold text-foreground sm:inline">{formatAmount(p.amount)}</span>
                {p.status === "paid" ? (
                  <Badge tone="success"><CheckCircle2 className="h-3 w-3" aria-hidden /> Paid {p.paidDate ? formatDate(p.paidDate) : ""}</Badge>
                ) : p.status === "overdue" ? (
                  <Badge tone="danger"><XCircle className="h-3 w-3" aria-hidden /> Overdue</Badge>
                ) : (
                  <Badge tone="warning">Due</Badge>
                )}
                <button
                  onClick={() => togglePaid(p)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                  aria-label={p.status === "paid" ? "Mark as unpaid" : "Mark as paid"}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                </button>
                <button
                  onClick={() => setDeleteId(p.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-danger"
                  aria-label="Delete payment"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record a payment"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="payment-form" loading={saving}>Save</Button>
          </>
        }
      >
        <form id="payment-form" onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="studentId">Student *</Label>
            <Select id="studentId" name="studentId" required options={students.map((s) => ({ value: s.id, label: s.fullName }))} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount">Amount (DZD)</Label>
              <Input id="amount" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 2000" />
            </div>
            <div>
              <Label htmlFor="dueDate">Due date *</Label>
              <Input id="dueDate" name="dueDate" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="paidDate">Paid date</Label>
            <Input id="paidDate" name="paidDate" type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} placeholder="Leave empty if not paid yet" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Monthly fee" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete this payment?"
        loading={deleting}
      />
    </>
  );
}