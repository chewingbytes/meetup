"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, X, Send, MessageSquare, Users, Instagram, Star } from "lucide-react";
import { useIdentity } from "@/lib/webappUser";
import { useChat } from "@/lib/useChat";
import { getCategoryConfig } from "@/lib/categories";
import { grad, authorGradient } from "@/lib/theme";
import { fmtTime } from "@/lib/format";
import { getWebappAvatars } from "@/lib/api";
import { ParticipantsDrawer } from "./ParticipantsDrawer";

const igUrl = (h: string) => `https://instagram.com/${h.replace(/^@/, "")}`;

interface ChatPanelProps {
  channelId: string | null;
  eventName: string;
  category?: string;
  /** Event id — enables the "participants" drawer (report / vote-to-kick). */
  eventId?: string | null;
  /** "page" = full-screen route (back arrow); "popup" = right-side panel (X). */
  mode: "page" | "popup";
  onClose: () => void;
}

/**
 * Reusable chat surface — header + messages + composer. Shared by the
 * /chat/[channelId] route and the in-map right-side popup so they stay identical.
 */
export function ChatPanel({ channelId, eventName, category, eventId, mode, onClose }: ChatPanelProps) {
  const { user } = useIdentity();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const identity = useMemo(
    () => (user ? { id: user.id, username: user.instagram } : null),
    [user],
  );
  const { messages, onlineCount, sendMessage, isLoading, error } = useChat(channelId, identity);

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Resolve sender avatars by user_id (messages only carry id + username).
  // undefined = not fetched yet, null = fetched but no avatar → show initial.
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  // Soonest+ early-member flag per sender id (waitlist members).
  const [premium, setPremium] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const ids = [
      ...new Set(messages.map((m) => m.user_id).filter((id) => id && id !== user?.id)),
    ];
    const missing = ids.filter((id) => !(id in avatars));
    if (missing.length === 0) return;
    let cancelled = false;
    getWebappAvatars(missing)
      .then((map) => {
        if (cancelled) return;
        setAvatars((prev) => {
          const next = { ...prev };
          for (const id of missing) next[id] = map[id]?.avatar_url ?? null;
          return next;
        });
        setPremium((prev) => {
          const next = { ...prev };
          for (const id of missing) next[id] = !!map[id]?.premium;
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [messages, avatars, user?.id]);

  const cat = getCategoryConfig(category);
  const CatIcon = cat.Icon;

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(t);
    setText("");
  };

  const rootClass =
    mode === "page"
      ? "flex h-[100dvh] flex-col bg-canvas"
      : "flex h-[85vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-canvas shadow-clayHero md:h-[calc(100vh-2rem)] md:w-[388px] md:rounded-[28px]";

  return (
    <>
    <div className={rootClass}>
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3 shadow-clayCardSm">
        <button
          onClick={onClose}
          aria-label={mode === "page" ? "Back" : "Close"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-textPrimary transition hover:bg-accentMuted"
        >
          {mode === "page" ? (
            <ChevronLeft size={20} strokeWidth={2.5} />
          ) : (
            <X size={18} strokeWidth={2.5} />
          )}
        </button>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: grad(cat.gradient) }}
        >
          <CatIcon size={16} color="#fff" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-base font-extrabold leading-tight text-textPrimary">
            {eventName}
          </h1>
          <p className="text-xs font-medium text-accentGreen">
            {onlineCount > 0 ? `${onlineCount} online` : "Group chat"}
          </p>
        </div>
        {eventId && (
          <button
            onClick={() => setParticipantsOpen(true)}
            aria-label="Show participants"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-textSecondary transition hover:bg-accentMuted"
          >
            <Users size={18} strokeWidth={2.4} />
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-textTertiary">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accentMuted">
              <MessageSquare size={26} className="text-accent" strokeWidth={2} />
            </div>
            <p className="font-heading font-extrabold text-textPrimary">{eventName}</p>
            <p className="text-sm text-textSecondary">Be the first to say something!</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-1">
            {messages.map((m, i) => {
              const isMe = m.user_id === user?.id;
              const g = authorGradient(m.username ?? "?");
              const prev = messages[i - 1];
              const showAuthor = !isMe && prev?.username !== m.username;
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isMe && (
                    <div className={`relative h-7 w-7 shrink-0 ${showAuthor ? "" : "opacity-0"}`}>
                      <div
                        className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
                        style={{ background: grad(g) }}
                      >
                        {avatars[m.user_id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatars[m.user_id]!}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (m.username ?? "?").charAt(0).toUpperCase()
                        )}
                      </div>
                      {premium[m.user_id] && (
                        <span
                          className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-canvas"
                          style={{ background: grad(["#FBBF24", "#F59E0B"]) }}
                          aria-label="Soonest+ early member"
                          title="Soonest+ early member"
                        >
                          <Star size={8} strokeWidth={3} className="text-white" />
                        </span>
                      )}
                    </div>
                  )}
                  <div className={`flex max-w-[78%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {showAuthor && (
                      <a
                        href={igUrl(m.username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-0.5 ml-1 inline-flex items-center gap-1 text-[11px] font-bold hover:underline"
                        style={{ color: g[1] }}
                      >
                        <Instagram size={11} strokeWidth={2.5} className="shrink-0" />@{m.username}
                      </a>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 ${
                        isMe ? "text-white" : "bg-white text-textPrimary shadow-clayCardSm"
                      }`}
                      style={isMe ? { background: grad(["#A78BFA", "#7C3AED"]) } : undefined}
                    >
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
                        {m.text}
                      </p>
                      <p
                        className={`mt-0.5 text-right text-[10px] ${
                          isMe ? "text-white/70" : "text-textTertiary"
                        }`}
                      >
                        {fmtTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
        {error && <p className="mt-2 text-center text-sm font-medium text-error">{error}</p>}
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2 border-t border-black/5 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-2xl border border-black/5 bg-canvas px-4 py-2.5 text-textPrimary outline-none transition focus:border-accentLight focus:bg-white"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-clayButton transition active:scale-95 disabled:opacity-40"
          style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>

    <ParticipantsDrawer
      eventId={eventId ?? null}
      eventName={eventName}
      open={participantsOpen}
      onClose={() => setParticipantsOpen(false)}
      user={user}
    />
    </>
  );
}
