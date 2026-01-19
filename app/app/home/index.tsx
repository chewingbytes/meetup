import HorizontalCarousel from "@/components/horizontal-carousel";
import VerticalList from "@/components/vertical-scroll-section";
import MobileNav from "@/components/mobile-nav";
import Header from "@/components/header";

import CommunityCard from "@/components/community-card";
import EventCard from "@/components/event-card";
import { PullToRefresh } from "@/components/pull-to-refresh";

import { Plus, Bell, User } from "lucide-react-native";

import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { sampleEvents } from "@/data/event";
import { usersCommunities } from "@/data/communities";
import { EventProps, CommunityProps } from "@/utils/types";

import chunkArray from "@/scripts/chunkArray";
import { useEffect, useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useCommunities } from "@/hooks/useCommunities";
import { useAuth } from "@/lib/authContext";

const PALETTE = {
  background: "#000000",
};

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Use Zustand stores with custom hooks
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

  const isstuffLoading = eventsLoading || communitiesLoading;
  const isRefreshing = eventsRefreshing || communitiesRefreshing;

  useEffect(() => {
    console.log(
      "📍 Index.tsx - Loading:",
      isLoading,
      "User:",
      user?.email || "None"
    );

    if (!isLoading) {
      if (user) {
        console.log("✅ User authenticated, should stay on home");
        // User is authenticated, router will handle this
      } else {
        console.log("❌ No user, redirecting to welcome");
        router.replace("/login");
      }
    }
  }, [isLoading, user]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ color: "#fff", marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  const openChat = (groupId: string, groupName: string) => {
    router.push(`/chat/${groupId}?name=${groupName}` as any);
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    await Promise.all([refreshEvents(), refreshCommunities()]);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: PALETTE.background }}
      edges={["top"]}
    >
      <Header
        title="Welcome"
        actions={[
          {
            icon: Plus,
            onPress: () => {
              if (menuOpen) {
                setMenuOpen(false);
              } else {
                setMenuOpen(true);
              }
            },
          },
          { icon: Bell, link: "/notifications" },
        ]}
      />
      {menuOpen && (
        <View
          style={{
            position: "absolute",
            top: 90,
            right: 20,
            backgroundColor: "#111",
            borderRadius: 12,
            paddingVertical: 8,
            zIndex: 1000,
          }}
        >
          <TouchableOpacity
            style={{ padding: 12 }}
            onPress={() => {
              setMenuOpen(false);
              router.push("/create-community");
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>
              Create community
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ padding: 12 }}
            onPress={() => {
              setMenuOpen(false);
              router.push("/create-event");
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>Create event</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        refreshControl={
          <PullToRefresh
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* <View
          style={{
            padding: 18,
          }}
        >
          <Text
            style={{
              fontSize: 40,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            Home
          </Text>
        </View> */}

        <View className="container">
          {/* Your Events */}
          <HorizontalCarousel<EventProps>
            heading="Your Events"
            chunks={chunkArray(events, 3)}
            cardComponent={EventCard}
            dataKey="event"
            onItemPress={(event) => router.push(`/events/${event.id}` as any)}
          />

          {/* Your Communities */}
          <VerticalList<CommunityProps>
            heading="Your Communities"
            items={communities}
            cardComponent={CommunityCard}
            dataKey="community"
            onItemPress={(community) => {
              router.push(`/community/${community.id}` as any);
            }}
          />
          {/* <VerticalList
            heading="Your Communities"
            items={sampleEvents}
            cardComponent={EventCard}
            dataKey="event"
          /> */}
        </View>
      </ScrollView>
      <MobileNav active="home" />
    </SafeAreaView>
  );
}
