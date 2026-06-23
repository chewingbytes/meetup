import { NeoLoader } from "@/components/ui/neo-loader";
import { ClayBackground } from "@/components/ui/clay-background";
import { ClayCard } from "@/components/ui/clay-card";
import { C } from "@/theme/clay";
import {
  getProfile,
  sendFriendRequest,
  respondFriend,
  getOrCreateDM,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AntDesign from "react-native-vector-icons/AntDesign";
import {
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  MapPin,
  MessageCircle,
  Star,
  ThumbsUp,
  UserCheck,
  UserPlus,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_W = Dimensions.get("window").width;
const SAMPLE_THUMBSUP = 47;
const SAMPLE_MEETUPS = 12;

const PROMPT_DEFS = [
  { key: "fixation", label: "what do you like to do in your free time?" },
  { key: "building", label: "what are you actively working towards?" },
  { key: "striving", label: "what are some goals you have in mind?" },
] as const;

const PROMPT_ACCENTS = ["#7C3AED", "#DB2777", "#059669"] as const;

type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

function computeAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function UserProfileView() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const myId = user?.id ?? "";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendRequestId, setFriendRequestId] = useState<string | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProfile(id as string)
      .then((data) => setProfile(data.user || data))
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));

    if (!myId || myId === id) return;
    supabase
      .from("friendships")
      .select("id, status, requester_id, addressee_id")
      .or(
        `and(requester_id.eq.${myId},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${myId})`
      )
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setFriendStatus("none"); return; }
        if (data.status === "accepted") {
          setFriendStatus("friends");
        } else if (data.status === "pending") {
          if (data.requester_id === myId) {
            setFriendStatus("pending_sent");
          } else {
            setFriendStatus("pending_received");
            setFriendRequestId(data.id);
          }
        } else {
          setFriendStatus("none");
        }
      });
  }, [id, myId]);

  const handleAddFriend = async () => {
    setAddingFriend(true);
    try {
      await sendFriendRequest(myId, id as string);
      setFriendStatus("pending_sent");
    } catch (err: any) {
      if (err?.message?.includes("409") || err?.status === 409) {
        setFriendStatus("pending_sent");
      } else {
        Alert.alert("Error", err?.message || "Could not send request");
      }
    } finally {
      setAddingFriend(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!friendRequestId) return;
    try {
      await respondFriend(friendRequestId, "accept");
      setFriendStatus("friends");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not accept request");
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    setDmLoading(true);
    try {
      const result = await getOrCreateDM(myId, id as string);
      router.push({
        pathname: "/chat/[channelId]",
        params: {
          channelId: result.channel_id,
          channelName: profile.username || profile.full_name,
          isDM: "true",
          friendName: profile.username || profile.full_name,
          friendAvatar: profile.avatar_url ?? "",
          friendId: id as string,
        },
      } as any);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not open chat");
    } finally {
      setDmLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.canvas,
        }}
      >
        <NeoLoader />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.canvas,
          padding: 24,
        }}
      >
        <Text
          style={{
            fontFamily: C.Fonts.heading,
            fontSize: C.FontSizes.xl,
            color: C.textPrimary,
            marginBottom: 8,
          }}
        >
          Profile not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtnErr}
        >
          <Text style={{ fontFamily: C.Fonts.bodyBold, color: C.accent }}>
            ← Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnProfile = myId === (id as string);
  const displayName = profile.full_name || profile.username || "—";
  const age = computeAge(profile.date_of_birth);
  const interestList: string[] = Array.isArray(profile.interests)
    ? profile.interests.filter(Boolean)
    : [];
  const mainInterest: string | null = profile.main_interest || null;
  const extraPhotos: string[] = Array.isArray(profile.photo_urls)
    ? profile.photo_urls.slice(1).filter(Boolean)
    : [];
  const avatarUrl: string | null =
    profile.photo_urls?.[0] || profile.avatar_url || null;
  const isVerified = profile.verified === "true";

  const promptDef = PROMPT_DEFS.find((p) => p.key === profile.prompt_key);
  const promptAccent = promptDef
    ? PROMPT_ACCENTS[PROMPT_DEFS.indexOf(promptDef)]
    : C.accent;

  const openInstagram = (handle: string) => {
    Linking.openURL(`instagram://user?username=${handle}`).catch(() =>
      Linking.openURL(`https://instagram.com/${handle}`)
    );
  };

  return (
    <ClayBackground>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={C.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 72 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Hero ── */}
        <View style={styles.avatarHero}>
          <LinearGradient
            colors={["#EDE9FE", "rgba(244,241,250,0)"]}
            style={styles.heroBackdrop}
            pointerEvents="none"
          />
          <View style={styles.avatarWithBubble}>
            <LinearGradient
              colors={C.Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={styles.avatarWrap}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={C.Gradients.primary}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarInitial}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                {isVerified && (
                  <View style={styles.verifiedPip}>
                    <BadgeCheck size={14} color="#fff" strokeWidth={2.5} />
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Prompt bubble */}
            {promptDef && profile.prompt_answer ? (
              <View style={styles.promptBubble}>
                <View style={styles.promptBubbleTailWrap}>
                  <View style={styles.promptBubbleTail} />
                </View>
                <Text style={[styles.promptBubbleLabel, { color: promptAccent }]}>
                  {promptDef.label}
                </Text>
                <Text style={styles.promptBubbleText}>
                  <Text
                    style={[styles.promptBubbleQuote, { color: promptAccent }]}
                  >
                    {'“'}
                  </Text>
                  {profile.prompt_answer}
                  <Text
                    style={[styles.promptBubbleQuote, { color: promptAccent }]}
                  >
                    {'”'}
                  </Text>
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroText}>
            <Text style={styles.nameText}>{displayName}</Text>

            {/* Meta chips */}
            <View style={styles.metaRow}>
              {profile.occupation ? (
                <View style={styles.metaChip}>
                  <Briefcase size={11} color={C.accent} strokeWidth={2.5} />
                  <Text style={styles.metaChipText}>{profile.occupation}</Text>
                </View>
              ) : null}
              {profile.location ? (
                <View style={styles.metaChip}>
                  <MapPin size={11} color={C.accent} strokeWidth={2.5} />
                  <Text style={styles.metaChipText}>{profile.location}</Text>
                </View>
              ) : null}
              {age !== null ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{age} yrs</Text>
                </View>
              ) : null}
            </View>

            {/* Personality badge */}
            {profile.personality_type ? (
              <View style={styles.personalityBadge}>
                <Text style={styles.personalityText}>
                  {profile.personality_type}
                </Text>
              </View>
            ) : null}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconChip,
                    { backgroundColor: C.accentMuted },
                  ]}
                >
                  <ThumbsUp size={16} color={C.accent} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={styles.statNum}>{SAMPLE_THUMBSUP}</Text>
                  <Text style={styles.statLabel}>thumbs up</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconChip,
                    { backgroundColor: C.greenMuted },
                  ]}
                >
                  <BadgeCheck
                    size={16}
                    color={C.accentGreen}
                    strokeWidth={2.5}
                  />
                </View>
                <View>
                  <Text style={[styles.statNum, { color: C.accentGreen }]}>
                    {SAMPLE_MEETUPS}
                  </Text>
                  <Text style={styles.statLabel}>meetups</Text>
                </View>
              </View>
            </View>

            {/* Instagram */}
            {profile.instagram_handle ? (
              <View style={styles.socialsRow}>
                <TouchableOpacity
                  onPress={() => openInstagram(profile.instagram_handle)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#833AB4", "#FD1D1D", "#FCAF45"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.socialPill}
                  >
                    <AntDesign name="instagram" size={20} color="#FFFFFF" />
                    <Text style={styles.socialPillText}>
                      @{profile.instagram_handle}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Extra photos grid ── */}
        {extraPhotos.length > 0 && (
          <View style={styles.photoGrid}>
            {extraPhotos.map((url, i) => (
              <Image
                key={url + i}
                source={{ uri: url }}
                style={styles.photoGridImg}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {/* ── Interests ── */}
        {interestList.length > 0 && (
          <ClayCard style={styles.section} elevated>
            <Text style={[styles.sectionLabel, { marginTop: 0 }]}>
              Interests
            </Text>
            <View style={styles.tagsRow}>
              {[...interestList]
                .sort((a, b) =>
                  a === mainInterest ? -1 : b === mainInterest ? 1 : 0,
                )
                .map((tag) => {
                  const isMain = mainInterest === tag;
                  return (
                    <View
                      key={tag}
                      style={isMain ? styles.tagMain : styles.tag}
                    >
                      {isMain && (
                        <Star
                          size={10}
                          color="#fff"
                          strokeWidth={2.5}
                          fill="#fff"
                        />
                      )}
                      <Text
                        style={isMain ? styles.tagMainText : styles.tagText}
                      >
                        {tag}
                      </Text>
                    </View>
                  );
                })}
            </View>
            {mainInterest ? (
              <View style={styles.mainInterestCaption}>
                <MapPin size={11} color={C.textSecondary} strokeWidth={2.5} />
                <Text style={styles.mainInterestCaptionText}>
                  <Text style={styles.mainInterestCaptionStrong}>
                    {mainInterest}
                  </Text>{" "}
                  shows on their map pin
                </Text>
              </View>
            ) : null}
          </ClayCard>
        )}
      </ScrollView>

      {/* ── Sticky CTA ── */}
      {!isOwnProfile && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          {friendStatus === "friends" ? (
            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.85}
              onPress={handleMessage}
              disabled={dmLoading}
            >
              {dmLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MessageCircle size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.ctaBtnText}>Send message</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.ctaRow}>
              {/* Friend action button */}
              {friendStatus === "pending_sent" ? (
                <View style={[styles.ctaBtnOutline, styles.ctaBtnHalf]}>
                  <Text style={styles.ctaBtnOutlineText}>Request sent</Text>
                </View>
              ) : friendStatus === "pending_received" ? (
                <TouchableOpacity
                  style={[styles.ctaBtnGreen, styles.ctaBtnHalf]}
                  activeOpacity={0.85}
                  onPress={handleAcceptFriend}
                >
                  <UserCheck size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.ctaBtnText}>Accept</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.ctaBtnSecondary, styles.ctaBtnHalf]}
                  activeOpacity={0.85}
                  onPress={handleAddFriend}
                  disabled={addingFriend}
                >
                  {addingFriend ? (
                    <ActivityIndicator color={C.accent} size="small" />
                  ) : (
                    <>
                      <UserPlus size={16} color={C.accent} strokeWidth={2.5} />
                      <Text style={styles.ctaBtnSecondaryText}>Add friend</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Message button */}
              <TouchableOpacity
                style={[styles.ctaBtn, styles.ctaBtnHalf]}
                activeOpacity={0.85}
                onPress={handleMessage}
                disabled={dmLoading}
              >
                {dmLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MessageCircle size={16} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.ctaBtnText}>Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ClayBackground>
  );
}

const styles = StyleSheet.create({
  backBtnErr: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: C.Radii.lg,
    borderWidth: 1.5,
    borderColor: C.accent,
    marginTop: 12,
  },

  // ── Header ──
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: C.Space.xl,
    paddingBottom: 14,
    backgroundColor: "rgba(244,241,250,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
  },
  headerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: C.Radii.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  scroll: { paddingBottom: 120 },

  // ── Avatar Hero ──
  avatarHero: {
    alignItems: "center",
    paddingTop: C.Space.xxl,
    paddingBottom: C.Space.xl,
    gap: C.Space.lg,
  },
  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  avatarWithBubble: {
    alignItems: "center",
    alignSelf: "center",
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.surface,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarInitial: { fontFamily: C.Fonts.heading, fontSize: 38, color: "#fff" },
  verifiedPip: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentGreen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.surface,
  },

  // ── Prompt bubble ──
  promptBubbleLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  promptBubble: {
    marginTop: -5,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.12)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 20,
    maxWidth: 300,
    alignItems: "center",
  },
  promptBubbleTailWrap: {
    position: "absolute",
    top: -11,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  promptBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#fff",
  },
  promptBubbleText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
    lineHeight: C.FontSizes.sm * 1.5,
    textAlign: "center",
  },
  promptBubbleQuote: {
    fontFamily: C.Fonts.heading,
    fontSize: 18,
    opacity: 0.45,
  },

  // ── Hero text ──
  heroText: { alignItems: "center", gap: 6 },
  nameText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxl,
    color: C.textPrimary,
  },

  // ── Meta chips ──
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.accent,
  },

  // ── Personality badge ──
  personalityBadge: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  personalityText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.accent,
    letterSpacing: 0.5,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    width: SCREEN_W - C.Space.xl * 2,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: C.Radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  statIconChip: {
    width: 38,
    height: 38,
    borderRadius: C.Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.accent,
    lineHeight: C.FontSizes.xl * 1.1,
  },
  statLabel: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // ── Social pill ──
  socialsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  socialPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: C.Radii.full,
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 6,
  },
  socialPillText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.md,
    color: "#fff",
  },

  // ── Photos grid ──
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
    gap: 8,
  },
  photoGridImg: {
    width: (SCREEN_W - C.Space.xl * 2 - 8) / 2,
    height: (SCREEN_W - C.Space.xl * 2 - 8) / 2,
    borderRadius: C.Radii.xl,
  },

  // ── Interests card ──
  section: { marginHorizontal: C.Space.xl, marginBottom: C.Space.lg },
  sectionLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.accent,
  },
  tagMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accent,
    borderRadius: C.Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagMainText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },
  mainInterestCaption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  mainInterestCaptionText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },
  mainInterestCaptionStrong: {
    fontFamily: C.Fonts.bodyBold,
    color: C.accent,
  },

  // ── CTA bar ──
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(244,241,250,1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(124,58,237,0.1)",
    paddingTop: 12,
    paddingHorizontal: C.Space.xl,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
  },
  ctaBtnHalf: {
    flex: 1,
  },
  ctaBtn: {
    backgroundColor: C.accent,
    borderRadius: C.Radii.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnGreen: {
    backgroundColor: C.accentGreen,
    borderRadius: C.Radii.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    shadowColor: C.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaBtnSecondary: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  ctaBtnSecondaryText: {
    fontFamily: C.Fonts.bodyBold,
    color: C.accent,
    fontSize: C.FontSizes.base,
    letterSpacing: 0.2,
  },
  ctaBtnOutline: {
    borderRadius: C.Radii.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: C.textTertiary,
  },
  ctaBtnOutlineText: {
    fontFamily: C.Fonts.bodyBold,
    color: C.textTertiary,
    fontSize: C.FontSizes.base,
    letterSpacing: 0.2,
  },
  ctaBtnText: {
    fontFamily: C.Fonts.bodyBold,
    color: "#fff",
    fontSize: C.FontSizes.base,
    letterSpacing: 0.2,
  },
});
