/**
 * Home screen — full-screen map with clay chrome.
 *
 * Map stays full-screen underneath everything.
 * All UI elements (top bar, sheet, FAB, nav) float ABOVE the map
 * as clay-styled surfaces with appropriate shadows.
 *
 * Clay event pins: rounded squares that feel like soft clay stickers
 * pressed onto the map surface.
 */

import CreateEventWizard from "@/components/create-event-wizard";
import EventsListModal from "@/components/events-list-modal";
import MobileNav from "@/components/mobile-nav";
import { NeoLoader } from "@/components/ui/neo-loader";
import { useEvents } from "@/hooks/useEvents";
import { useEventStore } from "@/lib/stores/eventStore";
import {
  checkEventMembership,
  deleteEvent,
  getEvent,
  joinEvent,
  leaveEvent,
} from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { getAvatarPublicUrl } from "@/lib/supabaseStorage";
import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { EventProps } from "@/utils/types";
import { getCategoryConfig } from "@/utils/categories";
import { C } from "@/theme/clay";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  Bell,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  UserPlus,
  X,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SHEET_WIDTH = SCREEN_WIDTH * 0.88;
const SHEET_LEFT = SCREEN_WIDTH * 0.06;
const WIZARD_HEIGHT = SCREEN_HEIGHT * 0.74;

// ── Time label helper ──────────────────────────────────────────────────────
// Returns {day, countdown} joined in the UI as "day  ·  countdown" (countdown may be "")
// "No time set" = midnight (00:00) meaning the user only picked a date in the wizard.
function getEventTimeLabel(startAt?: string): { day: string; countdown: string } {
  if (!startAt) return { day: "", countdown: "" };

  const now = new Date();
  const start = new Date(startAt);
  const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0;

  const isToday = start.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = start.toDateString() === tomorrow.toDateString();

  const dayName = isToday ? "today" : isTomorrow
    ? "tomorrow"
    : start.toLocaleDateString("en-SG", { weekday: "long" }).toLowerCase();

  if (!hasTime) {
    // Date only — just say when, no time breakdown
    return { day: isToday ? "today" : `on ${dayName}`, countdown: "" };
  }

  if (isToday) {
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return { day: "now", countdown: "" };
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return { day: "today", countdown: `starts in ${mins}m` };
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return { day: "today", countdown: `starts in ${hrs}h${remMins > 0 ? ` ${remMins}m` : ""}` };
  }

  // Another day with a specific time set
  const timeStr = start.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" });
  return { day: `${dayName}`, countdown: `at ${timeStr}` };
}

// ── MBTI helpers ──────────────────────────────────────────────────────────
const MBTI_NAMES: Record<string, string> = {
  INTJ: "The Architect",   INTP: "The Logician",
  ENTJ: "The Commander",   ENTP: "The Debater",
  INFJ: "The Advocate",    INFP: "The Mediator",
  ENFJ: "The Protagonist", ENFP: "The Campaigner",
  ISTJ: "The Logistician", ISFJ: "The Defender",
  ESTJ: "The Executive",   ESFJ: "The Consul",
  ISTP: "The Virtuoso",    ISFP: "The Adventurer",
  ESTP: "The Entrepreneur",ESFP: "The Entertainer",
};
// Analyst=violet, Diplomat=green, Sentinel=blue, Explorer=amber
function mbtiGradient(type: string): readonly [string, string] {
  const t = type.toUpperCase();
  if (["INTJ","INTP","ENTJ","ENTP"].includes(t)) return ["#8B5CF6","#6D28D9"];
  if (["INFJ","INFP","ENFJ","ENFP"].includes(t)) return ["#10B981","#059669"];
  if (["ISTJ","ISFJ","ESTJ","ESFJ"].includes(t)) return ["#3B82F6","#1D4ED8"];
  return ["#F59E0B","#D97706"]; // Explorers
}

