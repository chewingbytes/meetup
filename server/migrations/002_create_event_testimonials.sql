-- Create event_testimonials table
CREATE TABLE IF NOT EXISTS event_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one testimonial per user per event
  UNIQUE(event_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_event_testimonials_event_id ON event_testimonials(event_id);
CREATE INDEX idx_event_testimonials_user_id ON event_testimonials(user_id);
CREATE INDEX idx_event_testimonials_created_at ON event_testimonials(created_at DESC);

-- Add constraint to ensure testimonials can only be created after event ends
-- This will be enforced in the application layer since PostgreSQL doesn't support
-- cross-table CHECK constraints easily

COMMENT ON TABLE event_testimonials IS 'User testimonials/reviews for events they attended';
COMMENT ON COLUMN event_testimonials.rating IS 'Rating from 1-5 stars';
COMMENT ON COLUMN event_testimonials.text IS 'Written testimonial text';
