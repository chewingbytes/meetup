"use client";

import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";
import { ChatPanel } from "./ChatPanel";
import { getEventChannel } from "@/lib/api";
import type { EventProps } from "@/lib/types";

interface ChatPopupProps {
  event: EventProps | null;
  open: boolean;
  onClose: () => void;
}

/**
 * In-map chat — opens as a bottom sheet on mobile and a right-side panel on
 * desktop (never redirects). Resolves the event's chat channel, then renders
 * the shared ChatPanel.
 */
export function ChatPopup({ event, open, onClose }: ChatPopupProps) {
  const [channelId, setChannelId] = useState<string | null>(null);

  useEffect(() => {
    if (!event || !open) return;
    setChannelId(null);
    let cancelled = false;
    getEventChannel(event.id)
      .then((r) => !cancelled && setChannelId(r.channel_id ?? event.id))
      .catch(() => !cancelled && setChannelId(event.id));
    return () => {
      cancelled = true;
    };
  }, [event, open]);

  if (!event) return null;

  return (
    <Sheet open={open} onClose={onClose} variant="responsive" noBackdrop>
      <ChatPanel
        channelId={channelId}
        eventName={event.name}
        category={event.category ?? undefined}
        mode="popup"
        onClose={onClose}
      />
    </Sheet>
  );
}
