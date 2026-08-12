"use client";

import * as React from "react";
import { Wallet, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatAmount, formatDate } from "@/lib/format";

interface PaymentItem {
  id: string;
  amount: string | null;
  dueDate: string;
  paidDate: string | null;
  status: string;
  notes: string | null;
}

interface PaymentsData {
  current: PaymentItem | null;
  history: PaymentItem[];
}

export default function StudentPaymentsPage() {
  const [data, setData] = React.useState<PaymentsData | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    api
      .get<PaymentsData>("/api/student/payments")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <EmptyState icon={Wallet} title="Could not load your payments." />;
  if (!data) return <Spinner className="py-24" />;

  const items = data.history.length > 0 ? data.history : data.current ? [data.current] : [];

  return (
    <>
      <PageHeader title="Payments" description="Your tuition status and history." />

      {data.current ? (
        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Wallet className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current payment</p>
                <p className="text-lg font-bold text-foreground">{formatAmount(data.current.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(data.current.dueDate)}
                  {data.current.paidDate ? ` · paid ${formatDate(data.current.paidDate)}` : ""}
                </p>
              </div>
            </div>
            {data.current.status === "paid" ? (
              <Badge tone="success"><CheckCircle2 className="h-3 w-3" aria-hidden /> Paid</Badge>
            ) : data.current.status === "overdue" ? (
              <Badge tone="danger"><XCircle className="h-3 w-3" aria-hidden /> Overdue</Badge>
            ) : (
              <Badge tone="warning"><Clock3 className="h-3 w-3" aria-hidden /> Due</Badge>
            )}
          </div>
          {data.current.notes && <p className="mt-3 text-sm text-muted-foreground">{data.current.notes}</p>}
          {data.current.status !== "paid" && (
            <p className="mt-3 rounded-xl bg-warning-soft/60 p-3 text-sm text-warning">
              Please settle this payment. If you already paid, tell your teacher.
            </p>
          )}
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState icon={Wallet} title="No payments recorded" />
          ) : (
            <ul className="divide-y divide-border" role="list">
              {items.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{formatAmount(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(p.dueDate)}
                      {p.paidDate ? ` · paid ${formatDate(p.paidDate)}` : ""}
                    </p>
                  </div>
                  {p.status === "paid" ? (
                    <Badge tone="success">Paid</Badge>
                  ) : p.status === "overdue" ? (
                    <Badge tone="danger">Overdue</Badge>
                  ) : (
                    <Badge tone="warning">Due</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}