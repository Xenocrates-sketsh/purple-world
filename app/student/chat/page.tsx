"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageRow } from "@/lib/types";

interface ChatData {
  teacher: {
    profileId: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  messages: MessageRow[];
}

export default function StudentChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = React.useState<ChatData>({ teacher: null, messages: [] });
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<{ teacher: ChatData["teacher"] }>("/api/student/chat");
      const messages = await api.get<MessageRow[]>("/api/student/chat/messages");
      setData({ teacher: res.teacher, messages });
    } catch {
      if (!silent) setData({ teacher: null, messages: [] });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const t = setInterval(() => load(true), 8000);
    return () => clearInterval(t);
  }, [load]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [data.messages.length]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await api.post("/api/student/chat/messages", { content });
      setDraft("");
      await load(true);
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not send message." });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title="Messages" description="Chat with your teacher." />
      {loading ? (
        <div className="flex justify-center p-14">
          <Spinner />
        </div>
      ) : !data.teacher ? (
        <EmptyState
          icon={Send}
          title="Your teacher is not available yet"
          description="Once your teacher activates their account, you'll be able to message them here."
        />
      ) : (
        <Card className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Avatar name={data.teacher.fullName} src={data.teacher.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{data.teacher.fullName}</p>
              <p className="text-xs text-muted-foreground">Your teacher</p>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin">
            {data.messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Say hello to {data.teacher.fullName}!
                </p>
              </div>
            )}
            {data.messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                      mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-surface-muted text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-right text-[10px]",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <form
            className="flex items-end gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Type a message…"
              className="min-h-10 flex-1 resize-none rounded-xl border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              aria-label="Message"
            />
            <Button type="submit" size="md" loading={sending} aria-label="Send">
              <Send className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
