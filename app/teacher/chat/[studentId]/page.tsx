"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
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

interface Thread {
  student: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    studentNo: string;
  };
  messages: MessageRow[];
}

export default function TeacherChatThreadPage() {
  const params = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = React.useState<Thread | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const load = React.useCallback(
    async (silent = false) => {
      if (!params.studentId) return;
      if (!silent) setLoading(true);
      try {
        const data = await api.get<Thread>(`/api/teacher/chat/${params.studentId}`);
        setThread(data);
      } catch {
        if (!silent) setThread(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [params.studentId]
  );

  React.useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await api.post(`/api/teacher/chat/${params.studentId}`, { content });
      setDraft("");
      await load(true);
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not send message." });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href="/teacher/chat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar name={thread?.student.fullName ?? "Student"} src={thread?.student.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {thread?.student.fullName ?? "…"}
          </p>
          {thread?.student.studentNo && (
            <p className="text-xs text-muted-foreground">{thread.student.studentNo}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : !thread ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState icon={ArrowLeft} title="Conversation not available" />
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin">
            {thread.messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No messages yet — say hello to {thread.student.fullName}.
                </p>
              </div>
            )}
            {thread.messages.map((m) => {
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
        </>
      )}
    </Card>
  );
}
