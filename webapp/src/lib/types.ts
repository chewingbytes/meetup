// Shared types — kept in sync with the Expo app + server contracts.

export interface EventProps {
  id: string;
  name: string;
  startDate?: string | null;
  startTime?: string | null;
  startAnytime?: boolean;
  end_at?: string | null;
  location_text?: string;
  location_lat?: number;
  location_lng?: number;
  location_instructions?: string;
  cover_image?: string | null;
  description?: string;
  capacity?: number | null;
  require_approval?: boolean;
  visibility?: "public" | "private";
  organizer_id?: string | null;
  category?: string | null;
  // Enriched by GET /events
  organizer_username?: string | null;
  organizer_avatar_url?: string | null;
  organizer_photo_url?: string | null;
  // Attached by GET /webapp/my-activities (for the rail's chat ordering/badges)
  channel_id?: string | null;
  last_message_at?: string | null;
  // Total approved attendees (native + webapp) — powers the map pin's count badge.
  going_count?: number;
  created_at?: string;
  [key: string]: any;
}

export type MemberStatus = "approved" | "pending" | "rejected" | "kicked";

export interface Participant {
  id: string;
  // Identity is the Instagram handle (no display names anymore).
  instagram: string | null;
  avatar_url: string | null;
  main_interest?: string | null;
  source?: "app" | "webapp";
  status?: MemberStatus;
  /** On the launch waitlist → shows the Soonest+ early-member badge. */
  premium?: boolean;
}

export interface EventDetail extends EventProps {
  participants: Participant[];
  /** The requesting webapp user's membership status for this event. */
  my_status?: MemberStatus | null;
  /** True when anyone can join freely (not private, no approval) — enables
   *  vote-to-kick. Private/approval-gated events are organizer-moderated. */
  is_public?: boolean;
  /** Distinct vote-to-kick counts per member id (public activities only). */
  kick_votes?: Record<string, number>;
  /** Member ids the requesting user has already voted to kick. */
  my_kick_votes?: string[];
}

/** A pending join request, surfaced in the organizer dashboard. */
export interface PendingRequest {
  webapp_user_id: string;
  instagram: string | null;
  avatar_url?: string | null;
  joined_at: string;
}

/**
 * A webapp identity — now anchored to a verified Google account (id = Supabase
 * auth user id). Identity is solely the Instagram handle. This is the anti-spam
 * anchor: clearing localStorage can't mint a fresh identity anymore.
 */
export interface WebappUser {
  id: string; // Supabase auth user id (Google)
  instagram: string;
  avatar_url?: string | null; // pulled from the Google account on sign-in
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  username: string; // the Instagram handle
  text: string;
  created_at: string;
}
