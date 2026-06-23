"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { sendWebappMessage } from "./api";
import type { ChatMessage } from "./types";

interface Identity {
  id: string;
  username: string;
}

function mergeById(a: ChatMessage[], b: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  for (const m of a) map.set(m.id, m);
  for (const m of b) map.set(m.id, m);
  return Array.from(map.values()).sort((x, y) =>
    (x.created_at || "").localeCompare(y.created_at || ""),
  );
}

/**
 * Realtime chat for a channel. History + live updates are read directly with the
 * anon Supabase client (RLS on the messages table is disabled). No polling — a
 * one-time fetch seeds the thread and the realtime subscription streams new
 * messages. Sends still go through the backend (input validation), and the
 * realtime echo dedupes against the optimistic append by id.
 * Presence (online count) is pure realtime presence — RLS-independent.
 */
export function useChat(channelId: string | null, identity: Identity | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const identityRef = useRef(identity);
  identityRef.current = identity;

  // One-time history fetch (anon key)
  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;
    setMessages([]);
    setIsLoading(true);

    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("messages")
          .select("*")
          .eq("channel_id", channelId)
          .order("created_at", { ascending: true })
          .limit(200);
        if (err) throw err;
        if (!cancelled) {
          setMessages((data as ChatMessage[]) ?? []);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to load messages");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelId]);

  // Realtime stream (anon key)
  useEffect(() => {
    if (!channelId) return;
    const sub = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => mergeById(prev, [m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [channelId]);

  // Presence (online count) — pure realtime presence, RLS-independent
  useEffect(() => {
    if (!channelId || !identity) return;
    const presence = supabase.channel(`presence:${channelId}`, {
      config: { presence: { key: identity.id } },
    });
    presence
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(presence.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presence.track({
            id: identity.id,
            username: identity.username,
            online_at: new Date().toISOString(),
          });
        }
      });
    return () => {
      supabase.removeChannel(presence);
    };
  }, [channelId, identity?.id, identity?.username]);

  const sendMessage = useCallback(
    async (text: string) => {
      const id = identityRef.current;
      if (!channelId || !id) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      try {
        const msg = await sendWebappMessage({
          channel_id: channelId,
          user_id: id.id,
          username: id.username,
          text: trimmed,
        });
        if (msg?.id) setMessages((prev) => mergeById(prev, [msg]));
      } catch (err: any) {
        setError(err.message ?? "Failed to send");
      }
    },
    [channelId],
  );

  return { messages, onlineCount, sendMessage, isLoading, error };
}
