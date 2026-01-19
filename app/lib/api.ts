// ...new file...
// const API_BASE = "http://localhost:4000/api";
const API_BASE = "http://172.20.10.2:4000/api";
const AUTH_BASE = `${API_BASE}/auth`;

async function request(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const opts: RequestInit = {
    credentials: "include",
    ...options,
  };

  // Don't set content-type for FormData
  if (
    opts.body &&
    !(opts.body instanceof FormData) &&
    (!opts.headers || !(opts.headers as any)["Content-Type"])
  ) {
    opts.headers = {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
    };
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const err = new Error(
      (json && json.message) || res.statusText || "Request failed"
    );
    (err as any).status = res.status;
    (err as any).body = json;
    throw err;
  }
  return json;
}

// Auth helpers (stubs)
export const auth = {
  signIn: (email: string, password: string) =>
    request(`${AUTH_BASE}/signin`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signUp: (email: string, password: string, username?: string) =>
    request(`${AUTH_BASE}/signup`, {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    }),
  signOut: () => request(`${AUTH_BASE}/signout`, { method: "POST" }),
};

// Communities
export const getCommunities = () => request("/communities");
export const getCommunity = (id: string) => request(`/communities/${id}`);
export const createCommunity = (body: any) =>
  // support FormData (image) or JSON
  request("/communities", {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

// Topics
export const getTopics = () => request("/topics");

// Events
export const getEvents = () => request("/events");
export const getEvent = (id: string) => request(`/events/${id}`);
export const createEvent = (body: any) =>
  request("/events", {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

// Notifications
export const getNotifications = () => request("/notifications");
export const markNotificationRead = (id: string) =>
  request(`/notifications/${id}/read`, { method: "POST" });

// Profile
export const getProfile = (id?: string) =>
  request(id ? `/users/${id}` : `/profile`);
export const updateProfile = (body: any) =>
  request("/profile", { method: "PATCH", body: JSON.stringify(body) });

// Friendships (stubs)
export const getFriendRequests = () => request("/friends/requests");
export const respondFriend = (id: string, action: "accept" | "decline") =>
  request(`/friends/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });

export default {
  auth,
  getCommunities,
  getCommunity,
  createCommunity,
  getTopics,
  getEvents,
  getEvent,
  createEvent,
  getNotifications,
  markNotificationRead,
  getProfile,
  updateProfile,
  getFriendRequests,
  respondFriend,
};
