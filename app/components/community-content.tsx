import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Lock,
  Globe,
  Hash,
  Send,
  ChevronRight,
  X,
  Plus,
  LogOut,
} from "lucide-react-native";
import { Calendar } from "react-native-calendars";
import { CommunityProps, EventProps } from "@/utils/types";
import { LinearGradient } from "expo-linear-gradient";
import { useEvents } from "@/hooks/useEvents";
import EventCard from "@/components/event-card";
import ChatDrawer from "@/components/chat-drawer";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/authContext";
import { leaveCommunity } from "@/lib/api";
import { PullToRefresh } from "./pull-to-refresh";
import { useCommunities } from "@/hooks/useCommunities";
import { useChatNotificationStore } from "@/lib/stores/chatNotificationStore";

interface CommunityContentProps {
  community: CommunityProps | null;
}

// Mock chat messages
const mockMessages = [
  { id: "1", user: "Alex", text: "Hey everyone!", time: "10:30 AM" },
  { id: "2", user: "Jordan", text: "How's it going?", time: "10:32 AM" },
  { id: "3", user: "Casey", text: "All good here!", time: "10:35 AM" },
];

export default function CommunityContent({ community }: CommunityContentProps) {
  const drawerWidth = 320;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isLeavingCommunity, setIsLeavingCommunity] = useState(false);
  const slide = useRef(new Animated.Value(drawerWidth)).current;
  const router = useRouter();
  const { user } = useAuth();
  const unreadByChannel = useChatNotificationStore((s) => s.unreadByChannel);

  // Events
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

  const upcomingEvents: EventProps[] = useMemo(() => {
    if (!community) return [];
    return events
      .filter(
        (ev) =>
          ev.community_id === community.id &&
          (!ev.start_at || new Date(ev.start_at) >= new Date()),
      )
      .sort(
        (a, b) =>
          new Date(a.start_at || 0).getTime() -
          new Date(b.start_at || 0).getTime(),
      );
  }, [events, community]);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const isRefreshing = eventsRefreshing || communitiesRefreshing;
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );

  const handleRefresh = async () => {
    await Promise.all([refreshEvents(), refreshCommunities()]);
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventProps[]> = {};
    upcomingEvents.forEach((ev) => {
      if (!ev.start_at) return;
      const dateKey = ev.start_at.includes("T")
        ? ev.start_at.split("T")[0]
        : new Date(ev.start_at).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    });
    return map;
  }, [upcomingEvents]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.keys(eventsByDate).forEach((date) => {
      marks[date] = {
        marked: true,
        dotColor: "#4f46e5",
      };
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: "#4f46e5",
      };
    }
    return marks;
  }, [eventsByDate, selectedDate]);

  const hasEventsInMonth = useMemo(() => {
    if (!selectedMonth) return false;
    return Object.keys(eventsByDate).some((date) =>
      date.startsWith(selectedMonth),
    );
  }, [eventsByDate, selectedMonth]);

  // Drawer animation
  useEffect(() => {
    Animated.timing(slide, {
      toValue: drawerOpen ? 0 : drawerWidth,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, slide]);

  const handleLeaveCommunity = async () => {
    if (!user || !community) {
      Alert.alert("Error", "User or community not found");
      return;
    }

    Alert.alert(
      "Leave Community",
      "Are you sure you want to leave this community?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Leave",
          onPress: async () => {
            try {
              setIsLeavingCommunity(true);
              await leaveCommunity(user.id, community.id);
              console.log("✅ Left community:", community.id);
              Alert.alert("Success", "You have left this community");
              setDrawerOpen(false);
              router.push("/home");
            } catch (err: any) {
              console.error("❌ Failed to leave community:", err);
              Alert.alert("Error", err.message || "Failed to leave community");
            } finally {
              setIsLeavingCommunity(false);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  if (!community) {
    return (
      <LinearGradient
        colors={["#09090b", "#1a1a1a"]}
        className="flex-1 items-center justify-center"
      >
        <Text className="text-white/50 text-lg">No communities joined</Text>
        <Text className="text-white/30 text-sm mt-2">
          Join or create a community to get started
        </Text>
      </LinearGradient>
    );
  }

  const unreadCount = community?.id ? unreadByChannel[community.id] || 0 : 0;

  return (
    <View style={{ flex: 1 }}>
      <View
        className="flex-1 flex-col"
        style={{ flex: 1, borderTopLeftRadius: 20, overflow: "hidden", backgroundColor: "#1c1c1e" }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <PullToRefresh
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {/* Top bar with name + drawer toggle */}
          <View className="px-6 pt-7 items-start flex-col-reverse gap-1">
            <View className="">
              <TouchableOpacity
                onPress={() => setDrawerOpen(true)}
                className="flex-row items-center gap-2"
              >
                <Text className="text-white text-3xl font-bold">
                  {community.name}
                </Text>
                <ChevronRight size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-2">
              {community.privacy_mode ? (
                <>
                  <Lock size={16} color="#f59e0b" />
                  <Text className="text-amber-500 text-sm">Private</Text>
                </>
              ) : (
                <>
                  <Globe size={16} color="#10b981" />
                  <Text className="text-emerald-500 text-sm">Public</Text>
                </>
              )}
            </View>
          </View>

          {/* Chat Section */}
          <TouchableOpacity
            className="px-6 py-12"
            onPress={() => setChatDrawerOpen(true)}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Hash size={20} color="#fff" />
              <Text className="text-white font-bold text-lg">general</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View className="px-6 pb-12">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-bold text-lg">
                Upcoming Events
              </Text>

              {user && (
                <TouchableOpacity
                  onPress={() => {
                    if (!community?.id) return;
                    router.push({
                      pathname: "/create-event/advanced",
                      params: {
                        community_id: community.id,
                        communityName: community.name,
                      },
                    });
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: "#4f46e5",
                  }}
                >
                  <Plus size={16} color="#fff" />
                  <Text
                    className="text-white font-semibold text-sm"
                    style={{ marginLeft: 8 }}
                  >
                    Add Event
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {eventsLoading && upcomingEvents.length === 0 ? (
              <Text className="text-white/50 text-sm">Loading events…</Text>
            ) : upcomingEvents.length === 0 ? (
              <Text className="text-white/50 text-sm">
                No upcoming events for this community.
              </Text>
            ) : (
              <View style={styles.calendarCard}>
                <Calendar
                  onDayPress={(day) => setSelectedDate(day.dateString)}
                  onMonthChange={(month) => {
                    const monthKey = `${month.year}-${String(month.month).padStart(2, "0")}`;
                    setSelectedMonth(monthKey);
                    const monthStart = `${monthKey}-01`;
                    setSelectedDate(monthStart);
                  }}
                  markedDates={markedDates}
                  theme={{
                    backgroundColor: "#0f0f13",
                    calendarBackground: "#0f0f13",
                    textSectionTitleColor: "#a1a1aa",
                    selectedDayBackgroundColor: "#4f46e5",
                    selectedDayTextColor: "#fff",
                    todayTextColor: "#c4b5fd",
                    dayTextColor: "#e4e4e7",
                    textDisabledColor: "#52525b",
                    monthTextColor: "#fff",
                    arrowColor: "#a1a1aa",
                  }}
                  style={{ borderRadius: 12, overflow: "hidden" }}
                />

                <View style={styles.dateEventList}>
                  {!hasEventsInMonth ? (
                    <Text style={styles.noEventsText}>
                      No events scheduled for this month.
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.dateHeader}>
                        Events on {selectedDate}
                      </Text>
                      {(eventsByDate[selectedDate] || []).length === 0 ? (
                        <Text style={styles.noEventsText}>
                          No events scheduled for this date.
                        </Text>
                      ) : (
                        (eventsByDate[selectedDate] || []).map((ev) => (
                          <EventCard
                            key={ev.id}
                            event={ev}
                            onPress={() =>
                              router.push(`/events/${ev.id}` as any)
                            }
                          />
                        ))
                      )}
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Info Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: drawerWidth,
          transform: [{ translateX: slide }],
          backgroundColor: "#0b0b0f",
          borderLeftWidth: 1,
          borderLeftColor: "#18181b",
          paddingTop: 16,
          zIndex: 20,
        }}
      >
        <View className="px-4 pb-4 flex-row justify-between items-center">
          <Text className="text-white text-lg font-semibold">
            Community Info
          </Text>
          <TouchableOpacity
            onPress={() => setDrawerOpen(false)}
            style={{
              padding: 8,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <X size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ paddingHorizontal: 16 }}>
          <View style={styles.drawerCommunityHeader}>
            {community.profile_image ? (
              <Image
                source={{ uri: community.profile_image }}
                style={styles.drawerCommunityImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.drawerCommunityPlaceholder}>
                <Text style={styles.drawerCommunityInitial}>
                  {community.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {community.description && (
            <View className="mb-4">
              <Text className="text-white font-semibold mb-1">About</Text>
              <Text className="text-white/70 text-sm">
                {community.description}
              </Text>
            </View>
          )}

          {user && community.owner_id === user.id && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.createTemplateButton}
                onPress={() =>
                  router.push({
                    pathname: "/community/create-template",
                    params: { community_id: community.id },
                  })
                }
              >
                <Text style={styles.createTemplateIcon}>✨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.createTemplateTitle}>
                    Create Event Template
                  </Text>
                  <Text style={styles.createTemplateDescription}>
                    Make it easier for community members to create events
                  </Text>
                </View>
                <Text style={styles.createTemplateArrow}>→</Text>
              </TouchableOpacity>
            </View>
          )}

          {community.topics && community.topics.length > 0 && (
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">Topics</Text>
              <View className="flex-row flex-wrap gap-2">
                {community.topics.map((topic: string, idx: number) => (
                  <View
                    key={idx}
                    className="bg-indigo-600/30 px-3 py-1.5 rounded-full border border-indigo-500/40"
                  >
                    <Text className="text-indigo-300 text-xs font-semibold">
                      {topic}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {community.rules && community.rules.length > 0 && (
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">Rules</Text>
              {community.rules.map((rule: string, idx: number) => (
                <View key={idx} className="flex-row mb-2 gap-2">
                  <Text className="text-indigo-400 font-bold">{idx + 1}.</Text>
                  <Text className="text-white/70 flex-1 text-sm">{rule}</Text>
                </View>
              ))}
            </View>
          )}

          {community.faq && community.faq.length > 0 && (
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">FAQ</Text>
              {community.faq.map((item: any, idx: number) => (
                <View key={idx} className="mb-3">
                  <Text className="text-white font-semibold text-sm mb-1">
                    Q: {item.question}
                  </Text>
                  <Text className="text-white/60 text-sm">
                    A: {item.answer}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View className="mb-4">
            <Text className="text-white/50 text-xs font-semibold mb-1">
              CREATED
            </Text>
            <Text className="text-white text-base font-semibold">
              {new Date(community.created_at || "").toLocaleDateString(
                "en-US",
                { month: "short", year: "numeric" },
              )}
            </Text>
          </View>

          {community.slug && (
            <View className="mb-4">
              <Text className="text-white/50 text-xs font-semibold mb-1">
                HANDLE
              </Text>
              <Text className="text-indigo-300 text-base font-semibold">
                @{community.slug}
              </Text>
            </View>
          )}

          {/* Leave Community Button */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: "#ef4444",
              marginBottom: 32,
              justifyContent: "center",
              gap: 8,
            }}
            onPress={handleLeaveCommunity}
            disabled={isLeavingCommunity}
          >
            {isLeavingCommunity ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <LogOut size={16} color="#fff" />
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                >
                  Leave Community
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>

      <ChatDrawer
        channelId={community?.id}
        channelName="general"
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  drawerCommunityHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  drawerCommunityImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#27272a",
  },
  drawerCommunityPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#27272a",
  },
  drawerCommunityInitial: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  calendarCard: {
    backgroundColor: "#0f0f13",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  dateEventList: {
    marginTop: 16,
  },
  dateHeader: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  noEventsText: {
    color: "#a1a1aa",
    fontSize: 12,
  },
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  createTemplateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#4f46e5",
    gap: 12,
  },
  createTemplateIcon: {
    fontSize: 28,
  },
  createTemplateTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  createTemplateDescription: {
    color: "#a0a0a0",
    fontSize: 12,
    lineHeight: 16,
  },
  createTemplateArrow: {
    color: "#4f46e5",
    fontSize: 18,
    fontWeight: "700",
  },
});
