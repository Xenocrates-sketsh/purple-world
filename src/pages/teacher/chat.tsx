import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useChatUnread, sortConversations } from "@/hooks/useChatUnread";
import { useQuery, useDocMap } from "@/hooks/useFirestore";
import { allStudentsQuery } from "@/lib/db/students";
import type { StudentDoc } from "@/lib/types";
import { formatRelative, truncate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";

export function TeacherChatPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const { conversations, conversationsLoading, unreadByConv } = useChatUnread(uid);
  const students = useQuery<StudentDoc>(allStudentsQuery);
  const studentsById = useDocMap(students.docs);

  const sorted = conversations ? sortConversations(conversations) : null;

  return (
    <div>
      <PageHeader title="Messages" description="Conversations with your students." />

      <Card>
        <CardContent className="p-0">
          {conversationsLoading ? (
            <div className="p-5">
              <SkeletonList count={4} />
            </div>
          ) : !sorted || sorted.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="Pick a student to start chatting."
              action={
                <Link to="/teacher/students">
                  <Button>New chat</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {sorted.map((c) => {
                const student = c.data.studentId ? studentsById.get(c.data.studentId) : undefined;
                const unread = unreadByConv[c.id] ?? false;
                return (
                  <li key={c.id}>
                    <Link
                      to={c.data.studentId ? `/teacher/chat/${c.data.studentId}` : "/teacher/chat"}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                    >
                      <div className="relative">
                        <Avatar name={student?.name} size="md" />
                        {unread ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-danger"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={"truncate " + (unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                          {student?.name ?? "Student"}
                        </p>
                        <p className={"truncate text-sm " + (unread ? "text-foreground" : "text-muted-foreground")}>
                          {c.data.lastMessagePreview ? truncate(c.data.lastMessagePreview, 60) : "No messages yet"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {c.data.lastMessageAt ? formatRelative(c.data.lastMessageAt) : ""}
                        </span>
                        {unread ? <Badge variant="danger">New</Badge> : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}