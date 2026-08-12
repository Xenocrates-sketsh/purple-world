"use client";

import * as React from "react";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { ANNOUNCEMENT_CATEGORIES, labelFor } from "@/lib/constants";
import type { AnnouncementRow } from "@/lib/types";

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = React.useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<AnnouncementRow[]>("/api/student/announcements")
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="py-24" />;

  return (
    <>
      <PageHeader title="Announcements" description="News from your teacher." />

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nothing new"
          description="Announcements from your teacher will appear here."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{labelFor(ANNOUNCEMENT_CATEGORIES, a.category)}</Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <h2 className="text-base font-semibold text-foreground">{a.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}