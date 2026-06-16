import { ElementType } from "react";

export interface TopicProps {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

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
  is_paid?: boolean;
  price?: number;
  description?: string;
  capacity?: number | null;
  require_approval?: boolean;
  visibility?: "public" | "private";
  community_id?: string | null;
  organizer_id?: string | null;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CommunityProps {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  profile_image?: string | number | null;
  profileImage?: string | number | null;
  privacy_mode?: boolean;
  owner_id?: string | null;
  topics?: string[];
  rules?: string[];
  faq?: FaqItem[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string | null;
  photo_urls?: string[] | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  interests?: string[] | string | null;
  school?: string | null;
  year_of_study?: string | null;
  personality_type?: string | null;
  personality_answers?: any;
  social_preference?: string | null;
  verified?: string | null;
  // pivot fields
  occupation?: string | null;
  location?: string | null;
  date_of_birth?: string | null;
  prompt_key?: string | null;
  prompt_answer?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id?: string | null;
  type: "event" | "community" | "friend" | "system";
  title?: string;
  message?: string;
  ref_event?: string | null;
  ref_community?: string | null;
  ref_user?: string | null;
  is_read?: boolean;
  created_at?: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  created_at?: string;
  updated_at?: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: "requested" | "approved" | "rejected" | "cancelled";
  price_paid?: number;
  requested_at?: string;
  updated_at?: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: "member" | "admin" | "owner";
  status?: string;
  joined_at?: string;
}

export interface HeaderAction {
  icon: ElementType;
  onPress?: () => void;
  link?: string;
}

export interface HeaderProps {
  title: string;
  actions: HeaderAction[];
}
