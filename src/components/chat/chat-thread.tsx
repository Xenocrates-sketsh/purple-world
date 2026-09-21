import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Send, CheckCheck } from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import { messagesOfConversationQuery, sendMessage, markConversationRead } from "@/lib/db/chat";
import { formatRelative } from "@/lib/format";
import type { MessageDoc } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useToast } from "@/lib/toast";

interface ChatThreadProps {
  conversationId: string | null;
  myUid: string;
  otherName?: string | null;
  avatarSrc?: string | null;
  /** Participant doc from the auth pattern — not needed; read markers live on the participant subcollection. */
  backHref?: string;
}

export function ChatThread({ conversationId, myUid, otherName, avatarSrc, backHref }: ChatThreadProps) {
  const { toast } = useToast();
  const messages = useQuery<MessageDoc>(
    (db) => (conversationId ? messagesOfConversationQuery(db, conversationId) : null),
    [conversationId]
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef<string | null>(null);

  const sorted = useMemo(() => [...(messages.docs ?? [])], [messages.docs]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sorted.length, conversationId]);

  // Mark the conversation read once when a newer incoming message arrives.
  useEffect(() => {
    if (!conversationId || !messages.docs) return;
    const incoming = messages.docs.filter((m) => m.data.senderId !== myUid);
    const newest = incoming[incoming.length - 1];
    if (newest && markedRef.current !== newest.id) {
      markedRef.current = newest.id;
      void markConversationRead(conversationId, myUid);
    }
  }, [conversationId, messages.docs, myUid]);

  if (conversationId === null || !messages.docs) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        {conversationId === null ? (
          <EmptyState title="No conversation" description="Start one from a student's profile." />
        ) : (
          <SkeletonList count={4} />
        )}
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      await sendMessage(conversationId!, myUid, value);
      setText("");
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {
      toast("Could not send message", { variant: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        {backHref ? (
          <a href={backHref} className="rounded-lg p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground" aria-label="Back">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </a>
        ) : null}
        <Avatar name={otherName} src={avatarSrc ?? null} size="sm" />
        <p className="truncate font-medium text-foreground">{otherName ?? "Chat"}</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
        {sorted.length === 0 ? (
          <EmptyState title="Say hello!" description="Start the conversation with a message." />
        ) : (
          sorted.map((m) => {
            const mine = m.data.senderId === myUid;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                    mine
                      ? "rounded-br-md bg-primary text-white"
                      : "rounded-bl-md bg-surface-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.data.text}</p>
                  <p className={cn("mt-1 flex items-center gap-1 text-[11px]", mine ? "text-white/70" : "text-muted-foreground")}>
                    {formatRelative(m.data.createdAt)}
                    {mine ? <CheckCheck className="h-3 w-3" aria-hidden /> : null}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
        />
        <Button type="submit" size="icon" aria-label="Send" loading={sending} disabled={!text.trim()}>
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </Card>
  );
}