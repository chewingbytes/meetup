import MobileNav from "@/components/mobile-nav";
import { NeoLoader } from "@/components/ui/neo-loader";
import { getMyEvents } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { useChatNotificationStore } from "@/lib/stores/chatNotificationStore";
import { useRouter } from "expo-router";
import {
  Hash,
  MessageSquare,
  Search,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatEntry {
  channelId: string;
  channelName: string;
  eventName: string;
  communityName?: string;
  lastMessage?: string;
  lastAuthor?: string;
  lastAt?: string;
}

const ACCENT_COLORS = ["#FF6B6B", "#FFD93D", "#C4B5FD", "#6EE7B7", "#93C5FD", "#F472B6"];

function relativeTime(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const unreadByChannel = useChatNotificationStore((s) => s.unreadByChannel);

  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  const loadChats = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Fetch user's joined events
      const myEvents: any[] = await getMyEvents(user.id).catch(() => []);
      const validEvents = Array.isArray(myEvents) ? myEvents : [];

      // 2. Collect event IDs from the user's joined events
      const eventIds = validEvents.map((e: any) => e.id).filter(Boolean) as string[];

      if (eventIds.length === 0) {
        setChats([]);
        return;
      }

      // 3. Fetch channels linked directly to those events
      const { data: channels, error: chanErr } = await supabase
        .from("channels")
        .select("id, name, community_id, event_id")
        .in("event_id", eventIds);

      if (chanErr || !channels?.length) {
        setChats([]);
        return;
      }

      // 4. For each channel, get the last message
      const entries: ChatEntry[] = await Promise.all(
        channels.map(async (ch: any) => {
          const { data: msgs } = await supabase
            .from("messages")
            .select("text, username, created_at")
            .eq("channel_id", ch.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const last = msgs?.[0];

          // Match the event this channel belongs to
          const relatedEvent = validEvents.find((e: any) => e.id === ch.event_id);

          return {
            channelId: ch.id,
            channelName: ch.name,
            eventName: relatedEvent?.name ?? ch.name,
            communityName: ch.name,
            lastMessage: last?.text,
            lastAuthor: last?.username,
            lastAt: last?.created_at,
          } as ChatEntry;
        })
      );

      setChats(entries);
    } catch (e) {
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const filtered = chats.filter(
    (c) =>
      c.eventName.toLowerCase().includes(query.toLowerCase()) ||
      c.channelName.toLowerCase().includes(query.toLowerCase())
  );

  const totalUnread = Object.values(unreadByChannel).reduce((a, b) => a + b, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>CHATS</Text>
            <Text style={styles.headerSub}>
              {chats.length} ACTIVE CHANNELS
            </Text>
          </View>
          {totalUnread > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>{totalUnread}</Text>
            </View>
          )}
        </View>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <Search size={16} color="#000" strokeWidth={3} style={{ marginLeft: 12 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="SEARCH CHANNELS..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={styles.loaderWrap}>
          <NeoLoader />
          <Text style={styles.loaderText}>LOADING CHATS...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          {/* Decorative shapes */}
          <View style={styles.emptyShape1} />
          <View style={styles.emptyShape2} />

          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MessageSquare size={32} color="#000" strokeWidth={3} />
            </View>
            <Text style={styles.emptyTitle}>
              {query ? "NO RESULTS" : "RADIO SILENCE"}
            </Text>
            <Text style={styles.emptyBody}>
              {query
                ? "Try a different search term."
                : "Join an event to unlock its chat channel and connect with attendees."}
            </Text>
            {!query && (
              <TouchableOpacity
                onPress={() => router.push("/explore")}
                style={styles.emptyBtn}
                activeOpacity={0.8}
              >
                <Zap size={14} color="#000" strokeWidth={3} />
                <Text style={styles.emptyBtnText}>FIND EVENTS</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.channelId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item, index }) => {
            const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
            const unread = unreadByChannel[item.channelId] ?? 0;

            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/chat/[channelId]",
                    params: {
                      channelId: item.channelId,
                      channelName: item.channelName,
                    },
                  })
                }
                style={styles.chatCard}
                activeOpacity={0.85}
              >
                {/* Color accent strip */}
                <View style={[styles.cardStrip, { backgroundColor: color }]}>
                  <Hash size={18} color="#000" strokeWidth={3} />
                </View>

                {/* Body */}
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardEventName} numberOfLines={1}>
                      {item.eventName}
                    </Text>
                    <Text style={styles.cardTime}>
                      {relativeTime(item.lastAt)}
                    </Text>
                  </View>

                  <View style={styles.cardChannelRow}>
                    <View style={styles.channelPill}>
                      <Text style={styles.channelPillText}>
                        #{item.channelName}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardLastMsg} numberOfLines={1}>
                    {item.lastMessage
                      ? `${item.lastAuthor ? item.lastAuthor + ": " : ""}${item.lastMessage}`
                      : "No messages yet — be the first!"}
                  </Text>
                </View>

                {/* Unread badge */}
                {unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {unread > 99 ? "99+" : unread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <MobileNav active="messages" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFDF5",
  },

  // ── Header ──
  header: {
    backgroundColor: "#FFD93D",
    borderBottomWidth: 4,
    borderColor: "#000",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: "900",
    color: "#000",
    letterSpacing: -1,
    lineHeight: 44,
    textTransform: "uppercase",
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.6,
  },
  totalUnreadBadge: {
    backgroundColor: "#FF6B6B",
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginTop: 4,
  },
  totalUnreadText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.5,
  },

  // ── Loader ──
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
  },

  // ── Empty state ──
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyShape1: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 60,
    height: 60,
    backgroundColor: "#C4B5FD",
    borderWidth: 3,
    borderColor: "#000",
    transform: [{ rotate: "-12deg" }],
  },
  emptyShape2: {
    position: "absolute",
    bottom: 80,
    right: 24,
    width: 40,
    height: 40,
    backgroundColor: "#FF6B6B",
    borderWidth: 3,
    borderColor: "#000",
    borderRadius: 999,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#000",
    padding: 28,
    alignItems: "center",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    gap: 10,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    backgroundColor: "#FFD93D",
    borderWidth: 3,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  emptyBody: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    textAlign: "center",
    textTransform: "uppercase",
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF6B6B",
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 6,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // ── Chat list ──
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  chatCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    overflow: "hidden",
  },
  cardStrip: {
    width: 52,
    borderRightWidth: 3,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardEventName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginRight: 8,
  },
  cardTime: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
  },
  cardChannelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  channelPill: {
    backgroundColor: "#FFFDF5",
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  channelPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 0.5,
  },
  cardLastMsg: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    lineHeight: 16,
  },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    backgroundColor: "#FF6B6B",
    borderLeftWidth: 3,
    borderColor: "#000",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 12,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000",
  },
});
