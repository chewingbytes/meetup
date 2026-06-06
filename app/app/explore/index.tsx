/**
 * Explore screen — clay aesthetic.
 *
 * Layout:
 *   - Sticky header with search pill
 *   - "Hot Drops" — horizontal event card scroll
 *   - "Communities" — 2-column clay grid
 *   - "Discover" — vertical event list
 */

import MobileNav from "@/components/mobile-nav";
import { ClayBackground } from "@/components/ui/clay-background";
import { NeoLoader } from "@/components/ui/neo-loader";
import { C } from "@/theme/clay";
import { useCommunities } from "@/hooks/useCommunities";
import { useEvents } from "@/hooks/useEvents";
import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Flame, Hash, Search, Users, Zap } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PullToRefresh } from "@/components/pull-to-refresh";

const EVENT_GRADIENTS: Array<readonly [string, string]> = [
  C.Gradients.primary,
  C.Gradients.pink,
  C.Gradients.blue,
  C.Gradients.green,
  C.Gradients.amber,
];

const COMMUNITY_GRADIENTS: Array<readonly [string, string]> = [
  C.Gradients.blue,
  C.Gradients.coral,
  C.Gradients.green,
  C.Gradients.amber,
];

function EventMiniCard({ event, index, onPress }: { event: any; index: number; onPress: () => void }) {
  const grad = EVENT_GRADIENTS[index % EVENT_GRADIENTS.length];
  return (
    <TouchableOpacity onPress={onPress} style={styles.eventCard} activeOpacity={0.85}>
      {event.cover_image ? (
        <Image source={{ uri: event.cover_image }} style={styles.eventCardImg} resizeMode="cover" />
      ) : (
        <LinearGradient colors={grad} style={styles.eventCardImg}>
          <Text style={styles.eventCardInitial}>
            {event.name?.charAt(0)?.toUpperCase() ?? "E"}
          </Text>
        </LinearGradient>
      )}
      <View style={styles.eventCardBody}>
        <Text style={styles.eventCardName} numberOfLines={2}>{event.name}</Text>
        {event.location_text && (
          <Text style={styles.eventCardLocation} numberOfLines={1}>{event.location_text}</Text>
        )}
        <View style={styles.eventCardMeta}>
          {event.is_paid && event.price > 0 ? (
            <View style={[styles.eventCardBadge, { backgroundColor: C.amberMuted }]}>
              <Text style={[styles.eventCardBadgeText, { color: C.accentAmber }]}>${event.price}</Text>
            </View>
          ) : (
            <View style={[styles.eventCardBadge, { backgroundColor: C.greenMuted }]}>
              <Text style={[styles.eventCardBadgeText, { color: C.accentGreen }]}>Free</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isCheckingAuth } = useAuthRedirect("/main");

  const {
    events,
    isLoading: eventsLoading,
    isRefreshing: eventsRefreshing,
    refresh: refreshEvents,
  } = useEvents();

  const {
    communities,
    isLoading: communitiesLoading,
    isRefreshing: communitiesRefreshing,
    refresh: refreshCommunities,
  } = useCommunities();

  const isRefreshing = eventsRefreshing || communitiesRefreshing;
  const handleRefresh = async () => {
    await Promise.all([refreshEvents(), refreshCommunities()]);
  };

  const featuredEvents = useMemo(() =>
    events.filter((ev) => !ev.end_at || new Date(ev.end_at) >= new Date()).slice(0, 6),
    [events]
  );

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return events.filter((e) =>
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location_text?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  const filteredCommunities = useMemo(() => {
    if (!searchQuery.trim()) return communities.slice(0, 4);
    return communities.filter((c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [communities, searchQuery]);

  if (isCheckingAuth) {
    return (
      <View style={styles.loader}>
        <NeoLoader />
      </View>
    );
  }

  const showSearch = searchQuery.trim().length > 0;

  return (
    <ClayBackground>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchWrap}>
          <Search size={18} color={C.textSecondary} strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search hangouts & communities…"
            placeholderTextColor={C.textTertiary}
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 140 }]}
        refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {showSearch ? (
          /* ── Search results ── */
          <>
            {filteredEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Events</Text>
                {filteredEvents.map((event, i) => (
                  <EventMiniCard
                    key={event.id}
                    event={event}
                    index={i}
                    onPress={() => router.push(`/events/${event.id}` as any)}
                  />
                ))}
              </View>
            )}
            {filteredCommunities.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Communities</Text>
                {filteredCommunities.map((comm, i) => (
                  <TouchableOpacity
                    key={comm.id}
                    onPress={() => router.push(`/community/${comm.id}` as any)}
                    style={styles.commRow}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={COMMUNITY_GRADIENTS[i % COMMUNITY_GRADIENTS.length]}
                      style={styles.commRowIcon}
                    >
                      {comm.profile_image ? (
                        <Image source={{ uri: String(comm.profile_image) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                      ) : (
                        <Hash size={18} color="#fff" strokeWidth={2.5} />
                      )}
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commRowName} numberOfLines={1}>{comm.name}</Text>
                      <Text style={styles.commRowMeta}>{comm._count?.members ?? 0} members</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {filteredEvents.length === 0 && filteredCommunities.length === 0 && (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No results for "{searchQuery}"</Text>
              </View>
            )}
          </>
        ) : (
          /* ── Default discover view ── */
          <>
            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {[
                { label: "All", icon: Zap, active: true },
                { label: "Trending", icon: Flame, active: false },
                { label: "Free", icon: Hash, active: false },
                { label: "Groups", icon: Users, active: false },
              ].map((chip) => (
                <TouchableOpacity key={chip.label} style={[styles.chip, chip.active && styles.chipActive]}>
                  <chip.icon
                    size={13}
                    color={chip.active ? "#fff" : C.textSecondary}
                    strokeWidth={2.5}
                  />
                  <Text style={[styles.chipText, chip.active && styles.chipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Hot Drops */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Hot Drops</Text>
                <View style={styles.sectionBadge}>
                  <Flame size={12} color={C.accentPink} strokeWidth={2.5} />
                  <Text style={styles.sectionBadgeText}>New</Text>
                </View>
              </View>
              {eventsLoading ? (
                <View style={styles.miniLoader}><NeoLoader /></View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                >
                  {featuredEvents.map((event, i) => (
                    <EventMiniCard
                      key={event.id}
                      event={event}
                      index={i}
                      onPress={() => router.push(`/events/${event.id}` as any)}
                    />
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Communities */}
            {communities.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Communities</Text>
                <View style={styles.commGrid}>
                  {communities.slice(0, 4).map((comm, i) => (
                    <TouchableOpacity
                      key={comm.id}
                      onPress={() => router.push(`/community/${comm.id}` as any)}
                      style={styles.commCard}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={COMMUNITY_GRADIENTS[i % COMMUNITY_GRADIENTS.length]}
                        style={styles.commCardImg}
                      >
                        {comm.profile_image ? (
                          <Image source={{ uri: String(comm.profile_image) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                        ) : (
                          <Text style={styles.commCardInitial}>
                            {comm.name?.charAt(0)?.toUpperCase() ?? "#"}
                          </Text>
                        )}
                      </LinearGradient>
                      <Text style={styles.commCardName} numberOfLines={2}>{comm.name}</Text>
                      <Text style={styles.commCardMeta}>{comm._count?.members ?? 0} members</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* All events */}
            {events.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>All Hangouts</Text>
                {events.slice(0, 12).map((event, i) => (
                  <EventMiniCard
                    key={event.id}
                    event={event}
                    index={i}
                    onPress={() => router.push(`/events/${event.id}` as any)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <MobileNav active="explore" />
    </ClayBackground>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.canvas },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: C.Space.xl,
    paddingBottom: C.Space.xl,
    backgroundColor: "rgba(244,241,250,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
    gap: C.Space.lg,
  },
  title: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxxl,
    color: C.textPrimary,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: C.Space.md,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    paddingHorizontal: C.Space.lg,
    height: 50,
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

  scroll: { paddingBottom: 110, paddingHorizontal: C.Space.xl },

  chips: {
    gap: 8,
    paddingRight: 8,
    marginBottom: C.Space.xl,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.surface,
    borderRadius: C.Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: C.accent,
    shadowOpacity: 0.22,
  },
  chipText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  chipTextActive: { color: "#fff" },

  section: { marginBottom: C.Space.xxl },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: C.Space.lg },
  sectionTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    marginBottom: C.Space.lg,
  },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.pinkMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: C.Space.lg,
  },
  sectionBadgeText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 10,
    color: C.accentPink,
  },
  miniLoader: { alignItems: "center", paddingVertical: 24 },

  // Event card (horizontal scroll + vertical list)
  eventCard: {
    width: 220,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  eventCardImg: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  eventCardInitial: {
    fontFamily: C.Fonts.heading,
    fontSize: 40,
    color: "rgba(255,255,255,0.75)",
  },
  eventCardBody: {
    padding: C.Space.lg,
    gap: 4,
  },
  eventCardName: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    lineHeight: C.FontSizes.base * 1.3,
  },
  eventCardLocation: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },
  eventCardMeta: { flexDirection: "row", marginTop: 4 },
  eventCardBadge: {
    borderRadius: C.Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eventCardBadgeText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 10,
  },

  // Community grid
  commGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  commCard: {
    width: "47%",
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
    marginBottom: 4,
  },
  commCardImg: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  commCardInitial: {
    fontFamily: C.Fonts.heading,
    fontSize: 32,
    color: "rgba(255,255,255,0.8)",
  },
  commCardName: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    paddingHorizontal: C.Space.md,
    paddingTop: C.Space.md,
    lineHeight: C.FontSizes.base * 1.3,
  },
  commCardMeta: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    paddingHorizontal: C.Space.md,
    paddingBottom: C.Space.md,
    paddingTop: 2,
  },

  // Community list row (search results)
  commRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: C.Space.lg,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    padding: C.Space.lg,
    marginBottom: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  commRowIcon: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  commRowName: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  commRowMeta: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },

  emptySearch: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptySearchText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textSecondary,
  },
});
