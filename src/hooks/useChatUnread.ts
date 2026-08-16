import { useMemo } from "react";

import { useQuery } from "@/hooks/useFirestore";
import { teacherConversationsQuery, myParticipantDocsQuery } from "@/lib/db/chat";
import type { ConversationDoc, ParticipantDoc } from "@/lib/types";
import type { Doc } from "@/lib/db/paths";

/**
 * Unread state for a user's conversations, derived entirely from the
 * conversation doc (lastMessageAt / lastMessageSenderId) plus their own
 * participant markers (lastReadAt). Two lightweight listeners total.
 */
export function useChatUnread(uid: string) {
  const convs = useQuery<ConversationDoc>(
    (db) => teacherConversationsQuery(db, uid),
    [uid]
  );
  const parts = useQuery<ParticipantDoc>(
    (db) => myParticipantDocsQuery(db, uid),
    [uid]
  );

  const unreadByConv = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const c of convs.docs ?? []) {
      const lastAt = c.data.lastMessageAt?.toDate() ?? null;
      const participant = parts.docs?.find((p) => p.data.conversationId === c.id);
      const readAtTs = participant?.data.lastReadAt?.toDate() ?? null;
      map[c.id] =
        !!lastAt &&
        c.data.lastMessageSenderId != null &&
        c.data.lastMessageSenderId !== uid &&
        (readAtTs == null || lastAt > readAtTs);
    }
    return map;
  }, [convs.docs, parts.docs, uid]);

  const unreadCount = useMemo(
    () => Object.values(unreadByConv).filter(Boolean).length,
    [unreadByConv]
  );

  return {
    conversations: convs.docs,
    conversationsLoading: convs.loading,
    unreadByConv,
    unreadCount,
    unreadCountLoading: convs.loading || parts.loading,
  };
}

/** Order conversations newest-activity-first. */
export function sortConversations(convs: Doc<ConversationDoc>[]): Doc<ConversationDoc>[] {
  return [...convs].sort((a, b) => {
    const at = a.data.lastMessageAt?.toMillis() ?? a.data.createdAt.toMillis();
    const bt = b.data.lastMessageAt?.toMillis() ?? b.data.createdAt.toMillis();
    return bt - at;
  });
}
