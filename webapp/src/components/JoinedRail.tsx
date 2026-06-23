"use client";

import type { EventProps } from "@/lib/types";
import { getCategoryConfig } from "@/lib/categories";
import { grad } from "@/lib/theme";

interface JoinedRailProps {
  events: EventProps[];
  activeId?: string | null;
  /** Unread message count per event id — renders a badge on each icon. */
  unread?: Record<string, number>;
  onOpen: (event: EventProps) => void;
}

/**
 * Vertical rail of the activities you've joined, shown on the right under the
 * profile photo. Each icon mirrors the map pin (category gradient + icon +
 * organizer avatar). Hover reveals the activity name; click opens its chat
 * popup on the right.
 */
export function JoinedRail({ events, activeId, unread, onOpen }: JoinedRailProps) {
  if (events.length === 0) return null;

  return (
    <div className="pointer-events-auto flex max-h-[calc(100dvh-180px)] flex-col items-end gap-2.5 overflow-y-auto no-scrollbar pr-0.5">
      {events.map((event) => (
        <MiniPin
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

function MiniPin({
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
  const cat = getCategoryConfig(event.category);
  const CatIcon = cat.Icon;
  const initial = (event.organizer_username ?? "?").charAt(0).toUpperCase();
  const photo = event.organizer_photo_url ?? event.organizer_avatar_url ?? null;

  return (
    <button
      onClick={onClick}
      className="group relative flex items-center justify-center"
      aria-label={`Open chat for ${event.name}`}
    >
      {/* Tooltip (to the left, since the rail hugs the right edge) */}
      <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-textPrimary opacity-0 shadow-clayCard transition-opacity duration-150 group-hover:opacity-100 sm:block">
        {event.name}
      </span>

      <div className="relative h-11 w-11 transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[14px] shadow-clayCardSm ring-2 transition ${
            active ? "ring-accentGreen" : "ring-white/50"
          }`}
          style={{ background: grad(cat.gradient) }}
        >
          <CatIcon size={20} color="#fff" strokeWidth={2.4} />
        </div>
        {/* Organizer avatar badge */}
        <div className="absolute -bottom-1 -right-1 flex h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full border-2 border-white bg-accent shadow">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <span className="font-heading text-[9px] font-extrabold text-white">{initial}</span>
          )}
        </div>

        {/* Unread message badge */}
        {unread > 0 && (
          <div className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 shadow">
            <span className="font-heading text-[10px] font-extrabold leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
