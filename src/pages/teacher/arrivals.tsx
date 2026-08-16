import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Check, X, Clock } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { arrivalsQuery, acceptArrival, rejectArrival } from "@/lib/db/arrivals";
import type { ArrivalDoc } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

function ArrivalCard({
  a,
  busy,
  onAccept,
  onReject,
}: {
  a: ArrivalDoc;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar name={a.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
          <p className="truncate text-xs text-muted-foreground">{a.email}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {a.school ? <Badge variant="neutral">{a.school}</Badge> : null}
            {a.number ? <Badge variant="neutral">{a.number}</Badge> : null}
            {a.age != null ? <Badge variant="neutral">{a.age} years</Badge> : null}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Requested {formatRelative(a.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="danger"
          onClick={onReject}
          loading={busy}
          leftIcon={<X className="h-4 w-4" aria-hidden />}
        >
          Reject
        </Button>
        <Button
          size="sm"
          onClick={onAccept}
          loading={busy}
          leftIcon={<Check className="h-4 w-4" aria-hidden />}
        >
          Accept
        </Button>
      </div>
    </li>
  );
}

export function TeacherArrivalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const arrivals = useQuery<ArrivalDoc>(arrivalsQuery);
  const [busyId, setBusyId] = useState<string | null>(null);

  const docs = arrivals.docs ?? [];
  const pending = docs.filter((d) => d.data.status === "pending");
  const handled = docs.filter((d) => d.data.status !== "pending");

  async function onAccept(id: string, a: ArrivalDoc) {
    if (!user) return;
    setBusyId(id);
    try {
      await acceptArrival(id, a, user.uid);
      toast(`${a.name}'s account was created`, { variant: "success" });
    } catch {
      toast("Could not approve this request", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(id: string, a: ArrivalDoc) {
    if (!user) return;
    setBusyId(id);
    try {
      await rejectArrival(id, user.uid);
      toast(`Request from ${a.name} declined`, { variant: "info" });
    } catch {
      toast("Could not decline this request", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="New Arrivals"
        description="Students who asked to join with their name and email."
        action={
          pending.length > 0 ? (
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" aria-hidden /> {pending.length} pending
            </Badge>
          ) : undefined
        }
      />

      <Card>
        <CardHeader title="Awaiting your decision" />
        <CardContent className="p-0">
          {arrivals.loading ? (
            <div className="p-5">
              <SkeletonList count={3} />
            </div>
          ) : pending.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No pending requests"
              description="New student requests will show up here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((d) => (
                <ArrivalCard
                  key={d.id}
                  a={d.data}
                  busy={busyId === d.id}
                  onAccept={() => onAccept(d.id, d.data)}
                  onReject={() => onReject(d.id, d.data)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {handled.length > 0 ? (
        <Card className="mt-6">
          <CardHeader title="Handled requests" description="Previously accepted or declined." />
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {handled.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={d.data.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{d.data.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{d.data.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={d.data.status === "accepted" ? "success" : "danger"}>
                      {d.data.status}
                    </Badge>
                    <span>{formatRelative(d.data.handledAt ?? d.data.createdAt)}</span>
                    {d.data.studentId ? (
                      <Link
                        to={`/teacher/students/${d.data.studentId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        View
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}