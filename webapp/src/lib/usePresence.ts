"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * "People here now" — global webapp presence. Uses Supabase Realtime Presence
 * (built into supabase-js, no custom websocket server) on a single shared
 * channel. Everyone currently on the site is tracked; we surface the live count.
 */
export function useGlobalPresence(identity: { id: string; username: string } | null) {
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    if (!identity) return;
    const channel = supabase.channel("presence:webapp-global", {
      config: { presence: { key: identity.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const count = Object.keys(channel.presenceState()).length;
        setOnlineCount(Math.max(1, count));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: identity.id,
            username: identity.username,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [identity?.id, identity?.username]);

  return onlineCount;
}
