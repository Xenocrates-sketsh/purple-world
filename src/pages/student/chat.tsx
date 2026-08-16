import { MessageSquare } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useQuery } from "@/hooks/useFirestore";
import { studentConversationQuery } from "@/lib/db/chat";
import type { ConversationDoc } from "@/lib/types";
import { ChatThread } from "@/components/chat/chat-thread";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";

export function StudentChatPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const conversation = useQuery<ConversationDoc>(
    (db) => (uid ? studentConversationQuery(db, uid) : null),
    [uid]
  );

  const conv = (conversation.docs ?? [])[0];

  return (
    <div>
      <PageHeader title="Messages" description="Chat privately with your teacher." />

      {conversation.loading ? (
        <SkeletonList count={3} />
      ) : !conv ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversation yet"
          description="Your teacher will open a chat from your student profile — messages will appear here."
        />
      ) : (
        <ChatThread conversationId={conv.id} myUid={uid} otherName="Teacher" />
      )}
    </div>
  );
}