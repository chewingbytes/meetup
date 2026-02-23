import EventCard from "@/components/event-card";
import MobileNav from "@/components/mobile-nav";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { NeoLoader } from "@/components/ui/neo-loader";
import { useCommunities } from "@/hooks/useCommunities";
import { useEvents } from "@/hooks/useEvents";
import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { useRouter } from "expo-router";
import { Flame, Map, Search, Ticket, Users, Zap } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const { user, isCheckingAuth } = useAuthRedirect("/");

  const {
    events,
    isLoading: eventsLoading,
    isRefreshing: eventsRefreshing,
    refresh: refreshEvents,
  } = useEvents();

  // console.log("EVENTS:", events);

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

  // Filter and Sort
  const featuredEvents = useMemo(() => {
    return events
      .filter((ev) => !ev.end_at || new Date(ev.end_at) >= new Date())
      .sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
      .slice(0, 5);
  }, [events]);

  const trendingCommunities = useMemo(() => {
    return communities.slice(0, 4);
  }, [communities]);

  if (isCheckingAuth) {
    return (
      <View className="flex-1 bg-neo-bg items-center justify-center">
        <NeoLoader />
        <Text className="text-black font-black uppercase mt-4 animate-pulse">
          Authenticating...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      {/* Header & Search - Fixed at Top */}
      <View
        className="bg-[#FFD93D] pb-6 border-b-4 border-black z-50 absolute top-0 left-0 right-0"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center justify-between mb-4 px-4">
          <Text className="text-5xl font-black uppercase text-black tracking-tighter">
            Explore
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/map" as any)}
            activeOpacity={1}
            className="bg-white border-2 border-black p-3 rotate-3 shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
          >
            <Map size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <View className="relative mt-2 px-4 shadow-none">
          <View className="absolute top-0 left-0 right-0 bottom-0 bg-black translate-x-1 translate-y-1 ml-4 mr-4" />
          <View className="bg-white border-2 border-black flex-row items-center px-4 py-3">
            <Search size={24} color="#000" strokeWidth={3} />
            <TextInput
              placeholder="Search for chaos..."
              placeholderTextColor="#999"
              className="flex-1 ml-3 font-bold text-lg text-black bg-transparent border-0 min-h-[24px]"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ fontFamily: "SpaceGrotesk-Bold" }}
            />
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 210 }}
          refreshControl={
            <PullToRefresh
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {/* Tags / Categories - Sticker Style */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-8"
            contentContainerStyle={{
              paddingLeft: 16,
              paddingRight: 20,
              gap: 12,
              alignItems: "center",
              height: 60,
            }}
          >
            {[
              {
                label: "Trending",
                icon: Flame,
                color: "bg-neo-red",
                text: "text-white",
              },
              {
                label: "New",
                icon: Zap,
                color: "bg-neo-yellow",
                text: "text-black",
              },
              {
                label: "Events",
                icon: Ticket,
                color: "bg-neo-blue",
                text: "text-white",
              },
              {
                label: "Groups",
                icon: Users,
                color: "bg-neo-violet",
                text: "text-white",
              },
            ].map((tag, i) => (
              <TouchableOpacity
                key={tag.label}
                className={`${tag.color} border-2 border-black px-4 py-2 flex-row items-center gap-2 active:translate-y-1 ${i % 2 === 0 ? "-rotate-2" : "rotate-1"}`}
              >
                {/* <tag.icon size={16} color={tag.text === "text-white" ? "#fff" : "#000"} strokeWidth={3} /> */}
                <Text className={`${tag.text} font-black uppercase`}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured - "Hot Drops" */}
          <View className="mb-8">
            <View className="bg-black self-start px-4 py-2 -rotate-2 mb-4 ml-4">
              <Text className="text-white font-black uppercase text-xl">
                Hot Drops
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 16,
                paddingRight: 20,
                paddingLeft: 16,
              }}
            >
              {featuredEvents.map((event, index) => (
                <View
                  key={event.id}
                  className={`w-[280px] ${index % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
                >
                  <EventCard
                    event={event}
                    onPress={() => router.push(`/events/${event.id}` as any)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Community Spotlight - "The Crew" */}
          {trendingCommunities.length > 0 && (
            <View className="px-4 mb-2">
              <View className="bg-neo-violet border-2 border-black self-end px-4 py-1 rotate-1 mb-4">
                <Text className="text-white font-black uppercase text-xl">
                  The Crew
                </Text>
              </View>

              <View
                className="flex-row flex-wrap justify-between"
                style={{ gap: 8 }}
              >
                {trendingCommunities.map((comm, i) => (
                  <TouchableOpacity
                    key={comm.id}
                    activeOpacity={1}
                    onPress={() => router.push(`/community/${comm.id}` as any)}
                    style={{ width: "48%" }}
                    className={`mb-6 bg-white border-2 border-black p-2 ${i % 2 === 0 ? "-rotate-1" : "rotate-1"} active:translate-y-[2px]`}
                  >
                    <View className="aspect-square bg-neo-bg border-2 border-black mb-2 overflow-hidden bg-white">
                      {comm.profile_image ? (
                        <Image
                          source={{ uri: comm.profile_image }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center bg-gray-200">
                          <Text className="text-2xl"></Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="font-black text-lg uppercase leading-5 mb-1"
                      numberOfLines={2}
                    >
                      {comm.name}
                    </Text>
                    <Text className="text-xs font-bold text-gray-500 uppercase">
                      {comm._count?.members || 0} Member(s)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Discover More Feed */}
          <View className="bg-black py-8 mt-4">
            <Text className="text-neo-yellow text-center text-4xl font-black uppercase mb-6 italic tracking-widest">
              Don't Miss Out
            </Text>
            <View className="px-4 gap-6">
              {events.slice(5, 10).map((event, i) => (
                <View
                  key={event.id}
                  className={`${i % 2 === 0 ? "rotate-1 pl-2" : "-rotate-1 pr-2"}`}
                >
                  <EventCard
                    event={event}
                    onPress={() => router.push(`/events/${event.id}` as any)}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      <MobileNav active="explore" />
    </View>
  );
}
