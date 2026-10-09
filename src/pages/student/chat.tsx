import { useState } from "react";
import { MessageSquare } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { studentConversationQuery, findConversation, createConversation, getTeacherUid } from "@/lib/db/chat";
import type { ConversationDoc } from "@/lib/types";
import { ChatThread } from "@/components/chat/chat-thread";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useGraceLoading } from "@/hooks/useGraceLoading";
import { useToast } from "@/lib/toast";

export function StudentChatPage() {
  const { user, userDoc } = useAuth();
  const { toast } = useToast();
  const uid = user?.uid ?? "";
  const conversation = useQuery<ConversationDoc>(
    (db) => (uid ? studentConversationQuery(db, uid) : null),
    [uid]
  );

  const conv = (conversation.docs ?? [])[0];
  const conversationBusy = useGraceLoading(conversation.loading);
  const [starting, setStarting] = useState(false);

  async function startChat() {
    if (!uid || starting) return;
    setStarting(true);
    try {
      const teacherUid = await getTeacherUid();
      if (!teacherUid) {
        toast("Couldn't reach your teacher right now — try again.", { variant: "error" });
        return;
      }
      const existing = await findConversation([uid, teacherUid]);
      if (!existing) {
        await createConversation(uid, teacherUid, userDoc?.studentId ?? null);
      }
      // The live query above picks the thread up automatically.
    } catch {
      toast("Couldn't start the chat — try again.", { variant: "error" });
    } finally {
      setStarting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Messages" description="Chat privately with your teacher." />

      {conversationBusy ? (
        <SkeletonList count={3} />
      ) : !conv ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversation yet"
          description="Start a chat with your teacher any time."
          action={
            <Button onClick={startChat} loading={starting}>
              Message your teacher
            </Button>
          }
        />
      ) : (
        <ChatThread conversationId={conv.id} myUid={uid} otherName="Teacher" />
      )}
    </div>
  );
}