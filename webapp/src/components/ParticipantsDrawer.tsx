"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Users,
  MoreVertical,
  Flag,
  UserX,
  Gavel,
  Loader2,
  Check,
  Instagram,
  ShieldAlert,
  Star,
} from "lucide-react";
import type { EventDetail, Participant, WebappUser } from "@/lib/types";
import { grad, authorGradient } from "@/lib/theme";
import { getWebappEvent, reportUser, voteKick, removeParticipant } from "@/lib/api";
import { Sheet } from "./Sheet";

interface ParticipantsDrawerProps {
  eventId: string | null;
  eventName: string;
  open: boolean;
  onClose: () => void;
  user: WebappUser | null;
}

function igUrl(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

const REPORT_REASONS = [
  "Harassment or bullying",
  "Spam or scam",
  "Inappropriate content",
  "Safety concern",
  "Other",
];

/**
 * Right-side drawer listing an activity's participants, opened from the chat
 * header. Each row has a kebab menu with moderation actions:
 *  • Report — files a report (any signed-in member).
 *  • Vote to kick — public activities only; > 50% of members removes the target.
 *  • Remove — private/approval-gated activities; organizer-only.
 */
export function ParticipantsDrawer({
  eventId,
  eventName,
  open,
  onClose,
  user,
}: ParticipantsDrawerProps) {
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Report modal
  const [reportTarget, setReportTarget] = useState<Participant | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportText, setReportText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const me = user?.id ?? null;

  const refetch = useCallback(async () => {
    if (!eventId) return;
    const d = await getWebappEvent(eventId, me ?? undefined).catch(() => null);
    if (d) setDetail(d);
  }, [eventId, me]);

  useEffect(() => {
    if (!open || !eventId) return;
    let cancelled = false;
    setDetail(null);
    setOpenMenuId(null);
    setLoading(true);
    getWebappEvent(eventId, me ?? undefined)
      .then((d) => !cancelled && setDetail(d))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, eventId, me]);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const participants: Participant[] = detail?.participants ?? [];
  const organizerId = detail?.organizer_id ?? null;
  const isOrganizer = !!me && organizerId === me;
  const isPublic = !!detail?.is_public;
  const kickVotes = detail?.kick_votes ?? {};
  const myKickVotes = new Set(detail?.my_kick_votes ?? []);

  // Vote-to-kick denominator = approved webapp members (matches the server).
  const webappMembers = participants.filter((p) => p.source === "webapp");
  const kickBase = webappMembers.length;
  const threshold = Math.floor(kickBase / 2) + 1; // > 50%
  const viewerIsMember = !!me && webappMembers.some((p) => p.id === me);

  const onVote = useCallback(
    async (target: Participant) => {
      if (!me || !eventId) return;
      setVotingId(target.id);
      try {
        const r = await voteKick(eventId, { voter_id: me, target_id: target.id });
        setToast(
          r.kicked
            ? `@${target.instagram ?? "member"} was removed by majority vote.`
            : `Vote counted — ${r.votes}/${Math.floor(r.participants / 2) + 1} to remove.`,
        );
        await refetch();
      } catch (e: any) {
        setToast(e?.message || "Couldn't record your vote.");
      } finally {
        setVotingId(null);
        setOpenMenuId(null);
      }
    },
    [me, eventId, refetch],
  );

  const onRemove = useCallback(
    async (target: Participant) => {
      if (!me || !eventId) return;
      if (
        !confirm(
          `Remove @${target.instagram ?? "this participant"} from "${eventName}"? They won't be able to rejoin.`,
        )
      )
        return;
      setRemovingId(target.id);
      try {
        await removeParticipant(eventId, { host_id: me, webapp_user_id: target.id });
        setToast(`@${target.instagram ?? "participant"} removed.`);
        await refetch();
      } catch (e: any) {
        setToast(e?.message || "Couldn't remove participant.");
      } finally {
        setRemovingId(null);
        setOpenMenuId(null);
      }
    },
    [me, eventId, eventName, refetch],
  );

  const submitReport = useCallback(async () => {
    if (!me || !eventId || !reportTarget) return;
    const reason = [reportReason, reportText.trim()].filter(Boolean).join(" — ");
    if (!reason) return;
    setSubmitting(true);
    try {
      await reportUser(eventId, {
        reporter_id: me,
        reportee_id: reportTarget.id,
        reason,
      });
      setReportTarget(null);
      setReportReason("");
      setReportText("");
      setToast("Report submitted. Thanks for keeping Soonest safe.");
    } catch (e: any) {
      setToast(e?.message || "Couldn't submit report.");
    } finally {
      setSubmitting(false);
    }
  }, [me, eventId, reportTarget, reportReason, reportText]);

  if (!eventId) return null;

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        variant="right"
        widthClass="w-[86vw] max-w-[380px]"
        zClass="z-[1100]"
      >
        <div className="relative flex h-full flex-col bg-canvas">
          {/* Header */}
          <header className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3.5 shadow-clayCardSm">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
            >
              <Users size={16} color="#fff" strokeWidth={2.4} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-heading text-base font-extrabold leading-tight text-textPrimary">
                Participants
              </h2>
              <p className="truncate text-xs font-medium text-textTertiary">
                {participants.length} {participants.length === 1 ? "person" : "people"} ·{" "}
                {isPublic ? "Vote to kick enabled" : "Organizer-moderated"}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-textSecondary transition hover:bg-accentMuted"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </header>

          {/* Toast */}
          {toast && (
            <div className="mx-4 mt-3 flex items-start gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-clayCardSm ring-1 ring-accent/15">
              <ShieldAlert size={15} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.4} />
              <p className="text-sm font-semibold text-textPrimary">{toast}</p>
            </div>
          )}

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
            {loading ? (
              <div className="flex h-full items-center justify-center text-textTertiary">
                <Loader2 size={20} className="spin" />
              </div>
            ) : participants.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-textTertiary">
                <Users size={26} strokeWidth={1.8} />
                <p className="text-sm font-semibold">No one here yet.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {participants.map((p) => {
                  const handle = p.instagram || null;
                  const g = authorGradient(handle ?? p.id);
                  const isSelf = p.id === me;
                  const isThemOrganizer = p.id === organizerId;
                  const votes = kickVotes[p.id] ?? 0;
                  const iVoted = myKickVotes.has(p.id);
                  const menuOpen = openMenuId === p.id;

                  const canReport = !!me && !isSelf;
                  // The organizer can remove anyone directly — in public AND
                  // private/approval-gated activities.
                  const canRemove =
                    isOrganizer && !isSelf && !isThemOrganizer && p.source === "webapp";
                  // Vote-to-kick stays a public-activity tool for non-organizer
                  // members (the organizer removes directly instead of voting).
                  const canVote =
                    isPublic && !isOrganizer && viewerIsMember && !isSelf && !isThemOrganizer && p.source === "webapp";
                  const hasMenu = canReport || canVote || canRemove;
                  const busy = votingId === p.id || removingId === p.id;

                  return (
                    <li
                      key={p.id}
                      className="rounded-2xl bg-white px-3 py-2.5 shadow-clayCardSm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0">
                          <div
                            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
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
                              <span className="font-heading text-sm font-extrabold text-white">
                                {(handle ?? "?").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {p.premium && (
                            <span
                              className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-2 ring-white"
                              style={{ background: grad(["#FBBF24", "#F59E0B"]) }}
                              aria-label="Soonest+ early member"
                              title="Soonest+ early member"
                            >
                              <Star size={10} strokeWidth={3} className="text-white" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {handle ? (
                              <a
                                href={igUrl(handle)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-accent hover:underline"
                              >
                                <Instagram size={13} strokeWidth={2.5} className="shrink-0" />
                                <span className="truncate">@{handle}</span>
                              </a>
                            ) : (
                              <span className="truncate text-sm font-bold text-textSecondary">guest</span>
                            )}
                            {isThemOrganizer && (
                              <span className="shrink-0 rounded-full bg-accentMuted px-2 py-0.5 text-[10px] font-bold text-accent">
                                Host
                              </span>
                            )}
                            {isSelf && (
                              <span className="shrink-0 text-[11px] font-semibold text-textTertiary">
                                you
                              </span>
                            )}
                          </div>
                          {canVote && votes > 0 && (
                            <p className="mt-0.5 text-[11px] font-semibold text-accentAmber">
                              {votes}/{threshold} votes to remove
                            </p>
                          )}
                        </div>

                        {hasMenu && (
                          <button
                            onClick={() => setOpenMenuId(menuOpen ? null : p.id)}
                            aria-label="Member actions"
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                              menuOpen ? "bg-accentMuted text-accent" : "text-textTertiary hover:bg-canvas"
                            }`}
                          >
                            {busy ? <Loader2 size={16} className="spin" /> : <MoreVertical size={18} strokeWidth={2.2} />}
                          </button>
                        )}
                      </div>

                      {/* Inline action menu */}
                      {menuOpen && hasMenu && (
                        <div className="mt-2.5 flex flex-col gap-1.5 border-t border-black/5 pt-2.5">
                          {canReport && (
                            <button
                              onClick={() => {
                                setReportTarget(p);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2 text-left text-sm font-bold text-textSecondary transition hover:bg-red-50 hover:text-error"
                            >
                              <Flag size={15} strokeWidth={2.4} /> Report @{handle ?? "user"}
                            </button>
                          )}
                          {canVote && (
                            <button
                              onClick={() => onVote(p)}
                              disabled={iVoted || busy}
                              className="flex items-center gap-2.5 rounded-xl bg-amberMuted px-3 py-2 text-left text-sm font-bold text-accentAmber transition hover:brightness-95 disabled:opacity-60"
                            >
                              <Gavel size={15} strokeWidth={2.4} />
                              {iVoted ? `Voted to kick (${votes}/${threshold})` : `Vote to kick (${votes}/${threshold})`}
                            </button>
                          )}
                          {canRemove && (
                            <button
                              onClick={() => onRemove(p)}
                              disabled={busy}
                              className="flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2 text-left text-sm font-bold text-error transition hover:bg-red-50 disabled:opacity-60"
                            >
                              <UserX size={15} strokeWidth={2.4} /> Remove from activity
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Sheet>

      {/* Report modal */}
      <Sheet
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        variant="center"
        widthClass="max-w-sm"
        zClass="z-[1200]"
      >
        <div className="rounded-[28px] bg-white p-6 shadow-clayHero">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
              <Flag size={18} className="text-error" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-extrabold text-textPrimary">Report user</h3>
              {reportTarget?.instagram && (
                <p className="flex items-center gap-1 truncate text-xs font-semibold text-accent">
                  <Instagram size={12} strokeWidth={2.5} /> @{reportTarget.instagram}
                </p>
              )}
            </div>
          </div>
          <p className="mb-3 mt-2 text-sm text-textSecondary">
            Reports are private and help us keep Soonest safe. What's wrong?
          </p>

          <div className="flex flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReportReason(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  reportReason === r
                    ? "bg-accent text-white shadow-clayButton"
                    : "bg-canvas text-textSecondary hover:bg-accentMuted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Add details (optional)…"
            rows={3}
            className="mt-3 w-full resize-none rounded-2xl border border-black/5 bg-canvas px-4 py-3 text-sm text-textPrimary outline-none transition focus:border-accentLight focus:bg-white"
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setReportTarget(null)}
              className="flex-1 rounded-2xl bg-canvas py-3 font-bold text-textSecondary transition hover:bg-accentMuted"
            >
              Cancel
            </button>
            <button
              onClick={submitReport}
              disabled={submitting || !reportReason}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white shadow-clayButton transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: grad(["#F87171", "#EF4444"]) }}
            >
              {submitting ? <Loader2 size={16} className="spin" /> : <Check size={16} strokeWidth={2.6} />}
              Submit
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
