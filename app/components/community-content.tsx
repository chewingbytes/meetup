import EventCard from "@/components/event-card";
import { useEvents } from "@/hooks/useEvents";
import { CommunityProps, EventProps } from "@/utils/types";
import {
  ChevronLeft,
  Globe,
  Hash,
  Lock,
  LogOut,
  Plus,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
// ChatDrawer removed
import { NeoButtonLoader } from "@/components/ui/neo-loader";
import { useCommunities } from "@/hooks/useCommunities";
import { getMyEvents, leaveCommunity } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useChatNotificationStore } from "@/lib/stores/chatNotificationStore";
import { useRouter } from "expo-router";
import { PullToRefresh } from "./pull-to-refresh";

interface CommunityContentProps {
  community: CommunityProps | null;
}

export default function CommunityContent({ community }: CommunityContentProps) {
  const drawerWidth = 320;
  const [drawerOpen, setDrawerOpen] = useState(false);
  // chatDrawerOpen state removed
  const [isLeavingCommunity, setIsLeavingCommunity] = useState(false);
  const [myEvents, setMyEvents] = useState<EventProps[]>([]);
  const [isMyEventsLoading, setIsMyEventsLoading] = useState(false);
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

  const refreshMyEvents = useCallback(async () => {
    if (!user?.id) {
      setMyEvents([]);
      return;
    }
    setIsMyEventsLoading(true);
    try {
      const data = await getMyEvents(user.id);
      setMyEvents(data || []);
    } catch (err) {
      console.error(err);
      setMyEvents([]);
    } finally {
      setIsMyEventsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshMyEvents();
  }, [refreshMyEvents]);

  const handleRefresh = async () => {
    await Promise.all([
      refreshEvents(),
      refreshCommunities(),
      refreshMyEvents(),
    ]);
  };

  const attendingEventIds = useMemo(
    () => new Set((myEvents || []).map((ev) => ev.id)),
    [myEvents],
  );

  const attendingEvents = useMemo(
    () => upcomingEvents.filter((ev) => attendingEventIds.has(ev.id)),
    [upcomingEvents, attendingEventIds],
  );

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
        dotColor: "#FF6B6B", // Neo Red
      };
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: "#FF6B6B",
        selectedTextColor: "#000",
      };
    }
    return marks;
  }, [eventsByDate, selectedDate]);

  // Drawer animation
  useEffect(() => {
    Animated.timing(slide, {
      toValue: drawerOpen ? 0 : drawerWidth,
      duration: 300,
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
              setDrawerOpen(false);
              router.push("/");
            } catch (err: any) {
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
      <View className="flex-1 items-center justify-center bg-neo-bg">
        <Text className="text-black/50 text-lg font-bold uppercase tracking-widest">
          Select a community
        </Text>
      </View>
    );
  }

  const unreadCount = community?.id ? unreadByChannel[community.id] || 0 : 0;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFDF5" }}
      className="border-t-4"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PullToRefresh
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Section */}
        <View className="px-6 pt-8 pb-4">
          <View className="flex-row items-center justify-between mb-4 border-b-4 border-black pb-4">
            <View className="flex-1 mr-4">
              <Text
                className="text-4xl font-black uppercase text-black leading-tight tracking-tighter pt-1"
                numberOfLines={2}
              >
                {community.name}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setDrawerOpen(true)}
              className="bg-neo-yellow border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
            >
              <ChevronLeft size={24} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className={`border-2 border-black px-2 py-1 flex-row items-center gap-1 ${community.privacy_mode ? "bg-neo-violet" : "bg-neo-green-light"}`}
            >
              {community.privacy_mode ? (
                <Lock size={12} color="#000" />
              ) : (
                <Globe size={12} color="#000" />
              )}
              <Text className="text-xs font-bold uppercase">
                {community.privacy_mode ? "PRIVATE" : "PUBLIC"}
              </Text>
            </View>
          </View>
        </View>

        {/* Chat Button */}
        <TouchableOpacity
          activeOpacity={1}
          className="mx-6 mb-4 bg-white border-4 border-black p-4 flex-row items-center justify-between shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
          onPress={() => {
            if (community?.id) {
              router.push({
                pathname: "/chat/[channelId]",
                params: {
                  channelId: community.id,
                  channelName: "General Chat",
                },
              });
            }
          }}
        >
          <View className="flex-row items-center gap-3">
            <View className="bg-black p-2">
              <Hash size={20} color="#fff" strokeWidth={3} />
            </View>
            <Text className="text-black font-black text-xl uppercase tracking-wider">
              General Chat
            </Text>
          </View>

          {unreadCount > 0 && (
            <View className="bg-neo-red border-2 border-black px-2 py-1 rotate-3 absolute -top-3 -right-3 shadow-[2px_2px_0px_0px_#000]">
              <Text className="text-white font-bold text-xs">
                {unreadCount} NEW
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Event Chats */}
        {attendingEvents.map((event) => {
          const eventUnreadCount = unreadByChannel[event.id] || 0;
          return (
            <TouchableOpacity
              key={event.id}
              activeOpacity={1}
              className="mx-6 mb-4 bg-white border-4 border-black p-4 flex-row items-center justify-between shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
              onPress={() => {
                router.push({
                  pathname: "/chat/[channelId]",
                  params: { channelId: event.id, channelName: event.name },
                });
              }}
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-neo-yellow p-2">
                  <Hash size={20} color="#000" strokeWidth={3} />
                </View>
                <Text
                  numberOfLines={1}
                  className="text-black font-black text-lg w-52 uppercase tracking-wider"
                >
                  {event.name} Chat
                </Text>
              </View>

              {eventUnreadCount > 0 && (
                <View className="bg-neo-red border-2 border-black px-2 py-1 rotate-3 absolute -top-3 -right-3 shadow-[2px_2px_0px_0px_#000]">
                  <Text className="text-white font-bold text-xs">
                    {eventUnreadCount} NEW
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Events Section */}
        <View className="px-6 pb-24 mt-6">
          <View className="flex-row justify-between items-center mb-6 border-b-4 border-black pb-2">
            <Text className="text-2xl font-black uppercase text-black italic">
              Schedule
            </Text>

            {user && community.owner_id === user.id && (
              <TouchableOpacity
                activeOpacity={1}
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
                className="bg-neo-violet border-2 border-black px-3 py-2 flex-row items-center gap-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
              >
                <Plus size={16} color="#000" strokeWidth={3} />
                <Text className="text-black font-bold text-xs uppercase">
                  Add Hangout
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Calendar */}
          <View className="bg-white border-4 border-black p-2 shadow-[6px_6px_0px_0px_#000] mb-8">
            <Calendar
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              onMonthChange={(month: any) => {
                const monthKey = `${month.year}-${String(month.month).padStart(2, "0")}`;
                setSelectedMonth(monthKey);
                const monthStart = `${monthKey}-01`;
                setSelectedDate(monthStart);
              }}
              markedDates={markedDates}
              theme={{
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#000000",
                selectedDayBackgroundColor: "#FF6B6B",
                selectedDayTextColor: "#000000",
                todayTextColor: "#FF6B6B",
                dayTextColor: "#000000",
                textDisabledColor: "#d9e1e8",
                monthTextColor: "#000000",
                arrowColor: "#000000",
                textDayFontWeight: "700",
                textMonthFontWeight: "900",
                textDayHeaderFontWeight: "700",
              }}
            />
          </View>

          <View className="gap-4">
            <View className="bg-black p-1 self-start -rotate-1 mb-2">
              <Text className="text-white font-bold uppercase text-sm px-2">
                {selectedDate}
              </Text>
            </View>

            {(eventsByDate[selectedDate] || []).length === 0 ? (
              <Text className="text-black/40 font-bold uppercase text-sm border-2 border-dashed border-black/20 p-4 text-center bg-white/50">
                No hangouts on this day.
              </Text>
            ) : (
              (eventsByDate[selectedDate] || []).map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onPress={() => router.push(`/events/${ev.id}` as any)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Info Sliding Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: drawerWidth,
          transform: [{ translateX: slide }],
          backgroundColor: "#FFFDF5", // neo-bg
          borderLeftWidth: 4,
          borderLeftColor: "#000",
          zIndex: 50,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View className="p-4 border-b-4 border-black flex-row justify-between items-center bg-neo-yellow">
            <Text className="text-black text-xl font-black uppercase">
              Info Board
            </Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setDrawerOpen(false)}
              className="bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
            >
              <X size={20} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 p-4"
            showsVerticalScrollIndicator={false}
          >
            {/* Drawer Content */}
            <View className="items-center mb-6 mt-4">
              <View className="w-32 h-32 border-4 border-black mb-4 bg-white shadow-[6px_6px_0px_0px_#000] rotate-2">
                {(() => {
                  const imageSource =
                    community.profile_image ?? community.profileImage;
                  const resolvedImageSource =
                    typeof imageSource === "string"
                      ? { uri: imageSource }
                      : imageSource;
                  return resolvedImageSource ? (
                    <Image
                      source={resolvedImageSource as any}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-neo-blue">
                      <Text className="text-5xl">👾</Text>
                    </View>
                  );
                })()}
              </View>
              <Text className="text-2xl font-black uppercase text-center mt-4 leading-none">
                {community.name}
              </Text>
              <View className="mt-2 bg-black px-2 py-1 -rotate-1">
                <Text className="text-white text-xs font-bold uppercase">
                  {community.category || "General"}
                </Text>
              </View>
            </View>

            <View className="mb-6 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
              <Text className="font-bold uppercase mb-2 bg-neo-violet self-start px-2 border border-black text-xs shadow-[1px_1px_0px_0px_#000]">
                About
              </Text>
              <Text className="text-black font-medium leading-tight">
                {community.description || "No description provided."}
              </Text>
            </View>

            {/* Leave Community Button */}
            <TouchableOpacity
              activeOpacity={1}
              className="flex-row items-center justify-center bg-neo-red border-4 border-black p-4 mt-8 shadow-[2px_2px_0px_0px_#000] active:translate-y-1 mb-12"
              onPress={handleLeaveCommunity}
              disabled={isLeavingCommunity}
            >
              {isLeavingCommunity ? (
                <NeoButtonLoader color="#000" />
              ) : (
                <>
                  <LogOut size={20} color="#000" strokeWidth={3} />
                  <Text className="text-black font-black uppercase ml-2">
                    Leave Community
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
