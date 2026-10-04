import { Link } from "react-router-dom";
import { MapPin, Users, BookOpen } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useDoc } from "@/hooks/useFirestore";
import { paths } from "@/lib/db/paths";
import { DAY_LABELS } from "@/lib/constants";
import type { GroupDoc } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useGraceLoading } from "@/hooks/useGraceLoading";

export function StudentGroupPage() {
  const { userDoc } = useAuth();
  const groupId = userDoc?.groupId ?? "";
  const group = useDoc<GroupDoc>(groupId ? paths.groups(groupId) : null);
  const groupBusy = useGraceLoading(group.loading);

  return (
    <div>
      <PageHeader title="My group" description="Your class schedule." />

      {groupBusy ? (
        <SkeletonList count={2} />
      ) : !group.doc ? (
        <EmptyState
          icon={Users}
          title="You're not in a group yet"
          description="Your teacher will assign you to a group."
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={group.doc.data.name}
              description={group.doc.data.description ?? undefined}
            />
            <CardContent className="text-sm text-muted-foreground">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: group.doc.data.color }}
                  aria-hidden
                />
                <span className="font-medium text-foreground">{group.doc.data.name}</span>
              </div>
              {group.doc.data.scheduleSlots.length === 0 ? (
                <p>No schedule has been set yet.</p>
              ) : null}
            </CardContent>
          </Card>

          {group.doc.data.scheduleSlots.length > 0 ? (
            <Card>
              <CardHeader title="Weekly schedule" />
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {group.doc.data.scheduleSlots.map((slot, i) => {
                    return (
                      <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
                          {DAY_LABELS[slot.day].slice(0, 3)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">
                            {slot.startTime} – {slot.endTime}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {DAY_LABELS[slot.day]} · every week · {slot.durationMin} min
                          </p>
                        </div>
                        {slot.location ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" aria-hidden /> {slot.location}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Coming up" />
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your teacher posts concrete lessons under{" "}
                <Link to="/student/dashboard" className="text-primary hover:underline">
                  Home
                </Link>
                . Attendance and lesson notes are tracked there too.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-4 w-4" aria-hidden /> Program: see the curriculum under Program.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}