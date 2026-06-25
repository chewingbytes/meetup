/**
 * Backend API client — talks to the existing Express server. Mirrors the Expo
 * app's lib/api.ts request() helper, plus webapp-specific endpoints
 * (/webapp/*) backed by the separate webapp_users + webapp_event_members tables.
 */
import { supabase } from "./supabase";
import type {
  EventProps,
  EventDetail,
  WebappUser,
  ChatMessage,
  PendingRequest,
  MemberStatus,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://server.hangoutstudios.com/api";

const DEFAULT_TIMEOUT_MS = 12000;

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const opts: RequestInit = { signal: controller.signal, ...options };
  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  }

  // Attach the Supabase (Google) access token so the backend can verify who's
  // calling instead of trusting ids in the body. Anonymous visitors have no
  // session — public endpoints still work; protected ones return 401.
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) opts.headers = { ...(opts.headers || {}), Authorization: `Bearer ${token}` };
  } catch {
    /* no session available — proceed unauthenticated */
  }

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    if (!res.ok) {
      const err = new Error((json && json.message) || res.statusText || "Request failed");
      (err as any).status = res.status;
      (err as any).body = json;
      throw err;
    }
    return json as T;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      const e = new Error("Request timed out. Check your connection and try again.");
      (e as any).status = 408;
      throw e;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Events ───────────────────────────────────────────────────────────────────
// Map feed: upcoming activities only (webapp endpoint — higher limit so freshly
// created events always appear, and ended-day events are excluded).
export const getEvents = (): Promise<EventProps[]> => request("/webapp/events");

/** The signed-in user's activities (organized + approved-joined) — powers the
 *  right-side rail, including past ones so their chat stays reachable. */
export const getMyActivities = (webappUserId: string): Promise<EventProps[]> =>
  request(`/webapp/my-activities?webapp_user_id=${encodeURIComponent(webappUserId)}`);

export const createEvent = (body: any): Promise<EventProps> =>
  request("/webapp/events", { method: "POST", body: JSON.stringify(body) });

/** Organizer deletes their own activity (removes the map pin + its chat). */
export const deleteWebappEvent = (
  eventId: string,
  hostId: string,
): Promise<{ success: true }> =>
  request(
    `/webapp/events/${encodeURIComponent(eventId)}?host_id=${encodeURIComponent(hostId)}`,
    { method: "DELETE" },
  );

/** Unread message counts (+ latest message time) per channel, since the caller's
 *  last-read marks. Powers the rail's badges and recent-activity ordering. */
export const getRailUnread = (
  webappUserId: string,
  reads: Record<string, string | null>,
): Promise<Record<string, { unread: number; last_message_at: string | null }>> =>
  request("/webapp/rail-unread", {
    method: "POST",
    body: JSON.stringify({ webapp_user_id: webappUserId, reads }),
  });

// ── Webapp endpoints (Google-anchored identities, separate tables) ───────────

/** Upsert the webapp profile (id = Supabase auth uid; identity = IG handle). */
export const upsertWebappUser = (user: {
  id: string;
  instagram: string;
  avatar_url?: string | null;
}): Promise<WebappUser> =>
  request("/webapp/users", { method: "POST", body: JSON.stringify(user) });

/** Whether this Google account's email is on the launch waitlist — unlocks the
 *  Soonest+ early-member badge + 3-months-free perk. Matched by email. */
export const getWaitlistStatus = (email: string): Promise<{ premium: boolean }> =>
  request(`/webapp/waitlist-status?email=${encodeURIComponent(email)}`);

/** Fetch a webapp profile by auth uid (null if none yet). */
export const getWebappUser = async (id: string): Promise<WebappUser | null> => {
  try {
    return await request(`/webapp/users/${encodeURIComponent(id)}`);
  } catch (e: any) {
    if (e?.status === 404) return null;
    throw e;
  }
};

export const getWebappEvent = async (
  id: string,
  webappUserId?: string,
): Promise<EventDetail> => {
  const q = webappUserId ? `?webapp_user_id=${encodeURIComponent(webappUserId)}` : "";
  try {
    return await request(`/webapp/events/${id}${q}`);
  } catch (e: any) {
    if (e?.status === 404) return request(`/events/${id}`); // rollout fallback
    throw e;
  }
};

/** Join — returns the resulting membership status ('approved' or 'pending'). */
export const joinWebappEvent = (
  webapp_user_id: string,
  event_id: string,
): Promise<{ status: "approved" | "pending" }> =>
  request("/webapp/events/join", {
    method: "POST",
    body: JSON.stringify({ webapp_user_id, event_id }),
  });

export const leaveWebappEvent = (webapp_user_id: string, event_id: string) =>
  request("/webapp/events/leave", {
    method: "POST",
    body: JSON.stringify({ webapp_user_id, event_id }),
  });

/** Approved event IDs this user has joined (for pin highlighting + rail). */
export const getWebappJoinedEventIds = (webappUserId: string): Promise<string[]> =>
  request(`/webapp/events/joined?webapp_user_id=${encodeURIComponent(webappUserId)}`);

// ── Organizer dashboard (pending approval requests) ──────────────────────────
export const getEventRequests = (
  eventId: string,
  hostId: string,
): Promise<PendingRequest[]> =>
  request(
    `/webapp/events/${eventId}/requests?host_id=${encodeURIComponent(hostId)}`,
  );

