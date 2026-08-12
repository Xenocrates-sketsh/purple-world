"use client";

import * as React from "react";
import Link from "next/link";
import { UsersRound, CalendarDays, Megaphone, FileText, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { labelFor, ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";

interface GroupData {
  group: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    memberCount: number;
  } | null;
  members: { id: string; fullName: string; avatarUrl: string | null; studentNo: string }[];
  lessons: { id: string; title: string; startsAt: string; durationMin: number; location: string | null }[];
  announcements: { id: string; title: string; content: string; category: string; createdAt: string }[];
  exercises: { id: string; title: string; category: string; deadline: string | null }[];
}

export default function StudentGroupPage() {
  const [data, setData] = React.useState<GroupData | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    api
      .get<GroupData>("/api/student/group")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <EmptyState icon={UsersRound} title="Could not load your group." />;
  if (!data) return <Spinner className="py-24" />;

  if (!data.group) {
    return (
      <EmptyState
        icon={XCircle}
        title="You're not in a group yet"
        description="Your teacher will add you to a group."
      />
    );
  }

  return (
    <>
      <PageHeader
        title={data.group.name}
        description={data.group.description ?? `${data.group.memberCount} members`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-primary" aria-hidden /> Classmates ({data.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border" role="list">
              {data.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={m.fullName} src={m.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{m.fullName}</p>
                    <p className="text-xs text-muted-foreground">{m.studentNo}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden /> Upcoming lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.lessons.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No upcoming lessons" />
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {data.lessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(l.startsAt)}</p>
                      </div>
                      {l.location && <Badge tone="neutral">{l.location}</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" aria-hidden /> Group announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.announcements.length === 0 ? (
                <EmptyState icon={Megaphone} title="No announcements" />
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {data.announcements.map((a) => (
                    <li key={a.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
                        <Badge tone="neutral">{labelFor(ANNOUNCEMENT_CATEGORIES, a.category)}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{a.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" aria-hidden /> Group exercises
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.exercises.length === 0 ? (
                <EmptyState icon={FileText} title="No exercises yet" />
              ) : (
                <ul className="divide-y divide-border" role="list">
                  {data.exercises.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                      <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                      <Link href="/student/exercises" className="text-sm font-medium text-primary hover:underline">
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}