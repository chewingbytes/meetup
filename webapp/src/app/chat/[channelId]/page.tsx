"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useIdentity } from "@/lib/webappUser";
import { ChatPanel } from "@/components/ChatPanel";
import { grad } from "@/lib/theme";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ channelId: string }>();
  const search = useSearchParams();
  const channelId = params.channelId;
  const eventName = search.get("name") ?? "Activity chat";
  const category = search.get("category") ?? undefined;

  const { user, ready } = useIdentity();

  // Deep-linked without an identity → guide them home to join first.
  if (ready && !user) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-canvas p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accentMuted">
          <MessageSquare size={28} className="text-accent" strokeWidth={2} />
        </div>
        <p className="font-heading text-lg font-extrabold text-textPrimary">
          Join an activity to chat
        </p>
        <p className="max-w-xs text-sm text-textSecondary">
          Set up your profile and join an activity from the map to unlock its chat.
        </p>
        <button
          onClick={() => router.push("/")}
          className="rounded-2xl px-6 py-3 font-bold text-white shadow-clayButton"
          style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
        >
          Back to map
        </button>
      </div>
    );
  }

  return (
    <ChatPanel
      channelId={ready ? channelId : null}
      eventName={eventName}
      category={category}
      mode="page"
      onClose={() => router.push("/")}
    />
  );
}
