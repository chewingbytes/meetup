"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  MessageCircle,
  LogOut,
  Loader2,
  Check,
  Clock,
  Instagram,
  Inbox,
  Trash2,
  MapPin,
} from "lucide-react";
import type {
  EventProps,
  EventDetail,
  Participant,
  WebappUser,
  PendingRequest,
  MemberStatus,
} from "@/lib/types";
import { getCategoryConfig, interestEmoji } from "@/lib/categories";
import { grad, authorGradient } from "@/lib/theme";
import { combineEventDateTime, getEventTimeLabel } from "@/lib/format";
import {
  getWebappEvent,
  joinWebappEvent,
  leaveWebappEvent,
  getEventRequests,
  respondToRequest,
  deleteWebappEvent,
} from "@/lib/api";
import { Sheet } from "./Sheet";

interface EventSheetProps {
  event: EventProps | null;
  open: boolean;
  onClose: () => void;
  user: WebappUser | null;
  joined: boolean;
  /** Open the side-by-side JoinModal (used when not signed in). */
  onRequireAuthJoin: (event: EventProps) => void;
  onJoinedChange: (eventId: string, joined: boolean) => void;
  onOpenChat: (event: EventProps) => void;
  /** Organizer deleted the activity — parent drops the pin + closes the sheet. */
  onDeleted: (eventId: string) => void;
}

