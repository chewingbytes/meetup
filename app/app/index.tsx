import CreateEventWizard from "@/components/create-event-wizard";
import EventsListModal from "@/components/events-list-modal";
import MobileNav from "@/components/mobile-nav";
import { NeoLoader } from "@/components/ui/neo-loader";
import { useEvents } from "@/hooks/useEvents";
import { joinEvent } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { getAvatarPublicUrl } from "@/lib/supabaseStorage";
import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { EventProps } from "@/utils/types";
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;

const SINGAPORE = {
  latitude: 1.3521,
  longitude: 103.8198,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const MARKER_COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#C4B5FD",
  "#6EE7B7",
  "#93C5FD",
  "#F472B6",
];

function formatEventDate(iso?: string) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleDateString("en-SG", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatEventTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
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
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);

  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const mappableEvents = events.filter(
    (e) => e.location_lat != null && e.location_lng != null
  );

  const openSheet = useCallback(
    (event: EventProps) => {
      setSelectedEvent(event);
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    },
    [sheetAnim]
  );

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: SHEET_HEIGHT,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setSelectedEvent(null));
  }, [sheetAnim]);

  const handleJoin = async () => {
    if (!user || !selectedEvent) return;
    setJoiningId(selectedEvent.id);
    try {
      await joinEvent(user.id, selectedEvent.id);
      Alert.alert("Locked in!", `You're going to ${selectedEvent.name} 🎉`);
      closeSheet();
    } catch (e: any) {
      Alert.alert("Oops", e?.message || "Could not join event.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleWizardSuccess = useCallback(() => {
    setWizardVisible(false);
    Alert.alert("🎉 Event Created!", "Your event is now live on the map.");
  }, []);

  const avatarUrl = resolveAvatar(userProfile?.avatar_url);

  if (isCheckingAuth) {
    return (
      <View style={styles.loaderContainer}>
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
        {mappableEvents.map((event, idx) => {
          const color = MARKER_COLORS[idx % MARKER_COLORS.length];
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
              <View style={[styles.markerOuter, { backgroundColor: color }]}>
                <Text style={styles.markerText}>
                  {event.name?.charAt(0)?.toUpperCase() ?? "E"}
                </Text>
                <View style={styles.markerPin} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── Floating Top Navbar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.avatarButton}
          activeOpacity={0.8}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {userProfile?.username?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <View style={styles.onlinePip} />
        </TouchableOpacity>

        <View style={styles.wordmarkContainer}>
          <View style={styles.wordmarkBox}>
            <Text style={styles.wordmarkText}>HANGOUT</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <Bell size={20} color="#000" strokeWidth={3} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/friends" as any)}
            style={[styles.iconBtn, { backgroundColor: "#C4B5FD" }]}
            activeOpacity={0.8}
          >
            <UserPlus size={20} color="#000" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Empty map hint ── */}
      {!isLoading && mappableEvents.length === 0 && (
        <View style={styles.noMapEvents}>
          <View style={styles.noMapCard}>
            <Zap size={14} color="#000" strokeWidth={3} />
            <Text style={styles.noMapText}>NO PINS YET — CREATE ONE!</Text>
          </View>
        </View>
      )}

      {/* ── ALL EVENTS button + Create FAB ── */}
      <View
        style={[
          styles.bottomControls,
          { bottom: 75 + insets.bottom + 14 },
        ]}
      >
        {/* ALL EVENTS pill */}
        <TouchableOpacity
          onPress={() => setEventsModalVisible(true)}
          style={styles.allEventsBtn}
          activeOpacity={0.85}
        >
          <MapPin size={14} color="#000" strokeWidth={3} />
          <Text style={styles.allEventsBtnText}>ALL EVENTS</Text>
          {events.length > 0 && (
            <View style={styles.allEventsBadge}>
              <Text style={styles.allEventsBadgeText}>{events.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Create event FAB */}
        <TouchableOpacity
          onPress={() => setWizardVisible(true)}
          style={styles.fab}
          activeOpacity={0.85}
        >
          <Plus size={22} color="#000" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <View style={styles.mapLoader}>
          <View style={styles.mapLoaderCard}>
            <NeoLoader />
            <Text style={styles.mapLoaderText}>LOADING DROPS...</Text>
          </View>
        </View>
      )}

      {/* ── Bottom sheet tap-outside-to-close ── */}
      {selectedEvent && (
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: "transparent" }]}
          activeOpacity={1}
          onPress={closeSheet}
        />
      )}

      {/* ── Event Detail Bottom Sheet ── */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
        pointerEvents={selectedEvent ? "auto" : "none"}
      >
        {selectedEvent && (
          <>
            <View style={styles.sheetImageContainer}>
              {/* Colorful fallback always visible — image loads on top, no white flash */}
              <View
                style={[
                  styles.sheetImageFallback,
                  {
                    backgroundColor:
                      MARKER_COLORS[
                        events.findIndex((e) => e.id === selectedEvent.id) %
                          MARKER_COLORS.length
                      ],
                  },
                ]}
              >
                <Text style={styles.sheetImageInitial}>
                  {selectedEvent.name?.charAt(0)?.toUpperCase() ?? "E"}
                </Text>
              </View>
              {selectedEvent.cover_image && (
                <Image
                  source={{ uri: selectedEvent.cover_image }}
                  style={[styles.sheetImage, { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }]}
                  resizeMode="cover"
                />
              )}
              <TouchableOpacity onPress={closeSheet} style={styles.sheetClose}>
                <X size={18} color="#000" strokeWidth={3} />
              </TouchableOpacity>
              {selectedEvent.is_paid && (
                <View style={styles.sheetPriceBadge}>
                  <Text style={styles.sheetPriceText}>
                    ${selectedEvent.price ?? "?"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.sheetContent}>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle} numberOfLines={2}>
                  {selectedEvent.name}
                </Text>
                {selectedEvent.require_approval && (
                  <View style={styles.approvalBadge}>
                    <Text style={styles.approvalText}>APPLY</Text>
                  </View>
                )}
              </View>

              <View style={styles.sheetMeta}>
                <View style={styles.metaChip}>
                  <Calendar size={11} color="#000" strokeWidth={3} />
                  <Text style={styles.metaChipText}>
                    {formatEventDate(selectedEvent.start_at)}
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Clock size={11} color="#000" strokeWidth={3} />
                  <Text style={styles.metaChipText}>
                    {formatEventTime(selectedEvent.start_at)}
                  </Text>
                </View>
                {selectedEvent.capacity != null && (
                  <View style={[styles.metaChip, { backgroundColor: "#C4B5FD" }]}>
                    <Users size={11} color="#000" strokeWidth={3} />
                    <Text style={styles.metaChipText}>
                      {selectedEvent.capacity} SPOTS
                    </Text>
                  </View>
                )}
              </View>

              {selectedEvent.location_text && (
                <View style={styles.locationRow}>
                  <MapPin size={13} color="#FF6B6B" strokeWidth={3} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {selectedEvent.location_text}
                  </Text>
                </View>
              )}

              {selectedEvent.description_md && (
                <Text style={styles.sheetDesc} numberOfLines={2}>
                  {selectedEvent.description_md.replace(/[#*_`]/g, "")}
                </Text>
              )}

              <View style={styles.sheetCTA}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/events/${selectedEvent.id}` as any)
                  }
                  style={styles.detailBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.detailBtnText}>DETAILS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleJoin}
                  disabled={joiningId === selectedEvent.id}
                  style={[
                    styles.joinBtn,
                    joiningId === selectedEvent.id && styles.joinBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.joinBtnText}>
                    {joiningId === selectedEvent.id
                      ? "JOINING..."
                      : selectedEvent.require_approval
                      ? "APPLY NOW"
                      : "JOIN DROP"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Animated.View>

      {/* ── Events list modal ── */}
      <EventsListModal
        visible={eventsModalVisible}
        events={events}
        onClose={() => setEventsModalVisible(false)}
        onEventPress={openSheet}
      />

      {/* ── Create event wizard ── */}
      <CreateEventWizard
        visible={wizardVisible}
        onClose={() => setWizardVisible(false)}
        onSuccess={handleWizardSuccess}
      />

      {/* ── Bottom Nav ── */}
      <MobileNav active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFDF5",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDF5",
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
    paddingBottom: 12,
    backgroundColor: "#FFFDF5",
    borderBottomWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  avatarButton: { position: "relative" },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#000",
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#FFD93D",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
  },
  onlinePip: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: "#6EE7B7",
    borderWidth: 2,
    borderColor: "#000",
  },
  wordmarkContainer: {
    flex: 1,
    alignItems: "center",
  },
  wordmarkBox: {
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    position: "relative",
  },
  wordmarkText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#000",
    textTransform: "uppercase",
  },
  wordmarkAccent: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: "100%",
    height: "100%",
    zIndex: -1,
    borderWidth: 3,
    borderColor: "#000",
  },
  topActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#FFD93D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FF6B6B",
    borderWidth: 1.5,
    borderColor: "#000",
  },

  // ── Markers ──
  markerOuter: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  markerText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
  },
  markerPin: {
    position: "absolute",
    bottom: -8,
    width: 3,
    height: 8,
    backgroundColor: "#000",
  },

  // ── Empty map hint ──
  noMapEvents: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  noMapCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFD93D",
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  noMapText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ── Bottom controls (ALL EVENTS + FAB) ──
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFDF5",
    borderWidth: 4,
    borderColor: "#000",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  allEventsBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  allEventsBadge: {
    backgroundColor: "#FF6B6B",
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  allEventsBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000",
  },
  fab: {
    width: 56,
    height: 56,
    backgroundColor: "#FF6B6B",
    borderWidth: 4,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },

  // ── Map loader ──
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  mapLoaderCard: {
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#000",
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  mapLoaderText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
  },

  // ── Backdrop ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 29,
  },

  // ── Bottom Sheet ──
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "#FFFDF5",
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: "#000",
    zIndex: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 20,
  },
  sheetImageContainer: {
    height: SHEET_HEIGHT * 0.38,
    borderBottomWidth: 4,
    borderColor: "#000",
    position: "relative",
  },
  sheetImage: { width: "100%", height: "100%" },
  sheetImageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetImageInitial: {
    fontSize: 64,
    fontWeight: "900",
    color: "#000",
  },
  sheetClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  sheetPriceBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FFD93D",
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sheetPriceText: { fontSize: 14, fontWeight: "900", color: "#000" },
  sheetContent: { flex: 1, padding: 16, gap: 10 },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  approvalBadge: {
    backgroundColor: "#C4B5FD",
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  approvalText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
  },
  sheetMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#fff",
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  sheetDesc: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
    lineHeight: 18,
  },
  sheetCTA: { flexDirection: "row", gap: 10, marginTop: "auto" },
  detailBtn: {
    flex: 1,
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  joinBtn: {
    flex: 2,
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#FF6B6B",
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  joinBtnDisabled: {
    backgroundColor: "#ccc",
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  joinBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
