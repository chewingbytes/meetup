"use client";

import { X, MessageSquare } from "lucide-react";
import type { EventProps } from "@/lib/types";
import { grad } from "@/lib/theme";
import { Sheet } from "./Sheet";

interface ChatsDrawerProps {
  events: EventProps[];
  unread?: Record<string, number>;
  activeId?: string | null;
  open: boolean;
  onClose: () => void;
  onOpen: (event: EventProps) => void;
}

/**
 * Mobile chats list — a right-side drawer of the activities you've joined or
 * organized, opened from the top-bar chats icon. On desktop the floating rail
 * is used instead, so this is the small-screen replacement for it.
 */
export function ChatsDrawer({ events, unread, activeId, open, onClose, onOpen }: ChatsDrawerProps) {
  return (
    <Sheet open={open} onClose={onClose} variant="right" widthClass="w-[86vw] max-w-[360px]">
      <div className="flex h-full flex-col bg-canvas">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3.5 shadow-clayCardSm">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
          >
            <MessageSquare size={16} color="#fff" strokeWidth={2.4} />
          </div>
          <h2 className="min-w-0 flex-1 truncate font-heading text-base font-extrabold text-textPrimary">
            Chats
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-textSecondary transition hover:bg-accentMuted"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
          {events.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-textTertiary">
              <MessageSquare size={26} strokeWidth={1.8} />
              <p className="text-sm font-semibold">No chats yet.</p>
              <p className="text-xs">Join or drop an activity to start one.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {events.map((event) => {
                const initial = (event.organizer_username ?? event.name ?? "?")
                  .charAt(0)
                  .toUpperCase();
                const photo = event.organizer_photo_url ?? event.organizer_avatar_url ?? null;
                const count = unread?.[event.id] ?? 0;
                const active = activeId === event.id;
                return (
                  <li key={event.id}>
                    <button
                      onClick={() => onOpen(event)}
                      className={`flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-clayCardSm transition active:scale-[0.98] ${
                        active ? "ring-2 ring-accentGreen" : ""
                      }`}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
                        style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
                      >
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-heading text-sm font-extrabold text-white">{initial}</span>
                        )}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-textPrimary">
                        {event.name}
                      </span>
                      {count > 0 && (
                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5">
                          <span className="font-heading text-[11px] font-extrabold leading-none text-white">
                            {count > 9 ? "9+" : count}
                          </span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  );
}