function igUrl(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function EventSheet({
  event,
  open,
  onClose,
  user,
  joined,
  onRequireAuthJoin,
  onJoinedChange,
  onOpenChat,
  onDeleted,
}: EventSheetProps) {
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newParticipantId, setNewParticipantId] = useState<string | null>(null);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOrganizer = !!user && event?.organizer_id === user.id;

  const refetchDetail = useCallback(
    async (highlightId?: string) => {
      if (!event) return;
      const d = await getWebappEvent(event.id, user?.id).catch(() => null);
      if (d) {
        setDetail(d);
        if (highlightId) setNewParticipantId(highlightId);
      }
    },
    [event, user?.id],
  );

  const refetchRequests = useCallback(async () => {
    if (!event || !user || event.organizer_id !== user.id) return;
    const r = await getEventRequests(event.id, user.id).catch(() => []);
    setRequests(r);
  }, [event, user]);

  useEffect(() => {
    if (!event || !open) return;
    let cancelled = false;
    setDetail(null);
    setRequests([]);
    setNewParticipantId(null);
    setConfirmingDelete(false);
    setDeleting(false);
    setLoading(true);
    getWebappEvent(event.id, user?.id)
      .then((d) => !cancelled && setDetail(d))
      .catch(
        () =>
          !cancelled &&
          setDetail({ ...event, participants: [], my_status: null }),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [event, open, user?.id]);

  useEffect(() => {
    if (open && isOrganizer) refetchRequests();
  }, [open, isOrganizer, refetchRequests]);

  const handleJoin = useCallback(async () => {
    if (!event) return;
    if (!user) {
      onRequireAuthJoin(event); // not signed in → side-by-side modal
      return;
    }
    setJoining(true);
    try {
      const { status } = await joinWebappEvent(user.id, event.id);
      if (status === "approved") onJoinedChange(event.id, true);
      await refetchDetail(user.id);
    } catch (e: any) {
      if (e?.status === 409) await refetchDetail(user.id);
      else alert(e?.message || "Could not join. Please try again.");
    } finally {
      setJoining(false);
    }
  }, [event, user, onRequireAuthJoin, onJoinedChange, refetchDetail]);

  const handleLeave = useCallback(async () => {
    if (!event || !user) return;
    if (!confirm(`Leave "${event.name}"?`)) return;
    setJoining(true);
    try {
      await leaveWebappEvent(user.id, event.id);
      onJoinedChange(event.id, false);
      await refetchDetail();
    } catch (e: any) {
      alert(e?.message || "Could not leave.");
    } finally {
      setJoining(false);
    }
  }, [event, user, onJoinedChange, refetchDetail]);

  const handleDelete = useCallback(async () => {
    if (!event || !user) return;
    setDeleting(true);
    try {
      await deleteWebappEvent(event.id, user.id);
      onDeleted(event.id); // parent drops the pin + closes the sheet
    } catch (e: any) {
      alert(e?.message || "Could not delete activity. Please try again.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }, [event, user, onDeleted]);

  const respond = useCallback(
    async (webapp_user_id: string, action: "accept" | "reject") => {
      if (!event || !user) return;
      setRespondingId(webapp_user_id);
      try {
        await respondToRequest(event.id, {
          host_id: user.id,
          webapp_user_id,
          action,
        });
        await Promise.all([refetchRequests(), refetchDetail()]);
      } catch (e: any) {
        alert(e?.message || "Could not update request.");
      } finally {
        setRespondingId(null);
      }
    },
    [event, user, refetchRequests, refetchDetail],
  );

  if (!event) return null;

  const cat = getCategoryConfig(event.category);
  const CatIcon = cat.Icon;
  const { day, countdown } = getEventTimeLabel(
    combineEventDateTime(event.startDate, event.startTime, event.startAnytime),
  );
  const organizer = event.organizer_username || "Someone";
  const participants: Participant[] = detail?.participants ?? [];
  const myStatus: MemberStatus | null =
    detail?.my_status ?? (joined ? "approved" : null);
  const canChat = isOrganizer || myStatus === "approved";

  return (
    <Sheet open={open} onClose={onClose} variant="responsive">
      <div className="relative max-h-[86vh] overflow-y-auto no-scrollbar rounded-t-[28px] bg-white px-6 pb-8 pt-5 shadow-clayHero md:max-h-[calc(100vh-2rem)] md:rounded-[28px]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-black/10 md:hidden" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-textSecondary transition hover:bg-accentMuted"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        {/* Category badge */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: grad(cat.gradient) }}
          >
            <MapPin size={20} color="#fff" strokeWidth={2} />
          </div>
          {event.require_approval && (
            <span className="rounded-full bg-amberMuted px-3 py-1 text-xs font-bold text-accentAmber">
              Host approval required
            </span>
          )}
        </div>

        {/* Headline */}
        <p className="flex items-center gap-1 truncate text-sm font-medium text-textTertiary">
          {event.organizer_username && (
            <Instagram
              size={12}
              strokeWidth={2.5}
              className="shrink-0 text-accent"
            />
          )}
          <span className="truncate">
            <a
              href={igUrl(event.organizer_username ? `@${organizer}` : organizer)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent"
            >
              {event.organizer_username ? `@${organizer}` : organizer}
            </a>{" "}
            wants to
          </span>
        </p>
        <h2 className="font-heading text-2xl font-extrabold leading-tight text-textPrimary">
          {event.name}
        </h2>
        {(day || countdown) && (
          <p className="mt-1.5 text-sm font-semibold text-accent">
            {day}
            {countdown ? ` · ${countdown}` : ""}
          </p>
        )}
        {event.location_text && (
          <p className="mt-1 truncate text-sm text-textSecondary">
            📍 {event.location_text}
          </p>
        )}
        {event.description && (
          <p className="mt-2 text-sm leading-relaxed text-textSecondary">
            {event.description}
          </p>
        )}

        {/* Roster */}
        <div className="mt-5">
          <p className="text-sm font-bold text-textPrimary">
            {participants.length > 0
              ? `${participants.length} ${participants.length === 1 ? "person" : "people"} going`
              : "Be the first to join!"}
          </p>
          {participants.length > 0 && (
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
              {participants.map((p, i) => {
                const isNew = (p.id ?? "") === newParticipantId;
                const handle = p.instagram || null;
                const g = authorGradient(handle ?? p.id ?? String(i));
                const mainInterest = p.main_interest ?? null;
                const Tile = handle ? "a" : "div";
                return (
                  <Tile
                    key={p.id ?? i}
                    {...(handle
                      ? {
                          href: igUrl(handle),
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : {})}
                    className={`flex w-16 shrink-0 flex-col items-center ${isNew ? "animate-pop-in" : ""}`}
                  >
                    <div className="relative">
                      <div
                        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full"
                        style={{ background: grad(g) }}
                      >
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.avatar_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-heading text-lg font-extrabold text-white">
                            {(handle ?? "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {mainInterest && (
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white text-xs shadow">
                          {interestEmoji(mainInterest)}
                        </span>
                      )}
                    </div>
                    <span className="mt-1 flex w-full items-center justify-center gap-0.5 text-center text-xs font-semibold text-accent">
                      {handle ? (
                        <>
                          <Instagram
                            size={10}
                            strokeWidth={2.5}
                            className="shrink-0"
                          />
                          <span className="truncate">@{handle}</span>
                        </>
                      ) : (
                        "guest"
                      )}
                    </span>
                  </Tile>
                );
              })}
            </div>
          )}
        </div>

        {/* Organizer dashboard — pending requests */}
        {isOrganizer && (
          <div className="mt-6 rounded-2xl border border-black/5 bg-canvas p-4">
            <div className="mb-2 flex items-center gap-2">
              <Inbox size={16} className="text-accent" strokeWidth={2.5} />
              <span className="text-sm font-bold text-textPrimary">
                Requests{requests.length > 0 ? ` (${requests.length})` : ""}
              </span>
            </div>
            {requests.length === 0 ? (
              <p className="text-sm text-textTertiary">No pending requests.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map((r) => (
                  <li
                    key={r.webapp_user_id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-clayCardSm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
                        style={{
                          background: grad(
                            authorGradient(r.instagram ?? r.webapp_user_id),
                          ),
                        }}
                      >
                        {r.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.avatar_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-white">
                            {(r.instagram ?? "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {r.instagram ? (
                        <a
                          href={igUrl(r.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 truncate text-sm font-bold text-accent hover:underline"
                        >
                          <Instagram size={14} strokeWidth={2.5} /> @
                          {r.instagram}
                        </a>
                      ) : (
                        <span className="text-sm text-textTertiary">guest</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {respondingId === r.webapp_user_id ? (
                        <Loader2 size={16} className="spin text-textTertiary" />
                      ) : (
                        <>
                          <button
                            onClick={() => respond(r.webapp_user_id, "accept")}
                            className="rounded-lg bg-greenMuted px-3 py-1.5 text-xs font-bold text-accentGreen transition hover:brightness-95"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => respond(r.webapp_user_id, "reject")}
                            className="rounded-lg bg-canvas px-3 py-1.5 text-xs font-bold text-textSecondary transition hover:bg-red-50 hover:text-error"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-6">
          {isOrganizer ? (
            confirmingDelete ? (
              <div className="rounded-2xl border border-error/30 bg-red-50 p-4">
                <p className="text-sm font-bold text-error">
                  Delete this activity?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-textSecondary">
                  This permanently removes the activity, its map pin, and chat
                  for everyone. This can&apos;t be undone.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-white py-2.5 text-sm font-bold text-textSecondary shadow-clayCardSm transition hover:bg-canvas disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                    style={{ background: grad(["#F87171", "#EF4444"]) }}
                  >
                    {deleting ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Trash2 size={16} strokeWidth={2.5} />
                    )}
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => onOpenChat(event)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-clayButton transition active:scale-[0.98]"
                  style={{ background: grad(["#34D399", "#10B981"]) }}
                >
                  <MessageCircle size={18} strokeWidth={2.5} /> Open Chat
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  aria-label="Delete activity"
                  className="flex w-14 items-center justify-center rounded-2xl bg-canvas text-textSecondary transition hover:bg-red-50 hover:text-error"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </div>
            )
          ) : myStatus === "approved" ? (
            <div className="flex gap-3">
              <button
                onClick={() => onOpenChat(event)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-clayButton transition active:scale-[0.98]"
                style={{ background: grad(["#34D399", "#10B981"]) }}
              >
                <MessageCircle size={18} strokeWidth={2.5} /> Go to Chat
              </button>
              <button
                onClick={handleLeave}
                disabled={joining}
                aria-label="Leave activity"
                className="flex w-14 items-center justify-center rounded-2xl bg-canvas text-textSecondary transition hover:bg-red-50 hover:text-error disabled:opacity-60"
              >
                {joining ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <LogOut size={18} strokeWidth={2.5} />
                )}
              </button>
            </div>
          ) : myStatus === "kicked" ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-canvas py-3.5 font-bold text-textTertiary">
              <X size={18} strokeWidth={2.5} /> You were removed from this
              activity
            </div>
          ) : myStatus === "pending" ? (
            <div className="flex gap-3">
              <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amberMuted py-3.5 font-bold text-accentAmber">
                <Clock size={18} strokeWidth={2.5} /> Awaiting host approval
              </div>
              <button
                onClick={handleLeave}
                disabled={joining}
                aria-label="Cancel request"
                className="flex w-14 items-center justify-center rounded-2xl bg-canvas text-textSecondary transition hover:bg-red-50 hover:text-error disabled:opacity-60"
              >
                {joining ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <X size={18} strokeWidth={2.5} />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining || loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-clayButton transition active:scale-[0.98] disabled:opacity-70"
              style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
            >
              {joining ? (
                <>
                  <Loader2 size={18} className="spin" /> Joining…
                </>
              ) : (
                <>
                  <Check size={18} strokeWidth={2.5} />{" "}
                  {event.require_approval ? "Request to Join" : "Join Activity"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
