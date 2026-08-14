import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Wallet, CheckCircle2, Trash2 } from "lucide-react";

import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { allPaymentsQuery, createPayment, deletePayment, markPaymentPaid } from "@/lib/db/payments";
import { allStudentsQuery } from "@/lib/db/students";
import { formatDate, formatMoney } from "@/lib/format";
import type { PaymentDoc } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

type Filter = "all" | "due" | "overdue" | "paid";

export function TeacherPaymentsPage() {
  const { toast } = useToast();
  const payments = useQuery(allPaymentsQuery);
  const students = useQuery(allStudentsQuery);
  const studentsById = useDocMap(students.docs);

  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const [toDelete, setToDelete] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const now = Date.now();

  const rows = (payments.docs ?? [])
    .map((p) => {
      const overdue = p.data.status === "due" && p.data.dueDate.toMillis() < now;
      return { id: p.id, data: p.data, overdue };
    })
    .filter((r) => {
      if (filter === "due") return r.data.status === "due";
      if (filter === "overdue") return r.overdue;
      if (filter === "paid") return r.data.status === "paid";
      return true;
    });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!studentId || !amount) {
      toast("Pick a student and enter an amount", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await createPayment({
        studentId,
        amount: Number(amount),
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        paidDate: null,
        status: "due",
        notes: notes.trim() || null,
      });
      toast("Payment record added", { variant: "success" });
      setOpen(false);
      setAmount("");
      setNotes("");
    } catch {
      toast("Could not create payment", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onMarkPaid(id: string) {
    try {
      await markPaymentPaid(id, new Date());
      toast("Marked as paid", { variant: "success" });
    } catch {
      toast("Could not update payment", { variant: "error" });
    }
  }

  async function onDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deletePayment(toDelete.id);
      toast("Payment deleted", { variant: "info" });
      setToDelete(null);
    } catch {
      toast("Could not delete payment", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track monthly fees. Overdue is computed automatically from the due date."
        action={
          <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            New payment
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">All payments</option>
          <option value="due">Due (not paid)</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </Select>
      </div>

      {payments.loading ? (
        <SkeletonList count={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={filter === "all" ? "No payments yet" : "Nothing here"}
          description={filter === "all" ? "Add monthly fee records for your students." : "No payments match this filter."}
          action={filter === "all" ? (
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>New payment</Button>
          ) : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const st = studentsById.get(r.data.studentId);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <Avatar name={st?.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {st?.name ?? "Unknown student"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(r.data.dueDate)}
                        {r.data.notes ? ` · ${r.data.notes}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatMoney(r.data.amount)}</span>
                    {r.data.status === "paid" ? (
                      <Badge variant="success">Paid {formatDate(r.data.paidDate)}</Badge>
                    ) : r.overdue ? (
                      <Badge variant="danger">Overdue</Badge>
                    ) : (
                      <Badge variant="warning">Due</Badge>
                    )}
                    <div className="flex items-center gap-1">
                      {r.data.status !== "paid" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkPaid(r.id)}
                          leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                        >
                          Mark paid
                        </Button>
                      ) : null}
                      <button
                        type="button"
                        aria-label="Delete payment"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        onClick={() =>
                          setToDelete({ id: r.id, label: `${formatMoney(r.data.amount)} for ${st?.name ?? "student"}` })
                        }
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New payment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onCreate} loading={saving} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>Create</Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="space-y-4">
          <Field label="Student" htmlFor="p-student" required>
            <Select id="p-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">Select student…</option>
              {(students.docs ?? []).filter((s) => s.data.active).map((s) => (
                <option key={s.id} value={s.id}>{s.data.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (DZD)" htmlFor="p-amount" required>
              <Input id="p-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="8000" required />
            </Field>
            <Field label="Due date" htmlFor="p-due" required>
              <Input id="p-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </Field>
          </div>
          <Field label="Notes" htmlFor="p-notes">
            <Textarea id="p-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. January fee" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete != null}
        title="Delete payment?"
        description={toDelete ? `${toDelete.label} will be removed.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}