const SINGAPORE = {
  latitude: 1.3521,
  longitude: 103.8198,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// Clay gradient palette for event pins
const PIN_GRADIENTS: Array<readonly [string, string]> = [
  C.Gradients.primary,
  C.Gradients.pink,
  C.Gradients.blue,
  C.Gradients.green,
  C.Gradients.amber,
  C.Gradients.coral,
];

function formatEventDate(iso?: string) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-SG", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatEventTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveAvatar(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    return getAvatarPublicUrl(url);
  } catch {
    return null;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isCheckingAuth } = useAuthRedirect("/main");
  const { user, userProfile } = useAuth();
  const { events, isLoading } = useEvents();

  const [selectedEvent, setSelectedEvent] = useState<EventProps | null>(null);
  const [sheetParticipants, setSheetParticipants] = useState<any[]>([]);
  const [sheetJoined, setSheetJoined] = useState(false);
  const [sheetIsOrganizer, setSheetIsOrganizer] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [sheetOrganizerName, setSheetOrganizerName] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [newParticipantId, setNewParticipantId] = useState<string | null>(null);
  const newParticipantAnim = useRef(new Animated.Value(0)).current;

  const SHEET_OFF = SCREEN_HEIGHT * 0.7;
  const sheetAnim = useRef(new Animated.Value(SHEET_OFF)).current;
  const wizardAnim = useRef(new Animated.Value(WIZARD_HEIGHT)).current;

  const openWizard = useCallback(() => {
    setWizardVisible(true);
    Animated.spring(wizardAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
    }).start();
  }, [wizardAnim]);

  const closeWizard = useCallback(() => {
    Animated.timing(wizardAnim, {
      toValue: WIZARD_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setWizardVisible(false));
  }, [wizardAnim]);

  const mappableEvents = events.filter(
    (e) => e.location_lat != null && e.location_lng != null,
  );

  const openSheet = useCallback(
    (event: EventProps) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedEvent(event);
      setSheetParticipants([]);
      setSheetJoined(false);
      setSheetIsOrganizer(false);
      setSheetOrganizerName("");
      setSheetLoading(true);
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
      Promise.all([
        getEvent(event.id).catch(() => null),
        user ? checkEventMembership(user.id, event.id).catch(() => null) : null,
      ]).then(([detail, membership]) => {
        if (detail?.participants?.length) {
          setSheetParticipants(detail.participants);
          const org = detail.participants.find(
            (p: any) => p.user_id === event.organizer_id || p.id === event.organizer_id,
          );
          setSheetOrganizerName(org?.username ?? org?.display_name ?? "Someone");
        }
        if (membership?.isMember) setSheetJoined(true);
        if (membership?.isOrganizer) setSheetIsOrganizer(true);
        setSheetLoading(false);
      });
    },
    [sheetAnim, user],
  );

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: SHEET_OFF,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setSelectedEvent(null));
  }, [sheetAnim, SHEET_OFF]);

  const handleJoin = async () => {
    if (!user || !selectedEvent) return;
    setJoiningId(selectedEvent.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await joinEvent(user.id, selectedEvent.id);
      setSheetJoined(true);
      // Re-fetch fresh participant list so the user's tile appears
      const detail = await getEvent(selectedEvent.id).catch(() => null);
      if (detail?.participants?.length) {
        setSheetParticipants(detail.participants);
        // Find the current user's entry to animate it in
        const myEntry = detail.participants.find(
          (p: any) => p.id === user.id || p.user_id === user.id,
        );
        if (myEntry) {
          setNewParticipantId(myEntry.id ?? user.id);
          newParticipantAnim.setValue(0);
          Animated.spring(newParticipantAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 14,
            stiffness: 200,
          }).start();
        }
      }
    } catch (e: any) {
      Alert.alert("Oops", e?.message || "Could not join hangout.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleDeleteEvent = useCallback(() => {
    if (!user || !selectedEvent) return;
    Alert.alert(
      "Delete hangout?",
      `"${selectedEvent.name}" will be permanently removed, all attendees will be kicked, and the chat will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Are you sure?", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes, delete it",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deleteEvent(selectedEvent.id, user.id);
                    // Close sheet FIRST — clears selectedEvent before the store
                    // refreshes, preventing a re-render against the deleted event.
                    closeSheet();
                    useEventStore.getState().fetchEvents(true);
                  } catch (e: any) {
                    Alert.alert(
                      "Error",
                      e?.message || "Could not delete hangout.",
                    );
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  }, [user, selectedEvent, closeSheet]);

  const handleLeave = useCallback(() => {
    if (!user || !selectedEvent) return;
    Alert.alert(
      "Leave hangout?",
      `You'll be removed from ${selectedEvent.name} and its chat.`,
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              // Find my tile and animate it out first
              const myEntry = sheetParticipants.find(
                (p: any) => p.id === user.id || p.user_id === user.id,
              );
              if (myEntry) {
                const myId = myEntry.id ?? user.id;
                setNewParticipantId(myId);
                newParticipantAnim.setValue(1);
                await new Promise<void>((resolve) => {
                  Animated.timing(newParticipantAnim, {
                    toValue: 0,
                    duration: 280,
                    useNativeDriver: true,
                  }).start(() => resolve());
                });
              }

              await leaveEvent(user.id, selectedEvent.id);
              setSheetJoined(false);
              setNewParticipantId(null);

              // Re-fetch fresh participant list
              const detail = await getEvent(selectedEvent.id).catch(() => null);
              if (detail?.participants) {
                setSheetParticipants(detail.participants);
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Could not leave hangout.");
              setNewParticipantId(null);
            }
          },
        },
      ],
    );
  }, [user, selectedEvent, sheetParticipants, newParticipantAnim]);

  const handleWizardSuccess = useCallback(() => {
    closeWizard();
    Alert.alert("Hangout created!", "Your hangout is now live on the map.");
  }, [closeWizard]);

  const avatarUrl = resolveAvatar(userProfile?.avatar_url);

  if (isCheckingAuth) {
    return (
      <View style={styles.loader}>
        <NeoLoader />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Full-screen Map ── */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={SINGAPORE}
        showsUserLocation
        showsCompass={false}
        showsScale={false}
      >
        {mappableEvents.map((event) => {
          const cat = getCategoryConfig((event as any).category);
          const grad = cat.gradient;
          const { Icon: CatIcon } = cat;
          const orgAvatar = resolveAvatar((event as any).organizer_avatar_url);
          const orgInitial = ((event as any).organizer_username as string | null)
            ?.charAt(0)?.toUpperCase() ?? "?";
          return (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.location_lat!,
                longitude: event.location_lng!,
              }}
              onPress={() => openSheet(event)}
              tracksViewChanges={false}
            >
              <View style={styles.pinWrap}>
                {/* Main bubble */}
                <View style={styles.pinBubbleWrap}>
                  <LinearGradient
                    colors={grad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.pinBubble}
                  >
                    <CatIcon size={16} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>

                  {/* Organizer avatar sticker — bottom-right */}
                  <View style={styles.pinOrgAvatar}>
                    {orgAvatar ? (
                      <Image
                        source={{ uri: orgAvatar }}
                        style={styles.pinOrgAvatarImg}
                      />
                    ) : (
                      <LinearGradient
                        colors={C.Gradients.primary}
                        style={styles.pinOrgAvatarImg}
                      >
                        <Text style={styles.pinOrgInitial}>{orgInitial}</Text>
                      </LinearGradient>
                    )}
                  </View>
                </View>

                {/* Pin tail */}
                <View style={[styles.pinTail, { backgroundColor: grad[1] }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── Floating Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* Avatar button */}
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.avatarBtn}
          activeOpacity={0.8}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <LinearGradient
              colors={C.Gradients.primary}
              style={styles.avatarFallback}
            >
              <Text style={styles.avatarInitial}>
                {userProfile?.username?.charAt(0)?.toUpperCase() ?? "H"}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.onlinePip} />
        </TouchableOpacity>

        {/* Wordmark */}
        <View style={styles.wordmarkWrap}>
          <LinearGradient
            colors={["rgba(255,255,255,0.92)", "rgba(255,255,255,0.80)"]}
            style={styles.wordmark}
          >
            <Image
              source={require("../assets/images/homescreenlogo.png")}
              style={styles.wordmarkLogo}
              resizeMode="contain"
            />
            <Text style={styles.wordmarkText}>Soonest</Text>
          </LinearGradient>
        </View>

        {/* Actions */}
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => router.push("/notifications" as any)}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <Bell size={18} color={C.textPrimary} strokeWidth={2.5} />
            <View style={styles.notifPip} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/friends" as any)}
            style={[styles.iconBtn, { backgroundColor: C.accentMuted }]}
            activeOpacity={0.8}
          >
            <UserPlus size={18} color={C.accent} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Empty map hint ── */}
      {!isLoading && mappableEvents.length === 0 && (
        <View style={styles.emptyHint}>
          <View style={styles.emptyHintCard}>
            <Zap size={14} color={C.accent} strokeWidth={2.5} />
            <Text style={styles.emptyHintText}>
              No hangouts yet — create one!
            </Text>
          </View>
        </View>
      )}

      {/* ── Bottom Controls (ALL EVENTS + FAB) ── */}
      <View style={[styles.bottomControls, { bottom: 88 + insets.bottom }]}>
        <TouchableOpacity
          onPress={() => setEventsModalVisible(true)}
          activeOpacity={0.85}
          style={styles.allEventsBtn}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.95)", "rgba(250,248,255,0.90)"]}
            style={styles.allEventsBtnInner}
          >
            <MapPin size={15} color={C.accent} strokeWidth={2.5} />
            <Text style={styles.allEventsBtnText}>all hangouts</Text>
            {events.length > 0 && (
              <View style={styles.eventsBadge}>
                <Text style={styles.eventsBadgeText}>{events.length}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Create FAB */}
        <Pressable onPress={openWizard} style={styles.fabWrap}>
          <LinearGradient
            colors={C.Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      </View>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <View style={styles.mapLoader}>
          <View style={styles.mapLoaderCard}>
            <NeoLoader />
            <Text style={styles.mapLoaderText}>Loading hangouts…</Text>
          </View>
        </View>
      )}

      {/* ── Transparent tap-outside-to-close ── */}
      {selectedEvent && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { zIndex: 29 }]}
          activeOpacity={1}
          onPress={closeSheet}
        />
      )}

      {/* ── Event popup card ── */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
        pointerEvents={selectedEvent ? "auto" : "none"}
      >
        {selectedEvent && sheetLoading && (
          <View style={styles.sheetLoader}>
            <NeoLoader />
          </View>
        )}
        {selectedEvent && !sheetLoading && (() => {
          const catConfig = getCategoryConfig((selectedEvent as any).category);
          const CatIcon = catConfig.Icon;
          const { day, countdown } = getEventTimeLabel(selectedEvent.start_at);
          return (
            <>
              {/* Close */}
              <TouchableOpacity onPress={closeSheet} style={styles.sheetClose}>
                <X size={15} color={C.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Category icon */}
              <View style={styles.sheetCatRow}>
                <LinearGradient
                  colors={catConfig.gradient as readonly [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sheetCatIcon}
                >
                  <CatIcon size={20} color="#fff" strokeWidth={2} />
                </LinearGradient>
                {selectedEvent.require_approval && (
                  <View style={styles.applyBadge}>
                    <Text style={styles.applyText}>Apply to join</Text>
                  </View>
                )}
              </View>

              {/* Headline */}
              <View style={styles.sheetHeadline}>
                <Text style={styles.sheetWantsTo} numberOfLines={1}>
                  {sheetOrganizerName || "Someone"} wants to
                </Text>
                <Text style={styles.sheetTitle} numberOfLines={2}>
                  {selectedEvent.name}
                </Text>
                {(day || countdown) && (
                  <Text style={styles.sheetTimeLine}>
                    {day}{countdown ? ` · ${countdown}` : ""}
                  </Text>
                )}
              </View>

              {/* Location */}
              {/* {selectedEvent.location_text && (
                <View style={styles.locationRow}>
                  <MapPin size={12} color={C.accentPink} strokeWidth={2.5} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {selectedEvent.location_text}
                  </Text>
                </View>
              )} */}

              {/* Participants */}
              <View style={styles.sheetPeopleSection}>
                <Text style={styles.sheetPeopleCount}>
                  {sheetParticipants.length > 0
                    ? `${sheetParticipants.length} ${sheetParticipants.length === 1 ? "person" : "people"} going`
                    : "Be the first to join!"}
                </Text>
                {sheetParticipants.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sheetPeopleList}
                  >
                    {sheetParticipants.map((p, i) => {
                      const mbti = p.personality_type?.toUpperCase() ?? null;
                      const isNew = (p.id ?? p.user_id) === newParticipantId;
                      const tileStyle = isNew
                        ? {
                            opacity: newParticipantAnim,
                            transform: [
                              {
                                scale: newParticipantAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.4, 1],
                                }),
                              },
                              {
                                translateY: newParticipantAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [12, 0],
                                }),
                              },
                            ],
                          }
                        : undefined;
                      const Tile = isNew ? Animated.View : View;
                      return (
                        <Tile key={p.id ?? i} style={[styles.sheetPersonItem, tileStyle]}>
                          {/* Avatar with MBTI sticker overlaid */}
                          <View style={styles.sheetPersonAvatarWrap}>
                            <LinearGradient
                              colors={PIN_GRADIENTS[i % PIN_GRADIENTS.length]}
                              style={styles.sheetPersonAvatar}
                            >
                              {p.avatar_url ? (
                                <Image
                                  source={{ uri: p.avatar_url }}
                                  style={StyleSheet.absoluteFillObject}
                                />
                              ) : (
                                <Text style={styles.sheetPersonInitial}>
                                  {p.username?.charAt(0)?.toUpperCase() ?? "?"}
                                </Text>
                              )}
                            </LinearGradient>
                            {mbti && (
                              <LinearGradient
                                colors={mbtiGradient(mbti)}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.mbtiSticker}
                              >
                                <Text style={styles.mbtiStickerText}>{mbti}</Text>
                              </LinearGradient>
                            )}
                          </View>
                          <Text style={styles.sheetPersonName} numberOfLines={1}>
                            {p.username ?? "User"}
                          </Text>
                        </Tile>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* CTA */}
              {sheetIsOrganizer ? (
                <TouchableOpacity
                  onPress={handleDeleteEvent}
                  style={styles.deleteCta}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteCtaText}>Delete Hangout</Text>
                </TouchableOpacity>
              ) : sheetJoined ? (
                <View style={styles.ctaRow}>
                  {/* Go to Chat */}
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/chat/[channelId]", params: { channelId: selectedEvent.id, channelName: selectedEvent.name } })}
                    style={[styles.joinCta, { flex: 1 }]}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={C.Gradients.green}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.joinCtaGrad}
                    >
                      <Text style={styles.joinCtaText}>Go to Chat</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Leave */}
                  <TouchableOpacity
                    onPress={handleLeave}
                    style={styles.leaveCta}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.leaveCtaText}>Leave</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleJoin}
                  disabled={joiningId === selectedEvent.id}
                  style={[styles.joinCta, joiningId === selectedEvent.id && { opacity: 0.7 }]}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={C.Gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.joinCtaGrad}
                  >
                    <Text style={styles.joinCtaText}>
                      {joiningId === selectedEvent.id
                        ? "Joining…"
                        : selectedEvent.require_approval
                          ? "Apply Now"
                          : "Join Chat"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          );
        })()}
      </Animated.View>

      {/* ── Modals ── */}
      <EventsListModal
        visible={eventsModalVisible}
        events={events}
        onClose={() => setEventsModalVisible(false)}
        onEventPress={openSheet}
      />
      {/* Wizard — rendered as a native Animated.View so the map stays visible + interactive above it */}
      {wizardVisible && (
        <View style={styles.wizardWrapper} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.wizardAnimated,
              { transform: [{ translateY: wizardAnim }] },
            ]}
          >
            <CreateEventWizard
              onClose={closeWizard}
              onSuccess={handleWizardSuccess}
            />
          </Animated.View>
        </View>
      )}

      <MobileNav active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.canvas,
  },

  // ── Top Bar ──
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarBtn: { position: "relative" },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.full,
    borderWidth: 2,
    borderColor: "rgba(124,58,237,0.20)",
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: C.Fonts.heading,
    fontSize: 18,
    color: "#fff",
  },
  onlinePip: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentGreen,
    borderWidth: 2,
    borderColor: "#fff",
  },
  wordmarkWrap: { flex: 1, alignItems: "center" },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  wordmarkLogo: {
    width: 35,
    height: 35,
  },
  wordmarkText: {
    fontFamily: C.Fonts.heading,
    fontSize: 26,
    fontStyle: "italic",
    color: C.textPrimary,
  },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: C.Radii.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  notifPip: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentPink,
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  // ── Pins ──
  pinWrap: { alignItems: "center" },
  pinBubbleWrap: {
    position: "relative",
    width: 50,
    height: 50,
  },
  pinBubble: {
    width: 50,
    height: 50,
    borderRadius: C.Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderTopColor: "rgba(255,255,255,0.50)",
    borderLeftColor: "rgba(255,255,255,0.30)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  pinOrgAvatar: {
    position: "absolute",
    bottom: -5,
    right: -2,
    width: 25,
    height: 25,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 3,
  },
  pinOrgAvatarImg: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  pinOrgInitial: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 7,
    color: "#fff",
  },
  pinText: {
    fontFamily: C.Fonts.heading,
    fontSize: 15,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pinTail: {
    width: 3,
    height: 7,
    borderRadius: 2,
    marginTop: 1,
    opacity: 0.7,
  },

  // ── Empty hint ──
  emptyHint: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  emptyHintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: C.Radii.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyHintText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },

  // ── Bottom Controls ──
  bottomControls: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 15,
  },
  allEventsBtn: {
    flex: 1,
    borderRadius: C.Radii.xl,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  allEventsBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.95)",
    borderLeftColor: "rgba(255,255,255,0.70)",
    borderRightColor: "rgba(255,255,255,0.30)",
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  allEventsBtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  eventsBadge: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eventsBadgeText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
    color: C.accent,
  },
  fabWrap: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 10,
    borderRadius: C.Radii.full,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.50)",
    borderLeftColor: "rgba(255,255,255,0.30)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.08)",
  },

  // ── Map Loader ──
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  mapLoaderCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: C.Radii.xl,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  mapLoaderText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },

  // ── Event popup card ──
  sheet: {
    position: "absolute",
    bottom: 92,
    left: SHEET_LEFT,
    width: SHEET_WIDTH,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xxl,
    zIndex: 30,
    padding: C.Space.xl,
    gap: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  sheetLoader: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetClose: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    backgroundColor: C.canvas,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  sheetCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  sheetCatIcon: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  applyBadge: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  applyText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
    color: C.accent,
  },
  sheetHeadline: {
    gap: 4,
  },
  sheetWantsTo: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.lg,
    color: C.textSecondary,
  },
  sheetPersonAvatarWrap: {
    width: 44,
    height: 44,
    // overflow visible so the sticker can peek outside the circle
  },
  mbtiSticker: {
    position: "absolute",
    bottom: -5,
    right: -8,
    borderRadius: C.Radii.md,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: C.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  mbtiStickerText: {
    fontFamily: C.Fonts.heading,
    fontSize: 8,
    color: "#fff",
    letterSpacing: 0.6,
  },
  sheetTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    lineHeight: C.FontSizes.xl * 1.15,
    marginTop: 2,
  },
  sheetTimeLine: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.accent,
    marginTop: 1,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  sheetPeopleSection: {
    gap: 8,
  },
  sheetPeopleCount: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
  },
  sheetPeopleList: {
    gap: 12,
    paddingVertical: 2,
  },
  sheetPersonItem: {
    alignItems: "center",
    gap: 4,
    width: 54,
  },
  sheetPersonAvatar: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: C.surface,
  },
  sheetPersonInitial: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 16,
    color: "#fff",
  },
  sheetPersonName: {
    fontFamily: C.Fonts.body,
    fontSize: 10,
    color: C.textSecondary,
    textAlign: "center",
    width: 54,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  leaveCta: {
    height: 52,
    borderRadius: C.Radii.xl,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: C.Space.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveCtaText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#DC2626",
  },
  joinCta: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 7,
    marginTop: 2,
  },
  joinCtaGrad: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
    borderLeftColor: "rgba(255,255,255,0.25)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  joinCtaText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#fff",
    letterSpacing: 0.3,
  },
  deleteCta: {
    height: 52,
    borderRadius: C.Radii.xl,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  deleteCtaText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.error,
  },
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  rowContainer: {
    flexDirection: "row", // Establishes a horizontal row layout
    alignItems: "center", // Centers items vertically within the row
  },
  image: {
    width: 50, // Image must have an explicit width
    height: 50, // Image must have an explicit height
    marginRight: 10, // Creates space between image and text
  },
  text: {
    fontSize: 16,
    color: "#333",
    flexShrink: 1,
  },

  // Wizard bottom-sheet container — pointerEvents "box-none" on the wrapper
  // lets map touches pass through the transparent area above the sheet
  wizardWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  wizardAnimated: {
    // Width/height comes from the wizard's own sheet style
    width: "100%",
  },
});
