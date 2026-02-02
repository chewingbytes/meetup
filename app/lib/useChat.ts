import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  username: string;
  text: string;
  created_at: string;
}

export interface OnlineUser {
  id: string;
  username: string;
  status: 'online' | 'away';
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  community_id: string;
  created_at: string;
}

export const useChat = (channelId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!channelId) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (fetchError) throw fetchError;
        setMessages(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [channelId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!channelId) return;

    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId]);

  // Subscribe to presence (online users)
  useEffect(() => {
    if (!channelId || !user) return;

    const presenceChannel = supabase.channel(`presence:${channelId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: user.id },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users: OnlineUser[] = [];

        Object.entries(state).forEach(([, presences]) => {
          if (Array.isArray(presences)) {
            presences.forEach((presence: any) => {
              if (presence.username && presence.id) {
                users.push({
                  id: presence.id,
                  username: presence.username,
                  status: 'online',
                });
              }
            });
          }
        });

        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.username && presence.id) {
            setOnlineUsers((prev) => [
              ...prev,
              { id: presence.id, username: presence.username, status: 'online' },
            ]);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          setOnlineUsers((prev) => prev.filter((u) => u.id !== presence.id));
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await presenceChannel.track({
            id: user.id,
            username: user.user_metadata?.full_name || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [channelId, user]);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!channelId || !user) return;

      try {
        const { error: sendError } = await supabase.from('messages').insert({
          channel_id: channelId,
          user_id: user.id,
          username: user.user_metadata?.full_name || 'Anonymous',
          text,
          created_at: new Date().toISOString(),
        });

        if (sendError) throw sendError;
      } catch (err: any) {
        setError(err.message);
        console.error('Error sending message:', err);
      }
    },
    [channelId, user]
  );

  return {
    messages,
    onlineUsers,
    sendMessage,
    isLoading,
    error,
  };
};
