// Pending intent persisted across the Google OAuth redirect. The IG handle is
// collected before sign-in; after the redirect we resume the action.

export type PendingAction =
  | { type: "join"; eventId: string }
  | { type: "create"; form: Record<string, any> }
  | { type: "profile" };

export interface PendingIntent {
  instagram: string;
  action: PendingAction;
}

const KEY = "soonest_pending_v1";

export function setPending(p: PendingIntent) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* sessionStorage unavailable (private mode) */
  }
}

export function getPending(): PendingIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingIntent) : null;
  } catch {
    return null;
  }
}

export function clearPending() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// ── Create-form draft (so an in-progress form survives reloads) ──────────────
const FORM_KEY = "soonest_create_form_v1";

export function saveCreateDraft(form: Record<string, any>) {
  try {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(form));
  } catch {
    /* ignore */
  }
}

export function readCreateDraft(): Record<string, any> | null {
  try {
    const raw = sessionStorage.getItem(FORM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCreateDraft() {
  try {
    sessionStorage.removeItem(FORM_KEY);
  } catch {
    /* ignore */
  }
}
