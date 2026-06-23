"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import type { EventProps } from "./types";

function lsKey(uid: string): string {
  return `soonest:lastread:${uid}`;
}
function loadReads(uid: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(lsKey(uid)) || "{}");
  } catch {
    return {};
  }
}
function saveReads(uid: string, reads: Record<string, string>) {
  try {
    localStorage.setItem(lsKey(uid), JSON.stringify(reads));
  } catch {
    /* ignore */
  }
}

/**
 * Drives the right-side rail's realtime behaviour:
 *  - orders activities so the chat with the newest message floats to the top,
 *  - tracks an unread-message count per activity (badge on each icon).
 *
 * Reads + live updates go straight through the anon Supabase client (RLS on the
 * messages table is disabled). A one-time fetch seeds counts on load and a
 * realtime subscription keeps them live — no polling. "Read" marks (last-seen
 * timestamp per channel) live in localStorage.
 */
export function useRailChats(
  events: EventProps[],
  uid: string | null,
  openChannelId: string | null,
) {
  const [unread, setUnread] = useState<Record<string, number>>({}); // by channel_id
  const [lastAt, setLastAt] = useState<Record<string, string>>({}); // channel_id -> iso
  const readsRef = useRef<Record<string, string>>({});
  const openChanRef = useRef<string | null>(openChannelId);
  openChanRef.current = openChannelId;

  const channelIds = useMemo(
    () => events.map((e) => e.channel_id).filter((c): c is string => !!c),
    [events],
  );
  const channelKey = useMemo(() => [...channelIds].sort().join(","), [channelIds]);

  // Seed ordering from the server-provided last_message_at on each load.
  useEffect(() => {
    setLastAt((prev) => {
      const next = { ...prev };
      for (const e of events) {
        if (e.channel_id && e.last_message_at) {
          if (!next[e.channel_id] || e.last_message_at > next[e.channel_id]) {
            next[e.channel_id] = e.last_message_at;
          }
        }
      }
      return next;
    });
  }, [events]);

  // One-time seed: latest message time + unread-since-last-read per channel,
  // read directly with the anon key.
  const seed = useCallback(async () => {
    if (!uid || channelIds.length === 0) return;
    const open = openChanRef.current;
    await Promise.all(
      channelIds.map(async (c) => {
        const since = readsRef.current[c] ?? null;

        let countQ = supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", c)
          .neq("user_id", uid);
        if (since) countQ = countQ.gt("created_at", since);
        const { count } = await countQ;

        const { data: latest } = await supabase
          .from("messages")
          .select("created_at")
          .eq("channel_id", c)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setUnread((prev) => ({ ...prev, [c]: open === c ? 0 : count ?? 0 }));
        if (latest?.created_at) {
          setLastAt((prev) => ({ ...prev, [c]: latest.created_at }));
        }
      }),
    );
  }, [uid, channelKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!uid) {
      setUnread({});
      return;
    }
    readsRef.current = loadReads(uid);
    seed();
  }, [uid, channelKey, seed]);

  // Realtime (anon key): instant badge bump + reorder on new messages.
  useEffect(() => {
    if (channelIds.length === 0) return;
    const set = new Set(channelIds);
    const sub = supabase
      .channel(`rail:${uid ?? "anon"}:${channelKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as { channel_id: string; user_id: string; created_at: string };
          if (!m || !set.has(m.channel_id)) return;
          setLastAt((prev) => ({ ...prev, [m.channel_id]: m.created_at }));
          const isOpen = openChanRef.current === m.channel_id;
          const isMine = uid && m.user_id === uid;
          if (isOpen) {
            // Stay read while the chat is open.
            if (uid) {
              readsRef.current[m.channel_id] = m.created_at;
              saveReads(uid, readsRef.current);
            }
            return;
          }
          if (isMine) return;
          setUnread((prev) => ({ ...prev, [m.channel_id]: (prev[m.channel_id] ?? 0) + 1 }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [channelKey, uid]);

  // Mark a channel read (on open) — zero its badge + persist the timestamp.
  const markRead = useCallback(
    (channelId: string | null) => {
      if (!channelId || !uid) return;
      readsRef.current[channelId] = new Date().toISOString();
      saveReads(uid, readsRef.current);
      setUnread((prev) => (prev[channelId] ? { ...prev, [channelId]: 0 } : prev));
    },
    [uid],
  );

  useEffect(() => {
    if (openChannelId) markRead(openChannelId);
  }, [openChannelId, markRead]);

  // Newest-activity-first ordering; activities without any messages keep their
  // incoming (server) order at the bottom.
  const orderedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const ta = a.channel_id ? lastAt[a.channel_id] : undefined;
      const tb = b.channel_id ? lastAt[b.channel_id] : undefined;
      if (ta && tb) return tb.localeCompare(ta);
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
  }, [events, lastAt]);

  const unreadByEvent = useMemo(() => {
    const out: Record<string, number> = {};
    for (const e of events) if (e.channel_id) out[e.id] = unread[e.channel_id] ?? 0;
    return out;
  }, [events, unread]);

  return { orderedEvents, unreadByEvent };
}
