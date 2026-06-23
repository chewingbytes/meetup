/**
 * Messages / Chats screen — clay aesthetic.
 */

import MobileNav from "@/components/mobile-nav";
import { ClayBackground } from "@/components/ui/clay-background";
import { NeoLoader } from "@/components/ui/neo-loader";
import { C } from "@/theme/clay";
import { getMyEvents, getDMs } from "@/lib/api";
import { getCategoryConfig } from "@/utils/categories";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { getAvatarPublicUrl } from "@/lib/supabaseStorage";
import { useChatNotificationStore } from "@/lib/stores/chatNotificationStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MessageSquare, Search, Zap } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UnifiedEntry =
  | {
      kind: "event";
      channelId: string;
      channelName: string;
      eventName: string;
      eventId?: string;
      category?: string;
      lastMessage?: string;
      lastAuthor?: string;
      lastAt?: string;
    }
  | {
      kind: "dm";
      channelId: string;
      friend: { id: string; username: string; full_name: string | null; avatar_url: string | null };
      lastMessage?: string;
      lastAuthor?: string;
      lastAt?: string;
    };

function resolvedAvatar(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : getAvatarPublicUrl(url);
}


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

  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  const loadChats = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [myEvents, dmsData] = await Promise.all([
        getMyEvents(user.id).catch(() => []),
        getDMs(user.id).catch(() => []),
      ]);

      const dmEntries: UnifiedEntry[] = (Array.isArray(dmsData) ? dmsData : []).map(
        (dm: any) => ({
          kind: "dm" as const,
          channelId: dm.channel_id,
          friend: dm.friend,
          lastMessage: dm.lastMessage,
          lastAuthor: dm.lastAuthor,
          lastAt: dm.lastAt,
        })
      );

      const validEvents = Array.isArray(myEvents) ? myEvents : [];
      const eventIds = validEvents.map((e: any) => e.id).filter(Boolean) as string[];

      let eventEntries: UnifiedEntry[] = [];
      if (eventIds.length > 0) {
        const { data: channels } = await supabase
          .from("channels")
          .select("id, name, event_id")
          .in("event_id", eventIds);

        if (channels?.length) {
          eventEntries = await Promise.all(
            channels.map(async (ch: any) => {
              const { data: msgs } = await supabase
                .from("messages")
                .select("text, username, created_at")
                .eq("channel_id", ch.id)
                .order("created_at", { ascending: false })
                .limit(1);
              const last = msgs?.[0];
              const relatedEvent = validEvents.find((e: any) => e.id === ch.event_id);
              return {
                kind: "event" as const,
                channelId: ch.id,
                channelName: ch.name,
                eventName: relatedEvent?.name ?? ch.name,
                eventId: relatedEvent?.id,
                category: relatedEvent?.category,
                lastMessage: last?.text,
                lastAuthor: last?.username,
                lastAt: last?.created_at,
              };
            })
          );
        }
      }

      const all = [...dmEntries, ...eventEntries].sort((a, b) => {
        if (!a.lastAt && !b.lastAt) return 0;
        if (!a.lastAt) return 1;
        if (!b.lastAt) return -1;
        return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
      });
      setEntries(all);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const filtered = entries.filter((e) => {
    const q = query.toLowerCase();
    if (e.kind === "dm") return (e.friend?.username ?? "").toLowerCase().includes(q);
    return e.eventName.toLowerCase().includes(q) || e.channelName.toLowerCase().includes(q);
  });

  const totalUnread = Object.values(unreadByChannel).reduce((a, b) => a + b, 0);

  return (
    <ClayBackground style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Chats</Text>
          <View style={styles.titleMeta}>
            <Text style={styles.titleSub}>{entries.length} active</Text>
            {totalUnread > 0 && (
              <View style={styles.totalUnreadBadge}>
                <Text style={styles.totalUnreadText}>{totalUnread}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Search
            size={16}
            color={C.textSecondary}
            strokeWidth={2}
            style={{ marginLeft: 4 }}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search channels…"
            placeholderTextColor={C.textTertiary}
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <NeoLoader />
          <Text style={styles.loadingText}>Loading chats…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.channelId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <MessageSquare size={28} color={C.accent} strokeWidth={2} />
                </View>
                <Text style={styles.emptyTitle}>
                  {query ? "No results" : "No chats yet"}
                </Text>
                <Text style={styles.emptyBody}>
                  {query
                    ? "Try a different search term."
                    : "Join a hangout or add a friend to start chatting."}
                </Text>
                {!query && (
                  <TouchableOpacity
                    onPress={() => router.push("/")}
                    style={styles.emptyBtn}
                  >
                    <Zap size={14} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.emptyBtnText}>Find Hangouts</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const unread = unreadByChannel[item.channelId] ?? 0;

            if (item.kind === "dm") {
              const avatarUrl = resolvedAvatar(item.friend?.avatar_url ?? null);
              return (
                <TouchableOpacity
                  style={styles.chatCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/chat/[channelId]",
                      params: {
                        channelId: item.channelId,
                        channelName: item.friend?.username ?? "DM",
                        isDM: "true",
                        friendName: item.friend?.username ?? "",
                        friendAvatar: item.friend?.avatar_url ?? "",
                      },
                    } as any)
                  }
                >
                  <View style={styles.dmAvatarWrap}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.dmAvatarImg} />
                    ) : (
                      <LinearGradient colors={C.Gradients.primary} style={styles.dmAvatarCircle}>
                        <Text style={styles.dmAvatarText}>
                          {(item.friend?.username ?? "?").charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardEventName} numberOfLines={1}>
                        {item.friend?.username ?? "Direct Message"}
                      </Text>
                      <Text style={styles.cardTime}>{relativeTime(item.lastAt)}</Text>
                    </View>
                    <Text style={styles.cardLastMsg} numberOfLines={1}>
                      {item.lastMessage
                        ? `${item.lastAuthor ? item.lastAuthor + ": " : ""}${item.lastMessage}`
                        : "Send the first message!"}
                    </Text>
                  </View>
                  {unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread > 99 ? "99+" : unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }

            const catConfig = getCategoryConfig(item.category);
            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/chat/[channelId]",
                    params: {
                      channelId: item.channelId,
                      channelName: item.channelName,
                      eventId: item.eventId ?? "",
                      category: item.category ?? "",
                    },
                  })
                }
                style={styles.chatCard}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={catConfig.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.channelIcon}
                >
                  <catConfig.Icon size={18} color="#fff" strokeWidth={2.2} />
                </LinearGradient>
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardEventName} numberOfLines={1}>
                      {item.eventName}
                    </Text>
                    <Text style={styles.cardTime}>{relativeTime(item.lastAt)}</Text>
                  </View>
                  <Text style={styles.cardLastMsg} numberOfLines={1}>
                    {item.lastMessage
                      ? `${item.lastAuthor ? item.lastAuthor + ": " : ""}${item.lastMessage}`
                      : "No messages yet — be the first!"}
                  </Text>
                </View>
                {unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unread > 99 ? "99+" : unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <MobileNav active="messages" />
    </ClayBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: C.Space.xl,
    paddingBottom: C.Space.xl,
    gap: C.Space.lg,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxxl,
    color: C.textPrimary,
  },
  titleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },
  titleSub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  totalUnreadBadge: {
    backgroundColor: C.accentPink,
    borderRadius: C.Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  totalUnreadText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 12,
    color: "#fff",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    paddingHorizontal: C.Space.lg,
    height: 48,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: C.Radii.xxl,
    padding: 32,
    alignItems: "center",
    gap: 10,
    maxWidth: 300,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: C.FontSizes.sm * 1.6,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.accent,
    borderRadius: C.Radii.lg,
    paddingHorizontal: C.Space.xl,
    paddingVertical: 12,
    marginTop: 4,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyBtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },
  list: {
    padding: C.Space.xl,
    paddingBottom: 125,
  },
  dmAvatarWrap: {
    width: 52,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accentMuted,
  },
  dmAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  dmAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dmAvatarText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 14,
    color: "#fff",
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  channelIcon: {
    width: 52,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    padding: C.Space.lg,
    gap: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardEventName: {
    flex: 1,
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    marginRight: 8,
  },
  cardTime: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
  },
  cardChannelPill: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.accent,
  },
  cardLastMsg: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    lineHeight: C.FontSizes.sm * 1.4,
  },
  unreadBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentPink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: C.Space.lg,
  },
  unreadText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
    color: "#fff",
  },
});
