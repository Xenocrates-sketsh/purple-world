import { CreditCard, ReceiptText } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { studentPaymentsQuery } from "@/lib/db/payments";
import { formatDate, formatMoney } from "@/lib/format";
import type { PaymentDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";

export function StudentPaymentsPage() {
  const { userDoc } = useAuth();
  const studentId = userDoc?.studentId ?? "";
  const payments = useQuery<PaymentDoc>(
    (db) => (studentId ? studentPaymentsQuery(db, studentId) : null),
    [studentId]
  );

  if (!studentId) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No payment history"
        description="Once your account is linked to your student record, fees appear here."
      />
    );
  }

  const rows = (payments.docs ?? [])
    .map((p) => ({ id: p.id, ...p.data }))
    .sort((a, b) => b.dueDate.toMillis() - a.dueDate.toMillis());

  const outstandingTotal = rows.filter((r) => r.status === "due").reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        description={
          outstandingTotal > 0
            ? `Outstanding balance: ${formatMoney(outstandingTotal)}`
            : "You're all settled up."
        }
      />

      {payments.loading ? (
        <SkeletonList count={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No payment records yet"
          description="Your teacher will add monthly fee records here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const overdue = r.status === "due" && r.dueDate.toMillis() < Date.now();
                return (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <CreditCard className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{formatMoney(r.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.status === "paid"
                          ? `Paid on ${formatDate(r.paidDate)}`
                          : `Due ${formatDate(r.dueDate)}`}
                        {r.notes ? ` · ${r.notes}` : ""}
                      </p>
                    </div>
                    {r.status === "paid" ? (
                      <Badge variant="success">Paid</Badge>
                    ) : overdue ? (
                      <Badge variant="danger">Overdue</Badge>
                    ) : (
                      <Badge variant="warning">Due</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}