export const respondToRequest = (
  eventId: string,
  body: { host_id: string; webapp_user_id: string; action: "accept" | "reject" },
) =>
  request(`/webapp/events/${eventId}/requests/respond`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Resolve the chat channel id for an event (created server-side on event creation). */
export const getEventChannel = (eventId: string): Promise<{ channel_id: string | null }> =>
  request(`/webapp/events/${eventId}/channel`);

// ── Chat (proxied via backend service role; messages RLS blocks the anon role) ─
export const getWebappMessages = (channelId: string, limit = 100): Promise<ChatMessage[]> =>
  request(`/webapp/messages?channel_id=${encodeURIComponent(channelId)}&limit=${limit}`);

export const sendWebappMessage = (body: {
  channel_id: string;
  user_id: string;
  username: string;
  text: string;
}): Promise<ChatMessage> =>
  request("/webapp/messages", { method: "POST", body: JSON.stringify(body) });

/** Resolve avatars (+ IG handle) for a set of user ids — used to render avatars
 *  next to chat messages, which only carry user_id + username. */
export const getWebappAvatars = (
  ids: string[],
): Promise<Record<string, { instagram: string | null; avatar_url: string | null; premium?: boolean }>> =>
  ids.length === 0
    ? Promise.resolve({})
    : request("/webapp/avatars", { method: "POST", body: JSON.stringify({ ids }) });

// ── Moderation: report / vote-to-kick / organizer remove ─────────────────────

/** File a report against a user (multiple reports per user are allowed). */
export const reportUser = (
  eventId: string,
  body: { reporter_id: string; reportee_id: string; reason: string },
): Promise<{ success: true }> =>
  request(`/webapp/events/${encodeURIComponent(eventId)}/report`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Report an activity itself (scam, inappropriate, unsafe…). Filed against the
 *  organizer with the event for context — reuses the reports table server-side. */
export const reportEvent = (
  eventId: string,
  body: { reason: string },
): Promise<{ success: true }> =>
  request(`/webapp/events/${encodeURIComponent(eventId)}/report-activity`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Cast a vote to kick a member out of a public activity. Returns the running
 *  tally and whether that vote crossed the >50% threshold (target removed). */
export const voteKick = (
  eventId: string,
  body: { voter_id: string; target_id: string },
): Promise<{ votes: number; participants: number; kicked: boolean }> =>
  request(`/webapp/events/${encodeURIComponent(eventId)}/kick-vote`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Organizer removes a participant (private / approval-gated activities). */
export const removeParticipant = (
  eventId: string,
  body: { host_id: string; webapp_user_id: string },
): Promise<{ success: true }> =>
  request(`/webapp/events/${encodeURIComponent(eventId)}/remove`, {
    method: "POST",
    body: JSON.stringify(body),
  });

// ── Admin (banhammer) — every call is authorised server-side by requireAdmin ──
// (verified email on the ADMIN_EMAILS allowlist). 403 for non-admins.

export interface AdminUser {
  id: string;
  instagram: string;
  avatar_url: string | null;
  banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  created_at: string | null;
  email: string | null;
}

export interface AdminMember {
  id: string;
  source: "webapp" | "app";
  status: MemberStatus;
  instagram: string | null;
  avatar_url: string | null;
}

export interface AdminReport {
  id: string;
  event_id: string | null;
  reporter_id: string;
  reportee_id: string;
  reason: string;
  created_at: string;
  reporter_instagram: string | null;
  reportee_instagram: string | null;
  event_name: string | null;
}

/** Confirm the signed-in account is an admin (resolves true / false; never throws). */
export const adminCheck = async (): Promise<boolean> => {
  try {
    const r = await request<{ admin?: boolean }>("/webapp/admin/check");
    return !!r?.admin;
  } catch {
    return false;
  }
};

export const adminSearchUsers = (q: string): Promise<AdminUser[]> =>
  request(`/webapp/admin/users?q=${encodeURIComponent(q)}`);

export const adminUpdateUser = (
  id: string,
  body: { instagram?: string; avatar_url?: string | null },
): Promise<AdminUser> =>
  request(`/webapp/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const adminBanUser = (
  id: string,
  reason?: string,
): Promise<{ success: true }> =>
  request(`/webapp/admin/users/${encodeURIComponent(id)}/ban`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? null }),
  });

export const adminUnbanUser = (id: string): Promise<{ success: true }> =>
  request(`/webapp/admin/users/${encodeURIComponent(id)}/unban`, { method: "POST" });

export const adminSearchEvents = (q: string): Promise<EventProps[]> =>
  request(`/webapp/admin/events?q=${encodeURIComponent(q)}`);

export const adminUpdateEvent = (
  id: string,
  body: Record<string, any>,
): Promise<EventProps> =>
  request(`/webapp/admin/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const adminDeleteEvent = (id: string): Promise<{ success: true }> =>
  request(`/webapp/admin/events/${encodeURIComponent(id)}`, { method: "DELETE" });

export const adminEventMembers = (id: string): Promise<AdminMember[]> =>
  request(`/webapp/admin/events/${encodeURIComponent(id)}/members`);

export const adminRemoveMember = (
  id: string,
  body: { user_id: string; source: "webapp" | "app" },
): Promise<{ success: true }> =>
  request(`/webapp/admin/events/${encodeURIComponent(id)}/remove-member`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const adminListReports = (): Promise<AdminReport[]> =>
  request("/webapp/admin/reports");

/** Email the launch waitlist. While the server is in test mode this only sends
 *  to the admin's own inbox (but still reports the real waitlist size). */
export const adminBroadcast = (
  body?: { subject?: string; html?: string },
): Promise<{ success: true; test_mode: boolean; waitlist_count: number; sent: number; failed: number }> =>
  request("/webapp/admin/broadcast", { method: "POST", body: JSON.stringify(body ?? {}) });
