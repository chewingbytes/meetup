# Chat System Database Setup

Run these SQL queries in your Supabase dashboard to set up the chat system.

## 1. Create Messages Table

```sql
-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read all messages
CREATE POLICY "Users can read messages" ON messages
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Users can insert their own messages
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## 2. Create Channels Table

```sql
-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  community_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_channels_community_id ON channels(community_id);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read all channels
CREATE POLICY "Users can read channels" ON channels
  FOR SELECT
  TO authenticated
  USING (true);
```

## 3. Enable Real-time for Messages

Go to Supabase Dashboard:
1. Navigate to **Database** → **Replication**
2. Toggle **messages** table to enable real-time

Or use SQL:
```sql
-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

## 4. Create Default #general Channel

```sql
-- Insert general channel for each community
-- You'll need to get your community IDs first:
-- SELECT id, name FROM communities;

-- Example (replace with your actual community ID):
INSERT INTO channels (name, description, community_id) 
VALUES ('general', 'General discussion', 'YOUR_COMMUNITY_ID')
ON CONFLICT DO NOTHING;
```

## Quick Setup Script (All at once)

```sql
-- 1. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  community_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_channels_community_id ON channels(community_id);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read channels" ON channels FOR SELECT TO authenticated USING (true);

-- 3. Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

## Testing the Chat

1. **Create a test message manually** (or via the app):
```sql
INSERT INTO messages (channel_id, user_id, username, text)
VALUES (
  'your_community_id',
  (SELECT id FROM auth.users LIMIT 1),
  'Test User',
  'Hello, chat!'
);
```

2. **Query messages**:
```sql
SELECT * FROM messages 
WHERE channel_id = 'your_community_id' 
ORDER BY created_at DESC 
LIMIT 10;
```

3. **Monitor real-time updates**: Open the chat drawer in the app and messages should appear instantly

## Troubleshooting

### Messages not appearing
- Check that real-time is enabled for `messages` table
- Verify RLS policies allow authenticated users to read/write
- Check browser console for Supabase errors

### Presence (online users) not working
- Ensure supabase client is properly configured
- Check that user is authenticated before opening chat

### Can't send messages
- Verify user is authenticated
- Check that `user_id` matches `auth.uid()`
- Ensure user has insert permission via RLS policy

## Schema Diagram

```
communities (existing table)
    ↓ (one-to-many)
channels
    ↓ (one-to-many)
messages
    └─ references auth.users (user_id)
```

## Next Steps

1. Run the SQL setup queries in Supabase
2. Test sending a message via the app
3. Verify real-time updates work
4. Add more channels if needed
5. Consider adding typing indicators (advanced)
6. Consider adding message reactions (advanced)
