import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useDoc } from "@/hooks/useFirestore";
import { findConversation, createConversation } from "@/lib/db/chat";
import { paths } from "@/lib/db/paths";
import { ChatThread } from "@/components/chat/chat-thread";
import { SkeletonList } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

export function TeacherChatThreadPage() {
  const { studentId = "" } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const student = useDoc(paths.students(studentId));
  const linkedUid = student.doc?.data.linkedUid ?? null;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!linkedUid || !user) {
      setConversationId(null);
      return;
    }
    setResolving(true);
    (async () => {
      try {
        const existing = await findConversation([linkedUid, user.uid]);
        const id =
          existing?.id ?? (await createConversation(linkedUid, user.uid, studentId));
        if (!cancelled) setConversationId(id);
      } catch {
        if (!cancelled) {
          toast("Could not open the conversation", { variant: "error" });
          setConversationId(null);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [linkedUid, user, studentId, toast]);

  if (!student.doc) {
    return (
      <div>
        <Link to="/teacher/chat" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Messages
        </Link>
        <SkeletonList count={2} />
      </div>
    );
  }

  if (!linkedUid) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          This student hasn't signed up yet — create a{" "}
          <Link to={`/teacher/students/${studentId}`} className="text-primary hover:underline">
            sign-up invite
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/teacher/chat" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Messages
      </Link>
      {resolving ? (
        <SkeletonList count={3} />
      ) : (
        <ChatThread
          conversationId={conversationId}
          myUid={user?.uid ?? ""}
          otherName={student.doc.data.name}
          backHref="/teacher/chat"
        />
      )}
    </div>
  );
}