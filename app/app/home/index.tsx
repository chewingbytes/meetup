import HorizontalCarousel from "@/components/horizontal-carousel";
import VerticalList from "@/components/vertical-scroll-section";
import MobileNav from "@/components/mobile-nav";
import Header from "@/components/header";
import {
  SkeletonCarousel,
  SkeletonVerticalList,
} from "@/components/skeleton-loader";

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
import { useAuthRedirect } from "@/lib/useAuthRedirect";

const PALETTE = {
  background: "#000000",
};

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isCheckingAuth } = useAuthRedirect("/login");

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

  const shouldShowSkeleton = (eventsLoading || communitiesLoading) && !isCheckingAuth;
  const isRefreshing = eventsRefreshing || communitiesRefreshing;

  const openChat = (groupId: string, groupName: string) => {
    router.push(`/chat/${groupId}?name=${groupName}` as any);
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    await Promise.all([refreshEvents(), refreshCommunities()]);
  };

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: PALETTE.background }}
        edges={["top"]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={{ color: "#fff", marginTop: 12 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              setMenuOpen(!menuOpen);
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
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
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
        <View className="container">
          {/* ✅ Show skeleton ONLY while loading data (auth is done) */}
          {shouldShowSkeleton ? (
            <>
              <SkeletonCarousel />
              <SkeletonVerticalList />
            </>
          ) : (
            <>
            
            </>
            // <>
            //   <HorizontalCarousel<EventProps>
            //     heading="Your Events"
            //     chunks={chunkArray(events, 3)}
            //     cardComponent={EventCard}
            //     dataKey="event"
            //     onItemPress={(event) =>
            //       router.push(`/events/${event.id}` as any)
            //     }
            //   />

            //   <VerticalList<CommunityProps>
            //     heading="Your Communities"
            //     items={communities}
            //     cardComponent={CommunityCard}
            //     dataKey="community"
            //     onItemPress={(community) => {
            //       router.push(`/community/${community.id}` as any);
            //     }}
            //   />
            // </>
          )}
        </View>
      </ScrollView>
      <MobileNav active="home" />
    </SafeAreaView>
  );
}