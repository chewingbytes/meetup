"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { getWebappUser, upsertWebappUser, getWaitlistStatus } from "./api";
import type { WebappUser } from "./types";

/**
 * Identity = a verified Google account (Supabase Auth) + an Instagram handle.
 * The user's `id` is their Supabase auth user id; their display identity is the
 * IG handle stored in `webapp_users`. This is the anti-spam anchor — you can't
 * mint a new identity by clearing storage.
 *
 * Flow: collect IG handle (held in sessionStorage) → Google OAuth → on return we
 * upsert the profile and resume the pending action (join/create).
 */
interface IdentityContextValue {
  session: Session | null;
  user: WebappUser | null; // present only when signed in AND an IG handle is saved
  ready: boolean;
  isAuthed: boolean;
  hasProfile: boolean;
  isPremium: boolean; // on the launch waitlist → Soonest+ early-member perk
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveInstagram: (handle: string) => Promise<WebappUser>;
  refreshProfile: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

/** Google stores the profile picture in user_metadata (avatar_url / picture). */
function googleAvatar(session: Session | null): string | null {
  const m = session?.user?.user_metadata as Record<string, any> | undefined;
  return m?.avatar_url ?? m?.picture ?? null;
}

/** A raw Google-hosted avatar URL — these get rate-limited (429) when hotlinked,
 *  so the backend re-hosts them. A stored Google URL means it's not cached yet. */
function isGoogleAvatar(url: string | null | undefined): boolean {
  return !!url && /googleusercontent\.com/.test(url);
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<WebappUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const lastFetchedFor = useRef<string | null>(null);

  // Track the Supabase (Google) session.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setAuthChecked(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // When the session's user changes, load (or clear) the IG profile.
  useEffect(() => {
    const uid = session?.user?.id ?? null;
    if (!uid) {
      setUser(null);
      lastFetchedFor.current = null;
      setProfileChecked(true);
      return;
    }
    if (lastFetchedFor.current === uid) return;
    lastFetchedFor.current = uid;
    setProfileChecked(false);
    getWebappUser(uid)
      .then(async (p) => {
        // Backfill / re-host the avatar for profiles created before caching, or
        // whose stored avatar is still a rate-limited raw Google URL.
        if (p && (!p.avatar_url || isGoogleAvatar(p.avatar_url))) {
          const av = googleAvatar(session);
          if (av) {
            const updated = await upsertWebappUser({
              id: uid,
              instagram: p.instagram,
              avatar_url: av,
            }).catch(() => null);
            setUser(updated ?? p);
            return;
          }
        }
        setUser(p);
      })
      .catch(() => setUser(null))
      .finally(() => setProfileChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Premium = the verified Google email is on the launch waitlist. Checked once
  // per signed-in email; cleared on sign-out. Fail-open to non-premium.
  useEffect(() => {
    const email = session?.user?.email ?? null;
    if (!email) {
      setIsPremium(false);
      return;
    }
    let cancelled = false;
    getWaitlistStatus(email)
      .then((r) => !cancelled && setIsPremium(!!r?.premium))
      .catch(() => !cancelled && setIsPremium(false));
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    lastFetchedFor.current = null;
  }, []);

  const saveInstagram = useCallback(
    async (handle: string): Promise<WebappUser> => {
      const uid = session?.user?.id;
      if (!uid) throw new Error("Sign in first");
      const saved = await upsertWebappUser({
        id: uid,
        instagram: handle.trim().replace(/^@/, ""),
        avatar_url: googleAvatar(session),
      });
      setUser(saved);
      return saved;
    },
    [session?.user?.id],
  );

  const refreshProfile = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid) return;
    const p = await getWebappUser(uid).catch(() => null);
    setUser(p);
  }, [session?.user?.id]);

  const value = useMemo<IdentityContextValue>(
    () => ({
      session,
      user,
      ready: authChecked && profileChecked,
      isAuthed: !!session?.user,
      hasProfile: !!user?.instagram,
      isPremium,
      signInWithGoogle,
      signOut,
      saveInstagram,
      refreshProfile,
    }),
    [session, user, authChecked, profileChecked, isPremium, signInWithGoogle, signOut, saveInstagram, refreshProfile],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}
