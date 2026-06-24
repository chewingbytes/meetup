"use client";

import { useState } from "react";
import {
  Instagram,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useIdentity } from "@/lib/webappUser";
import { setPending, type PendingAction } from "@/lib/pending";
import { grad } from "@/lib/theme";

interface AuthStepsProps {
  /** What to resume after Google sign-in completes. */
  action: PendingAction;
  /** Shown above step 1 for context. */
  intro?: string;
}

function cleanHandle(v: string) {
  return v.trim().replace(/^@+/, "").replace(/\s+/g, "");
}

/**
 * Two-step gateway used wherever participation needs an account:
 *   1. Enter Instagram handle  →  Next
 *   2. Sign in with Google     →  (stores the pending intent, then redirects)
 * After the OAuth redirect, the app reads the pending intent and finishes the job.
 */
export function AuthSteps({ action, intro }: AuthStepsProps) {
  const { signInWithGoogle } = useIdentity();
  const [step, setStep] = useState<1 | 2>(1);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    const h = cleanHandle(handle);
    if (h.length < 1 || h.length > 30) {
      setError("Enter your Instagram handle to continue.");
      return;
    }

    if (h.length < 1 || h.length > 30) {
      setError("Enter a valid Instagram handle (1-30 characters).");
      return;
    }

    // 2. Check for allowed characters (letters, numbers, periods, underscores)
    // Instagram usernames are also lowercase-only in practice for validation.
    const instagramRegex = /^[a-zA-Z0-9._]+$/;

    if (!instagramRegex.test(h)) {
      setError(
        "Handles can only contain letters, numbers, periods, and underscores.",
      );
      return;
    }

    // Optional: Instagram also bans consecutive periods (e.g., "user..name")
    // and cannot start or end with a period.
    if (h.startsWith(".") || h.endsWith(".") || h.includes("..")) {
      setError("Handles cannot start, end, or have consecutive periods.");
      return;
    }
    setError(null);
    setHandle(h);
    setStep(2);
  };

  const signIn = async () => {
    setError(null);
    setBusy(true);
    try {
      setPending({ instagram: cleanHandle(handle), action });
      await signInWithGoogle(); // redirects away
    } catch (e: any) {
      setError(e?.message || "Sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full transition ${
              step >= s ? "bg-accent" : "bg-black/10"
            }`}
          />
        ))}
      </div>

      {step === 1 ? (
        <>
          {intro && (
            <p className="text-sm leading-relaxed text-textSecondary">
              {intro}
            </p>
          )}
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-textTertiary">
              <Instagram size={13} strokeWidth={2.5} /> Instagram handle
            </span>
            <div className="flex items-center rounded-2xl border border-black/5 bg-canvas px-4 transition focus-within:border-accentLight focus-within:bg-white">
              <span className="text-textTertiary">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="yourhandle"
                autoFocus
                className="w-full bg-transparent py-3 pl-1 text-textPrimary outline-none"
              />
            </div>
          </label>
          {error && <p className="text-sm font-medium text-error">{error}</p>}
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-clayButton transition active:scale-[0.98]"
            style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
          >
            Next <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-2xl bg-accentMuted/60 p-3">
            <ShieldCheck
              size={16}
              className="mt-0.5 shrink-0 text-accent"
              strokeWidth={2.5}
            />
            <p className="text-xs leading-relaxed text-textSecondary">
              One quick verification keeps the map free of spam and bots. We
              only use it to confirm you&apos;re a real person. Your handle{" "}
              <span className="inline-flex items-center gap-0.5 align-middle font-bold text-accent">
                <Instagram size={12} strokeWidth={2.5} className="shrink-0" />@
                {cleanHandle(handle)}
              </span>{" "}
              is what others see.
            </p>
          </div>
          {error && <p className="text-sm font-medium text-error">{error}</p>}
          <button
            onClick={signIn}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-3.5 font-bold text-textPrimary transition hover:bg-canvas disabled:opacity-60"
          >
            {busy ? <Loader2 size={18} className="spin" /> : <GoogleIcon />}
            Sign in with Google
          </button>
          <button
            onClick={() => setStep(1)}
            className="flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-textTertiary transition hover:text-textSecondary"
          >
            <ArrowLeft size={14} strokeWidth={2.5} /> Change handle
          </button>
        </>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 4.7 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 4.7 29.4 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.3 0 10.1-1.8 13.6-4.9l-6.3-5.2c-2 1.4-4.6 2.3-7.3 2.3-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 40.6 16.2 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.3 5.2C41.4 35.9 45 30.5 45 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
