import { C } from "@/theme/clay";
import { useAuth } from "@/lib/authContext";
import {
  getFriends,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
  respondFriend,
  getOrCreateDM,
} from "@/lib/api";
import { getAvatarPublicUrl } from "@/lib/supabaseStorage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  MessageCircle,
  Search,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface FriendEntry {
  friendship_id: string;
  friend: Profile;
}

interface RequestEntry {
  request_id: string;
  requester: Profile;
  created_at: string;
}

type FriendStatus = "friends" | "pending_sent" | "pending_received" | "none";

const GRAD_POOL: Array<readonly [string, string]> = [
  C.Gradients.primary,
  C.Gradients.pink,
  C.Gradients.blue,
  C.Gradients.green,
  C.Gradients.amber,
];

function pickGradient(id: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return GRAD_POOL[Math.abs(h) % GRAD_POOL.length];
}

function resolvedAvatarUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : getAvatarPublicUrl(url);
}

function Avatar({ profile, size = 44 }: { profile: Profile; size?: number }) {
  const url = resolvedAvatarUrl(profile.avatar_url);
  const grad = pickGradient(profile.id);
  const r = size / 2;
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: r }}
      />
    );
  }
  return (
    <LinearGradient
      colors={grad}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: C.Fonts.bodyBold,
          fontSize: size * 0.38,
          color: "#fff",
        }}
      >
        {(profile.username || "?").charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const myId = user?.id ?? "";

  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState<
    Record<string, { status: FriendStatus; requestId?: string }>
  >({});
  const [dmLoading, setDmLoading] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!myId) return;
    setLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(myId).catch(() => []),
        getFriendRequests(myId).catch(() => []),
      ]);
      const fl: FriendEntry[] = Array.isArray(friendsData) ? friendsData : [];
      const rl: RequestEntry[] = Array.isArray(requestsData)
        ? requestsData
        : [];
      setFriends(fl);
      setRequests(rl);
      const map: Record<string, { status: FriendStatus; requestId?: string }> =
        {};
      fl.forEach((f) => {
        if (f.friend)
          map[f.friend.id] = { status: "friends", requestId: f.friendship_id };
      });
      rl.forEach((r) => {
        if (r.requester)
          map[r.requester.id] = {
            status: "pending_received",
            requestId: r.request_id,
          };
      });
      setStatusMap(map);
    } finally {
      setLoading(false);
    }
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const data = await searchUsers(q, myId);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query, myId]);

  const handleAdd = async (profile: Profile) => {
    setAddingId(profile.id);
    try {
      await sendFriendRequest(myId, profile.id);
      setStatusMap((prev) => ({
        ...prev,
        [profile.id]: { status: "pending_sent" },
      }));
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not send request");
    } finally {
      setAddingId(null);
    }
  };

  const handleRespond = async (
    requestId: string,
    requesterId: string,
    action: "accept" | "decline",
  ) => {
    try {
      await respondFriend(requestId, action);
      if (action === "accept") {
        load();
      } else {
        setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
        setStatusMap((prev) => {
          const n = { ...prev };
          delete n[requesterId];
          return n;
        });
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not respond");
    }
  };

  const handleMessage = async (friend: Profile) => {
    setDmLoading(friend.id);
    try {
      const result = await getOrCreateDM(myId, friend.id);
      router.push({
        pathname: "/chat/[channelId]",
        params: {
          channelId: result.channel_id,
          channelName: friend.username,
          isDM: "true",
          friendName: friend.username,
          friendAvatar: friend.avatar_url ?? "",
        },
      } as any);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not open chat");
    } finally {
      setDmLoading(null);
    }
  };

  const showSearch = query.trim().length >= 2;

  function StatusButton({ profile }: { profile: Profile }) {
    const info = statusMap[profile.id];
    const status = info?.status ?? "none";

    if (status === "friends") {
      return (
        <TouchableOpacity
          style={s.btnMsg}
          onPress={() => handleMessage(profile)}
          disabled={dmLoading === profile.id}
        >
          {dmLoading === profile.id ? (
            <ActivityIndicator size="small" color={C.accent} />
          ) : (
            <>
              <MessageCircle size={13} color={C.accent} strokeWidth={2.5} />
              <Text style={s.btnMsgTxt}>Message</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }
    if (status === "pending_sent") {
      return (
        <View style={s.btnPending}>
          <Text style={s.btnPendingTxt}>Sent</Text>
        </View>
      );
    }
    if (status === "pending_received") {
      return (
        <TouchableOpacity
          style={s.btnAccept}
          onPress={() => handleRespond(info!.requestId!, profile.id, "accept")}
        >
          <UserCheck size={13} color="#fff" strokeWidth={2.5} />
          <Text style={s.btnAcceptTxt}>Accept</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={s.btnAdd}
        onPress={() => handleAdd(profile)}
        disabled={addingId === profile.id}
      >
        {addingId === profile.id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <UserPlus size={13} color="#fff" strokeWidth={2.5} />
            <Text style={s.btnAddTxt}>Add</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  function ProfileRow({
    profile,
    right,
  }: {
    profile: Profile;
    right: React.ReactNode;
  }) {
    return (
      <View style={s.row}>
        <Avatar profile={profile} size={44} />
        <View style={s.rowBody}>
          <Text style={s.rowName}>{profile.username}</Text>
          {profile.full_name ? (
            <Text style={s.rowSub}>{profile.full_name}</Text>
          ) : null}
        </View>
        {right}
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: C.canvas }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={20} color={C.accent} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Friends</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Search size={16} color={C.textTertiary} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username…"
          placeholderTextColor={C.textTertiary}
          style={s.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color={C.textTertiary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {showSearch ? (
        searching ? (
          <View style={s.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : searchResults.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyTxt}>No users found for "{query}"</Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(p) => p.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            renderItem={({ item }) => (
              <ProfileRow
                profile={item}
                right={<StatusButton profile={item} />}
              />
            )}
          />
        )
      ) : (
        <>
          {/* Tabs */}
          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, tab === "friends" && s.tabActive]}
              onPress={() => setTab("friends")}
            >
              <Text style={[s.tabTxt, tab === "friends" && s.tabTxtActive]}>
                Friends{friends.length > 0 ? ` (${friends.length})` : ""}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, tab === "requests" && s.tabActive]}
              onPress={() => setTab("requests")}
            >
              <Text style={[s.tabTxt, tab === "requests" && s.tabTxtActive]}>
                Requests
              </Text>
              {requests.length > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeTxt}>{requests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={s.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : tab === "friends" ? (
            friends.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyTxt}>
                  No friends yet — search for people above!
                </Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(f) => f.friendship_id}
                contentContainerStyle={s.list}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={s.sep} />}
                renderItem={({ item }) =>
                  item.friend ? (
                    <ProfileRow
                      profile={item.friend}
                      right={
                        <TouchableOpacity
                          style={s.btnMsg}
                          onPress={() => handleMessage(item.friend)}
                          disabled={dmLoading === item.friend.id}
                        >
                          {dmLoading === item.friend.id ? (
                            <ActivityIndicator size="small" color={C.accent} />
                          ) : (
                            <>
                              <MessageCircle
                                size={13}
                                color={C.accent}
                                strokeWidth={2.5}
                              />
                              <Text style={s.btnMsgTxt}>Message</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      }
                    />
                  ) : null
                }
              />
            )
          ) : requests.length === 0 ? (
            <View style={s.center}>
              <Text style={s.emptyTxt}>No pending requests</Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(r) => r.request_id}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={s.sep} />}
              renderItem={({ item }) =>
                item.requester ? (
                  <View style={s.row}>
                    <Avatar profile={item.requester} size={44} />
                    <View style={s.rowBody}>
                      <Text style={s.rowName}>{item.requester.username}</Text>
                      {item.requester.full_name ? (
                        <Text style={s.rowSub}>{item.requester.full_name}</Text>
                      ) : null}
                    </View>
                    <View style={s.requestBtns}>
                      <TouchableOpacity
                        style={s.btnAccept}
                        onPress={() =>
                          handleRespond(
                            item.request_id,
                            item.requester.id,
                            "accept",
                          )
                        }
                      >
                        <UserCheck size={13} color="#fff" strokeWidth={2.5} />
                        <Text style={s.btnAcceptTxt}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.btnDecline}
                        onPress={() =>
                          handleRespond(
                            item.request_id,
                            item.requester.id,
                            "decline",
                          )
                        }
                      >
                        <UserX size={14} color={C.error} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.md,
    color: "#000000",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
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

  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    padding: 4,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: C.Radii.lg,
    gap: 6,
  },
  tabActive: { backgroundColor: C.accentMuted },
  tabTxt: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  tabTxtActive: { fontFamily: C.Fonts.bodyBold, color: C.accent },
  badge: {
    backgroundColor: C.accentPink,
    borderRadius: C.Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  badgeTxt: { fontFamily: C.Fonts.bodyBold, fontSize: 10, color: "#fff" },

  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },
  sep: { height: 1, backgroundColor: "#F0EDF8", marginVertical: 2 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTxt: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  rowBody: { flex: 1, gap: 2 },
  rowName: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  rowSub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },

  requestBtns: { flexDirection: "row", alignItems: "center", gap: 8 },

  btnAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accent,
    borderRadius: C.Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnAddTxt: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: "#fff",
  },

  btnMsg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnMsgTxt: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.accent,
  },

  btnPending: {
    borderRadius: C.Radii.lg,
    borderWidth: 1.5,
    borderColor: C.textTertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnPendingTxt: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
  },

  btnAccept: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accentGreen,
    borderRadius: C.Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnAcceptTxt: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: "#fff",
  },

  btnDecline: {
    width: 34,
    height: 34,
    borderRadius: C.Radii.md,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
});
