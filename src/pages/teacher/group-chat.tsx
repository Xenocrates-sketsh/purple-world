import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useDoc } from "@/hooks/useFirestore";
import { paths } from "@/lib/db/paths";
import { ChatThread } from "@/components/chat/chat-thread";
import type { ConversationDoc } from "@/lib/types";
import { SkeletonList } from "@/components/ui/skeleton";

export function TeacherGroupChatPage() {
  const { conversationId = "" } = useParams();
  const { user } = useAuth();
  const conv = useDoc<ConversationDoc>(paths.conversations(conversationId));

  const data = conv.doc?.data;
  const title = data?.name ?? "Class chat";

  return (
    <div>
      <Link
        to="/teacher/chat"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Messages
      </Link>
      {conv.loading ? (
        <SkeletonList count={3} />
      ) : (
        <ChatThread
          conversationId={data ? conversationId : null}
          myUid={user?.uid ?? ""}
          otherName={title}
          backHref="/teacher/chat"
        />
      )}
    </div>
  );
}