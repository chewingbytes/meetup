"use client";

import type { EventProps } from "@/lib/types";
import { grad } from "@/lib/theme";

interface JoinedRailProps {
  events: EventProps[];
  activeId?: string | null;
  /** Unread message count per event id — renders a badge on each pill. */
  unread?: Record<string, number>;
  onOpen: (event: EventProps) => void;
}

/**
 * Vertical rail of the activities you've joined, shown on the right under the
 * profile photo. Each row is a compact pill: organizer avatar + the activity's
 * (truncated) name + an unread badge. Tapping opens its chat popup. Pills read
 * far better than bare icons on phones, and the badge lives inside the pill so
 * it's never clipped by the scroll container.
 */
export function JoinedRail({ events, activeId, unread, onOpen }: JoinedRailProps) {
  if (events.length === 0) return null;

  return (
    <div className="pointer-events-auto flex max-h-[calc(100dvh-180px)] flex-col items-stretch gap-2 overflow-y-auto overflow-x-visible no-scrollbar p-1">
      {events.map((event) => (
        <RailPill
          key={event.id}
          event={event}
          active={activeId === event.id}
          unread={unread?.[event.id] ?? 0}
          onClick={() => onOpen(event)}
        />
      ))}
    </div>
  );
}

function RailPill({
  event,
  active,
  unread,
  onClick,
}: {
  event: EventProps;
  active: boolean;
  unread: number;
  onClick: () => void;
}) {
  const initial = (event.organizer_username ?? event.name ?? "?").charAt(0).toUpperCase();
  const photo = event.organizer_photo_url ?? event.organizer_avatar_url ?? null;

  return (
    <button
      onClick={onClick}
      aria-label={`Open chat for ${event.name}`}
      className={`group flex w-[44vw] max-w-[220px] items-center gap-2 rounded-full bg-white/95 py-1.5 pl-1.5 pr-3 shadow-clayCardSm backdrop-blur transition active:scale-[0.97] ${
        active ? "ring-2 ring-accentGreen" : "ring-1 ring-black/5"
      }`}
    >
      {/* Organizer avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <span className="font-heading text-xs font-extrabold text-white">{initial}</span>
        )}
      </div>

      {/* Truncated activity title */}
      <span className="min-w-0 flex-1 truncate text-left text-sm font-bold text-textPrimary">
        {event.name}
      </span>

      {/* Unread message badge */}
      {unread > 0 && (
        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5">
          <span className="font-heading text-[11px] font-extrabold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        </span>
      )}
    </button>
  );
}
