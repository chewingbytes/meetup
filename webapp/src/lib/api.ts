/**
 * Backend API client — talks to the existing Express server. Mirrors the Expo
 * app's lib/api.ts request() helper, plus webapp-specific endpoints
 * (/webapp/*) backed by the separate webapp_users + webapp_event_members tables.
 */
import type {
  EventProps,
  EventDetail,
  WebappUser,
  ChatMessage,
  PendingRequest,
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
  request("/events", { method: "POST", body: JSON.stringify(body) });

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
