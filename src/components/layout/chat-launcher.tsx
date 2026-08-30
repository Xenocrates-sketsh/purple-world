import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useChatUnread } from "@/hooks/useChatUnread";
import { cn } from "@/lib/cn";

/**
 * Messenger-style floating chat button, shown across the portal. One tap
 * opens the user's Messages page and a badge shows how many conversations
 * have unread messages. Hidden while on a chat screen so it never covers the
 * composer or duplicates the active Messages tab.
 */
export function ChatLauncher({ onChatRoute }: { onChatRoute: boolean }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const { unreadCount } = useChatUnread(user?.uid ?? "");

  if (!user || !role || onChatRoute) return null;

  const dest = role === "teacher" ? "/teacher/chat" : "/student/chat";

  return (
    <button
      type="button"
      onClick={() => navigate(dest)}
      aria-label={unreadCount > 0 ? `Open messages (${unreadCount} unread)` : "Open messages"}
      className={cn(
        "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
        "bottom-24 right-4 lg:bottom-6 lg:right-6"
      )}
    >
      <MessageSquare className="h-6 w-6" aria-hidden />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white ring-2 ring-background">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}