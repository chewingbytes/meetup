"use client";

import { useState } from "react";
import { X, LogOut, Instagram, Sparkles, Loader2, Plus, Star, Shield } from "lucide-react";
import { Sheet } from "./Sheet";
import { AuthSteps } from "./AuthSteps";
import { AdminPanel } from "./AdminPanel";
import { useIdentity } from "@/lib/webappUser";
import { grad, authorGradient } from "@/lib/theme";

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  onlineCount: number;
  /** Refresh the map pins after an admin edits/deletes an activity. */
  onEventsChanged?: () => void;
}

const igUrl = (h: string) => `https://instagram.com/${h.replace(/^@/, "")}`;

export function ProfileDrawer({ open, onClose, onlineCount, onEventsChanged }: ProfileDrawerProps) {
  const { user, isAuthed, hasProfile, isPremium, isAdmin, saveInstagram, signOut } = useIdentity();
  const g = authorGradient(user?.instagram ?? user?.id ?? "guest");
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <>
    <Sheet open={open} onClose={onClose} variant="right" widthClass="w-[88vw] max-w-[380px]">
      <div className="flex h-full flex-col bg-white shadow-clayHero">
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <h2 className="font-heading text-xl font-extrabold text-textPrimary">Your profile</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-textSecondary transition hover:bg-accentMuted"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
          {user ? (
            <>
              {/* Signed in with a saved handle */}
              <div className="mb-6 flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full"
                  style={{ background: grad(g) }}
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-heading text-2xl font-extrabold text-white">
                      {user.instagram.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <a
                    href={igUrl(user.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-heading text-lg font-extrabold text-accent hover:underline"
                  >
                    <Instagram size={18} strokeWidth={2.5} /> @{user.instagram}
                  </a>
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-greenMuted px-2.5 py-1">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accentGreen" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accentGreen" />
                    </span>
                    <span className="text-xs font-bold text-accentGreen">
                      {onlineCount} online now
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-5 flex items-start gap-2 rounded-2xl bg-accentMuted/60 p-3 shadow-md">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.5} />
                <p className="text-xs leading-relaxed text-textSecondary">
                  You&apos;re verified with Google. Your Instagram handle is shown to people in
                  activities you join.
                </p>
              </div>

              {/* Soonest+ early-member perk — only for waitlist members */}
              {isPremium && (
                <div className="mb-5 rounded-2xl shadow-md bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full shadow-clayCardSm ring-2 ring-white"
                      style={{ background: grad(["#FBBF24", "#F59E0B"]) }}
                    >
                      <Star size={13} strokeWidth={3.5} className="text-white" />
                    </span>
                    <span className="font-heading text-sm font-extrabold text-amber-700">
                      Early member · Soonest+
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-900/80">
                    Thank you for being part of Soonest this early. <br />
                    You&apos;re entitled to <strong>3 months of Soonest+ premium</strong>{" "}
                    free after the app launches. 🎉
                  </p>
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => setAdminOpen(true)}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-clayButton transition active:scale-[0.98]"
                  style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
                >
                  <Shield size={15} strokeWidth={2.6} /> Admin controls
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm("Sign out of this device?")) {
                    signOut();
                    onClose();
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-textTertiary transition hover:bg-red-50 hover:text-error"
              >
                <LogOut size={15} strokeWidth={2.5} /> Sign out
              </button>
            </>
          ) : isAuthed && !hasProfile ? (
            <SetHandle onSave={saveInstagram} onDone={onClose} />
          ) : (
            <>
              <p className="mb-4 text-sm leading-relaxed text-textSecondary">
                Set up your profile to join and host activities.
              </p>
              <AuthSteps action={{ type: "profile" }} />
            </>
          )}
        </div>
      </div>
    </Sheet>

    {isAdmin && (
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} onEventsChanged={onEventsChanged} />
    )}
    </>
  );
}

/** Signed in via Google but no handle saved yet (rare edge) — just ask the handle. */
function SetHandle({
  onSave,
  onDone,
}: {
  onSave: (handle: string) => Promise<unknown>;
  onDone: () => void;
}) {
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const h = handle.trim().replace(/^@+/, "");
    if (h.length < 2) return setError("Enter your Instagram handle.");
    setError(null);
    setBusy(true);
    try {
      await onSave(h);
      onDone();
    } catch (e: any) {
      if (e?.status === 409 || e?.body?.code === "ig_taken") {
        setError(e?.body?.message || "That Instagram handle is already in use.");
      } else {
        setError("Couldn't save. Please try again.");
      }
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-textSecondary">Almost there — add your Instagram handle.</p>
      <div className="flex items-center rounded-2xl border border-black/5 bg-canvas px-4 focus-within:border-accentLight focus-within:bg-white">
        <span className="text-textTertiary">@</span>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="yourhandle"
          autoFocus
          className="w-full bg-transparent py-3 pl-1 text-textPrimary outline-none"
        />
      </div>
      {error && <p className="text-sm font-medium text-error">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-clayButton transition active:scale-[0.98] disabled:opacity-70"
        style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
      >
        {busy ? <Loader2 size={18} className="spin" /> : null}
        Save handle
      </button>
    </div>
  );
}
