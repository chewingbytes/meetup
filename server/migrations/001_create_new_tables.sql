-- Testimonials table for events and communities
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT at_least_one_ref CHECK ((event_id IS NOT NULL) OR (community_id IS NOT NULL))
);

-- Event templates for quick event creation
CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 120,
  default_capacity INT DEFAULT 50,
  color VARCHAR(7) DEFAULT '#FF8FA3',
  icon VARCHAR(50) DEFAULT 'calendar',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sub-communities
CREATE TABLE IF NOT EXISTS subcommunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User interests with ranking (ordered preference)
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_name VARCHAR(100) NOT NULL,
  ranking INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, interest_name)
);

-- No-show tracking for banning system
CREATE TABLE IF NOT EXISTS no_show_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP DEFAULT NOW(),
  ban_until TIMESTAMP
);

-- Event attendee invitations (for bring a friend)
CREATE TABLE IF NOT EXISTS event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, invitee_id)
);

-- Indexes for performance
CREATE INDEX idx_testimonials_user ON testimonials(user_id);
CREATE INDEX idx_testimonials_event ON testimonials(event_id);
CREATE INDEX idx_testimonials_community ON testimonials(community_id);
CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_no_show_records_user ON no_show_records(user_id);
CREATE INDEX idx_event_invitations_event ON event_invitations(event_id);
CREATE INDEX idx_event_invitations_invitee ON event_invitations(invitee_id);
