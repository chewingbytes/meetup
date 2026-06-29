"use client";

import { X, Instagram, MapPin } from "lucide-react";
import { Sheet } from "./Sheet";
import { AuthSteps } from "./AuthSteps";
import { getCategoryConfig } from "@/lib/categories";
import { grad } from "@/lib/theme";
import { combineEventDateTime, getEventTimeLabel } from "@/lib/format";
import type { EventProps } from "@/lib/types";

interface JoinModalProps {
  event: EventProps | null;
  open: boolean;
  onClose: () => void;
}

function igUrl(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

/**
 * Unauthenticated join — a side-by-side card: the event summary on the left and
 * the 2-step (Instagram → Google) registration on the right. Stacks on mobile.
 * After Google sign-in, the pending join is resumed automatically.
 */
export function JoinModal({ event, open, onClose }: JoinModalProps) {
  if (!event) return null;

  const cat = getCategoryConfig(event.category);
  const CatIcon = cat.Icon;
  const { day, countdown } = getEventTimeLabel(
    combineEventDateTime(event.startDate, event.startTime, event.startAnytime),
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      variant="center"
      widthClass="max-w-3xl"
    >
      <div className="relative overflow-hidden rounded-[28px] bg-white shadow-clayHero">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-textSecondary shadow-clayCardSm backdrop-blur transition hover:bg-accentMuted"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Event summary */}
          <div className="flex flex-col gap-4 px-7 pt-7 text-white">
            {/* <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <MapPin size={24} color="#fff" strokeWidth={2.2} />
            </div> */}
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-white">
                {event.organizer_username && (
                  <Instagram
                    size={12}
                    strokeWidth={2.5}
                    className="shrink-0 text-accent"
                  />
                )}
                <span className="truncate text-black">
                  <a
                    href={igUrl(event.organizer_username as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent"
                  >
                    <span className="text-accent">
                      {event.organizer_username
                        ? `@${event.organizer_username}`
                        : "Someone"}{" "}
                    </span>
                    wants to
                  </a>
                </span>
              </p>
              <h2 className="text-black font-heading text-3xl font-extrabold leading-tight">
                {event.name}
              </h2>
            </div>
            {/* {(day || countdown) && (
              <p className="text-sm font-semibold text-accent">
                {day}
                {countdown ? ` · ${countdown}` : ""}
              </p>
            )}
            {event.location_text && (
              <p className="text-sm text-black/80">📍 {event.location_text}</p>
            )}
            {event.require_approval && (
              <span className="mt-1 w-fit rounded-full bg-black/20 px-3 py-1 text-xs font-bold">
                Host approval required
              </span>
            )}
            {event.description && (
              <p className="mt-1 text-sm leading-relaxed text-black/80 line-clamp-4">
                {event.description}
              </p>
            )} */}
          </div>

          {/* Registration */}
          <div className="px-7 pb-7 pt-4">
            <h3 className="mb-1 font-heading text-lg font-extrabold text-textPrimary">
              Join this activity
            </h3>
            <AuthSteps
              action={{ type: "join", eventId: event.id }}
              intro="No account needed beyond a quick verify. Add your Instagram so the group knows who's coming."
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
}
