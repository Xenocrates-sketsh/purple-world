"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Conversation {
  studentId: string;
  profileId: string;
  fullName: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
}

export default function TeacherChatPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    api
      .get<Conversation[]>("/api/teacher/chat")
      .then((data) => active && setConversations(data))
      .catch(() => active && setConversations([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader title="Messages" description="Talk to your students one-on-one." />
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" aria-hidden />
          {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-14">
            <Spinner />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="Messages you exchange with your students will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {conversations.map((c) => (
              <li key={c.studentId}>
                <Link
                  href={`/teacher/chat/${c.studentId}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <Avatar name={c.fullName} src={c.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{c.fullName}</p>
                      {c.lastAt && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateTime(c.lastAt)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", c.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {c.lastMessage ?? "Start a conversation"}
                      </p>
                      {c.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
