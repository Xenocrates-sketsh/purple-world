import { Link } from "react-router-dom";
import { BookOpen, CreditCard } from "lucide-react";

import type { QueryState } from "@/hooks/useFirestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";
import type { AssessmentDoc, AssessmentResultDoc, PaymentDoc } from "@/lib/types";

export function StudentGradesCard({
  results,
  assessmentsById,
}: {
  results: QueryState<AssessmentResultDoc>;
  assessmentsById: Map<string, AssessmentDoc>;
}) {
  return (
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
  );
}

export function StudentPaymentsCard({ payments }: { payments: QueryState<PaymentDoc> }) {
  return (
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
  );
}
