// ...new file...
// const API_BASE = "http://localhost:4000/api";
// const API_BASE = "http://172.20.10.4:4000/api";
const API_BASE = "http://192.168.1.122:4000/api";
// const API_BASE = "http://172.20.10.4:4000/api";
const AUTH_BASE = `${API_BASE}/auth`;

async function request(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const opts: RequestInit = {
    credentials: "include",
    ...options,
  };

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
      (json && json.message) || res.statusText || "Request failed",
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
  signUp: (
    email: string,
    password: string,
    username: string,
    avatarUrl: string | null,
    bio: string,
    selectedInterests: string[],
  ) =>
    request(`${AUTH_BASE}/signup`, {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        username,
        image_url: avatarUrl,
        bio,
        interests: selectedInterests,
      }),
    }),
  signOut: () => request(`${AUTH_BASE}/signout`, { method: "POST" }),
};

// Communities
export const getCommunities = () => request("/communities");
export const getMyCommunities = (user_id: string) =>
  request(`/communities/my-communities?user_id=${user_id}`);
export const getCommunity = (id: string) => request(`/communities/${id}`);
export const createCommunity = (body: any) =>
  // support FormData (image) or JSON
  request("/communities", {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
export const joinCommunity = (user_id: string, community_id: string) =>
  request("/communities/join", {
    method: "POST",
    body: JSON.stringify({ user_id, community_id }),
  });
export const leaveCommunity = (user_id: string, community_id: string) =>
  request("/communities/leave", {
    method: "POST",
    body: JSON.stringify({ user_id, community_id }),
  });
export const checkMembership = (user_id: string, community_id: string) =>
  request(
    `/communities/check-membership?user_id=${user_id}&community_id=${community_id}`,
  );

// Topics
export const getTopics = () => request("/topics");
export const getCommunitiesByTopic = (topicId: number) =>
  request(`/topics/${topicId}/communities`);

// Events
export const getEvents = () => request("/events");
export const getMyEvents = (user_id: string) =>
  request(`/events/my-events?user_id=${user_id}`);
export const getEvent = (id: string) => request(`/events/${id}`);
export const createEvent = (body: any) =>
  request("/events", {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const joinEvent = (user_id: string, event_id: string) =>
  request("/events/join", {
    method: "POST",
    body: JSON.stringify({ user_id, event_id }),
  });
export const leaveEvent = (user_id: string, event_id: string) =>
  request("/events/leave", {
    method: "POST",
    body: JSON.stringify({ user_id, event_id }),
  });
export const checkEventMembership = (user_id: string, event_id: string) =>
  request(`/events/check-membership?user_id=${user_id}&event_id=${event_id}`);

// Notifications
export const getNotifications = () => request("/notifications");
export const markNotificationRead = (id: string) =>
  request(`/notifications/${id}/read`, { method: "POST" });

// Push Tokens
export const savePushToken = (body: any) =>
  request("/push-tokens", {
    method: "POST",
    body: JSON.stringify(body),
  });

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

// Testimonials
export const getTestimonials = (event_id?: string, community_id?: string) =>
  request(
    `/testimonials?${event_id ? `event_id=${event_id}` : `community_id=${community_id}`}`,
  );
export const getUserTestimonials = (user_id: string) =>
  request(`/testimonials/user/${user_id}`);
export const createTestimonial = (body: any) =>
  request("/event-testimonials", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateTestimonial = (id: string, body: any) =>
  request(`/testimonials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const deleteTestimonial = (id: string) =>
  request(`/testimonials/${id}`, { method: "DELETE" });

// Event Templates
export const getEventTemplates = (community_id: string) =>
  request(`/event-templates/community/${community_id}`);
export const createEventTemplate = (body: any) =>
  request("/event-templates", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateEventTemplate = (id: string, body: any) =>
  request(`/event-templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const deleteEventTemplate = (id: string) =>
  request(`/event-templates/${id}`, { method: "DELETE" });

// Subcommunities
export const getSubcommunities = (community_id: string) =>
  request(`/subcommunities/community/${community_id}`);
export const createSubcommunity = (body: any) =>
  request("/subcommunities", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateSubcommunity = (id: string, body: any) =>
  request(`/subcommunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const deleteSubcommunity = (id: string) =>
  request(`/subcommunities/${id}`, { method: "DELETE" });

// Interests
export const saveUserInterests = (user_id: string, interests: string[]) =>
  request("/interests", {
    method: "POST",
    body: JSON.stringify({ user_id, interests }),
  });
export const getUserInterests = (user_id: string) =>
  request(`/interests/user/${user_id}`);
export const calculateInterestMatch = (user_id: string, event_id: string) =>
  request("/interests/match-score", {
    method: "POST",
    body: JSON.stringify({ user_id, event_id }),
  });

// Event Testimonials
export const getEventTestimonials = (event_id: string) =>
  request(`/event-testimonials/event/${event_id}`);
export const getUserEventTestimonials = (user_id: string) =>
  request(`/event-testimonials/user/${user_id}`);
export const createEventTestimonial = (body: any) =>
  request("/event-testimonials", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateEventTestimonial = (id: string, body: any) =>
  request(`/event-testimonials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const deleteEventTestimonial = (id: string) =>
  request(`/event-testimonials/${id}`, { method: "DELETE" });
export const getEventTestimonialStats = (event_id: string) =>
  request(`/event-testimonials/event/${event_id}/stats`);

// Invitations
export const sendEventInvitation = (
  event_id: string,
  inviter_id: string,
  invitee_id: string,
) =>
  request("/invitations/send", {
    method: "POST",
    body: JSON.stringify({ event_id, inviter_id, invitee_id }),
  });
export const getPendingInvitations = (user_id: string) =>
  request(`/invitations/pending/${user_id}`);
export const acceptInvitation = (invitation_id: string, user_id: string) =>
  request(`/invitations/accept/${invitation_id}`, {
    method: "POST",
    body: JSON.stringify({ user_id }),
  });
export const declineInvitation = (invitation_id: string) =>
  request(`/invitations/decline/${invitation_id}`, { method: "POST" });

export default {
  auth,
  getCommunities,
  getMyCommunities,
  getCommunity,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  checkMembership,
  getTopics,
  getEvents,
  getMyEvents,
  getEvent,
  joinEvent,
  leaveEvent,
  checkEventMembership,
  createEvent,
  getNotifications,
  markNotificationRead,
  getProfile,
  updateProfile,
  getFriendRequests,
  respondFriend,
  getTestimonials,
  getUserTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getEventTemplates,
  createEventTemplate,
  updateEventTemplate,
  deleteEventTemplate,
  getSubcommunities,
  createSubcommunity,
  updateSubcommunity,
  deleteSubcommunity,
  saveUserInterests,
  getUserInterests,
  calculateInterestMatch,
  sendEventInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
};
