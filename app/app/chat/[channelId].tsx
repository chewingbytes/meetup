/**
 * Chat / Channel screen — clay aesthetic.
 *
 * My messages: violet gradient bubble, right-aligned.
 * Others: white clay card, left-aligned with author name + avatar initial.
 */

import { C } from "@/theme/clay";
import { getCategoryConfig } from "@/utils/categories";
import { useAuth } from "@/lib/authContext";
import { useChat } from "@/lib/useChat";
import { supabase } from "@/lib/supabase";
import { getAvatarPublicUrl } from "@/lib/supabaseStorage";
import { useChatNotificationStore } from "@/lib/stores/chatNotificationStore";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ChevronLeft, MessageSquare, Send } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NeoLoader } from "@/components/ui/neo-loader";

// Stable colour per username so the same person always gets the same shade
const AUTHOR_GRADIENTS: Array<readonly [string, string]> = [
  C.Gradients.primary,
  C.Gradients.pink,
  C.Gradients.blue,
  C.Gradients.green,
  C.Gradients.amber,
  C.Gradients.coral,
];

function authorGradient(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++)
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return AUTHOR_GRADIENTS[Math.abs(hash) % AUTHOR_GRADIENTS.length];
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatScreen() {
  const { channelId, channelName, eventId, category, isDM, friendName, friendAvatar, friendId } =
    useLocalSearchParams<{
      channelId: string;
      channelName: string;
      eventId: string;
      category: string;
      isDM?: string;
      friendName?: string;
      friendAvatar?: string;
      friendId?: string;
    }>();
  const isDirectMessage = isDM === "true";
  const catConfig = getCategoryConfig(category);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const myUserId = user?.id ?? "";

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userAvatars, setUserAvatars] = useState<Record<string, string | null>>({});
  const fetchedIds = useRef<Set<string>>(new Set());

  const markRead = useChatNotificationStore((s) => s.markRead);
  const setActiveChannel = useChatNotificationStore((s) => s.setActiveChannel);

  const { messages, onlineUsers, sendMessage, isLoading, error } =
    useChat(channelId);

  // Batch-fetch profile avatars for any new senders
  useEffect(() => {
    const newIds = messages
      .map((m) => m.user_id)
      .filter((id) => id && id !== myUserId && !fetchedIds.current.has(id));
    const unique = [...new Set(newIds)];
    if (unique.length === 0) return;
    unique.forEach((id) => fetchedIds.current.add(id));
    supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", unique)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string | null> = {};
        data.forEach((p: any) => {
          if (!p.avatar_url) { map[p.id] = null; return; }
          map[p.id] = p.avatar_url.startsWith("http")
            ? p.avatar_url
            : getAvatarPublicUrl(p.avatar_url);
        });
        setUserAvatars((prev) => ({ ...prev, ...map }));
      });
  }, [messages, myUserId]);

  useEffect(() => {
    if (channelId) {
      setActiveChannel(channelId);
      markRead(channelId);
    }
    return () => setActiveChannel(null);
  }, [channelId, markRead, setActiveChannel]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !channelId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSending(true);
    try {
      await sendMessage(trimmed);
      setText("");
    } catch {
    } finally {
      setSending(false);
    }
  };

  const canSend = text.trim().length > 0 && !sending;

  return (
    <View style={[styles.root, { backgroundColor: C.canvas }]}>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "slide_from_right",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={C.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => {
            if (isDirectMessage && friendId) {
              router.push({ pathname: "/profile/[id]", params: { id: friendId } } as any);
            } else if (!isDirectMessage && eventId) {
              router.push({ pathname: "/events/[id]", params: { id: eventId } });
            }
          }}
          activeOpacity={isDirectMessage && friendId || (!isDirectMessage && !!eventId) ? 0.7 : 1}
        >
          {isDirectMessage ? (
            friendAvatar ? (
              <Image
                source={{ uri: friendAvatar.startsWith("http") ? friendAvatar : friendAvatar }}
                style={styles.dmHeaderAvatar}
              />
            ) : (
              <LinearGradient
                colors={C.Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.channelIcon}
              >
                <Text style={styles.dmAvatarInitial}>
                  {(friendName ?? channelName ?? "?").charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )
          ) : (
            <LinearGradient
              colors={catConfig.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.channelIcon}
            >
              <catConfig.Icon size={18} color="#fff" strokeWidth={2.2} />
            </LinearGradient>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {isDirectMessage ? (friendName ?? channelName) : (channelName ?? "general")}
            </Text>
            <Text style={styles.headerSub}>
              {isDirectMessage
                ? "Direct message"
                : (onlineUsers?.length ?? 0) > 0
                ? `${onlineUsers!.length} online`
                : eventId
                ? "tap to view event"
                : "group chat"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={styles.loader}>
              <NeoLoader />
            </View>
          ) : (
            <FlatList
              data={[...messages].reverse()}
              keyExtractor={(item) => item.id}
              inverted
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              ListEmptyComponent={
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <MessageSquare size={28} color={C.accent} strokeWidth={2} />
                  </View>
                  <Text style={styles.emptyTitle}>{channelName}</Text>
                  <Text style={styles.emptySub}>
                    Be the first to say something!
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => {
                const isMe = item.user_id === myUserId;
                const grad = authorGradient(item.username ?? "?");

                // Show author name only when sender changes
                const nextItem = [...messages].reverse()[index + 1];
                const showAuthor =
                  !isMe && nextItem?.username !== item.username;

                return (
                  <View
                    style={[
                      styles.row,
                      isMe ? styles.rowRight : styles.rowLeft,
                    ]}
                  >
                    {/* Avatar — only for others */}
                    {!isMe && (
                      userAvatars[item.user_id] ? (
                        <Image
                          source={{ uri: userAvatars[item.user_id]! }}
                          style={[styles.avatar, !showAuthor && styles.avatarHidden]}
                        />
                      ) : (
                        <LinearGradient
                          colors={grad}
                          style={[
                            styles.avatar,
                            !showAuthor && styles.avatarHidden,
                          ]}
                        >
                          <Text style={styles.avatarText}>
                            {item.username?.charAt(0)?.toUpperCase() ?? "?"}
                          </Text>
                        </LinearGradient>
                      )
                    )}

                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : styles.bubbleOther,
                      ]}
                    >
                      {showAuthor && (
                        <Text style={[styles.author, { color: grad[0] }]}>
                          {item.username}
                        </Text>
                      )}
                      {isMe ? (
                        <LinearGradient
                          colors={C.Gradients.primary}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.bubbleMeGrad}
                        >
                          <Text style={styles.bodyMe}>{item.text}</Text>
                          <Text style={styles.timeMe}>
                            {fmtTime(item.created_at)}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.bubbleOtherInner}>
                          <Text style={styles.bodyOther}>{item.text}</Text>
                          <Text style={styles.timeOther}>
                            {fmtTime(item.created_at)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}

          {error && (
            <View style={styles.errorBar}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* ── Input bar ── */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.inputWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message…"
              placeholderTextColor={C.textTertiary}
              multiline
              style={styles.input}
              onSubmitEditing={canSend ? handleSend : undefined}
            />
          </View>
          <Pressable
            onPress={canSend ? handleSend : undefined}
            style={({ pressed }) => [
              styles.sendWrap,
              pressed && { opacity: 0.82 },
            ]}
          >
            <LinearGradient
              colors={
                canSend
                  ? C.Gradients.primary
                  : (["#E5E1F0", "#E5E1F0"] as const)
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendBtn}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Send
                  size={18}
                  color={canSend ? "#fff" : C.textTertiary}
                  strokeWidth={2.5}
                />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: C.Radii.md,
    backgroundColor: C.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: C.Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dmHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  dmAvatarInitial: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 15,
    color: "#fff",
  },
  headerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
  },
  headerSub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    marginTop: 1,
  },

  // ── Message list ──
  list: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },

  // ── Rows ──
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
    gap: 8,
  },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },

  // ── Avatar ──
  avatar: {
    width: 28,
    height: 28,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarHidden: { opacity: 0 },
  avatarText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
    color: "#fff",
  },

  // ── Bubble containers ──
  bubble: { maxWidth: "75%" },
  bubbleMe: { alignItems: "flex-end" },
  bubbleOther: { alignItems: "flex-start" },

  // My message — gradient pill
  bubbleMeGrad: {
    borderRadius: 20,
    borderBottomRightRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.40)",
    borderLeftColor: "rgba(255,255,255,0.20)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  bodyMe: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: "#fff",
    lineHeight: C.FontSizes.base * 1.45,
  },
  timeMe: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: "rgba(255,255,255,0.65)",
    alignSelf: "flex-end",
  },

  // Other message — white clay card
  bubbleOtherInner: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  author: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    marginBottom: 2,
  },
  bodyOther: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    lineHeight: C.FontSizes.base * 1.45,
  },
  timeOther: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    alignSelf: "flex-end",
  },

  // ── Empty state ──
  empty: {
    alignItems: "center",
    paddingTop: 64,
    gap: 8,
    transform: [{ scaleY: -1 }], // counteract FlatList inverted
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
  },
  emptySub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },

  // ── Error ──
  errorBar: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.error,
    textAlign: "center",
  },

  // ── Input bar ──
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: "rgba(124,58,237,0.08)",
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.canvas,
    borderRadius: C.Radii.xl,
    paddingHorizontal: C.Space.lg,
    paddingVertical: 10,
    minHeight: 46,
    maxHeight: 120,
    justifyContent: "center",
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  input: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    maxHeight: 100,
  },
  sendWrap: {
    borderRadius: C.Radii.full,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
    borderLeftColor: "rgba(255,255,255,0.25)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.canvas,
  },
});
