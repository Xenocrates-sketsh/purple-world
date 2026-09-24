import { Link } from "react-router-dom";
import { Clock, Trash2, MapPin, Plus, Users } from "lucide-react";

import type { QueryState } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { DAY_LABELS } from "@/lib/constants";
import type { ScheduleSlot, StudentDoc } from "@/lib/types";

export function GroupScheduleCard({
  slots,
  onAddSlot,
  onDeleteSlot,
}: {
  slots: ScheduleSlot[];
  onAddSlot: () => void;
  onDeleteSlot: (index: number) => void;
}) {
  const daySlots = DAY_LABELS.map((label, dayIdx) => ({
    label,
    items: slots.map((s, i) => ({ s, i })).filter((x) => x.s.day === dayIdx),
  })).filter((d) => d.items.length > 0);

  return (
    <Card>
      <CardHeader
        title="Weekly schedule"
        description="Recurring slots — lessons are created from these"
        action={
          <Button variant="ghost" size="sm" onClick={onAddSlot} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Add slot
          </Button>
        }
      />
      <CardContent>
        {slots.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No schedule yet"
            description="Add recurring weekly slots so lessons can be planned."
            action={
              <Button variant="secondary" size="sm" onClick={onAddSlot} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
                Add first slot
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {daySlots.map((d) => (
              <li key={d.label} className="rounded-xl border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d.label}</p>
                <ul className="space-y-1.5">
                  {d.items.map(({ s, i }) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <span className="font-medium">
                          {s.startTime} – {s.endTime}
                        </span>
                        <span className="text-xs text-muted-foreground">({s.durationMin} min)</span>
                        {s.location ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" aria-hidden /> {s.location}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        aria-label="Delete slot"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        onClick={() => onDeleteSlot(i)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function GroupMembersCard({ members }: { members: QueryState<StudentDoc> }) {
  return (
    <Card>
      <CardHeader title={`Students in this group (${members.docs?.length ?? "…"})`} />
      <CardContent className="p-0">
        {members.loading ? (
          <div className="p-5"><SkeletonList count={3} /></div>
        ) : (members.docs ?? []).length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students in this group yet"
            description="Assign students from their profile page."
          />
        ) : (
          <ul className="divide-y divide-border">
            {members.docs?.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/teacher/students/${s.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <Avatar name={s.data.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{s.data.name}</p>
                    <p className="text-xs text-muted-foreground">{s.data.studentNo}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.data.stream ?? ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
