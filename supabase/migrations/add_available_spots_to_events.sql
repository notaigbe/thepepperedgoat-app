
-- Add available_spots column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS available_spots INTEGER NOT NULL DEFAULT 0;

-- Set available_spots to capacity for existing events
UPDATE events SET available_spots = capacity WHERE available_spots = 0;

-- Create a unique constraint to prevent duplicate RSVPs
CREATE UNIQUE INDEX IF NOT EXISTS event_rsvps_user_event_unique ON event_rsvps(user_id, event_id);
