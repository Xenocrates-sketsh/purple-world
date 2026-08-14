import { Megaphone } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { studentAnnouncementsQuery } from "@/lib/db/announcements";
import { ANNOUNCEMENT_TYPES } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";

export function StudentAnnouncementsPage() {
  const { userDoc } = useAuth();
  const studentId = userDoc?.studentId ?? "";
  const groupId = userDoc?.groupId ?? "";
  const announcements = useQuery(
    (db) =>
      studentId
        ? studentAnnouncementsQuery(db, ["all", `group:${groupId}`, `student:${studentId}`])
        : null,
    [groupId, studentId]
  );

  return (
    <div>
      <PageHeader title="Announcements" description="Latest news from your teacher." />

      {studentId && announcements.loading ? (
        <SkeletonList count={4} />
      ) : !studentId || (announcements.docs ?? []).length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nothing announced yet"
          description="Schedule changes, exam reminders and homework notes land here."
        />
      ) : (
        <ul className="space-y-4">
          {(announcements.docs ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{a.data.title}</h3>
                    <Badge variant="primary">
                      {ANNOUNCEMENT_TYPES.find((t) => t.value === a.data.type)?.label ?? a.data.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelative(a.data.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{a.data.body}</p>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}