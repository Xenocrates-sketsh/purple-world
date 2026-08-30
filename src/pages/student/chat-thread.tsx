import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useDoc } from "@/hooks/useFirestore";
import { paths } from "@/lib/db/paths";
import { ChatThread } from "@/components/chat/chat-thread";
import { fruitAvatarByKey, fruitAvatarSrc } from "@/lib/constants";
import type { ConversationDoc, UserDoc } from "@/lib/types";
import { SkeletonList } from "@/components/ui/skeleton";

export function StudentChatThreadPage() {
  const { conversationId = "" } = useParams();
  const { user } = useAuth();
  const conv = useDoc<ConversationDoc>(paths.conversations(conversationId));

  const data = conv.doc?.data;
  const isGroup = data?.kind === "group";
  const title = isGroup ? (data.name ?? "Class chat") : data ? "Teacher" : null;
  const targetUid = isGroup ? null : (data?.teacherId ?? null);
  const teacher = useDoc<UserDoc>(targetUid ? paths.users(targetUid) : null);
  const teacherData = teacher.doc?.data;

  return (
    <div>
      <Link
        to="/student/chat"
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
          title={title}
          backHref="/student/chat"
          targetUid={targetUid}
          avatarSrc={teacherData?.avatarUrl ?? fruitAvatarSrc(teacherData?.avatarKey)}
          avatarEmoji={fruitAvatarByKey(teacherData?.avatarKey)?.emoji}
        />
      )}
    </div>
  );
}